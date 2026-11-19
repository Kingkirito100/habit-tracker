"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, deleteHabit, setEntry } from "@/lib/db";
import { useData, useToday } from "@/lib/hooks";
import { addDays, ds, pd, weekStart } from "@/lib/dates";
import { MAX_SKIPS_PER_WEEK, cellState, skipsInWeek, streak } from "@/lib/streak";
import { HabitGrid, Legend } from "@/components/HabitGrid";
import { StreakBadge } from "@/components/StreakBadge";
import { HabitForm } from "@/components/HabitForm";

export default function HabitDetail() {
  const id = Number(useParams<{ id: string }>().id);
  const r = useRouter();
  const data = useData();
  const today = useToday();
  const [edit, setEdit] = useState(false);
  if (!data || !today) return <div className="skel" />;
  const h = data.habits.find((x) => x.id === id);
  if (!h) return <div className="empty"><p>Привычка не найдена.</p><button className="btn" onClick={() => r.push("/")}>К списку</button></div>;
  const map = data.maps[id];
  const k = streak(h, map, today);
  const start = weekStart(addDays(pd(today), -28));
  const days = Array.from({ length: 35 }, (_, i) => ds(addDays(start, i)));
  const cycle = (d: string) => {
    const c = cellState(h, map, d, today);
    setEntry(id, d, c === "done" ? "skipped" : c === "skipped" ? null : "done");
  };
  return (
    <>
      <h1>{h.name}</h1>
      <div className="panel"><StreakBadge current={k.current} best={k.best} /></div>
      {edit ? (
        <HabitForm initial={h} submitLabel="Сохранить" onSubmit={async (d) => { await db.habits.update(id, d); setEdit(false); }} />
      ) : (
        <>
          <div className="panel">
            <p className="mt-0 text-mute">Последние 5 недель, Пн–Вс. Нажми на день: выполнено → пропуск → пусто.</p>
            <HabitGrid habit={h} map={map} days={days} today={today} onCycle={cycle} />
            <Legend />
          </div>
          <p>Пропусков на этой неделе: {skipsInWeek(map, today)} из {MAX_SKIPS_PER_WEEK}. {h.reminderTime ? `Напоминание в ${h.reminderTime}.` : ""}</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => setEdit(true)}>Редактировать</button>
            <button className="btn" onClick={async () => { await db.habits.update(id, { archived: !h.archived }); r.push("/"); }}>{h.archived ? "Вернуть из архива" : "В архив"}</button>
            <button className="btn warn" onClick={async () => { if (confirm(`Удалить «${h.name}» вместе с историей?`)) { await deleteHabit(id); r.push("/"); } }}>Удалить</button>
          </div>
        </>
      )}
    </>
  );
}
