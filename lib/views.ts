import type { Habit } from "./db";
import { addDays, ds, pd, weekStart } from "./dates";
import { cellState, type EntryMap } from "./streak";

export type Mode = "day" | "week" | "month" | "year";

export function shiftAnchor(anchor: string, mode: Mode, n: number) {
  const d = pd(anchor);
  if (mode === "day") return ds(addDays(d, n));
  if (mode === "week") return ds(addDays(d, 7 * n));
  if (mode === "month") return ds(new Date(d.getFullYear(), d.getMonth() + n, 1));
  return ds(new Date(d.getFullYear() + n, 0, 1));
}

export function periodTitle(anchor: string, mode: Mode) {
  const d = pd(anchor);
  if (mode === "day") return d.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  if (mode === "week") {
    const s = weekStart(d), e = addDays(s, 6);
    return `${s.getDate()}–${e.getDate()} ${e.toLocaleDateString("ru-RU", { month: "short" })}`;
  }
  if (mode === "month") return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  return String(d.getFullYear());
}

// Кеш агрегатов: ключ habitId + период + anchor + ревизия данных. Сбрасывается при изменении entries.
let cacheRev = "";
const cache = new Map<string, unknown>();
function memo<T>(rev: string, key: string, fn: () => T): T {
  if (rev !== cacheRev) { cache.clear(); cacheRev = rev; }
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key) as T;
}

export function weekDays(anchor: string) {
  const s = weekStart(pd(anchor));
  return Array.from({ length: 7 }, (_, i) => ds(addDays(s, i)));
}

export function monthDays(anchor: string) {
  const d = pd(anchor);
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const offset = (new Date(d.getFullYear(), d.getMonth(), 1).getDay() + 6) % 7;
  return { offset, days: Array.from({ length: dim }, (_, i) => ds(new Date(d.getFullYear(), d.getMonth(), i + 1))) };
}

export function countDone(h: Habit, em: EntryMap | undefined, days: string[], today: string, rev: string) {
  return memo(rev, `${h.id}|${days[0]}|${days.length}`, () => days.filter((d) => cellState(h, em, d, today) === "done").length);
}

export function yearData(h: Habit, em: EntryMap | undefined, year: number, today: string, rev: string) {
  return memo(rev, `${h.id}|y${year}`, () =>
    Array.from({ length: 12 }, (_, m) => {
      const dim = new Date(year, m + 1, 0).getDate();
      let done = 0, elapsed = 0;
      for (let j = 1; j <= dim; j++) {
        const d = ds(new Date(year, m, j));
        if (d <= today && d >= h.createdAt) elapsed++;
        if (cellState(h, em, d, today) === "done") done++;
      }
      return { month: m, done, elapsed };
    }),
  );
}
