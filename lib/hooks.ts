"use client";
import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Habit } from "./db";
import type { EntryMap } from "./streak";
import { todayStr } from "./dates";

export interface AppData {
  habits: Habit[];
  active: Habit[];
  maps: Record<number, EntryMap>;
  rev: string;
}

/** undefined — данные ещё грузятся (на сервере и при первом рендере). */
export function useData(): AppData | undefined {
  const habits = useLiveQuery(() => db.habits.orderBy("order").toArray(), []);
  const entries = useLiveQuery(() => db.entries.toArray(), []);
  return useMemo(() => {
    if (!habits || !entries) return undefined;
    const maps: Record<number, EntryMap> = {};
    let max = 0;
    for (const e of entries) {
      (maps[e.habitId] ??= {})[e.date] = e;
      if (e.updatedAt > max) max = e.updatedAt;
    }
    return { habits, active: habits.filter((h) => !h.archived), maps, rev: `${entries.length}:${max}:${habits.length}` };
  }, [habits, entries]);
}

/** Сегодняшняя дата; null до монтирования. Обновляется, когда приложение возвращается на передний план. */
export function useToday() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const u = () => setT(todayStr());
    u();
    document.addEventListener("visibilitychange", u);
    return () => document.removeEventListener("visibilitychange", u);
  }, []);
  return t;
}
