"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useData, useToday } from "@/lib/hooks";
import { updateSettings, useSettings } from "@/lib/settings";
import { setEntry } from "@/lib/db";
import { countDone, monthDays, weekDays, yearData } from "@/lib/views";
import { cellState, isDue, streak } from "@/lib/streak";
import { pd } from "@/lib/dates";
import { HabitCheckIn } from "@/components/HabitCheckIn";
import { HabitGrid, Legend } from "@/components/HabitGrid";
import { HabitCalendar } from "@/components/HabitCalendar";
import { DayRing } from "@/components/DayRing";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import { NotificationPermission } from "@/components/NotificationPermission";
import { WEEKDAYS_SHORT, plural } from "@/lib/dates";
import type { Habit } from "@/lib/db";

export default function TodayPage() {
  const data = useData();
  const today = useToday();
  const s = useSettings();
  const [anchorSel, setAnchor] = useState<string | null>(null);

  if (!data || !today) return <><h1>Привычки</h1><div className="skel" /><div className="skel" /></>;
  const anchor = anchorSel ?? today;
  const { active, maps, rev } = data;
  const mode = s.mode;
  const sel: Habit | undefined = active.find((h) => h.id === s.sel) ?? active[0];

  const cycle = (h: Habit, d: string) => {
    const c = cellState(h, maps[h.id], d, today);
    if (c === "done") setEntry(h.id, d, "skipped");
    else if (c === "skipped") setEntry(h.id, d, null);
    else setEntry(h.id, d, "done");
    if (c !== "done" && c !== "skipped") onFirst();
  };
  const onFirst = () => { try { localStorage.setItem("hb-checkin", "1"); } catch {} window.dispatchEvent(new Event("hb:checkin")); };

  // Swipe между периодами
  let sx = 0, sy = 0;
  const touch = {
    onTouchStart: (e: React.TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; },
    onTouchEnd: (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 40) import("@/lib/views").then((v) => setAnchor(v.shiftAnchor(anchor, mode, dx < 0 ? 1 : -1)));
    },
  };

  if (!active.length) {
    return (
      <>
        <h1>Привычки</h1>
        <div className="empty">
          <p>Здесь пока пусто. Добавь первую привычку — отмечать её можно одним касанием.</p>
          <Link href="/habits/new" className="btn pri mt-2 inline-flex items-center">Добавить первую привычку</Link>
        </div>
      </>
    );
  }

  return (
    <div {...touch}>
      <h1>Привычки</h1>
      <NotificationPermission />
      <ViewSwitcher mode={mode} anchor={anchor} today={today} onMode={(m) => updateSettings({ mode: m })} onAnchor={setAnchor} />

      {mode === "day" && (() => {
        const ids = new Set(active.filter((h) => isDue(h, maps[h.id], anchor)).map((h) => h.id));
        const done = active.filter((h) => maps[h.id]?.[anchor]?.status === "done");
        done.forEach((h) => ids.add(h.id));
        return (
          <>
            <DayRing done={done.length} total={ids.size} />
            {active.map((h) => (
              <div key={h.id} data-accent={h.color} className="mb-1">
                <HabitCheckIn habit={h} map={maps[h.id]} date={anchor} today={today} onFirstCheckIn={onFirst} />
                {s.layout === "calendar" && <HabitCalendar habit={h} map={maps[h.id]} today={today} />}
              </div>
            ))}
            <p className="text-[15px] text-mute">Нажми на карточку, чтобы отметить. Пропуск — до 2 раз в неделю, серия не сгорает. Нажми на календарь, чтобы открыть подробности.</p>
          </>
        );
      })()}

      {mode === "week" && (
        <>
          <div className="grid7 px-3.5 pb-1">{WEEKDAYS_SHORT.map((l) => <div key={l} className="wl">{l}</div>)}</div>
          {active.map((h) => {
            const days = weekDays(anchor);
            return (
              <div key={h.id} className="panel">
                <div className="mb-2 flex items-center justify-between"><h2><Link href={`/habits/${h.id}`}>{h.name}</Link></h2><span className="text-mute">{countDone(h, maps[h.id], days, today, rev)} из 7</span></div>
                <HabitGrid habit={h} map={maps[h.id]} days={days} today={today} onCycle={(d) => cycle(h, d)} />
              </div>
            );
          })}
          <Legend />
        </>
      )}

      {(mode === "month" || mode === "year") && sel && (
        <>
          <select className="field" aria-label="Привычка" value={sel.id} onChange={(e) => updateSettings({ sel: Number(e.target.value) })}>
            {active.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          {mode === "month" && (() => {
            const { offset, days } = monthDays(anchor);
            return (
              <>
                <div className="panel">
                  <div className="mb-2 flex items-center justify-between"><h2>Выполнено</h2><span className="text-mute">{countDone(sel, maps[sel.id], days, today, rev)} из {days.length}</span></div>
                  <div className="grid7 mb-1">{WEEKDAYS_SHORT.map((l) => <div key={l} className="wl">{l}</div>)}</div>
                  <HabitGrid habit={sel} map={maps[sel.id]} days={days} today={today} offset={offset} onCycle={(d) => cycle(sel, d)} />
                </div>
                <Legend />
                <p className="text-[15px] text-mute">Листай свайпом влево и вправо. Нажми на день: выполнено → пропуск → пусто.</p>
              </>
            );
          })()}
          {mode === "year" && (() => {
            const y = pd(anchor).getFullYear();
            const months = yearData(sel, maps[sel.id], y, today, rev);
            const total = months.reduce((a, m) => a + m.done, 0);
            return (
              <>
                <p><b>{total}</b> {plural(total)} выполнено за {y} год</p>
                <div className="grid grid-cols-3 gap-2">
                  {months.map((m) => (
                    <button key={m.month} className="mon" onClick={() => { updateSettings({ mode: "month" }); setAnchor(`${y}-${String(m.month + 1).padStart(2, "0")}-01`); }}>
                      <span className="text-[15px] capitalize text-mute">{new Date(y, m.month, 1).toLocaleDateString("ru-RU", { month: "long" })}</span>
                      <div className="text-[26px] font-bold">{m.done}</div>
                      <div className="bar" aria-hidden><i style={{ width: `${m.elapsed ? Math.round((100 * m.done) / m.elapsed) : 0}%` }} /></div>
                    </button>
                  ))}
                </div>
                <p className="text-[15px] text-mute">Число — выполненных дней в месяце, полоса — доля от прошедших дней. Нажми на месяц, чтобы открыть его.</p>
              </>
            );
          })()}
        </>
      )}

      <Link href="/habits/new" className="fab"><Plus size={20} aria-hidden /> Привычка</Link>
    </div>
  );
}
