import type { Entry, Habit } from "./db";
import { addDays, ds, pd, weekStart } from "./dates";
import { getFreq, unitOf, type StreakUnit } from "./freq";

export type Cell = "done" | "skipped" | "missed" | "today" | "future" | "off";
export type EntryMap = Record<string, Entry>;
export const MAX_SKIPS_PER_WEEK = 2;

/** Запланирован ли день: для daily — всегда, для days — по выбранным дням, для weekly/monthly — нет (важен период, а не день). */
export function isScheduled(h: Habit, date: string) {
  const f = getFreq(h);
  if (f.kind === "days") return f.days.includes((pd(date).getDay() + 6) % 7);
  return f.kind === "daily";
}

/** off — прошедший день без отметки, который не считается пропуском (вне расписания или цель периода). */
export function cellState(h: Habit, em: EntryMap | undefined, date: string, today: string): Cell {
  const s = em?.[date]?.status;
  if (s === "done") return "done";
  if (s === "skipped") return "skipped";
  if (date > today || date < h.createdAt) return "future";
  if (date === today) return "today";
  return isScheduled(h, date) ? "missed" : "off";
}

const pstart = (d: Date, kind: "weekly" | "monthly") => (kind === "weekly" ? weekStart(d) : new Date(d.getFullYear(), d.getMonth(), 1));
const pnext = (d: Date, kind: "weekly" | "monthly") => (kind === "weekly" ? addDays(d, 7) : new Date(d.getFullYear(), d.getMonth() + 1, 1));
function countIn(em: EntryMap | undefined, start: Date, kind: "weekly" | "monthly") {
  let n = 0;
  for (let c = start, end = pnext(start, kind); c < end; c = addDays(c, 1)) if (em?.[ds(c)]?.status === "done") n++;
  return n;
}

export interface Streak { current: number; best: number; unit: StreakUnit }

/**
 * daily/days: done +1, skipped и внеплановые дни нейтральны, missed обрывает.
 * weekly/monthly: считаются подряд выполненные периоды; текущий невыполненный период серию не обрывает.
 */
export function streak(h: Habit, em: EntryMap | undefined, today: string): Streak {
  const f = getFreq(h);
  const unit = unitOf(f);
  if (f.kind === "weekly" || f.kind === "monthly") {
    let best = 0, run = 0;
    const starts: Date[] = [];
    for (let s = pstart(pd(h.createdAt), f.kind); ds(s) <= today; s = pnext(s, f.kind)) starts.push(s);
    starts.forEach((s, i) => {
      if (countIn(em, s, f.kind as "weekly" | "monthly") >= f.times) { run++; best = Math.max(best, run); }
      else if (i !== starts.length - 1) run = 0;
    });
    return { current: run, best, unit };
  }
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
  return { current, best, unit };
}

/** Прогресс текущей недели/месяца для привычек «N раз в период»; для остальных null. */
export function periodProgress(h: Habit, em: EntryMap | undefined, date: string) {
  const f = getFreq(h);
  if (f.kind !== "weekly" && f.kind !== "monthly") return null;
  return { done: countIn(em, pstart(pd(date), f.kind), f.kind), goal: f.times, period: f.kind === "weekly" ? "неделе" : "месяце" };
}

/** Нужно ли делать привычку в этот день (для кольца дня и приглушения карточек). */
export function isDue(h: Habit, em: EntryMap | undefined, date: string) {
  const f = getFreq(h);
  if (f.kind === "daily") return true;
  if (f.kind === "days") return isScheduled(h, date);
  if (em?.[date]?.status) return true;
  const p = periodProgress(h, em, date)!;
  return p.done < p.goal;
}

export function skipsInWeek(em: EntryMap | undefined, date: string) {
  const s = weekStart(pd(date));
  let n = 0;
  for (let i = 0; i < 7; i++) if (em?.[ds(addDays(s, i))]?.status === "skipped") n++;
  return n;
}
