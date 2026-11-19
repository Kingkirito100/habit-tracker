"use client";
import { useEffect } from "react";
// Serwist в production регистрирует sw.js сам; этот компонент нужен на случай, если автоматическая регистрация отключена.
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
