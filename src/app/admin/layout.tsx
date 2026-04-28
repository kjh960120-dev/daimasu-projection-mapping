/**
 * /admin shell — vertical sidebar + content area.
 * Login page (/admin/login) opts out of the sidebar via its own root layout.
 */
import Link from "next/link";
import { LayoutDashboard, CalendarDays, Settings, LogOut } from "lucide-react";
import { getAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {admin ? (
        <div className="grid min-h-screen grid-cols-[240px_1fr]">
          <aside className="border-r border-border bg-surface/40 p-6">
            <div className="mb-10 border-b border-border pb-6">
              <p className="text-[10px] uppercase tracking-[0.32em] text-gold/70">
                DAIMASU
              </p>
              <p className="mt-1 text-xs tracking-[0.18em] text-text-secondary">
                ADMIN PANEL
              </p>
            </div>
            <nav className="flex flex-col gap-1 text-sm">
              <NavLink href="/admin" icon={<LayoutDashboard size={16} />}>
                Dashboard
              </NavLink>
              <NavLink href="/admin/reservations" icon={<CalendarDays size={16} />}>
                Reservations
              </NavLink>
              <NavLink href="/admin/settings" icon={<Settings size={16} />}>
                Settings
              </NavLink>
            </nav>
            <div className="mt-12 border-t border-border pt-6 text-xs">
              <p className="text-text-muted">{admin.email}</p>
              <form action="/admin/logout" method="post" className="mt-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 text-text-muted transition-colors hover:text-foreground"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </form>
            </div>
          </aside>
          <main className="overflow-x-auto">{children}</main>
        </div>
      ) : (
        // Logged out: render full-page (login screen)
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
      className="flex items-center gap-3 px-3 py-2 text-text-secondary transition-colors hover:bg-surface hover:text-foreground"
    >
      <span className="text-gold/70">{icon}</span>
      <span className="tracking-wider">{children}</span>
    </Link>
  );
}
