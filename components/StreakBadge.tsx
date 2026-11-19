import { Flame } from "lucide-react";
import { streakWord, type StreakUnit } from "@/lib/freq";
export function StreakBadge({ current, best, unit = "day" }: { current: number; best?: number; unit?: StreakUnit }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 font-semibold">
      <Flame size={20} aria-hidden className="text-ok" />
      {current} {streakWord(current, unit)}
      {best !== undefined && <span className="font-normal text-mute"> · лучшая {best}</span>}
    </span>
  );
}
