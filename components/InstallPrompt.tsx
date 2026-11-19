"use client";
import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { isIOS, isStandalone } from "@/lib/notifications";

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** Не блокирует основной поток и не появляется на холодном первом визите: только после первого чекина. */
export function InstallPrompt() {
  const [ev, setEv] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem("hb-install-dismissed")) return;
    setIos(isIOS());
    const gate = () => setShow(!!localStorage.getItem("hb-checkin"));
    gate();
    const onBip = (e: Event) => { e.preventDefault(); setEv(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("hb:checkin", gate);
    return () => { window.removeEventListener("beforeinstallprompt", onBip); window.removeEventListener("hb:checkin", gate); };
  }, []);

  const close = () => { localStorage.setItem("hb-install-dismissed", "1"); setShow(false); };
  if (!show || (!ev && !ios)) return null;
  return (
    <div className="banner" role="region" aria-label="Установка приложения">
      <b className="block">Установить на телефон</b>
      {ios ? (
        <p className="my-1 text-mute">Чтобы получать напоминания, добавь приложение на домашний экран: нажми <Share size={16} className="inline" aria-label="Поделиться" /> «Поделиться» → «На экран Домой».</p>
      ) : <p className="my-1 text-mute">Откроется как обычное приложение и будет работать без сети.</p>}
      <div className="mt-2 flex gap-2">
        {ev && <button className="btn pri flex items-center gap-1.5" onClick={async () => { await ev.prompt(); setEv(null); close(); }}><Download size={18} aria-hidden /> Установить</button>}
        <button className="btn" onClick={close}>Не сейчас</button>
      </div>
    </div>
  );
}
