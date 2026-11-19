import type { Entry, Habit } from "./db";
import { addDays, ds, pd, weekStart } from "./dates";

export type Cell = "done" | "skipped" | "missed" | "today" | "future";
export type EntryMap = Record<string, Entry>;
export const MAX_SKIPS_PER_WEEK = 2;

export function cellState(h: Habit, em: EntryMap | undefined, date: string, today: string): Cell {
  const s = em?.[date]?.status;
  if (s === "done") return "done";
  if (s === "skipped") return "skipped";
  if (date > today || date < h.createdAt) return "future";
  return date === today ? "today" : "missed";
}

/** Серия: done +1, skipped не прерывает и не добавляет, missed обрывает. Сегодняшний день, пока не отмечен, серию не обрывает. */
export function streak(h: Habit, em: EntryMap | undefined, today: string) {
  let current = 0;
  let d = pd(today);
  if (cellState(h, em, today, today) === "today") d = addDays(d, -1);
  for (let i = 0; i < 2000; i++) {
    const c = cellState(h, em, ds(d), today);
    if (c === "done") current++;
    else if (c === "missed" || c === "future") break;
    d = addDays(d, -1);
  }
  let best = 0, run = 0;
  for (let c = pd(h.createdAt); ds(c) <= today; c = addDays(c, 1)) {
    const s = cellState(h, em, ds(c), today);
    if (s === "done") { run++; best = Math.max(best, run); } else if (s === "missed") run = 0;
  }
  return { current, best };
}

/** Сколько пропусков уже стоит в календарной неделе (пн–вс) выбранной даты. */
export function skipsInWeek(em: EntryMap | undefined, date: string) {
  const s = weekStart(pd(date));
  let n = 0;
  for (let i = 0; i < 7; i++) if (em?.[ds(addDays(s, i))]?.status === "skipped") n++;
  return n;
}
