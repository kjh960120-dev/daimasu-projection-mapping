/**
 * Supabase clients — three flavors used across the app.
 *
 * 1. service-role (server only)  — bypasses RLS. ONLY for trusted code paths
 *    (booking flow, Stripe webhook, admin mutations). NEVER imported into
 *    "use client" components.
 *
 * 2. server-bound user client    — authenticated as the signed-in admin user
 *    via cookies. Honors RLS. Used in /admin route handlers.
 *
 * 3. browser client              — anon key only. Used by the public booking
 *    UI for non-mutating reads (e.g. closed-dates calendar) where RLS
 *    suffices. Never trusted for capacity logic.
 *
 * The service-role key MUST NOT be exposed to the browser. The schema check
 * in `env.ts` plus `import "server-only"` below enforce this at build time.
 */
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";
import type { Reservation, Payment, RestaurantSettings } from "@/lib/db/types";

// Hand-rolled minimal Database type — replace with generated types post-link.
export type Database = {
  public: {
    Tables: {
      reservations: { Row: Reservation; Insert: Partial<Reservation>; Update: Partial<Reservation> };
      payments:     { Row: Payment;     Insert: Partial<Payment>;     Update: never };
      restaurant_settings: {
        Row: RestaurantSettings;
        Insert: Partial<RestaurantSettings>;
        Update: Partial<RestaurantSettings>;
      };
    };
  };
};

/** Service-role client. Use sparingly; bypasses RLS. */
export function adminClient() {
  const env = serverEnv();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

/** Cookie-bound server client — used in /admin route handlers and server components. */
export async function authedServerClient() {
  const env = serverEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet: { name: string; value: string; options: CookieOptions }[]) {
          for (const { name, value, options } of toSet) {
            cookieStore.set({ name, value, ...options });
          }
        },
      },
    }
  );
}
