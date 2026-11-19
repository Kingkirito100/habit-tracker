"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ListChecks, Settings } from "lucide-react";

const TABS = [
  { href: "/", label: "Привычки", Icon: ListChecks },
  { href: "/insights", label: "Инсайты", Icon: BarChart3 },
  { href: "/settings", label: "Настройки", Icon: Settings },
];
export function TabBar() {
  const p = usePathname();
  return (
    <nav className="tabs" aria-label="Разделы">
      {TABS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} aria-current={(href === "/" ? p === "/" || p.startsWith("/habits") : p.startsWith(href)) ? "page" : undefined}>
          <Icon size={22} aria-hidden />{label}
        </Link>
      ))}
    </nav>
  );
}
