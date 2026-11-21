"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, MessageSquare, Minus, Plus } from "lucide-react";
import { setEntry, setEntryNote, type Habit, type Status } from "@/lib/db";
import { useSettings } from "@/lib/settings";
import { MAX_SKIPS_PER_WEEK, isDue, periodProgress, skipsInWeek, type EntryMap } from "@/lib/streak";
import { freqLabel, getFreq } from "@/lib/freq";
import { HabitIcon } from "./HabitIcon";

export function HabitCheckIn({ habit, map, date, today, onFirstCheckIn }: {
  habit: Habit;
  map?: EntryMap;
  date: string;
  today: string;
  onFirstCheckIn?: () => void;
}) {
  const entry = map?.[date];
  const [adjust, setAdjust] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [pulse, setPulse] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const settings = useSettings();
  const status = entry?.status ?? null;
  const value = entry?.value ?? (status === "done" && habit.type === "count" ? habit.target : 0);
  const canEdit = date <= today && date >= habit.createdAt;
  const isCount = habit.type === "count";
  const freq = getFreq(habit);
  const due = isDue(habit, map, date);
  const progress = periodProgress(habit, map, date);
  const progressText = progress ? `${progress.done} из ${progress.goal} на этой ${progress.period}` : null;
  const numericQuantity = Number(quantity);
  const validQuantity = /^\d+$/.test(quantity) && Number.isSafeInteger(numericQuantity);
  const amount = validQuantity ? numericQuantity : 0;

  useEffect(() => {
    if (!pulse) return;
    const timer = window.setTimeout(() => setPulse(false), 260);
    return () => window.clearTimeout(timer);
  }, [pulse]);

  async function write(nextStatus: Status | null, nextValue?: number) {
    if (!canEdit || busy) return false;
    setBusy(true);
    setMessage("");
    try {
      await setEntry(habit.id, date, nextStatus, nextValue);
      if (nextStatus === "done" && status !== "done") {
        if (settings.motion) setPulse(true);
        if (settings.haptics) navigator.vibrate?.(15);
        onFirstCheckIn?.();
      }
      return true;
    } catch {
      setMessage("Не удалось сохранить отметку.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function skip() {
    if (status !== "skipped" && skipsInWeek(map, date) >= MAX_SKIPS_PER_WEEK) {
      setMessage(`На этой неделе уже ${MAX_SKIPS_PER_WEEK} пропуска.`);
      return;
    }
    if (await write(status === "skipped" ? null : "skipped")) setAdjust(false);
  }

  async function saveNote() {
    if (!canEdit || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await setEntryNote(habit.id, date, note);
      setNoteOpen(false);
    } catch {
      setMessage("Не удалось сохранить заметку.");
    } finally {
      setBusy(false);
    }
  }

  let description = progressText ?? freqLabel(freq);
  if (!canEdit) description = date > today ? "День ещё не наступил" : "Привычка ещё не была создана";
  else if (status === "skipped") description = "День пропущен";
  else if (isCount) description = `${value} из ${habit.target}${habit.unit ? ` ${habit.unit}` : ""}`;
  else if (status === "done") description = progressText ?? "Выполнено";
  else if (!due) description = freq.kind === "days" ? "День вне расписания" : "Цель периода выполнена";

  return (
    <div className="mb-2">
      <div className="flex gap-2">
        <button
          type="button"
          className={`tap min-w-0 ${status === "done" ? "d" : status === "skipped" ? "s" : ""} ${pulse ? "pulse" : ""}`}
          disabled={!canEdit || busy}
          aria-pressed={status === "done"}
          onClick={() => {
            setAdjust(false);
            void (status === "done" ? write(null) : write("done", isCount ? habit.target : undefined));
          }}
        >
          <span className="box">
            {status === "done" && <Check size={20} strokeWidth={3} aria-hidden />}
            {status === "skipped" && <Minus size={20} strokeWidth={3} aria-hidden />}
          </span>
          <span className="min-w-0 flex-1">
            <b className="block break-words font-semibold">{habit.name}</b>
            <small>{description}</small>
            {isCount && canEdit && status !== "skipped" && (
              <span className="checkin-meter" aria-hidden>
                <i style={{ width: `${Math.min(100, 100 * value / habit.target)}%` }} />
              </span>
            )}
          </span>
          <HabitIcon name={habit.icon} />
        </button>
        {isCount ? (
          <button type="button" className="side shrink-0" disabled={!canEdit || busy} aria-expanded={adjust} aria-label={`Изменить количество: ${habit.name}`} onClick={() => { setQuantity(String(value)); setAdjust(!adjust); }}>±</button>
        ) : (
          <button type="button" className={`side shrink-0 ${status === "skipped" ? "on" : ""}`} disabled={!canEdit || busy} onClick={skip} aria-label={`${status === "skipped" ? "Отменить пропуск" : "Пропустить день"}: ${habit.name}`}>{status === "skipped" ? "Вернуть" : "Пропуск"}</button>
        )}
      </div>
      {isCount && adjust && (
        <form className="panel mt-2 flex flex-wrap items-center gap-2" onSubmit={async (event) => {
          event.preventDefault();
          if (validQuantity && await write(amount >= habit.target ? "done" : amount ? "pending" : null, amount || undefined)) setAdjust(false);
        }}>
          <button type="button" className="btn" onClick={() => setQuantity(String(Math.max(0, amount - 1)))} aria-label="Меньше"><Minus size={18} aria-hidden /></button>
          <input className="field !m-0 !w-20" type="text" inputMode="numeric" pattern="[0-9]+" maxLength={16} value={quantity} aria-label={`Количество: ${habit.name}`} onChange={(event) => setQuantity(event.target.value)} />
          <button type="button" className="btn" disabled={amount >= Number.MAX_SAFE_INTEGER} onClick={() => setQuantity(String(amount + 1))} aria-label="Больше"><Plus size={18} aria-hidden /></button>
          <button type="submit" className="btn pri" disabled={!validQuantity || busy}>Сохранить</button>
          <button type="button" className="btn warn" disabled={busy} onClick={skip}>{status === "skipped" ? "Вернуть" : "Пропуск"}</button>
        </form>
      )}
      <div className="checkin-metadata">
        {canEdit && <button type="button" aria-expanded={noteOpen} onClick={() => { setNote(entry?.note ?? ""); setNoteOpen(!noteOpen); }}><MessageSquare size={15} aria-hidden /> {entry?.note ? "Заметка" : "Добавить заметку"}</button>}
        <Link href={`/habits/${habit.id}`} aria-label={`История и настройки: ${habit.name}`}>Подробнее</Link>
      </div>
      {entry?.note && !noteOpen && <p className="whitespace-pre-wrap break-words px-2 pb-2 text-sm text-mute">{entry.note}</p>}
      {noteOpen && (
        <form className="panel" onSubmit={(event) => { event.preventDefault(); void saveNote(); }}>
          <label className="block">
            <span className="mb-1 block text-sm text-mute">Заметка к отметке</span>
            <textarea className="field !mb-2 resize-y py-2" maxLength={500} rows={2} value={note} placeholder="Как прошло?" onChange={(event) => setNote(event.target.value)} />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="btn pri" disabled={busy || note.trim() === (entry?.note ?? "")}>Сохранить</button>
            <button type="button" className="btn" disabled={busy} onClick={() => setNoteOpen(false)}>Отмена</button>
            <span className="ml-auto text-sm text-mute">{note.length}/500</span>
          </div>
        </form>
      )}
      {message && <p className="px-2 text-sm text-mute" role="status">{message}</p>}
    </div>
  );
}
