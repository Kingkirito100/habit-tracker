"use client";
import { useSyncExternalStore } from "react";
import type { Mode } from "./views";

export interface Settings {
  theme: "system" | "light" | "dark";
  accent: "blue" | "green" | "orange" | "purple" | "pink" | "teal";
  density: "comfortable" | "compact";
  style: "classic" | "glass" | "neon";
  layout: "calendar" | "cards";
  mode: Mode;
  sel: number; // выбранная привычка в месяце/годе
}
export const DEFAULTS: Settings = { theme: "system", accent: "blue", density: "comfortable", style: "classic", layout: "calendar", mode: "day", sel: 0 };
const KEY = "hb-settings";
let cur: Settings = DEFAULTS;
let loaded = false;
const subs = new Set<() => void>();

function read(): Settings {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return DEFAULTS; }
}
export function applySettings(s: Settings) {
  const r = document.documentElement;
  const dark = s.style === "neon" || s.theme === "dark" || (s.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  r.dataset.theme = dark ? "dark" : "light";
  r.dataset.accent = s.accent;
  r.dataset.density = s.density;
  r.dataset.style = s.style;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? (s.style === "neon" ? "#07060f" : "#000000") : "#f2f2f7");
}
export function updateSettings(p: Partial<Settings>) {
  cur = { ...getSnapshot(), ...p };
  try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch {}
  applySettings(cur);
  subs.forEach((f) => f());
}
function getSnapshot() {
  if (!loaded && typeof window !== "undefined") { cur = read(); loaded = true; }
  return cur;
}
function subscribe(f: () => void) {
  subs.add(f);
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const h = () => applySettings(getSnapshot());
  mq.addEventListener("change", h);
  return () => { subs.delete(f); mq.removeEventListener("change", h); };
}
export const useSettings = () => useSyncExternalStore(subscribe, getSnapshot, () => DEFAULTS);

/** Скрипт для <head>: применяет тему до первой отрисовки, чтобы не было вспышки. */
export const THEME_SCRIPT = `try{var s=JSON.parse(localStorage.getItem("${KEY}")||"{}"),r=document.documentElement,t=s.theme||"system",d=s.style==="neon"||t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);r.dataset.theme=d?"dark":"light";r.dataset.accent=s.accent||"blue";r.dataset.density=s.density||"comfortable";r.dataset.style=s.style||"classic"}catch(e){}`;
