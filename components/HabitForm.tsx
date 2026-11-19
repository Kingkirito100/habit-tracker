"use client";
import { useState } from "react";
import { ICONS, HabitIcon } from "./HabitIcon";
import { Segmented } from "./Segmented";
import type { Habit } from "@/lib/db";

export type HabitDraft = Pick<Habit, "name" | "icon" | "type" | "target" | "unit" | "reminderTime">;

export function HabitForm({ initial, submitLabel, onSubmit }: { initial?: HabitDraft; submitLabel: string; onSubmit: (d: HabitDraft) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "check");
  const [type, setType] = useState<"binary" | "count">(initial?.type ?? "binary");
  const [target, setTarget] = useState(String(initial?.target ?? 1));
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [time, setTime] = useState(initial?.reminderTime ?? "");
  const valid = name.trim().length > 0 && (type === "binary" || Number(target) >= 1);
  return (
    <div>
      <label htmlFor="nm" className="mb-1 block text-mute">Название</label>
      <input id="nm" className="field" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: выпить воды" autoFocus />
      <span className="mb-1 block text-mute">Иконка</span>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Иконка">
        {Object.keys(ICONS).map((k) => (
          <button key={k} onClick={() => setIcon(k)} aria-pressed={icon === k} aria-label={k}
            className={`grid h-12 w-12 place-items-center rounded-ctl border-2 ${icon === k ? "border-ok bg-ok text-okt" : "border-line bg-surf"}`}>
            <HabitIcon name={k} />
          </button>
        ))}
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
        onClick={() => onSubmit({ name: name.trim(), icon, type, target: type === "count" ? Number(target) : 1, unit: type === "count" ? unit.trim() : undefined, reminderTime: time || undefined })}>
        {submitLabel}
      </button>
    </div>
  );
}
