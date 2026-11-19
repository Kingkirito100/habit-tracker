import { Flame } from "lucide-react";
import { plural } from "@/lib/dates";
export function StreakBadge({ current, best }: { current: number; best?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold">
      <Flame size={20} aria-hidden className="text-ok" />
      {current} {plural(current)}
      {best !== undefined && <span className="font-normal text-mute"> · лучшая {best}</span>}
    </span>
  );
}
