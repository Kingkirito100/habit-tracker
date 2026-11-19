"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { db, deleteHabit, exportAll, importAll, swapOrder } from "@/lib/db";
import { useData } from "@/lib/hooks";
import { updateSettings, useSettings, type Settings } from "@/lib/settings";
import { enableNotifications, notifState, type NotifState } from "@/lib/notifications";
import { Segmented } from "@/components/Segmented";

const ACCENTS: [Settings["accent"], string][] = [
  ["blue", "Синий"], ["green", "Зелёный"], ["orange", "Оранжевый"],
  ["purple", "Фиолетовый"], ["pink", "Розовый"], ["teal", "Бирюзовый"],
];

export default function SettingsPage() {
  const s = useSettings();
  const data = useData();
  const file = useRef<HTMLInputElement>(null);
  const [ns, setNs] = useState<NotifState | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => setNs(notifState()), []);

  const backup = async () => {
    const url = URL.createObjectURL(new Blob([await exportAll()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `habits-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <h1>Настройки</h1>
      <h2 className="mb-2">Стиль</h2>
      <Segmented<Settings["style"]> label="Стиль" value={s.style} onChange={(style) => updateSettings({ style })} items={[["classic", "Классика"], ["glass", "Стекло"], ["neon", "Неон"]]} />
      <p className="-mt-1 mb-3 text-[15px] text-mute">«Стекло» — полупрозрачные слои с размытием в духе Liquid Glass. «Неон» — свечение и яркие цвета, всегда на тёмном фоне.</p>
      <h2 className="mb-2">Тема</h2>
      <Segmented<Settings["theme"]> label="Тема" value={s.theme} onChange={(theme) => updateSettings({ theme })} items={[["system", "Система"], ["light", "Светлая"], ["dark", "Тёмная"]]} />
      <h2 className="mb-2">Акцент</h2>
      <div className="sw" role="group" aria-label="Акцентный цвет">
        {ACCENTS.map(([k, name]) => (
          <button key={k} data-accent={k} className="sw-btn" aria-label={name} aria-pressed={s.accent === k} onClick={() => updateSettings({ accent: k })}>{s.accent === k && <Check size={22} strokeWidth={3} aria-hidden />}</button>
        ))}
      </div>
      <h2 className="mb-2">Главный экран</h2>
      <Segmented<Settings["layout"]> label="Главный экран" value={s.layout} onChange={(layout) => updateSettings({ layout })} items={[["calendar", "С календарями"], ["cards", "Только карточки"]]} />
      <h2 className="mb-2">Плотность списка</h2>
      <Segmented<Settings["density"]> label="Плотность" value={s.density} onChange={(density) => updateSettings({ density })} items={[["comfortable", "Комфортная"], ["compact", "Компактная"]]} />

      <h2 className="mb-2 mt-2">Привычки</h2>
      <div className="panel">
        {!data?.habits.length && <span className="text-mute">Пока нет привычек.</span>}
        {data?.habits.map((h, i, arr) => (
          <div className="row" key={h.id}>
            <span className={`min-w-0 flex-1 break-words ${h.archived ? "text-mute" : ""}`}>{h.name}{h.archived ? " (архив)" : ""}</span>
            <button aria-label="Выше" disabled={i === 0} onClick={() => swapOrder(h, arr[i - 1])}><ArrowUp size={18} aria-hidden /></button>
            <button aria-label="Ниже" disabled={i === arr.length - 1} onClick={() => swapOrder(h, arr[i + 1])}><ArrowDown size={18} aria-hidden /></button>
            <button onClick={() => db.habits.update(h.id, { archived: !h.archived })}>{h.archived ? "Вернуть" : "Архив"}</button>
            {h.archived && <button aria-label="Удалить" onClick={() => confirm(`Удалить «${h.name}» вместе с историей?`) && deleteHabit(h.id)}>✕</button>}
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-2">Напоминания</h2>
      <div className="panel">
        <p className="mt-0">Время напоминания задаётся в настройках каждой привычки.</p>
        {ns === "needs-install" && <p className="text-mute">На iPhone уведомления работают только из установленного приложения: нажми «Поделиться» → «На экран Домой», открой приложение с иконки и вернись сюда.</p>}
        {ns === "unsupported" && <p className="text-mute">Этот браузер не поддерживает уведомления.</p>}
        {ns === "denied" && <p className="text-mute">Уведомления запрещены в настройках браузера или телефона. Разрешите их там — и вернитесь сюда.</p>}
        {ns === "granted" && <p className="text-mute">Уведомления включены. Пока приложение открыто, напоминания приходят локально; при закрытом — через Web Push, если подключён сервер (см. README).</p>}
        {ns === "default" && <button className="btn pri" onClick={async () => { await enableNotifications(); setNs(notifState()); }}>Включить напоминания</button>}
      </div>

      <h2 className="mb-2 mt-2">Данные и аккаунт</h2>
      <div className="panel">
        <p className="mt-0">Вы в гостевом режиме: регистрация не нужна, все данные хранятся на этом устройстве. Резервную копию можно сохранить файлом и перенести на другое устройство.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={backup}>Сохранить копию</button>
          <button className="btn" onClick={() => file.current?.click()}>Загрузить копию</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try { await importAll(await f.text()); setMsg("Копия добавлена к текущим данным."); } catch (err) { setMsg(`Не удалось загрузить: ${(err as Error).message}`); }
            e.target.value = "";
          }} />
        </div>
        {msg && <p role="status" className="mb-0 text-mute">{msg}</p>}
      </div>
    </>
  );
}
