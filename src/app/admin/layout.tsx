import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  LogOut,
  Plus,
  ClipboardList,
  CalendarX,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { getAdmin } from "@/lib/auth/admin";
import { getAdminLang, ti } from "@/lib/auth/admin-lang";
import { getAdminTheme } from "@/lib/auth/admin-theme";
import { mockAdmin } from "./preview-mode";
import { LangToggle } from "./lang-toggle";
import { ThemeToggle } from "./theme-toggle";

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
  const theme = await getAdminTheme();

  return (
    <div data-admin-theme={theme} className="min-h-screen bg-background text-foreground">
      {admin ? (
        <div className="lg:grid lg:min-h-screen lg:grid-cols-[220px_1fr] print:!block">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
                DAIMASU
              </p>
              <p className="text-[11px] tracking-[0.12em] text-text-secondary">
                {ti(lang, "管理画面", "ADMIN PANEL")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle current={theme} />
              <LangToggle current={lang} />
            </div>
          </header>

          {/* Mobile horizontal nav scroller — primary action first */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-2 text-[13px] lg:hidden print:hidden">
            <MobileNavLink href="/admin/reservations/new" icon={<Plus size={14} />} primary>
              {ti(lang, "新規予約", "New booking")}
            </MobileNavLink>
            <MobileNavLink href="/admin" icon={<LayoutDashboard size={14} />}>
              {ti(lang, "ホーム", "Home")}
            </MobileNavLink>
            <MobileNavLink href="/admin/today" icon={<ClipboardList size={14} />}>
              {ti(lang, "本日", "Today")}
            </MobileNavLink>
            <MobileNavLink href="/admin/reservations" icon={<CalendarDays size={14} />}>
              {ti(lang, "予約", "Bookings")}
            </MobileNavLink>
            <MobileNavLink href="/admin/celebrations" icon={<Sparkles size={14} />}>
              {ti(lang, "お祝い", "Celebrate")}
            </MobileNavLink>
            <MobileNavLink href="/admin/customers" icon={<Users size={14} />}>
              {ti(lang, "顧客", "Customers")}
            </MobileNavLink>
            <MobileNavLink href="/admin/revenue" icon={<TrendingUp size={14} />}>
              {ti(lang, "売上", "Revenue")}
            </MobileNavLink>
            <MobileNavLink href="/admin/closed-dates" icon={<CalendarX size={14} />}>
              {ti(lang, "休業", "Closed")}
            </MobileNavLink>
            <MobileNavLink href="/admin/settings" icon={<Settings size={14} />}>
              {ti(lang, "設定", "Settings")}
            </MobileNavLink>
          </nav>

          {/* Desktop sidebar */}
          <aside className="hidden flex-col border-r border-border bg-surface p-5 lg:flex print:hidden">
            <div className="mb-6 border-b border-border pb-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
                DAIMASU
              </p>
              <p className="mt-1 text-[12px] tracking-[0.12em] text-text-secondary">
                {ti(lang, "管理画面", "ADMIN PANEL")}
              </p>
            </div>
            <nav className="flex flex-col gap-1 text-sm">
              <NavLink
                href="/admin/reservations/new"
                icon={<Plus size={18} strokeWidth={2.5} />}
                primary
              >
                {ti(lang, "新規予約", "New booking")}
              </NavLink>
              <div className="my-2 h-px bg-border" aria-hidden="true" />
              <NavLink href="/admin" icon={<LayoutDashboard size={16} />}>
                {ti(lang, "ダッシュボード", "Dashboard")}
              </NavLink>
              <NavLink href="/admin/today" icon={<ClipboardList size={16} />}>
                {ti(lang, "本日のサービス表", "Service sheet")}
              </NavLink>
              <NavLink href="/admin/reservations" icon={<CalendarDays size={16} />}>
                {ti(lang, "予約一覧", "Reservations")}
              </NavLink>
              <NavLink href="/admin/celebrations" icon={<Sparkles size={16} />}>
                {ti(lang, "お祝い管理", "Celebrations")}
              </NavLink>
              <NavLink href="/admin/customers" icon={<Users size={16} />}>
                {ti(lang, "顧客一覧", "Customers")}
              </NavLink>
              <NavLink href="/admin/revenue" icon={<TrendingUp size={16} />}>
                {ti(lang, "売上分析", "Revenue")}
              </NavLink>
              <NavLink href="/admin/closed-dates" icon={<CalendarX size={16} />}>
                {ti(lang, "休業日", "Closed dates")}
              </NavLink>
              <NavLink href="/admin/settings" icon={<Settings size={16} />}>
                {ti(lang, "設定", "Settings")}
              </NavLink>
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4 text-[12px]">
              <p className="truncate text-text-secondary" title={admin.email}>
                {admin.email}
              </p>
              <div className="flex items-center justify-between gap-3">
                <ThemeToggle current={theme} />
                <LangToggle current={lang} />
              </div>
              <form action="/admin/logout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-2 text-text-secondary transition-colors hover:text-foreground"
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
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 border border-gold bg-gold px-3 py-3 text-[15px] font-semibold text-background shadow-[0_2px_0_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all hover:brightness-105 hover:shadow-[0_4px_12px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.45)]"
      >
        <span aria-hidden="true">{icon}</span>
        <span className="tracking-[0.04em]">{children}</span>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-2.5 py-2.5 text-[14px] text-text-secondary transition-colors hover:bg-card hover:text-foreground"
    >
      <span className="text-gold">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

function MobileNavLink({
  href,
  icon,
  children,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border border-gold bg-gold px-3.5 py-2 font-semibold text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      >
        <span aria-hidden="true">{icon}</span>
        <span>{children}</span>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border border-border bg-background px-3 py-2 text-text-secondary hover:border-gold/50 hover:text-foreground"
    >
      <span className="text-gold">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
