export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export type NotifState = "unsupported" | "needs-install" | "default" | "granted" | "denied";

export function notifState(): NotifState {
  if (isIOS() && !isStandalone()) return "needs-install"; // iOS: push только из установленного PWA
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as NotifState;
}

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Подписка на Web Push. Нужны NEXT_PUBLIC_VAPID_PUBLIC_KEY и (чтобы сервер мог слать) NEXT_PUBLIC_PUSH_ENDPOINT. */
export async function subscribePush() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key || !("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) as BufferSource }));
  const url = process.env.NEXT_PUBLIC_PUSH_ENDPOINT;
  if (url) await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub) });
  return sub;
}

/** Вызывать только по действию пользователя. */
export async function enableNotifications() {
  const p = await Notification.requestPermission();
  if (p === "granted") await subscribePush().catch(() => null);
  return p;
}

export async function showLocal(title: string, body: string) {
  const reg = await navigator.serviceWorker?.ready;
  if (reg) await reg.showNotification(title, { body, icon: "/icons/icon-192.png", tag: title });
  else new Notification(title, { body });
}

/** Пока приложение открыто — одно напоминание на привычку в день в заданное время. */
export function scheduleInApp(items: { name: string; time: string }[]) {
  const timers = items.map(({ name, time }) => {
    const [h, m] = time.split(":").map(Number);
    const at = new Date();
    at.setHours(h, m, 0, 0);
    const ms = at.getTime() - Date.now();
    return ms > 0 ? window.setTimeout(() => showLocal("Пора отметить привычку", name), ms) : 0;
  });
  return () => timers.forEach((t) => t && clearTimeout(t));
}
