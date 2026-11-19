import Link from "next/link";
import type { Habit } from "@/lib/db";
import { addDays, ds, pd, weekStart, WEEKDAYS_SHORT } from "@/lib/dates";
import { freqLabel, getFreq, nextMilestone, streakWord } from "@/lib/freq";
import { periodProgress, streak, type EntryMap } from "@/lib/streak";
import { HabitGrid } from "./HabitGrid";
import { StreakBadge } from "./StreakBadge";

/** Мини-календарь привычки на главной: 5 недель, серия, лучшая серия, прогресс периода и ближайшая веха. Вся карточка — ссылка на детали. */
export function HabitCalendar({ habit, map, today }: { habit: Habit; map?: EntryMap; today: string }) {
  const k = streak(habit, map, today);
  const prog = periodProgress(habit, map, today);
  const start = weekStart(addDays(pd(today), -28));
  const days = Array.from({ length: 35 }, (_, i) => ds(addDays(start, i)));
  const ms = nextMilestone(k.current, k.unit);
  return (
    <Link href={`/habits/${habit.id}`} className="panel block" aria-label={`${habit.name}: серия ${k.current}, лучшая ${k.best}. Открыть подробности`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <StreakBadge current={k.current} best={k.best} unit={k.unit} />
        <span className="text-[15px] text-mute">{freqLabel(getFreq(habit))}</span>
      </div>
      <div className="grid7 mb-1" aria-hidden>{WEEKDAYS_SHORT.map((l) => <div key={l} className="wl">{l}</div>)}</div>
      <HabitGrid mini habit={habit} map={map} days={days} today={today} />
      <p className="mb-0 mt-2 text-[15px] text-mute">
        {prog ? `${prog.done} из ${prog.goal} на этой ${prog.period}. ` : ""}
        {ms ? `До ${ms} ${streakWord(ms, k.unit)} осталось ${ms - k.current}.` : "Серия выше всех вех — так держать."}
      </p>
    </Link>
  );
}
