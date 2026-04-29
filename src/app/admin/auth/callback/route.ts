/**
 * Magic-link redirect handler. Exchanges the auth code for a session cookie,
 * then redirects to /admin (or /admin/login if the user isn't allowlisted).
 */
import { NextResponse, type NextRequest } from "next/server";
import { authedServerClient } from "@/lib/db/clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=missing_code", req.url));
  }
  const sb = await authedServerClient();
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }
  return NextResponse.redirect(new URL("/admin", req.url));
}
