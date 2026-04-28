import Link from "next/link";
import { LayoutDashboard, CalendarDays, Settings, LogOut } from "lucide-react";
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
        <div className="grid min-h-screen grid-cols-[220px_1fr]">
          <aside className="flex flex-col border-r border-border bg-surface/40 p-5">
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
              <NavLink href="/admin/reservations" icon={<CalendarDays size={16} />}>
                {ti(lang, "予約一覧", "Reservations")}
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
          <main className="overflow-x-auto">{children}</main>
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
