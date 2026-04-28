/**
 * Domain types mirroring the Supabase schema (supabase/migrations/0003_*.sql).
 * Hand-maintained for now; replace with `supabase gen types typescript` once
 * the project is linked.
 */

export type SeatingSlot = "s1" | "s2";

export type ReservationStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled_full"
  | "cancelled_partial"
  | "cancelled_late"
  | "no_show"
  | "completed";

export type PaymentMethod = "cash" | "card" | "gcash" | "deposit_only";

export type PaymentKind =
  | "deposit_capture"
  | "refund_full"
  | "refund_partial"
  | "on_site_settlement"
  | "manual_adjustment";

export type PaymentProvider = "stripe" | "paymongo" | "on_site";

export interface RestaurantSettings {
  id: 1;
  total_seats: number;
  online_seats: number;
  seating_1_label: string;
  seating_2_label: string;
  seating_1_starts_at: string; // 'HH:MM'
  seating_2_starts_at: string;
  service_minutes: number;
  course_price_centavos: number;
  deposit_pct: number;
  refund_full_hours: number;
  refund_partial_hours: number;
  reminder_long_hours: number;
  reminder_short_hours: number;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  whatsapp_from_number: string | null;
  resend_from_email: string | null;
  timezone: string;
  monthly_revenue_target_centavos: number;
  display_name: string;
  reservations_open: boolean;
  updated_at: string;
}

export interface Reservation {
  id: string;
  service_date: string; // 'YYYY-MM-DD'
  seating: SeatingSlot;
  service_starts_at: string; // ISO
  party_size: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_lang: "ja" | "en";
  notes: string | null;
  course_price_centavos: number;
  deposit_pct: number;
  total_centavos: number;
  deposit_centavos: number;
  balance_centavos: number;
  status: ReservationStatus;
  cancel_token_hash: string;
  cancel_token_expires_at: string;
  reminder_long_sent_at: string | null;
  reminder_short_sent_at: string | null;
  settled_at: string | null;
  settlement_method: PaymentMethod | null;
  settlement_centavos: number | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancelled_by: "guest" | "staff" | "system" | null;
  source: "web" | "staff" | "phone" | "walkin";
}

export interface Payment {
  id: string;
  reservation_id: string;
  kind: PaymentKind;
  provider: PaymentProvider;
  amount_centavos: number;
  method: PaymentMethod | null;
  provider_ref: string | null;
  idempotency_key: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface ReservationMoney {
  reservation_id: string;
  service_date: string;
  seating: SeatingSlot;
  status: ReservationStatus;
  party_size: number;
  total_centavos: number;
  deposit_received: number;
  refunded: number;
  on_site_received: number;
  net_received: number;
}

export interface RevenueDaily {
  service_date: string;
  covers_booked: number;
  gross_booked_centavos: number;
  net_completed_centavos: number;
  no_show_deposit_kept_centavos: number;
  no_show_lost_centavos: number;
  no_show_count: number;
  cancel_count: number;
}

export interface RevenueMonthly {
  month_start: string;
  covers_booked: number;
  gross_booked_centavos: number;
  net_completed_centavos: number;
  no_show_deposit_kept_centavos: number;
  no_show_lost_centavos: number;
  no_show_count: number;
  cancel_count: number;
}
