"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, deleteHabit, setEntry } from "@/lib/db";
import { useData, useToday } from "@/lib/hooks";
import { addDays, ds, pd, weekStart } from "@/lib/dates";
import { MAX_SKIPS_PER_WEEK, cellState, periodProgress, skipsInWeek, streak } from "@/lib/streak";
import { freqLabel, getFreq, nextMilestone, streakWord } from "@/lib/freq";
import { HabitGrid, Legend } from "@/components/HabitGrid";
import { StreakBadge } from "@/components/StreakBadge";
import { getReminders } from "@/lib/reminders";
import { recordFirstCheckIn } from "@/components/DailyPlan";
import { HabitForm } from "@/components/HabitForm";

export default function HabitDetail() {
  const id = Number(useParams<{ id: string }>().id);
  const r = useRouter();
  const data = useData();
  const today = useToday();
  const [edit, setEdit] = useState(false);
  const [message, setMessage] = useState("");
  if (!data || !today) return <div className="skel" />;
  const h = data.habits.find((x) => x.id === id);
  if (!h) return <div className="empty"><p>Привычка не найдена.</p><button className="btn" onClick={() => r.push("/")}>К списку</button></div>;
  const map = data.maps[id];
  const k = streak(h, map, today);
  const start = weekStart(addDays(pd(today), -28));
  const days = Array.from({ length: 35 }, (_, i) => ds(addDays(start, i)));
  const cycle = async (date: string) => {
    if (date > today || date < h.createdAt) return;
    const state = cellState(h, map, date, today);
    if (state === "done" && skipsInWeek(map, date) >= MAX_SKIPS_PER_WEEK) {
      setMessage("На этой неделе уже два пропуска. Отметка сохранена.");
      return;
    }
    setMessage("");
    try {
      const next = state === "done" ? "skipped" : state === "skipped" ? null : "done";
      await setEntry(id, date, next, next === "done" && h.type === "count" ? h.target : undefined);
      if (next === "done") recordFirstCheckIn();
    } catch {
      setMessage("Не удалось сохранить отметку.");
    }
  };
  const reminders = getReminders(h);
  const notes = Object.values(map ?? {}).filter((entry) => entry.note).sort((a, b) => b.date.localeCompare(a.date));
  const prog = periodProgress(h, map, today);
  const ms = nextMilestone(k.current, k.unit);
  return (
    <div data-accent={h.color}>
      <h1>{h.name}</h1>
      <div className="panel"><StreakBadge current={k.current} best={k.best} unit={k.unit} /><p className="mb-0 mt-1.5 text-mute">{freqLabel(getFreq(h))}{prog ? ` · ${prog.done} из ${prog.goal} на этой ${prog.period}` : ""}{ms ? ` · до ${ms} ${streakWord(ms, k.unit)} осталось ${ms - k.current}` : ""}</p></div>
      {edit ? (
        <HabitForm initial={h} submitLabel="Сохранить" onSubmit={async (d) => { await db.habits.update(id, d); setEdit(false); }} />
      ) : (
        <>
          <div className="panel">
            <p className="mt-0 text-mute">Последние 5 недель, Пн–Вс. Нажми на день: выполнено → пропуск → пусто.</p>
            <HabitGrid habit={h} map={map} days={days} today={today} onCycle={cycle} />
            <Legend />
            {message && <p className="text-sm text-mute" role="status">{message}</p>}
          </div>
          <p>Пропусков на этой неделе: {skipsInWeek(map, today)} из {MAX_SKIPS_PER_WEEK}.</p>
          {reminders.length > 0 && <p className="mb-2">Напоминания: {reminders.map(({ time }) => time).join(", ")}.</p>}
          {notes.length > 0 && (
            <details className="panel">
              <summary className="min-h-11 cursor-pointer content-center font-semibold">История заметок ({notes.length})</summary>
              <ul>
                {notes.map(({ date, note }) => (
                  <li key={date} className="border-t border-line py-2">
                    <time dateTime={date} className="text-sm text-mute">{pd(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</time>
                    <p className="whitespace-pre-wrap break-words">{note}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => setEdit(true)}>Редактировать</button>
            <button className="btn" onClick={async () => { await db.habits.update(id, { archived: !h.archived }); r.push("/"); }}>{h.archived ? "Вернуть из архива" : "В архив"}</button>
            <button className="btn warn" onClick={async () => { if (confirm(`Удалить «${h.name}» вместе с историей?`)) { await deleteHabit(id); r.push("/"); } }}>Удалить</button>
          </div>
        </>
      )}
    </div>
  );
}
