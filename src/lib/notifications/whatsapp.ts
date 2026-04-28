/**
 * Twilio WhatsApp Business reminder sender.
 * Optional — degrades gracefully when credentials absent.
 */
import "server-only";
import { serverEnv } from "@/lib/env";

interface SendArgs {
  toPhoneE164: string; // e.g. "+63917XXXXXXX"
  body: string;
  fromWhatsApp?: string; // override per-tenant
}

export async function sendWhatsApp(
  args: SendArgs
): Promise<{ ok: true; sid: string } | { ok: false; reason: string }> {
  const env = serverEnv();
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return { ok: false, reason: "twilio_not_configured" };
  }
  // Lazy import so that a missing peer dep can't break server boot.
  const { default: twilio } = await import("twilio");
  const client = twilio(sid, token);
  const from = args.fromWhatsApp ?? "whatsapp:+14155238886"; // Twilio sandbox default
  try {
    const msg = await client.messages.create({
      from,
      to: `whatsapp:${args.toPhoneE164}`,
      body: args.body,
    });
    return { ok: true, sid: msg.sid };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "send_failed" };
  }
}
