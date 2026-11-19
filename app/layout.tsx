import type { Metadata, Viewport } from "next";
import "../ui/tokens.css";
import "./globals.css";
import { TabBar } from "@/components/TabBar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ReminderScheduler } from "@/components/ReminderScheduler";
import { SwRegister } from "@/components/SwRegister";
import { THEME_SCRIPT } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Трекер привычек",
  description: "Ежедневный чекин, серии и инсайты. Работает офлайн.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Привычки", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f2f2f7" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body>
        <main className="shell">
          <InstallPrompt />
          {children}
        </main>
        <TabBar />
        <ReminderScheduler />
        <SwRegister />
      </body>
    </html>
  );
}
