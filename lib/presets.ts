import type { Freq, Habit } from "./db";
type P = Pick<Habit, "name" | "icon" | "type" | "target" | "unit" | "freq">;
const d: Freq = { kind: "daily", times: 1, days: [] };
export const PRESETS: P[] = [
  { name: "Пить воду", icon: "water", type: "count", target: 8, unit: "стаканов", freq: d },
  { name: "Читать", icon: "book", type: "binary", target: 1, freq: d },
  { name: "Зарядка", icon: "sport", type: "binary", target: 1, freq: { kind: "weekly", times: 3, days: [] } },
  { name: "Прогулка", icon: "walk", type: "binary", target: 1, freq: { kind: "days", times: 1, days: [0, 2, 4] } },
  { name: "Медитация", icon: "mind", type: "binary", target: 1, freq: d },
  { name: "Лечь до 23:00", icon: "sleep", type: "binary", target: 1, freq: d },
  { name: "Позвонить близким", icon: "phone", type: "binary", target: 1, freq: { kind: "weekly", times: 1, days: [] } },
  { name: "Генеральная уборка", icon: "leaf", type: "binary", target: 1, freq: { kind: "monthly", times: 1, days: [] } },
];
