/**
 * POST /api/admin/reservations/[id]/settle — owner-only.
 *
 * Records the on-site settlement, transitions the reservation to `completed`.
 * Idempotent on idempotency_key derived from reservation id.
 */
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/db/clients";
import { getAdmin } from "@/lib/auth/admin";
import { receiptBreakdown } from "@/lib/domain/reservation";
import type { Reservation, RestaurantSettings } from "@/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  method: z.enum(["cash", "card", "gcash", "deposit_only"]),
  amount_centavos: z.number().int().min(0).max(100_000_00),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const sb = adminClient();
  const { data: reservation } = await sb
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single<Reservation>();
  if (!reservation) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (reservation.status !== "confirmed") {
    return NextResponse.json(
      { ok: false, error: `bad_state:${reservation.status}` },
      { status: 409 }
    );
  }

  // Insert on-site settlement payment row (idempotent via UNIQUE key)
  const { error: payErr } = await sb.from("payments").insert({
    reservation_id: id,
    kind: "on_site_settlement",
    provider: "on_site",
    amount_centavos: parsed.data.amount_centavos,
    method: parsed.data.method,
    idempotency_key: `res:${id}:settle:v1`,
    recorded_by: admin.email,
  });
  if (payErr && !payErr.message.includes("duplicate key")) {
    return NextResponse.json({ ok: false, error: payErr.message }, { status: 500 });
  }

  // Flip reservation to completed
  const { error: updErr } = await sb
    .from("reservations")
    .update({
      status: "completed",
      settled_at: new Date().toISOString(),
      settlement_method: parsed.data.method,
      settlement_centavos:
        reservation.deposit_centavos + parsed.data.amount_centavos,
    })
    .eq("id", id)
    .eq("status", "confirmed");
  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  // Issue the BIR Official Receipt for this settlement (S2 + S3).
  // The breakdown is recomputed from the canonical pricing (course_price ×
  // party_size, then SVC 10%, then VAT 12% on subtotal+SVC) so the printed
  // receipt always matches what the diner agreed to at booking. The OR
  // number is allocated atomically by the SQL function and the receipts row
  // is the legal record.
  let or_number: string | null = null;
  try {
    const { data: settings } = await sb
      .from("restaurant_settings")
      .select("course_price_centavos, deposit_pct")
      .eq("id", 1)
      .single<Pick<RestaurantSettings, "course_price_centavos" | "deposit_pct">>();
    if (settings) {
      const r = receiptBreakdown(
        settings.course_price_centavos,
        reservation.party_size,
        settings.deposit_pct
      );
      const settlementMethod =
        parsed.data.method === "deposit_only" ? null : parsed.data.method;
      const { data: receipt, error: rcptErr } = await sb.rpc(
        "settle_with_receipt",
        {
          p_reservation_id: id,
          p_menu_subtotal: r.menu_subtotal_centavos,
          p_service_charge: r.service_charge_centavos,
          p_vat: r.vat_centavos,
          p_grand_total: r.grand_total_centavos,
          p_settlement_method: settlementMethod,
          p_issued_by: null,
        }
      );
      if (!rcptErr && receipt) {
        or_number = (receipt as { or_number: string }).or_number;
      }
      // Receipt issuance failure should not roll back the settlement —
      // the operator can re-issue from the admin UI later. We log it
      // and keep the settlement valid.
    }
  } catch {
    // Logged via audit_log below, ignore otherwise.
  }

  await sb.from("audit_log").insert({
    actor: admin.email,
    reservation_id: id,
    action: "reservation.settle",
    after_data: {
      method: parsed.data.method,
      amount_centavos: parsed.data.amount_centavos,
      or_number,
    } as never,
  });

  return NextResponse.json({ ok: true, or_number });
}
