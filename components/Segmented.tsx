"use client";
export function Segmented<T extends string>({ items, value, onChange, label }: { items: [T, string][]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {items.map(([v, t]) => (
        <button key={v} aria-pressed={v === value} onClick={() => onChange(v)}>{t}</button>
      ))}
    </div>
  );
}
