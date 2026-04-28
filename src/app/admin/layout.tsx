import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  LogOut,
  Plus,
  ClipboardList,
  CalendarX,
} from "lucide-react";
import { getAdmin } from "@/lib/auth/admin";
import { getAdminLang, ti } from "@/lib/auth/admin-lang";
import { mockAdmin } from "./preview-mode";
import { LangToggle } from "./lang-toggle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREVIEW_MODE = process.env.PREVIEW_MODE === "1";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = PREVIEW_MODE ? mockAdmin : await getAdmin();
  const lang = await getAdminLang();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {admin ? (
        <div className="lg:grid lg:min-h-screen lg:grid-cols-[220px_1fr] print:!block">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-gold/70">
                DAIMASU
              </p>
              <p className="text-[10px] tracking-[0.16em] text-text-secondary">
                {ti(lang, "管理画面", "ADMIN PANEL")}
              </p>
            </div>
            <LangToggle current={lang} />
          </header>

          {/* Mobile horizontal nav scroller */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface/40 px-2 py-2 text-[12px] lg:hidden print:hidden">
            <MobileNavLink href="/admin" icon={<LayoutDashboard size={14} />}>
              {ti(lang, "ホーム", "Home")}
            </MobileNavLink>
            <MobileNavLink href="/admin/today" icon={<ClipboardList size={14} />}>
              {ti(lang, "本日", "Today")}
            </MobileNavLink>
            <MobileNavLink href="/admin/reservations" icon={<CalendarDays size={14} />}>
              {ti(lang, "予約", "Bookings")}
            </MobileNavLink>
            <MobileNavLink href="/admin/reservations/new" icon={<Plus size={14} />}>
              {ti(lang, "新規", "New")}
            </MobileNavLink>
            <MobileNavLink href="/admin/closed-dates" icon={<CalendarX size={14} />}>
              {ti(lang, "休業", "Closed")}
            </MobileNavLink>
            <MobileNavLink href="/admin/settings" icon={<Settings size={14} />}>
              {ti(lang, "設定", "Settings")}
            </MobileNavLink>
          </nav>

          {/* Desktop sidebar */}
          <aside className="hidden flex-col border-r border-border bg-surface/40 p-5 lg:flex print:hidden">
            <div className="mb-6 border-b border-border pb-4">
              <p className="text-[10px] uppercase tracking-[0.32em] text-gold/70">
                DAIMASU
              </p>
              <p className="mt-1 text-xs tracking-[0.16em] text-text-secondary">
                {ti(lang, "管理画面", "ADMIN PANEL")}
              </p>
            </div>
            <nav className="flex flex-col gap-1 text-sm">
              <NavLink href="/admin" icon={<LayoutDashboard size={16} />}>
                {ti(lang, "ダッシュボード", "Dashboard")}
              </NavLink>
              <NavLink href="/admin/today" icon={<ClipboardList size={16} />}>
                {ti(lang, "本日のサービス表", "Service sheet")}
              </NavLink>
              <NavLink href="/admin/reservations" icon={<CalendarDays size={16} />}>
                {ti(lang, "予約一覧", "Reservations")}
              </NavLink>
              <NavLink
                href="/admin/reservations/new"
                icon={<Plus size={16} />}
              >
                {ti(lang, "新規予約 (電話/来店)", "New booking")}
              </NavLink>
              <NavLink href="/admin/closed-dates" icon={<CalendarX size={16} />}>
                {ti(lang, "休業日", "Closed dates")}
              </NavLink>
              <NavLink href="/admin/settings" icon={<Settings size={16} />}>
                {ti(lang, "設定", "Settings")}
              </NavLink>
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4 text-xs">
              <p className="truncate text-text-muted" title={admin.email}>
                {admin.email}
              </p>
              <LangToggle current={lang} />
              <form action="/admin/logout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-2 text-text-muted transition-colors hover:text-foreground"
                >
                  <LogOut size={14} />
                  {ti(lang, "ログアウト", "Sign out")}
                </button>
              </form>
            </div>
          </aside>
          <main className="min-w-0 overflow-x-auto">{children}</main>
        </div>
      ) : (
        <div className="min-h-screen">{children}</div>
      )}
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-2.5 py-2 text-text-secondary transition-colors hover:bg-surface hover:text-foreground"
    >
      <span className="text-gold/70">{icon}</span>
      <span className="tracking-wider">{children}</span>
    </Link>
  );
}

function MobileNavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border border-border/40 bg-background/40 px-3 py-1.5 text-text-secondary hover:border-gold/40 hover:text-foreground"
    >
      <span className="text-gold/70">{icon}</span>
      <span className="tracking-wider">{children}</span>
    </Link>
  );
}
