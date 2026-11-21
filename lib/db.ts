import Dexie, { type Table } from "dexie";

export type Status = "done" | "skipped" | "pending";

/** Частота: daily — каждый день; days — выбранные дни недели (0=Пн … 6=Вс); weekly/monthly — N раз за неделю/месяц. */
export interface Freq {
  kind: "daily" | "days" | "weekly" | "monthly";
  times: number;
  days: number[];
}

export interface HabitReminder {
  time: string;
  days: number[];
  message?: string;
}

export interface Habit {
  id: number;
  name: string;
  icon: string;
  type: "binary" | "count";
  target: number; // для count — цель; для binary = 1
  unit?: string;
  order: number;
  archived: boolean;
  reminderTime?: string; // "HH:MM"
  reminders?: HabitReminder[];
  freq?: Freq; // нет поля = каждый день
  color?: string; // ключ акцента; нет = цвет темы
  createdAt: string; // YYYY-MM-DD
}

export interface Entry {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD
  status: Status;
  value?: number;
  note?: string;
  updatedAt: number;
}

class HabitDB extends Dexie {
  habits!: Table<Habit, number, Omit<Habit, "id">>;
  entries!: Table<Entry, number>;
  constructor() {
    super("habit-tracker");
    this.version(1).stores({
      habits: "++id,order,archived",
      entries: "++id,&[habitId+date],habitId,date",
    });
  }
}

export const db = new HabitDB();

function entryFor(habitId: number, date: string) {
  return db.entries.where("[habitId+date]").equals([habitId, date]).first();
}

export async function setEntry(habitId: number, date: string, status: Status | null, value?: number) {
  await db.transaction("rw", db.entries, async () => {
    const previous = await entryFor(habitId, date);
    if (status === null && !value && !previous?.note) {
      if (previous?.id != null) await db.entries.delete(previous.id);
      return;
    }
    await db.entries.put({ ...previous, habitId, date, status: status ?? "pending", value, updatedAt: Date.now() });
  });
}

export async function setEntryNote(habitId: number, date: string, note: string) {
  await db.transaction("rw", db.entries, async () => {
    const previous = await entryFor(habitId, date);
    const trimmed = note.trim();
    if (!trimmed && (!previous || (previous.status === "pending" && !previous.value))) {
      if (previous?.id != null) await db.entries.delete(previous.id);
      return;
    }
    await db.entries.put({ habitId, date, status: "pending", ...previous, note: trimmed || undefined, updatedAt: Date.now() });
  });
}

export async function completeHabits(habits: Habit[], date: string) {
  return db.transaction("rw", db.entries, async () => {
    const changes: { previous?: Entry; saved: Entry & { id: number } }[] = [];
    for (const habit of habits) {
      const previous = await entryFor(habit.id, date);
      if (previous?.status === "done" || previous?.status === "skipped") continue;
      const saved: Entry = {
        ...previous, habitId: habit.id, date, status: "done",
        value: habit.type === "count" ? Math.max(habit.target, previous?.value ?? 0) : undefined,
        updatedAt: Date.now(),
      };
      const id = await db.entries.put(saved);
      changes.push({ previous, saved: { ...saved, id } });
    }
    return async () => {
      await db.transaction("rw", db.entries, async () => {
        for (const { previous, saved } of changes) {
          const current = await db.entries.get(saved.id);
          if (!current || current.updatedAt !== saved.updatedAt || current.status !== saved.status
            || current.value !== saved.value || current.note !== saved.note) continue;
          if (previous) await db.entries.put({ ...previous, updatedAt: Date.now() });
          else await db.entries.delete(saved.id);
        }
      });
    };
  });
}

export async function addHabit(h: Omit<Habit, "id" | "order" | "archived" | "createdAt">, createdAt: string) {
  const last = await db.habits.orderBy("order").last();
  return db.habits.add({ ...h, order: (last?.order ?? 0) + 1, archived: false, createdAt });
}

export async function deleteHabit(id: number) {
  await db.transaction("rw", db.habits, db.entries, async () => {
    await db.entries.where("habitId").equals(id).delete();
    await db.habits.delete(id);
  });
}

export async function swapOrder(a: Habit, b: Habit) {
  await db.transaction("rw", db.habits, async () => {
    await db.habits.update(a.id, { order: b.order });
    await db.habits.update(b.id, { order: a.order });
  });
}

export async function exportAll() {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), habits: await db.habits.toArray(), entries: await db.entries.toArray() });
}

/** Импорт добавляет данные к существующим, ничего не перезаписывая молча: id привычек перенумеровываются. */
export async function importAll(json: string) {
  const d = JSON.parse(json);
  if (!Array.isArray(d.habits) || !Array.isArray(d.entries)) throw new Error("Неверный формат файла");
  await db.transaction("rw", db.habits, db.entries, async () => {
    const map = new Map<number, number>();
    for (const h of d.habits as Habit[]) {
      const { id, ...rest } = h;
      map.set(id, await db.habits.add(rest));
    }
    for (const e of d.entries as Entry[]) {
      const hid = map.get(e.habitId);
      if (hid) await db.entries.add({ habitId: hid, date: e.date, status: e.status, value: e.value, note: e.note, updatedAt: e.updatedAt });
    }
  });
}
