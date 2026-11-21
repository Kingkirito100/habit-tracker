"use client";
import { useEffect, useRef } from "react";
import { useData } from "@/lib/hooks";
import { addDays, ds } from "@/lib/dates";
import { notifState, showLocal } from "@/lib/notifications";
import { remindersForDay } from "@/lib/reminders";

export function ReminderScheduler() {
  const data = useData();
  const delivered = useRef({ date: "", tags: new Set<string>() });

  useEffect(() => {
    if (!data) return;

    let timers: number[] = [];
    const clearTimers = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    };

    const schedule = () => {
      clearTimers();
      if (notifState() !== "granted") return;

      const now = new Date();
      const date = ds(now);
      if (date !== delivered.current.date) delivered.current = { date, tags: new Set() };
      timers.push(window.setTimeout(schedule, addDays(now, 1).getTime() - now.getTime()));

      for (const habit of data.active) {
        for (const reminder of remindersForDay(habit, data.maps[habit.id], now)) {
          const [hour, minute] = reminder.time.split(":").map(Number);
          const at = new Date(now);
          at.setHours(hour, minute, 0, 0);
          const delay = at.getTime() - now.getTime();
          if (delay <= -60_000 || at.getHours() !== hour || at.getMinutes() !== minute) continue;

          const tag = `habit-${habit.id}-${date}-${reminder.time}`;
          timers.push(window.setTimeout(() => {
            const current = new Date();
            if (ds(current) !== date || current.getTime() - at.getTime() >= 60_000 || notifState() !== "granted") return;
            if (delivered.current.tags.has(tag)) return;
            delivered.current.tags.add(tag);
            const message = reminder.message ? `${habit.name}: ${reminder.message}` : habit.name;
            void showLocal("Пора отметить привычку", message, tag).catch(() => {});
          }, Math.max(delay, 0)));
        }
      }
    };

    schedule();
    window.addEventListener("focus", schedule);
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("hb:notifications", schedule);
    return () => {
      clearTimers();
      window.removeEventListener("focus", schedule);
      document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener("hb:notifications", schedule);
    };
  }, [data]);

  return null;
}
