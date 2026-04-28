/**
 * Admin auth helpers.
 *
 * Two layers:
 *  1. Supabase Auth (magic link) — user has a JWT.
 *  2. admin_owners allowlist — DB-side check that the JWT email is allowed.
 *
 * Both server components and route handlers go through requireAdminOrRedirect
 * (or requireAdminOrJson) at their top.
 */
import "server-only";
import { redirect } from "next/navigation";
import { authedServerClient } from "@/lib/db/clients";

export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
}

/** Returns the admin user, or null if not signed in / not allowlisted. */
export async function getAdmin(): Promise<AdminUser | null> {
  const sb = await authedServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !user.email) return null;

  const { data: row } = await sb
    .from("admin_owners")
    .select("email,display_name")
    .ilike("email", user.email)
    .maybeSingle<{ email: string; display_name: string | null }>();
  if (!row) return null;
  return { id: user.id, email: row.email, display_name: row.display_name };
}

/** Use in server components — redirects to /admin/login if not signed in. */
export async function requireAdminOrRedirect(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
