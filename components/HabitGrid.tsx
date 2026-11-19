"use client";
import { Check, Minus } from "lucide-react";
import type { Habit } from "@/lib/db";
import { pd } from "@/lib/dates";
import { cellState, type EntryMap } from "@/lib/streak";

const LABEL = { done: "выполнено", skipped: "пропуск", missed: "не отмечено", today: "сегодня, не отмечено", future: "недоступно", off: "вне расписания" } as const;
const CLS = { done: "d", skipped: "s", missed: "", today: "t", future: "f", off: "o" } as const;

/** Сетка из 7 колонок. Состояния различаются формой: заливка+галочка / пунктир+тире / пустая рамка / точечная рамка / бледная рамка (вне расписания). */
export function HabitGrid({ habit, map, days, today, offset = 0, onCycle, mini }: { habit: Habit; map?: EntryMap; days: string[]; today: string; offset?: number; onCycle?: (date: string) => void; mini?: boolean }) {
  return (
    <div className="grid7">
      {Array.from({ length: offset }, (_, i) => <div key={`o${i}`} />)}
      {days.map((d) => {
        const s = cellState(habit, map, d, today);
        if (mini) {
          return <div key={d} className={`c mini ${CLS[s]}`} aria-hidden>{s === "done" ? <Check size={14} strokeWidth={3} /> : s === "skipped" ? <Minus size={14} strokeWidth={3} /> : null}</div>;
        }
        const inner = s === "done" ? <Check size={20} strokeWidth={3} aria-hidden /> : s === "skipped" ? <Minus size={20} strokeWidth={3} aria-hidden /> : pd(d).getDate();
        return (
          <button key={d} className={`c ${CLS[s]}`} disabled={!onCycle || s === "future"} onClick={() => onCycle?.(d)} aria-label={`${d}: ${LABEL[s]}`}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}

export function Legend() {
  return (
    <div className="legend" aria-hidden>
      <span>✓ выполнено</span><span>– пропуск</span><span>○ не отмечено</span><span>··· впереди</span>
    </div>
  );
}
