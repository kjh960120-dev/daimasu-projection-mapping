/**
 * Pure-function domain logic for reservations. No I/O, no Supabase, no Stripe.
 * Unit-testable in isolation.
 */
import type {
  ReservationStatus,
  RestaurantSettings,
  SeatingSlot,
} from "@/lib/db/types";

/** Compute the canonical service start instant in the restaurant's TZ. */
export function serviceStartsAt(
  date: string, // 'YYYY-MM-DD'
  seating: SeatingSlot,
  settings: Pick<
    RestaurantSettings,
    "seating_1_starts_at" | "seating_2_starts_at" | "timezone"
  >
): Date {
  const hhmm =
    seating === "s1"
      ? settings.seating_1_starts_at
      : settings.seating_2_starts_at;
  // We reconstruct the wall-clock time in the restaurant TZ by using
  // Intl.DateTimeFormat to build an ISO and parsing it back. For Asia/Manila
  // (no DST) we can do a simpler offset application: PHT = UTC+8.
  // Use TZ-aware construction below if more zones are added.
  if (settings.timezone === "Asia/Manila") {
    return new Date(`${date}T${hhmm}:00+08:00`);
  }
  // Fallback: treat as UTC; caller can reformat. Adequate for non-Manila ops.
  return new Date(`${date}T${hhmm}:00Z`);
}

/** Hours between `now` and the booking's service start (negative if past). */
export function hoursUntilService(
  serviceStartsAt: Date,
  now: Date = new Date()
): number {
  return (serviceStartsAt.getTime() - now.getTime()) / 3_600_000;
}

/** Refund tier given remaining hours and policy thresholds. */
export type RefundTier = "full" | "partial" | "late";

export function refundTier(
  hoursRemaining: number,
  settings: Pick<RestaurantSettings, "refund_full_hours" | "refund_partial_hours">
): RefundTier {
  if (hoursRemaining >= settings.refund_full_hours) return "full";
  if (hoursRemaining >= settings.refund_partial_hours) return "partial";
  return "late";
}

/** Refund amount in centavos given tier and original deposit. */
export function refundAmountCentavos(
  tier: RefundTier,
  depositCentavos: number
): number {
  switch (tier) {
    case "full":
      return depositCentavos;
    case "partial":
      return Math.floor(depositCentavos / 2);
    case "late":
      return 0;
  }
}

/** Reservation status after cancellation by tier. */
export function statusAfterCancel(tier: RefundTier): ReservationStatus {
  switch (tier) {
    case "full":
      return "cancelled_full";
    case "partial":
      return "cancelled_partial";
    case "late":
      return "cancelled_late";
  }
}

/** Centavos -> "₱8,000" style display.
 *  Uses narrowSymbol so the ₱ glyph renders even when the user is in JA locale
 *  (otherwise ja-JP defaults to "PHP" prefix). The business is PH-only. */
export function formatPHP(centavos: number, locale: "ja" | "en" = "en"): string {
  const peso = centavos / 100;
  return peso.toLocaleString(locale === "ja" ? "ja-JP" : "en-PH", {
    style: "currency",
    currency: "PHP",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  });
}

/** Compute deposit / balance breakdown given course price and party size. */
export function priceBreakdown(
  coursePriceCentavos: number,
  partySize: number,
  depositPct: number
) {
  const total = coursePriceCentavos * partySize;
  const deposit = Math.floor((total * depositPct) / 100);
  const balance = total - deposit;
  return { total, deposit, balance };
}

/** Whether a reservation is still capacity-blocking (counts against seats). */
export function blocksCapacity(status: ReservationStatus): boolean {
  return status === "pending_payment" || status === "confirmed";
}
