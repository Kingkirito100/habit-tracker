import Dexie, { type Table } from "dexie";

export type Status = "done" | "skipped" | "pending";

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

/** Создаёт или обновляет запись; status=null и пустое value — удаляет запись. */
export async function setEntry(habitId: number, date: string, status: Status | null, value?: number) {
  const ex = await db.entries.where("[habitId+date]").equals([habitId, date]).first();
  if (status === null && !value) {
    if (ex?.id) await db.entries.delete(ex.id);
    return;
  }
  const rec: Entry = { habitId, date, status: status ?? "pending", value, updatedAt: Date.now() };
  if (ex?.id) await db.entries.update(ex.id, rec);
  else await db.entries.add(rec);
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
