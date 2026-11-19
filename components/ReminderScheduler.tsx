"use client";
import { useEffect } from "react";
import { useData } from "@/lib/hooks";
import { notifState, scheduleInApp } from "@/lib/notifications";
import { todayStr } from "@/lib/dates";

/** Пока приложение открыто — локальные напоминания. При закрытом приложении работает Web Push (см. README). */
export function ReminderScheduler() {
  const data = useData();
  useEffect(() => {
    if (!data || notifState() !== "granted") return;
    const t = todayStr();
    const items = data.active.filter((h) => h.reminderTime && data.maps[h.id]?.[t]?.status !== "done" && data.maps[h.id]?.[t]?.status !== "skipped").map((h) => ({ name: h.name, time: h.reminderTime! }));
    return scheduleInApp(items);
  }, [data]);
  return null;
}
