"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { enableNotifications, notifState, type NotifState } from "@/lib/notifications";

/** Разрешение просим только после первого успешного чекина и только по нажатию кнопки. */
export function NotificationPermission() {
  const [state, setState] = useState<NotifState | null>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const gate = () => { setState(notifState()); setShow(!!localStorage.getItem("hb-checkin") && !localStorage.getItem("hb-notif-dismissed")); };
    gate();
    window.addEventListener("hb:checkin", gate);
    return () => window.removeEventListener("hb:checkin", gate);
  }, []);
  if (!show || state !== "default") return null;
  const close = () => { localStorage.setItem("hb-notif-dismissed", "1"); setShow(false); };
  return (
    <div className="banner" role="region" aria-label="Напоминания">
      <b className="flex items-center gap-1.5"><Bell size={18} aria-hidden /> Напоминать об отметке?</b>
      <p className="my-1 text-mute">Один раз в день в удобное время — время задаётся в настройках привычки.</p>
      <div className="mt-2 flex gap-2">
        <button className="btn pri" onClick={async () => { await enableNotifications(); setState(notifState()); close(); }}>Включить</button>
        <button className="btn" onClick={close}>Не сейчас</button>
      </div>
    </div>
  );
}
