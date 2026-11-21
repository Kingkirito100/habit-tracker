export function DayRing({ done, total }: { done: number; total: number }) {
  const r = 24, c = 2 * Math.PI * r, p = total ? Math.min(1, done / total) : 0;
  return (
    <div className="day-ring panel flex items-center gap-3.5">
      <svg width="60" height="60" viewBox="0 0 60 60" role="img" aria-label={`Выполнено ${done} из ${total}`}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle cx="30" cy="30" r={r} fill="none" stroke="var(--ok)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 30 30)" />
      </svg>
      <div>
        <b className="block text-[20px]">{total ? `${done} из ${total}` : "Отдых"}</b>
        <span className="text-mute">{!total ? "На этот день ничего не запланировано" : "выполнено"}</span>
      </div>
    </div>
  );
}
