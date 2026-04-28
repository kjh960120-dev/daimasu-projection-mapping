/**
 * Public-facing input shapes. Validated at every API boundary.
 * Server-only (zod is heavy — keep the parser off the client bundle when possible).
 */
import { z } from "zod";

/** YYYY-MM-DD in local restaurant TZ (validated as a real date below). */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine((s) => !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime()), "Invalid date");

/** ITU-T E.164-ish: + then 7-19 digits/spaces/dashes. */
const phone = z
  .string()
  .min(7)
  .max(30)
  .regex(/^[+0-9 ()-]{7,30}$/, "Invalid phone");

/** RFC 5321 length cap; defer the full RFC 5322 dance to Resend. */
const email = z.string().email().max(254);

export const createReservationSchema = z.object({
  service_date: dateString,
  seating: z.enum(["s1", "s2"]),
  party_size: z.number().int().min(1).max(8),
  guest_name: z.string().min(1).max(80),
  guest_email: email,
  guest_phone: phone,
  guest_lang: z.enum(["ja", "en"]).default("ja"),
  notes: z.string().max(1000).optional().nullable(),
  // Honeypot — the booking UI ships an always-hidden field. Bots fill it.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const cancelReservationSchema = z.object({
  token: z.string().min(20).max(2048),
});

export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;

/** Date-availability query — used by the booking calendar to disable full slots. */
export const availabilityQuerySchema = z.object({
  from: dateString,
  to: dateString,
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
