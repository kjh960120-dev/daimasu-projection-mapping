/**
 * POST /api/reservations
 *
 * The atomic booking entry point.
 *
 * Flow:
 *  1. Validate input (zod)
 *  2. Lookup live settings + closed-dates + capacity (single RPC: assert_capacity_or_throw)
 *  3. INSERT reservation with status=pending_payment inside the same transaction
 *     (the RPC takes the FOR UPDATE lock; the INSERT inherits it)
 *  4. Issue HMAC self-cancel token, persist hash
 *  5. Create Stripe Checkout for the deposit, with idempotency_key bound to res.id
 *  6. Return { checkoutUrl }; client redirects.
 *
 * On any failure after step 3 we leave the reservation as `pending_payment` —
 * a daily Edge Function reaps stale ones older than 30 min (Phase 2).
 */
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/db/clients";
import { stripe, toStripeAmount } from "@/lib/stripe/client";
import { issueCancelToken } from "@/lib/security/cancel-token";
import { createReservationSchema } from "@/lib/domain/schemas";
import {
  serviceStartsAt,
  priceBreakdown,
} from "@/lib/domain/reservation";
import { serverEnv } from "@/lib/env";
import type { Reservation, RestaurantSettings } from "@/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiError =
  | { code: "validation"; details: unknown }
  | { code: "closed_date" }
  | { code: "capacity_exceeded" }
  | { code: "reservations_closed" }
  | { code: "internal"; reason?: string };

export async function POST(req: NextRequest) {
  // 1. parse + validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errJson({ code: "validation", details: "invalid_json" }, 400);
  }
  const parsed = createReservationSchema.safeParse(body);
  if (!parsed.success) {
    return errJson({ code: "validation", details: parsed.error.issues }, 400);
  }
  const input = parsed.data;
  if (input.website && input.website.length > 0) {
    // Honeypot tripped. Pretend success for bot-tarpit.
    return NextResponse.json({ ok: true, fake: true }, { status: 200 });
  }

  const sb = adminClient();

  // 2. read settings (single row id=1)
  const { data: settings, error: settingsErr } = await sb
    .from("restaurant_settings")
    .select("*")
    .eq("id", 1)
    .single<RestaurantSettings>();
  if (settingsErr || !settings) {
    return errJson({ code: "internal", reason: "settings_missing" }, 500);
  }
  if (!settings.reservations_open) {
    return errJson({ code: "reservations_closed" }, 409);
  }

  // 3. atomic capacity check via SQL function — throws on closed/full
  const startsAt = serviceStartsAt(input.service_date, input.seating, settings);
  const { error: capErr } = await sb.rpc("assert_capacity_or_throw", {
    p_service_date: input.service_date,
    p_seating: input.seating,
    p_party_size: input.party_size,
  });
  if (capErr) {
    if (capErr.message.includes("closed_date")) {
      return errJson({ code: "closed_date" }, 409);
    }
    if (capErr.message.includes("capacity_exceeded")) {
      return errJson({ code: "capacity_exceeded" }, 409);
    }
    return errJson({ code: "internal", reason: capErr.message }, 500);
  }

  // 4. price snapshot + INSERT (within the same connection so the FOR UPDATE
  //    lock from the RPC stays held). With supabase-js we rely on DB-side
  //    SERIALIZABLE-by-row via the RPC; concurrent INSERTs would re-acquire
  //    the lock and re-fail capacity.
  const { deposit, balance } = priceBreakdown(
    settings.course_price_centavos,
    input.party_size,
    settings.deposit_pct
  );

  // pre-issue an id so we can use it in the cancel-token + Stripe metadata
  const reservationId = crypto.randomUUID();

  // P1-2 fix: bound token TTL to "service date + 7 days" instead of a flat 90 days,
  // so a leaked token from a forwarded email has a tight blast radius.
  const ttlSeconds =
    Math.max(
      Math.floor((startsAt.getTime() - Date.now()) / 1000) + 7 * 86_400,
      86_400 // floor: 24h, even for last-minute bookings
    );
  const tokenBundle = await issueCancelToken(reservationId, ttlSeconds);

  const insertRow: Partial<Reservation> = {
    id: reservationId,
    service_date: input.service_date,
    seating: input.seating,
    service_starts_at: startsAt.toISOString(),
    party_size: input.party_size,
    guest_name: input.guest_name,
    guest_email: input.guest_email,
    guest_phone: input.guest_phone,
    guest_lang: input.guest_lang,
    notes: input.notes ?? null,
    course_price_centavos: settings.course_price_centavos,
    deposit_pct: settings.deposit_pct,
    deposit_centavos: deposit,
    balance_centavos: balance,
    status: "pending_payment",
    cancel_token_hash: tokenBundle.hash,
    cancel_token_expires_at: tokenBundle.expiresAt.toISOString(),
    source: "web",
  };

  const { error: insertErr } = await sb.from("reservations").insert(insertRow);
  if (insertErr) {
    // Race: an interleaved transaction took the last seat between RPC and INSERT.
    // The DB-side RPC should usually catch this; fallback message returned.
    return errJson({ code: "capacity_exceeded" }, 409);
  }

  // 5. Stripe Checkout (PHP). Idempotent per reservation.
  const env = serverEnv();
  const successUrl = `${env.NEXT_PUBLIC_SITE_URL}/reservation/confirm?session_id={CHECKOUT_SESSION_ID}&rid=${reservationId}`;
  const cancelUrl = `${env.NEXT_PUBLIC_SITE_URL}/reservation/abandoned?rid=${reservationId}`;

  let checkoutUrl: string;
  try {
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        currency: "php",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: input.guest_email,
        metadata: {
          reservation_id: reservationId,
          service_date: input.service_date,
          seating: input.seating,
          party_size: String(input.party_size),
        },
        payment_intent_data: {
          description: `DAIMASU 大桝 BAR — ${input.service_date} ${settings[input.seating === "s1" ? "seating_1_label" : "seating_2_label"]} (${input.party_size}p)`,
          metadata: { reservation_id: reservationId },
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "php",
              product_data: {
                name: input.guest_lang === "ja" ? "DAIMASU 大桝 BAR — デポジット" : "DAIMASU 大桝 BAR — Deposit",
                description: `${input.party_size} × ₱${(settings.course_price_centavos / 100).toLocaleString()}  (${settings.deposit_pct}%)`,
              },
              unit_amount: toStripeAmount(deposit),
            },
          },
        ],
        // 30 min hold — anything beyond and the slot is reaped.
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        locale: input.guest_lang === "ja" ? "ja" : "en",
      },
      {
        idempotencyKey: `res:${reservationId}:checkout:v1`,
      }
    );
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    checkoutUrl = session.url;

    // Persist the Stripe session id so /api/cron/reap-pending can verify the
    // session is truly expired before flipping status (audit fix C-3).
    await sb
      .from("reservations")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", reservationId);
  } catch (err) {
    // Roll back the half-built reservation so the seat returns to the pool.
    await sb.from("reservations").delete().eq("id", reservationId);
    return errJson(
      { code: "internal", reason: err instanceof Error ? err.message : "stripe_failed" },
      502
    );
  }

  // Best-effort: token expiry mirrored from JWT exp
  return NextResponse.json(
    {
      ok: true,
      reservation_id: reservationId,
      checkout_url: checkoutUrl,
      cancel_token: tokenBundle.token, // returned ONCE; client may store in localStorage as a backup
    },
    { status: 201 }
  );
}

function errJson(error: ApiError, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}
