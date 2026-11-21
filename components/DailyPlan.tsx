"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";
import { completeHabits, type Habit } from "@/lib/db";
import { isDue, type EntryMap } from "@/lib/streak";
import { useSettings } from "@/lib/settings";
import { DayRing } from "./DayRing";
import { HabitCalendar } from "./HabitCalendar";
import { HabitCheckIn } from "./HabitCheckIn";

export function recordFirstCheckIn() {
  try { localStorage.setItem("hb-checkin", "1"); } catch {}
  window.dispatchEvent(new Event("hb:checkin"));
}

interface DailyPlanProps {
  habits: Habit[];
  maps: Record<number, EntryMap>;
  date: string;
  today: string;
  quick?: boolean;
}

export function DailyPlan({ habits, maps, date, today, quick }: DailyPlanProps) {
  const settings = useSettings();
  const [undo, setUndo] = useState<(() => Promise<void>) | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const planned = habits.filter((habit) => {
    if (date < habit.createdAt || date > today) return false;
    const status = maps[habit.id]?.[date]?.status;
    return status === "done" || status === "skipped" || isDue(habit, maps[habit.id], date);
  });
  const betterLater = new Set(planned.map((habit) => habit.id));
  const done = planned.filter((habit) => maps[habit.id]?.[date]?.status === "done").length;
  const skipped = planned.filter((habit) => maps[habit.id]?.[date]?.status === "skipped").length;
  const remaining = planned.filter((habit) => {
    const status = maps[habit.id]?.[date]?.status;
    return status !== "done" && status !== "skipped";
  });
  const remainingIds = new Set(remaining.map((habit) => habit.id));
  const pendingFirst = quick || settings.unfinishedFirst;
  const list = pendingFirst ? [...remaining, ...habits.filter((habit) => !remainingIds.has(habit.id))] : habits;
  const allDone = planned.length > 0 && done === planned.length;

  const markAll = async () => {
    setBusy(true);
    setMessage("");
    try {
      const revert = await completeHabits(remaining, date);
      setUndo(() => revert);
      setMessage("Отметки сохранены.");
      recordFirstCheckIn();
      if (settings.haptics) navigator.vibrate?.(15);
    } catch {
      setMessage("Не удалось сохранить отметки. Попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  const undoAll = async () => {
    if (!undo) return;
    setBusy(true);
    try {
      await undo();
      setUndo(null);
      setMessage("Последняя массовая отметка отменена.");
    } catch {
      setMessage("Не удалось отменить отметки. Попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="day-hero" aria-label="Итоги дня">
        <DayRing done={done} total={planned.length} />
        {allDone && <p role="status" className="day-celebration"><Sparkles size={18} aria-hidden /> {date === today ? "План на сегодня закрыт!" : "План на этот день закрыт"}</p>}
        {skipped > 0 && <p className="text-sm text-mute">Пропуски: {skipped}</p>}
        {(remaining.length > 0 || undo || !quick) && (
          <div className="flex flex-wrap items-center gap-2">
            {remaining.length > 0 && <button type="button" className="btn pri inline-flex items-center gap-2" disabled={busy} onClick={markAll}><Check size={18} aria-hidden /> Отметить всё ({remaining.length})</button>}
            {undo && <button type="button" className="btn" disabled={busy} onClick={undoAll}>Отменить</button>}
            {!quick && <Link href="/quick" className="btn inline-flex items-center gap-2"><Zap size={16} aria-hidden /> Быстрая отметка</Link>}
          </div>
        )}
        {message && <p role="status" className="text-sm text-mute">{message}</p>}
      </section>
      {remaining.length > 0 && pendingFirst && <h2 className="mb-2">Осталось сделать <span className="text-mute">{remaining.length}</span></h2>}
      {list.map((habit, index) => (
        <div key={habit.id}>
          {pendingFirst && remaining.length > 0 && index === remaining.length && <h2 className="mb-2 mt-4">Остальные привычки</h2>}
          <article className="daily-card" data-accent={habit.color} data-priority={remainingIds.has(habit.id) ? "next" : betterLater.has(habit.id) ? "settled" : "off"}>
            <HabitCheckIn habit={habit} map={maps[habit.id]} date={date} today={today} onFirstCheckIn={recordFirstCheckIn} />
            {!quick && settings.layout === "calendar" && <HabitCalendar habit={habit} map={maps[habit.id]} today={today} />}
          </article>
        </div>
      ))}
    </>
  );
}
