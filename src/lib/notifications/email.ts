/**
 * Resend transactional email. Templates for booking confirm / reminder / cancel.
 * Bilingual JA/EN driven by reservation.guest_lang.
 */
import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

let cached: Resend | null = null;

function resend(): Resend {
  if (cached) return cached;
  cached = new Resend(serverEnv().RESEND_API_KEY);
  return cached;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  fromOverride?: string;
  idempotencyKey?: string;
}

export async function sendEmail(
  args: SendArgs
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const env = serverEnv();
  const from = args.fromOverride ?? env.NEXT_PUBLIC_SITE_URL.includes("daimasu")
    ? "DAIMASU Reservations <reservations@bar.daimasu.com.ph>"
    : "DAIMASU Reservations <onboarding@resend.dev>";
  try {
    const r = await resend().emails.send(
      { from, to: args.to, subject: args.subject, html: args.html },
      args.idempotencyKey ? { idempotencyKey: args.idempotencyKey } : undefined
    );
    if (r.error) return { ok: false, error: r.error.message };
    return { ok: true, id: r.data?.id ?? "unknown" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
