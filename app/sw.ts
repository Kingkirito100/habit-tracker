import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: { entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }] },
});
serwist.addEventListeners();

// Web Push: сервер шлёт JSON {title, body, url}
self.addEventListener("push", (event) => {
  const d = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(d.title ?? "Пора отметить привычку", {
      body: d.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: d.url ?? "/" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((cs) => {
      const c = cs[0];
      return c ? c.focus() : self.clients.openWindow(url);
    }),
  );
});
