"use client";
import { useRef, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ICONS, HabitIcon } from "./HabitIcon";
import { Segmented } from "./Segmented";
import type { Freq, Habit, HabitReminder } from "@/lib/db";
import { getReminders, isReminderDay, validReminderTime } from "@/lib/reminders";
import { DAYS_LABEL, freqLabel } from "@/lib/freq";
import { PRESETS } from "@/lib/presets";

export type HabitDraft = Pick<Habit, "name" | "icon" | "type" | "target" | "unit" | "reminderTime" | "reminders" | "freq" | "color">;
const ACCENT_KEYS = ["blue", "green", "orange", "purple", "pink", "teal"];
const ACCENT_NAMES: Record<string, string> = { blue: "Синий", green: "Зелёный", orange: "Оранжевый", purple: "Фиолетовый", pink: "Розовый", teal: "Бирюзовый" };

export function HabitForm({ initial, submitLabel, onSubmit }: { initial?: HabitDraft; submitLabel: string; onSubmit: (d: HabitDraft) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "check");
  const [type, setType] = useState<"binary" | "count">(initial?.type ?? "binary");
  const [target, setTarget] = useState(String(initial?.target ?? 1));
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [reminders, setReminders] = useState(() =>
    (initial ? getReminders(initial) : []).map((reminder, id) => ({ ...reminder, id })),
  );
  const nextReminderId = useRef(reminders.length);
  const updateReminder = (id: number, patch: Partial<HabitReminder>) => {
    setReminders((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };
  const [kind, setKind] = useState<Freq["kind"]>(initial?.freq?.kind ?? "daily");
  const [times, setTimes] = useState(initial?.freq?.times && initial.freq.times > 0 ? initial.freq.times : 3);
  const [days, setDays] = useState<number[]>(initial?.freq?.days?.length ? initial.freq.days : [0, 2, 4]);
  const [color, setColor] = useState<string | undefined>(initial?.color);

  const max = kind === "weekly" ? 6 : 28;
  const freq: Freq = { kind, times: kind === "weekly" || kind === "monthly" ? Math.min(times, max) : 1, days: kind === "days" ? [...days].sort() : [] };
  const hasConflictingReminders = reminders.some((item, index) =>
    reminders.slice(0, index).some((previous) =>
      item.time === previous.time &&
      DAYS_LABEL.some((_, day) => isReminderDay(item, day) && isReminderDay(previous, day)),
    ),
  );
  const goal = Number(target);
  const valid = name.trim().length > 0 && (type === "binary" || (Number.isSafeInteger(goal) && goal >= 1)) &&
    (kind !== "days" || days.length > 0) && reminders.every(({ time }) => validReminderTime(time)) &&
    !hasConflictingReminders;

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setName(p.name); setIcon(p.icon); setType(p.type); setTarget(String(p.target)); setUnit(p.unit ?? "");
    const f = p.freq!; setKind(f.kind); if (f.times > 1 || f.kind !== "daily") setTimes(f.times); if (f.days.length) setDays(f.days);
  };

  return (
    <div>
      {!initial && (
        <>
          <span className="mb-1 block text-mute">Быстрый старт — выберите шаблон</span>
          <div className="mb-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.name} className="btn flex items-center gap-1.5 !px-3 text-[15px]" onClick={() => applyPreset(p)}>
                <HabitIcon name={p.icon} size={18} />{p.name}
              </button>
            ))}
          </div>
        </>
      )}
      <label htmlFor="nm" className="mb-1 block text-mute">Название</label>
      <input id="nm" className="field" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: выпить воды" />

      <span className="mb-1 block text-mute">Как часто</span>
      <Segmented<Freq["kind"]> label="Частота" value={kind} onChange={setKind} items={[["daily", "Ежедневно"], ["days", "По дням"], ["weekly", "В неделю"], ["monthly", "В месяц"]]} />
      {kind === "days" && (
        <div className="mb-3 flex gap-1.5" role="group" aria-label="Дни недели">
          {DAYS_LABEL.map((l, i) => (
            <button key={l} aria-pressed={days.includes(i)} onClick={() => setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))}
              className={`h-11 flex-1 rounded-ctl border-2 text-[15px] font-semibold ${days.includes(i) ? "border-ok bg-ok text-okt" : "border-line bg-surf"}`}>{l}</button>
          ))}
        </div>
      )}
      {(kind === "weekly" || kind === "monthly") && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-ctl bg-surf p-2">
          <button className="btn" aria-label="Меньше" onClick={() => setTimes((t) => Math.max(1, t - 1))}><Minus size={20} aria-hidden /></button>
          <b className="text-center text-[18px]">{freqLabel(freq)}</b>
          <button className="btn" aria-label="Больше" onClick={() => setTimes((t) => Math.min(max, t + 1))}><Plus size={20} aria-hidden /></button>
        </div>
      )}
      <p className="-mt-1 mb-3 text-[15px] text-mute">
        {kind === "weekly" || kind === "monthly" ? "Серия считает подряд выполненные " + (kind === "weekly" ? "недели" : "месяцы") + ". Отмечать можно в любые дни." : kind === "days" ? "В остальные дни привычка не считается пропуском." : "Серия считает дни подряд."}
      </p>

      <span className="mb-1 block text-mute">Иконка</span>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Иконка">
        {Object.keys(ICONS).map((k) => (
          <button key={k} onClick={() => setIcon(k)} aria-pressed={icon === k} aria-label={k}
            className={`grid h-12 w-12 place-items-center rounded-ctl border-2 ${icon === k ? "border-ok bg-ok text-okt" : "border-line bg-surf"}`}>
            <HabitIcon name={k} />
          </button>
        ))}
      </div>

      <span className="mb-1 block text-mute">Цвет</span>
      <div className="mb-3 flex flex-wrap items-center gap-2.5" role="group" aria-label="Цвет привычки">
        <button className="btn !px-3 text-[15px]" aria-pressed={!color} onClick={() => setColor(undefined)} style={!color ? { outline: "3px solid var(--ink)", outlineOffset: 2 } : undefined}>Как в теме</button>
        {ACCENT_KEYS.map((k) => <button key={k} data-accent={k} className="sw-btn" aria-label={ACCENT_NAMES[k]} aria-pressed={color === k} onClick={() => setColor(k)} />)}
      </div>

      <span className="mb-1 block text-mute">Тип</span>
      <Segmented<"binary" | "count"> label="Тип" value={type} onChange={setType} items={[["binary", "Сделал / не сделал"], ["count", "Количество"]]} />
      {type === "count" && (
        <div className="flex gap-2">
          <div className="flex-1"><label htmlFor="tg" className="mb-1 block text-mute">Цель</label><input id="tg" className="field" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))} /></div>
          <div className="flex-1"><label htmlFor="un" className="mb-1 block text-mute">Единица</label><input id="un" className="field" value={unit} maxLength={12} onChange={(e) => setUnit(e.target.value)} placeholder="стаканов" /></div>
        </div>
      )}
      <section className="mb-4" aria-labelledby="reminder-heading">
        <h2 id="reminder-heading">Напоминания</h2>
        <p className="mb-3 mt-1 text-[15px] text-mute">
          Работают, пока приложение открыто и уведомления разрешены. Учитывают расписание привычки.
        </p>
        {reminders.map((item, index) => (
          <fieldset className="panel min-w-0" key={item.id}>
            <legend>Напоминание {index + 1}</legend>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <label className="min-w-0 flex-1">
                <span className="mb-1 block text-mute">Время</span>
                <input type="time" className="field !mb-0" value={item.time}
                  aria-invalid={!validReminderTime(item.time)}
                  onChange={(e) => updateReminder(item.id, { time: e.target.value })} />
              </label>
              <button className="btn self-end" type="button" aria-label={`Удалить напоминание ${index + 1}`}
                onClick={() => setReminders((items) => items.filter(({ id }) => id !== item.id))}>
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
            {!validReminderTime(item.time) && <p className="mt-0 text-[15px] text-mute">Укажи время напоминания.</p>}
            <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label={`Дни напоминания ${index + 1}`}>
              <button className={`btn !px-3 ${item.days.length === 0 ? "pri" : ""}`} type="button" aria-pressed={item.days.length === 0}
                onClick={() => updateReminder(item.id, { days: [] })}>Все дни</button>
              {DAYS_LABEL.map((label, day) => {
                const selected = item.days.includes(day);
                return (
                  <button key={label} type="button" aria-pressed={selected}
                    className={`btn !px-3 ${selected ? "pri" : ""}`}
                    onClick={() => updateReminder(item.id, { days: selected ? item.days.filter((n) => n !== day) : [...item.days, day] })}>
                    {label}
                  </button>
                );
              })}
            </div>
            <label>
              <span className="mb-1 block text-mute">Сообщение (необязательно)</span>
              <input className="field !mb-0" maxLength={120} value={item.message ?? ""}
                placeholder="Например: как насчёт короткой прогулки?"
                onChange={(e) => updateReminder(item.id, { message: e.target.value })} />
            </label>
          </fieldset>
        ))}
        {hasConflictingReminders && <p className="text-mute" role="status">В один день время напоминаний не должно совпадать.</p>}
        <button className="btn inline-flex items-center gap-2" type="button" onClick={() => {
          const id = nextReminderId.current++;
          setReminders((items) => [...items, { id, time: "", days: [] }]);
        }}>
          <Plus size={18} aria-hidden /> Добавить напоминание
        </button>
      </section>
      <button className="btn pri w-full" disabled={!valid} style={{ opacity: valid ? 1 : 0.5 }}
        onClick={() => onSubmit({
          name: name.trim(),
          icon,
          type,
          target: type === "count" ? goal : 1,
          unit: type === "count" ? unit.trim() : undefined,
          reminderTime: undefined,
          freq,
          color,
          reminders: reminders.map(({ time, days, message }) => ({ time, days, message: message?.trim() || undefined })),
        })}>
        {submitLabel}
      </button>
    </div>
  );
}
