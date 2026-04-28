import { NextResponse, type NextRequest } from "next/server";
import { authedServerClient } from "@/lib/db/clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sb = await authedServerClient();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL("/admin/login", req.url));
}
