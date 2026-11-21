"use client";

import Link from "next/link";
import { DailyPlan } from "@/components/DailyPlan";
import { NotificationPermission } from "@/components/NotificationPermission";
import { useData, useToday } from "@/lib/hooks";

export default function QuickPage() {
  const data = useData();
  const today = useToday();

  return (
    <>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="m-0">Быстрая отметка</h1>
        <Link href="/" className="btn inline-flex items-center">К календарю</Link>
      </header>
      {!data || !today ? <div className="skel" /> : data.active.length === 0 ? (
        <div className="empty"><Link className="btn pri inline-flex items-center" href="/habits/new">Добавить привычку</Link></div>
      ) : (
        <>
          <NotificationPermission />
          <DailyPlan key={today} habits={data.active} maps={data.maps} date={today} today={today} quick />
        </>
      )}
    </>
  );
}
