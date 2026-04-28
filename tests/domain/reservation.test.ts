/**
 * Pure-function tests for domain logic. No Supabase / Stripe / network.
 *
 * These cover the highest-risk math the system performs:
 *   - refund tier classification at policy boundaries
 *   - deposit / balance breakdown (no centavo drift)
 *   - capacity-blocking status set
 */
import { describe, it, expect } from "vitest";
import {
  hoursUntilService,
  refundTier,
  refundAmountCentavos,
  statusAfterCancel,
  priceBreakdown,
  blocksCapacity,
  serviceStartsAt,
} from "@/lib/domain/reservation";

const POLICY = { refund_full_hours: 48, refund_partial_hours: 24 };

describe("refundTier — boundary semantics", () => {
  it("48h or more → full refund", () => {
    expect(refundTier(48, POLICY)).toBe("full");
    expect(refundTier(72, POLICY)).toBe("full");
    expect(refundTier(48.0001, POLICY)).toBe("full");
  });

  it("just under 48h but ≥ 24h → partial (50%)", () => {
    expect(refundTier(47.999, POLICY)).toBe("partial");
    expect(refundTier(36, POLICY)).toBe("partial");
    expect(refundTier(24, POLICY)).toBe("partial");
  });

  it("under 24h → late (0%)", () => {
    expect(refundTier(23.999, POLICY)).toBe("late");
    expect(refundTier(0, POLICY)).toBe("late");
    expect(refundTier(-5, POLICY)).toBe("late");
  });
});

describe("refundAmountCentavos — money math", () => {
  it("full tier returns the full deposit", () => {
    expect(refundAmountCentavos("full", 400_000)).toBe(400_000);
  });
  it("partial tier returns floor(50%) — no rounding-up cents", () => {
    expect(refundAmountCentavos("partial", 400_000)).toBe(200_000);
    expect(refundAmountCentavos("partial", 1)).toBe(0); // floor(0.5)
    expect(refundAmountCentavos("partial", 3)).toBe(1); // floor(1.5)
  });
  it("late tier returns 0", () => {
    expect(refundAmountCentavos("late", 400_000)).toBe(0);
  });
});

describe("statusAfterCancel — labels match refund tier exactly", () => {
  it("full → cancelled_full", () => {
    expect(statusAfterCancel("full")).toBe("cancelled_full");
  });
  it("partial → cancelled_partial", () => {
    expect(statusAfterCancel("partial")).toBe("cancelled_partial");
  });
  it("late → cancelled_late", () => {
    expect(statusAfterCancel("late")).toBe("cancelled_late");
  });
});

describe("priceBreakdown — deposit + balance == total, no centavo drift", () => {
  it("8 pax × ₱8,000 × 50% deposit", () => {
    const r = priceBreakdown(800_000, 8, 50);
    expect(r.total).toBe(800_000 * 8);
    expect(r.deposit + r.balance).toBe(r.total);
    expect(r.deposit).toBe(800_000 * 8 / 2);
  });

  it("odd party with non-50 deposit pct still sums clean", () => {
    const r = priceBreakdown(800_000, 3, 33);
    expect(r.total).toBe(2_400_000);
    expect(r.deposit + r.balance).toBe(r.total);
    expect(r.deposit).toBe(Math.floor(2_400_000 * 33 / 100));
  });

  it("0% deposit: deposit=0, balance=total", () => {
    const r = priceBreakdown(800_000, 2, 0);
    expect(r.deposit).toBe(0);
    expect(r.balance).toBe(r.total);
  });

  it("100% deposit: balance=0", () => {
    const r = priceBreakdown(800_000, 2, 100);
    expect(r.balance).toBe(0);
    expect(r.deposit).toBe(r.total);
  });
});

describe("blocksCapacity — only pending/confirmed count", () => {
  it("pending_payment and confirmed block capacity", () => {
    expect(blocksCapacity("pending_payment")).toBe(true);
    expect(blocksCapacity("confirmed")).toBe(true);
  });
  it("any cancelled/no_show/completed do NOT block", () => {
    expect(blocksCapacity("cancelled_full")).toBe(false);
    expect(blocksCapacity("cancelled_partial")).toBe(false);
    expect(blocksCapacity("cancelled_late")).toBe(false);
    expect(blocksCapacity("no_show")).toBe(false);
    expect(blocksCapacity("completed")).toBe(false);
  });
});

describe("serviceStartsAt — Manila TZ wall-clock construction", () => {
  const settings = {
    seating_1_starts_at: "17:30",
    seating_2_starts_at: "19:30",
    timezone: "Asia/Manila",
  };

  it("builds the correct UTC instant for s1", () => {
    const d = serviceStartsAt("2026-05-01", "s1", settings);
    expect(d.toISOString()).toBe("2026-05-01T09:30:00.000Z"); // 17:30 PHT = 09:30 UTC
  });
  it("builds the correct UTC instant for s2", () => {
    const d = serviceStartsAt("2026-05-01", "s2", settings);
    expect(d.toISOString()).toBe("2026-05-01T11:30:00.000Z");
  });
});

describe("hoursUntilService — sign + magnitude", () => {
  it("future booking → positive hours", () => {
    const future = new Date(Date.now() + 50 * 3_600_000);
    expect(hoursUntilService(future)).toBeCloseTo(50, 0);
  });
  it("past booking → negative hours", () => {
    const past = new Date(Date.now() - 5 * 3_600_000);
    expect(hoursUntilService(past)).toBeCloseTo(-5, 0);
  });
});
