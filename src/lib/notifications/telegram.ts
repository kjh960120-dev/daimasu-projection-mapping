/**
 * Telegram fallback notification — kept as a second-channel safety net.
 * Token + chat ID resolved from restaurant_settings (admin-editable per Q3 of Gate 1).
 */
import "server-only";
import { serverEnv } from "@/lib/env";

interface NotifyArgs {
  text: string;
  /** Settings-table values take precedence; env fallbacks used if null. */
  tokenOverride?: string | null;
  chatIdOverride?: string | null;
}

export async function notifyTelegram(
  args: NotifyArgs
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const env = serverEnv();
  const token = args.tokenOverride ?? env.TELEGRAM_BOT_TOKEN_FALLBACK;
  const chatId = args.chatIdOverride ?? env.TELEGRAM_CHAT_ID_FALLBACK;
  if (!token || !chatId) return { ok: false, reason: "telegram_not_configured" };
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: args.text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    const data = (await res.json()) as { ok?: boolean; description?: string };
    if (!data.ok) return { ok: false, reason: data.description ?? "telegram_error" };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "send_failed" };
  }
}
