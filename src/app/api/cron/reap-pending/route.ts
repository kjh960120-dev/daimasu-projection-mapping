/**
 * POST /api/cron/reap-pending
 *
 * Stripe Checkout sessions expire 30 min after creation. After that, the
 * pending_payment reservation no longer corresponds to an in-flight payment
 * — release the seat back to the pool.
 *
 * Schedule every 5 min (Supabase pg_cron).
 */
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/db/clients";
import { verifyCronAuth } from "@/lib/security/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!verifyCronAuth(req.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const sb = adminClient();
  const cutoff = new Date(Date.now() - 35 * 60_000).toISOString();

  const { data, error } = await sb
    .from("reservations")
    .delete()
    .eq("status", "pending_payment")
    .lt("created_at", cutoff)
    .select("id");
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const reaped = (data as Array<{ id: string }> | null)?.length ?? 0;
  return NextResponse.json({ ok: true, reaped });
}
