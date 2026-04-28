/**
 * POST /api/admin/reservations — owner-side manual booking.
 *
 * Bypasses Stripe deposit; creates the reservation in `confirmed` state.
 * Capacity + closed-date checks reuse the SQL function used by the public path
 * so capacity invariants are identical for both flows.
 *
 * If the owner collected a cash deposit, an `on_site` payment row of kind
 * `deposit_capture` is added so revenue reports stay accurate.
 */
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/db/clients";
import { getAdmin } from "@/lib/auth/admin";
import { adminCreateReservationSchema } from "@/lib/domain/schemas";
import { serviceStartsAt, priceBreakdown } from "@/lib/domain/reservation";
import { issueCancelToken } from "@/lib/security/cancel-token";
import type { Reservation, RestaurantSettings } from "@/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "invalid_json" } },
      { status: 400 }
    );
  }

  const parsed = adminCreateReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "validation", details: parsed.error.issues } },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const sb = adminClient();
  const { data: settings } = await sb
    .from("restaurant_settings")
    .select("*")
    .eq("id", 1)
    .single<RestaurantSettings>();
  if (!settings) {
    return NextResponse.json(
      { ok: false, error: { code: "settings_missing" } },
      { status: 500 }
    );
  }

  // Atomic capacity check — same SQL function the public path uses.
  const { error: capErr } = await sb.rpc("assert_capacity_or_throw", {
    p_service_date: input.service_date,
    p_seating: input.seating,
    p_party_size: input.party_size,
  });
  if (capErr) {
    if (capErr.message.includes("closed_date")) {
      return NextResponse.json(
        { ok: false, error: { code: "closed_date" } },
        { status: 409 }
      );
    }
    if (capErr.message.includes("capacity_exceeded")) {
      return NextResponse.json(
        { ok: false, error: { code: "capacity_exceeded" } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "internal", reason: capErr.message } },
      { status: 500 }
    );
  }

  const startsAt = serviceStartsAt(input.service_date, input.seating, settings);
  const { deposit, balance } = priceBreakdown(
    settings.course_price_centavos,
    input.party_size,
    settings.deposit_pct
  );

  const reservationId = crypto.randomUUID();
  // Token still useful: lets owner share a self-cancel link with the guest.
  const ttlSeconds = Math.max(
    Math.floor((startsAt.getTime() - Date.now()) / 1000) + 7 * 86_400,
    86_400
  );
  const tokenBundle = await issueCancelToken(reservationId, ttlSeconds);

  const insertRow: Partial<Reservation> = {
    id: reservationId,
    service_date: input.service_date,
    seating: input.seating,
    service_starts_at: startsAt.toISOString(),
    party_size: input.party_size,
    guest_name: input.guest_name,
    guest_email: input.guest_email || `manual-${reservationId.slice(0, 8)}@daimasu.local`,
    guest_phone: input.guest_phone,
    guest_lang: input.guest_lang,
    notes: input.notes ?? null,
    course_price_centavos: settings.course_price_centavos,
    deposit_pct: settings.deposit_pct,
    deposit_centavos: input.deposit_received ? deposit : 0,
    balance_centavos: input.deposit_received ? balance : deposit + balance,
    status: "confirmed",
    cancel_token_hash: tokenBundle.hash,
    cancel_token_expires_at: tokenBundle.expiresAt.toISOString(),
    source: input.source,
  };

  const { error: insertErr } = await sb.from("reservations").insert(insertRow);
  if (insertErr) {
    return NextResponse.json(
      { ok: false, error: { code: "insert_failed", reason: insertErr.message } },
      { status: 500 }
    );
  }

  // Cash deposit payment row (if collected upfront).
  if (input.deposit_received) {
    await sb.from("payments").insert({
      reservation_id: reservationId,
      kind: "deposit_capture",
      provider: "on_site",
      amount_centavos: deposit,
      method: "cash",
      idempotency_key: `res:${reservationId}:manual-deposit:v1`,
      recorded_by: admin.email,
      notes: `manual booking via /admin/reservations/new (${input.source})`,
    });
  }

  await sb.from("audit_log").insert({
    actor: admin.email,
    reservation_id: reservationId,
    action: "reservation.create",
    after_data: {
      source: input.source,
      deposit_received: input.deposit_received,
      party_size: input.party_size,
    } as never,
    reason: `manual booking (${input.source})`,
  });

  return NextResponse.json(
    { ok: true, reservation_id: reservationId },
    { status: 201 }
  );
}
