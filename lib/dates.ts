export const pad = (n: number) => String(n).padStart(2, "0");
export const ds = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const pd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const todayStr = () => ds(new Date());
export const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
export const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const WEEKDAYS_LONG = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
export function plural(n: number, one = "день", few = "дня", many = "дней") {
  const a = n % 100, b = n % 10;
  return a > 10 && a < 15 ? many : b === 1 ? one : b > 1 && b < 5 ? few : many;
}
