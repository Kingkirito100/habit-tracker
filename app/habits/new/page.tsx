"use client";
import { useRouter } from "next/navigation";
import { addHabit } from "@/lib/db";
import { todayStr } from "@/lib/dates";
import { HabitForm } from "@/components/HabitForm";

export default function NewHabit() {
  const r = useRouter();
  return (
    <>
      <h1>Новая привычка</h1>
      <HabitForm submitLabel="Добавить" onSubmit={async (d) => { await addHabit(d, todayStr()); r.push("/"); }} />
    </>
  );
}
