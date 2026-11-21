import Link from "next/link";
import { CalendarCheck, Flame, RotateCcw, Trophy } from "lucide-react";
import { addDays, ds, pd } from "@/lib/dates";
import type { Habit } from "@/lib/db";
import { streak, type EntryMap } from "@/lib/streak";

const GOALS = [
  { id: "week", title: "Первая неделя", detail: "Серия из 7 отметок или первая выполненная недельная цель.", Icon: Flame },
  { id: "month", title: "Месяц регулярности", detail: "Серия из 30 отметок, 4 недельных целей или первая месячная цель.", Icon: CalendarCheck },
  { id: "return", title: "С возвращением", detail: "Отметка после 7 дней без выполнений этой привычки.", Icon: RotateCcw },
] as const;

export function Achievements({ habits, maps, today }: { habits: Habit[]; maps: Record<number, EntryMap>; today: string }) {
  const milestones = habits.map((habit) => {
    const map = maps[habit.id];
    const { best, unit } = streak(habit, map, today);
    const completed = Object.values(map ?? {})
      .filter((entry) => entry.status === "done" && entry.date >= habit.createdAt && entry.date <= today)
      .map((entry) => entry.date)
      .sort();
    return {
      habit,
      week: (unit === "day" && best >= 7) || (unit === "week" && best >= 1),
      month: best >= { day: 30, week: 4, month: 1 }[unit],
      return: completed.some((date, index) => index > 0 && date >= ds(addDays(pd(completed[index - 1]), 8))),
    };
  });
  const unlocked = GOALS.filter(({ id }) => milestones.some((item) => item[id])).length;

  return (
    <section className="panel achievement-panel" aria-labelledby="achievements">
      <header>
        <h2 id="achievements"><Trophy size={20} aria-hidden /> Достижения</h2>
        <span className="text-sm text-mute">Открыто {unlocked} из {GOALS.length}</span>
      </header>
      <ul className="achievement-list">
        {GOALS.map(({ id, title, detail, Icon }) => {
          const matches = milestones.filter((item) => item[id]);
          return (
            <li key={id} data-earned={matches.length > 0}>
              <span className="achievement-icon"><Icon size={20} aria-hidden /></span>
              <div className="min-w-0">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-mute">{detail}</p>
                {matches.length ? (
                  <ul className="achievement-habits" aria-label="Привычки с достижением">
                    {matches.map(({ habit }) => <li key={habit.id}><Link href={`/habits/${habit.id}`}>{habit.name}</Link></li>)}
                  </ul>
                ) : <p className="mt-1 text-sm text-mute">В процессе</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
