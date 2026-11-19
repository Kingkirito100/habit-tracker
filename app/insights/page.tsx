"use client";
import { useData, useToday } from "@/lib/hooks";
import { addDays, ds, pd, WEEKDAYS_LONG } from "@/lib/dates";
import { getFreq, streakWord } from "@/lib/freq";
import { cellState, streak } from "@/lib/streak";
import { HabitGrid, Legend } from "@/components/HabitGrid";
import { StreakBadge } from "@/components/StreakBadge";

export default function Insights() {
  const data = useData();
  const today = useToday();
  if (!data || !today) return <><h1>Инсайты</h1><div className="skel" /></>;
  if (!data.active.length) return <><h1>Инсайты</h1><div className="empty">Когда появятся привычки и отметки, здесь будет ответ на вопрос «как у меня дела».</div></>;
  return (
    <>
      <h1>Инсайты</h1>
      {data.active.map((h) => {
        const map = data.maps[h.id];
        const week = Array.from({ length: 7 }, (_, i) => ds(addDays(pd(today), i - 6)));
        const doneWeek = week.filter((d) => cellState(h, map, d, today) === "done").length;
        const cnt = [0, 0, 0, 0, 0, 0, 0];
        let total = 0;
        Object.values(map ?? {}).forEach((e) => { if (e.status === "done") { cnt[pd(e.date).getDay()]++; total++; } });
        const best = cnt.indexOf(Math.max(...cnt));
        const k = streak(h, map, today);
        // Процент за 30 дней: пропуски не считаются провалом
        let el = 0, dn = 0;
        for (let i = 0; i < 30; i++) {
          const d = ds(addDays(pd(today), -i));
          const c = cellState(h, map, d, today);
          if (c === "done") { dn++; el++; } else if (c === "missed") el++;
        }
        return (
          <div className="panel" key={h.id} data-accent={h.color}>
            <div className="mb-2 flex items-center justify-between gap-2"><h2>{h.name}</h2><StreakBadge current={k.current} unit={k.unit} /></div>
            <HabitGrid habit={h} map={map} days={week} today={today} />
            <p className="mb-0 mt-2.5">
              {doneWeek} из 7 дней за последнюю неделю.{" "}
              {total >= 3 ? `Лучший день — ${WEEKDAYS_LONG[best]}. ` : "Данных пока мало — продолжай отмечать. "}
              {getFreq(h).kind === "weekly" || getFreq(h).kind === "monthly" ? `За 30 дней отмечено ${dn} раз. ` : el > 0 ? `За 30 дней — ${Math.round((100 * dn) / el)}%. ` : ""}Всего выполнено: {total}. 
              Самая длинная серия — {k.best} {streakWord(k.best, k.unit)}.
            </p>
          </div>
        );
      })}
      <Legend />
    </>
  );
}
