"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLang } from "@/lib/language";

// Gold gradient applied inline to the 一夜 accent — Tailwind v4 / Turbopack
// silently drops single-use custom classes from compiled CSS under this
// project's setup, so inline styles are the safe path for gradient-text.
const goldGradientStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #fff0ad 0%, #d4af37 45%, #9d7418 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
  textShadow: "none",
};

const STATS = [
  { value: "8", label: { ja: "コース", en: "Courses" } },
  { value: "90", label: { ja: "分", en: "min" } },
  { value: "8M", label: { ja: "カウンター", en: "Counter" } },
  { value: "8", label: { ja: "席", en: "Seats" } },
];

export default function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLang();

  return (
    <section
      id="about"
      ref={ref}
      className="relative overflow-hidden py-[60px] lg:py-[80px]"
      style={{ background: "#12100A" }}
    >
      {/* Mobile: Master Owly character as atmospheric background. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          backgroundImage: "url(/videos/hero-poster.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          opacity: 0.18,
          mixBlendMode: "luminosity",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(18,16,10,0.45) 0%, rgba(18,16,10,0.96) 80%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          {/* Left: text column */}
          <div className="flex flex-col justify-center">
            {/* ① Sub-title — Noto Sans JP Medium, #D4AF37, 0.16em */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="mb-3 font-[family-name:var(--font-noto-sans)] text-[13px] font-medium leading-[1.6] tracking-[0.16em] text-gold text-shadow-hero sm:text-[14px]"
            >
              {t("マスター・アウリの食卓", "MASTER OWLY'S TABLE")}
            </motion.p>

            {/* ② Main heading — Noto Serif JP Bold, clamp(36,6.2vw,44), 一夜 gold */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-[family-name:var(--font-noto-serif)] font-bold leading-[1.25] tracking-[0.04em] text-foreground text-shadow-hero [font-size:clamp(36px,6.2vw,44px)]"
            >
              {t(
                <>
                  八皿に綴られる<br />
                  <span style={goldGradientStyle}>一夜</span>の物語
                </>,
                <>
                  An evening written<br />
                  in <span style={goldGradientStyle}>eight courses</span>
                </>
              )}
            </motion.h2>

            {/* Ornate line under heading — 1px rgba(212,175,55,0.25) with diamond */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={inView ? { opacity: 1, scaleX: 1 } : {}}
              transition={{ duration: 1, delay: 0.25, ease: "easeOut" }}
              aria-hidden="true"
              className="mt-6 mb-6 flex origin-left items-center gap-3"
            >
              <span className="inline-block h-[7px] w-[7px] rotate-45 bg-gold shadow-[0_0_10px_rgba(212,175,55,0.55)]" />
              <span className="h-px w-28 bg-gradient-to-r from-[rgba(212,175,55,0.7)] via-[rgba(212,175,55,0.3)] to-transparent" />
            </motion.div>

            {/* ③ Body paragraph 1 — Noto Sans JP Regular 14-16px, #CBB98A, leading 1.9, left-aligned */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mb-7 max-w-[720px] font-[family-name:var(--font-noto-sans)] text-[14px] font-normal leading-[1.9] text-gold-soft text-shadow-hero sm:text-[15px] lg:text-[16px]"
            >
              {t(
                "8メートルの檜カウンターに、八つの場面が次々と浮かび上がる九十分の懐石劇場。先付の桜から甘味の宵まで、一皿ごとにマスター・アウリの物語が展開し、その余韻とともに料理をお楽しみいただきます。",
                "A ninety-minute kaiseki theatre where eight scenes unfold across an eight-meter hinoki counter. From the cherry garden of the first course to the lantern-warmth of the last, Master Owly's tales lead each dish to the table."
              )}
            </motion.p>

            {/* ③ Body paragraph 2 */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mb-10 max-w-[720px] font-[family-name:var(--font-noto-sans)] text-[14px] font-normal leading-[1.9] text-gold-soft text-shadow-hero sm:text-[15px] lg:text-[16px]"
            >
              {t(
                "黄金の単眼鏡を掛けた一羽の梟が、桜の庭、寺院の勝手口、深き蒼の海底、夜の焚き火、冬の銀景色を巡ります。見事な登場、可笑しな失敗、魔法のような解決 — 物語が収まるその瞬間、完璧な一皿が目の前に届きます。",
                "A monocled owl with a golden feather pen moves through cherry gardens, temple kitchens, indigo depths, campfires, and silver-snow landscapes. Grand entrance, gentle mishap, magical recovery — and as each tale resolves, the perfect dish lands before you."
              )}
            </motion.p>

            {/* ④ Stats — 2×2 on mobile, 4-col on sm+. Vertical gold dividers between items. */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="mt-2 grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:gap-y-0"
            >
              {STATS.map((stat, i) => (
                <div
                  key={stat.label.ja}
                  className={[
                    "flex flex-col items-center px-2 text-center sm:px-4",
                    // Mobile: 2-col grid — right item of each row gets left border
                    i % 2 === 1
                      ? "border-l border-[rgba(212,175,55,0.25)]"
                      : "",
                    // Desktop: 4-col row — every item except first gets left border
                    i > 0
                      ? "sm:border-l sm:border-[rgba(212,175,55,0.25)]"
                      : "sm:border-l-0",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <p className="font-[family-name:var(--font-cinzel)] font-medium tracking-[0.04em] text-gold [font-size:clamp(30px,5vw,38px)] [text-shadow:0_0_16px_rgba(212,175,55,0.2)]">
                    {stat.value}
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-noto-sans)] text-[12px] font-medium tracking-[0.16em] text-gold-soft sm:text-[13px]">
                    {t(stat.label.ja, stat.label.en)}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Master Owly visual column — PC only per spec */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.15 }}
            aria-hidden="true"
            className="relative hidden aspect-[4/5] lg:block"
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url(/videos/hero-poster.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center 30%",
                filter: "brightness(0.92) contrast(1.05) saturate(0.95)",
              }}
            />
            {/* Vignette / bokeh around the character */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 65% 75% at 50% 45%, transparent 25%, rgba(18,16,10,0.55) 70%, rgba(18,16,10,0.92) 100%)",
              }}
            />
            {/* Left-edge fade toward text column */}
            <div
              className="absolute inset-y-0 left-0 w-32"
              style={{
                background:
                  "linear-gradient(to right, rgba(18,16,10,1), rgba(18,16,10,0))",
              }}
            />
            {/* Soft gold spot-light on the owl */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 55% 40%, rgba(212,175,55,0.08) 0%, transparent 40%)",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
