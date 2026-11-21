"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Minus } from "lucide-react";
import type { Habit } from "@/lib/db";
import { addDays, ds, pd, weekStart, WEEKDAYS_SHORT } from "@/lib/dates";
import { getFreq } from "@/lib/freq";
import { cellState, isScheduled, type EntryMap } from "@/lib/streak";

export function WeeklySummary({ habits, maps, today }: { habits: Habit[]; maps: Record<number, EntryMap>; today: string }) {
  const [offset, setOffset] = useState(0);
  const start = addDays(weekStart(pd(today)), offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => ds(addDays(start, i)));
  const end = days[6];
  const earliest = habits.reduce((date, habit) => habit.createdAt < date ? habit.createdAt : date, today);
  const label = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).formatRange(start, pd(end));

  const rows = habits.filter((habit) => habit.createdAt <= end).map((habit) => {
    const map = maps[habit.id];
    const freq = getFreq(habit);
    const cells = days.map((date) => {
      const scheduled = date >= habit.createdAt && date <= today && isScheduled(habit, date);
      const state = date < habit.createdAt || date > today ? "future" : cellState(habit, map, date, today);
      return {
        date, scheduled, state,
        label: state === "done" ? "выполнено" : state === "skipped" ? "пропуск"
          : state === "future" ? "недоступно" : scheduled ? "нет отметки" : "без плана на день",
      };
    });
    return {
      habit, freq, cells,
      done: cells.filter((cell) => cell.state === "done").length,
      planned: cells.filter((cell) => cell.scheduled).length,
      doneOnPlan: cells.filter((cell) => cell.scheduled && cell.state === "done").length,
    };
  });
  const totalMarks = rows.reduce((total, row) => total + row.done, 0);
  const weeklyGoals = rows.filter((row) => row.freq.kind === "weekly");
  const weeklyDone = weeklyGoals.filter((row) => row.done >= row.freq.times).length;

  return (
    <section className="panel" aria-labelledby="weekly-summary">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="weekly-summary">Итоги недели</h2>
        <div className="week-navigation">
          <button type="button" aria-label="Предыдущая неделя" disabled={days[0] <= earliest} onClick={() => setOffset(offset - 1)}><ChevronLeft size={20} aria-hidden /></button>
          <span aria-live="polite">{label}</span>
          <button type="button" aria-label="Следующая неделя" disabled={offset >= 0} onClick={() => setOffset(offset + 1)}><ChevronRight size={20} aria-hidden /></button>
        </div>
      </header>
      <p className="mb-2 text-sm"><b>Отметки: {totalMarks}</b>{weeklyGoals.length > 0 && <span className="text-mute"> · Недельные цели: {weeklyDone} из {weeklyGoals.length}</span>}</p>
      {rows.length === 0 ? <p className="text-mute">На этой неделе ещё не было привычек.</p> : <>
        <div className="week-cells mb-1" aria-hidden="true">
          {WEEKDAYS_SHORT.map((day) => <span key={day} className="wl">{day}</span>)}
        </div>
        <ul className="week-rows">
          {rows.map(({ habit, cells, freq, planned, doneOnPlan, done }) => (
            <li key={habit.id} data-accent={habit.color}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
                <Link className="min-w-0 break-words font-semibold hover:underline" href={`/habits/${habit.id}`}>{habit.name}</Link>
                <span className="text-sm text-mute">
                  {freq.kind === "weekly" ? `${done} из ${freq.times} на неделе`
                    : freq.kind === "monthly" ? `Отметки за неделю: ${done}`
                    : planned ? `${doneOnPlan} из ${planned} по плану` : "Без плана на эти дни"}
                </span>
              </div>
              <div className="week-cells">
                {cells.map((cell, index) => (
                  <span className="week-cell" key={cell.date} data-state={cell.state}>
                    <span className="sr-only">{WEEKDAYS_SHORT[index]}, {cell.date}: {cell.label}</span>
                    {cell.state === "done" ? <Check size={16} aria-hidden /> : cell.state === "skipped" ? <Minus size={16} aria-hidden />
                      : <span aria-hidden>{pd(cell.date).getDate()}</span>}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </>}
    </section>
  );
}
