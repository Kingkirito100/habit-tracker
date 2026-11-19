import type { Freq, Habit } from "./db";
import { plural } from "./dates";

export type StreakUnit = "day" | "week" | "month";
export const DAILY: Freq = { kind: "daily", times: 1, days: [] };
export const getFreq = (h: Habit): Freq => h.freq ?? DAILY;
export const DAYS_LABEL = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function freqLabel(f: Freq) {
  if (f.kind === "weekly") return `${f.times} ${plural(f.times, "раз", "раза", "раз")} в неделю`;
  if (f.kind === "monthly") return `${f.times} ${plural(f.times, "раз", "раза", "раз")} в месяц`;
  if (f.kind === "days" && f.days.length < 7) return f.days.map((i) => DAYS_LABEL[i]).join(", ");
  return "Каждый день";
}
export const unitOf = (f: Freq): StreakUnit => (f.kind === "weekly" ? "week" : f.kind === "monthly" ? "month" : "day");
export function streakWord(n: number, u: StreakUnit) {
  return u === "week" ? plural(n, "неделя", "недели", "недель") : u === "month" ? plural(n, "месяц", "месяца", "месяцев") : plural(n);
}
const MILESTONES: Record<StreakUnit, number[]> = { day: [3, 7, 14, 21, 30, 60, 100, 200, 365], week: [2, 4, 8, 12, 26, 52], month: [2, 3, 6, 12] };
export const nextMilestone = (n: number, u: StreakUnit) => MILESTONES[u].find((m) => m > n);
