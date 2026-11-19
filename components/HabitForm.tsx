"use client";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { ICONS, HabitIcon } from "./HabitIcon";
import { Segmented } from "./Segmented";
import type { Freq, Habit } from "@/lib/db";
import { DAYS_LABEL, freqLabel } from "@/lib/freq";
import { PRESETS } from "@/lib/presets";

export type HabitDraft = Pick<Habit, "name" | "icon" | "type" | "target" | "unit" | "reminderTime" | "freq" | "color">;
const ACCENT_KEYS = ["blue", "green", "orange", "purple", "pink", "teal"];
const ACCENT_NAMES: Record<string, string> = { blue: "Синий", green: "Зелёный", orange: "Оранжевый", purple: "Фиолетовый", pink: "Розовый", teal: "Бирюзовый" };

export function HabitForm({ initial, submitLabel, onSubmit }: { initial?: HabitDraft; submitLabel: string; onSubmit: (d: HabitDraft) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "check");
  const [type, setType] = useState<"binary" | "count">(initial?.type ?? "binary");
  const [target, setTarget] = useState(String(initial?.target ?? 1));
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [time, setTime] = useState(initial?.reminderTime ?? "");
  const [kind, setKind] = useState<Freq["kind"]>(initial?.freq?.kind ?? "daily");
  const [times, setTimes] = useState(initial?.freq?.times && initial.freq.times > 0 ? initial.freq.times : 3);
  const [days, setDays] = useState<number[]>(initial?.freq?.days?.length ? initial.freq.days : [0, 2, 4]);
  const [color, setColor] = useState<string | undefined>(initial?.color);

  const max = kind === "weekly" ? 6 : 28;
  const freq: Freq = { kind, times: kind === "weekly" || kind === "monthly" ? Math.min(times, max) : 1, days: kind === "days" ? [...days].sort() : [] };
  const valid = name.trim().length > 0 && (type === "binary" || Number(target) >= 1) && (kind !== "days" || days.length > 0);

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
      <label htmlFor="tm" className="mb-1 block text-mute">Напоминание (необязательно)</label>
      <input id="tm" type="time" className="field" value={time} onChange={(e) => setTime(e.target.value)} />
      <button className="btn pri w-full" disabled={!valid} style={{ opacity: valid ? 1 : 0.5 }}
        onClick={() => onSubmit({ name: name.trim(), icon, type, target: type === "count" ? Number(target) : 1, unit: type === "count" ? unit.trim() : undefined, reminderTime: time || undefined, freq, color })}>
        {submitLabel}
      </button>
    </div>
  );
}
