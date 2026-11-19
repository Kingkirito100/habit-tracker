"use client";
import { useEffect, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { setEntry, type Habit, type Status } from "@/lib/db";
import { plural } from "@/lib/dates";
import { MAX_SKIPS_PER_WEEK, skipsInWeek, streak, type EntryMap } from "@/lib/streak";
import { HabitIcon } from "./HabitIcon";

/** Один тап — отметка. Optimistic update: состояние меняется мгновенно, запись в IndexedDB идёт следом. */
export function HabitCheckIn({ habit, map, date, today, onFirstCheckIn }: { habit: Habit; map?: EntryMap; date: string; today: string; onFirstCheckIn?: () => void }) {
  const real = map?.[date];
  const [opt, setOpt] = useState<{ status: Status | null; value?: number } | undefined>();
  const [adjust, setAdjust] = useState(false);
  const [pulse, setPulse] = useState(false);
  useEffect(() => setOpt(undefined), [real?.status, real?.value]);

  const status = opt ? opt.status : real?.status ?? null;
  const value = opt ? opt.value : real?.value;
  const future = date > today;
  const isCount = habit.type === "count";
  const k = streak(habit, map, today);

  const write = (s: Status | null, v?: number) => {
    setOpt({ status: s, value: v });
    setEntry(habit.id, date, s, v);
  };
  const toggle = () => {
    const next = status === "done" ? null : "done";
    write(next, next && isCount ? habit.target : undefined);
    if (next) { setPulse(true); setTimeout(() => setPulse(false), 260); navigator.vibrate?.(15); onFirstCheckIn?.(); }
  };
  const skip = () => {
    if (status === "skipped") return write(null);
    if (skipsInWeek(map, date) >= MAX_SKIPS_PER_WEEK) return alert(`На этой неделе уже ${MAX_SKIPS_PER_WEEK} пропуска.`);
    write("skipped");
  };
  const setVal = (v: number) => {
    const n = Math.max(0, v);
    write(n >= habit.target ? "done" : n > 0 ? "pending" : null, n || undefined);
  };

  const cls = status === "done" ? "d" : status === "skipped" ? "s" : "";
  const sub =
    status === "skipped" ? "Пропуск — серия не прервётся"
    : isCount ? `${value ?? 0} из ${habit.target} ${habit.unit ?? ""}`
    : status === "done" ? "Выполнено"
    : future ? "Ещё не наступило"
    : date === today && k.current ? `Серия: ${k.current} ${plural(k.current)}` : "Не отмечено";

  return (
    <div className="mb-2.5">
      <div className="flex gap-2">
        <button className={`tap ${cls} ${pulse ? "pulse" : ""}`} disabled={future} aria-pressed={status === "done"} onClick={toggle}>
          <span className="box">{status === "done" ? <Check size={20} strokeWidth={3} aria-hidden /> : status === "skipped" ? <Minus size={20} strokeWidth={3} aria-hidden /> : null}</span>
          <span className="min-w-0 flex-1">
            <b className="block font-semibold">{habit.name}</b>
            <small>{sub}</small>
          </span>
          <HabitIcon name={habit.icon} />
        </button>
        {isCount ? (
          <button className="side" disabled={future} onClick={() => setAdjust((a) => !a)} aria-expanded={adjust} aria-label={`Изменить количество: ${habit.name}`}>±</button>
        ) : (
          <button className={`side ${status === "skipped" ? "on" : ""}`} disabled={future} onClick={skip} aria-label={`Пропустить день: ${habit.name}`}>{status === "skipped" ? "Вернуть" : "Пропуск"}</button>
        )}
      </div>
      {isCount && adjust && (
        <div className="panel mt-2 flex items-center justify-between gap-2">
          <button className="btn" onClick={() => setVal((value ?? 0) - 1)} aria-label="Меньше"><Minus size={20} aria-hidden /></button>
          <span className="text-[22px] font-bold">{value ?? 0} <span className="text-[15px] font-normal text-mute">/ {habit.target} {habit.unit}</span></span>
          <button className="btn" onClick={() => setVal((value ?? 0) + 1)} aria-label="Больше"><Plus size={20} aria-hidden /></button>
          <button className={`btn ${status === "skipped" ? "pri" : "warn"}`} onClick={skip}>Пропуск</button>
        </div>
      )}
    </div>
  );
}
