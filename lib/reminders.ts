import type { Habit, HabitReminder } from "./db";
import { ds } from "./dates";
import { isDue, periodProgress, type EntryMap } from "./streak";

export function getReminders(habit: Pick<Habit, "reminders" | "reminderTime">): HabitReminder[] {
  return habit.reminders ?? (habit.reminderTime ? [{ time: habit.reminderTime, days: [] }] : []);
}

export const validReminderTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

export function isReminderDay(reminder: HabitReminder, weekday: number) {
  return reminder.days.length === 0 || reminder.days.includes(weekday);
}

export function remindersForDay(habit: Habit, entries: EntryMap | undefined, day: Date) {
  const date = ds(day);
  const status = entries?.[date]?.status;
  if (habit.archived || date < habit.createdAt || status === "done" || status === "skipped" || !isDue(habit, entries, date)) return [];
  const progress = periodProgress(habit, entries, date);
  if (progress && progress.done >= progress.goal) return [];

  const weekday = (day.getDay() + 6) % 7;
  return getReminders(habit).filter((reminder) => validReminderTime(reminder.time) && isReminderDay(reminder, weekday));
}
