"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Segmented } from "./Segmented";
import { periodTitle, shiftAnchor, type Mode } from "@/lib/views";

export function ViewSwitcher({ mode, anchor, today, onMode, onAnchor }: { mode: Mode; anchor: string; today: string; onMode: (m: Mode) => void; onAnchor: (a: string) => void }) {
  const mp = useRef<HTMLInputElement>(null);
  return (
    <>
      <Segmented<Mode> label="Период" value={mode} onChange={onMode} items={[["day", "День"], ["week", "Неделя"], ["month", "Месяц"], ["year", "Год"]]} />
      <div className="nav">
        <button className="a" aria-label="Назад" onClick={() => onAnchor(shiftAnchor(anchor, mode, -1))}><ChevronLeft className="m-auto" aria-hidden /></button>
        {mode === "month" ? (
          <button className="t" aria-label="Выбрать месяц и год" onClick={() => { try { mp.current?.showPicker(); } catch { mp.current?.focus(); } }}>
            {periodTitle(anchor, mode)} <ChevronDown size={18} aria-hidden className="ml-1 inline" />
          </button>
        ) : <div className="t">{periodTitle(anchor, mode)}</div>}
        <button className="a" aria-label="Вперёд" onClick={() => onAnchor(shiftAnchor(anchor, mode, 1))}><ChevronRight className="m-auto" aria-hidden /></button>
        <button className="td" onClick={() => onAnchor(today)}>Сегодня</button>
        <input ref={mp} type="month" value={anchor.slice(0, 7)} aria-label="Месяц и год" tabIndex={-1} className="pointer-events-none absolute left-1/2 top-10 h-px w-px opacity-0"
          onChange={(e) => e.target.value && onAnchor(`${e.target.value}-01`)} />
      </div>
    </>
  );
}
