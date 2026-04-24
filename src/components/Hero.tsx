"use client";

import { motion } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";
import { SITE, CURRENT_CHAPTER, COURSE_PRICE, CONTACT } from "@/lib/constants";
import { useLang } from "@/lib/language";

export default function Hero() {
  const { t } = useLang();

  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0" style={{ contain: "paint" }} aria-hidden="true">
        <video
          className="hero-bg-video absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/videos/hero-poster.jpg"
        >
          <source src="/videos/hero-highlight-720.mp4" media="(max-width: 768px)" type="video/mp4" />
          <source src="/videos/hero-highlight-1080.mp4" type="video/mp4" />
        </video>
        {/* Darken video so body/price text retains contrast against bright scenes (flame, surf). */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Radial dim around the centered text column — boosts the thin gold price line
            without flattening the video's edges. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)",
          }}
        />
        {/* Edge-fade gradient keeps chrome-on-black aesthetic and blends into next section. */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background" />
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/4 blur-[120px]"
          style={{ willChange: "opacity", transform: "translate3d(-50%, -50%, 0)" }}
        />
        {/* Widescreen ambient: faint gold vertical lines (byobu-inspired), xl+ only */}
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute left-[10%] top-1/2 hidden h-[400px] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-gold/70 to-transparent xl:block"
          style={{ willChange: "opacity" }}
        />
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute right-[10%] top-1/2 hidden h-[400px] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-gold/70 to-transparent xl:block"
          style={{ willChange: "opacity" }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center">
        {/* Chapter badge — 1px border #C8A85A, 2px rounded, Noto Serif JP Medium 14px */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="mb-8 inline-flex items-center gap-3 rounded-[2px] border border-[#C8A85A] px-4 py-2 font-[family-name:var(--font-noto-serif)] text-[14px] font-medium tracking-[0.08em] text-gold text-shadow-hero"
        >
          <span>{CURRENT_CHAPTER.number}</span>
          <span className="text-gold/50">|</span>
          <span>{t(CURRENT_CHAPTER.name.ja, CURRENT_CHAPTER.name.en)}</span>
        </motion.div>

        {/* Kicker — Noto Sans JP 14px #CBB98A 0.12em */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mb-6 font-[family-name:var(--font-noto-sans)] text-[14px] tracking-[0.12em] text-gold-soft text-shadow-hero"
        >
          {t("プロジェクションマッピング・ダイニング", "PROJECTION MAPPING DINING")}
        </motion.p>

        {/* H1 — Noto Serif JP Bold, 28px SP / 36px PC, #FFFFFF + 食卓 #D4AF37, 0.04em, 1.4 leading.
            CSS animation (not framer-motion) so Lighthouse detects it as an LCP candidate. */}
        <h1 className="hero-h1 text-shadow-hero mb-4 font-[family-name:var(--font-noto-serif)] text-[28px] font-bold leading-[1.4] tracking-[0.04em] text-foreground sm:text-[36px]">
          {t(
            <>マスターの<span className="text-gold">食卓</span>へ</>,
            <>An evening at <span className="text-gold">Master Owly&apos;s</span> table</>
          )}
        </h1>

        {/* Tagline — Noto Serif JP Regular 15px #CBB98A 0.06em */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.5 }}
          className="mb-6 font-[family-name:var(--font-noto-serif)] text-[15px] font-normal leading-relaxed tracking-[0.06em] text-gold-soft text-shadow-hero"
        >
          {t(SITE.tagline.ja, SITE.tagline.en)}
        </motion.p>

        {/* Price — Noto Serif JP Medium 16px #D4AF37 0.06em */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-6 font-[family-name:var(--font-noto-serif)] text-[16px] font-medium tracking-[0.06em] text-gold text-shadow-hero"
        >
          {COURSE_PRICE.amount}
          <span className="ml-1 text-gold/70 text-[0.8em]">PHP</span>
          <span className="mx-3 text-gold/60">|</span>
          {t("全8コース・約90分", "8 courses · 90 minutes")}
        </motion.p>

        {/* Ornate divider between price and CTA stack — diamonds at both ends */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.4, delay: 0.55 }}
          className="ornate-divider mx-auto mb-8 w-[88%] max-w-md"
          aria-hidden="true"
        >
          <span className="ornate-diamond" />
          <span className="ornate-diamond" />
        </motion.div>

        {/* CTA stack — 88% width, 56px tall, 4px rounded */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mx-auto flex w-[88%] max-w-md flex-col items-stretch gap-3"
        >
          <a
            href="#reservation"
            className="btn-gold-ornate flex h-14 items-center justify-center font-[family-name:var(--font-noto-serif)] text-[16px] font-medium tracking-[0.06em]"
          >
            {t("ご予約", "Reserve")}
          </a>
          <a
            href={CONTACT.whatsapp.reservationHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("WhatsAppで問い合わせる", "Inquire via WhatsApp")}
            className="btn-ornate-ghost flex h-14 items-center justify-center gap-2.5 font-[family-name:var(--font-noto-sans)] text-[16px] font-medium tracking-[0.02em]"
          >
            <MessageCircle size={18} aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
        </motion.div>

        {/* Scroll hint — Noto Sans JP #CBB98A */}
        <motion.a
          href="#experience"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-8 inline-block font-[family-name:var(--font-noto-sans)] text-[13px] tracking-[0.1em] text-gold-soft text-shadow-hero transition-colors duration-300 hover:text-gold"
        >
          {t("体験の流れを見る ↓", "see how the evening unfolds ↓")}
        </motion.a>

        {/* Second ornate divider — before seat-count footnote */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.4, delay: 0.8 }}
          className="ornate-divider mx-auto mt-10 w-[88%] max-w-md"
          aria-hidden="true"
        >
          <span className="ornate-diamond" />
          <span className="ornate-diamond" />
        </motion.div>

        {/* Seat-count footnote — Noto Sans JP Regular 13px #CBB98A 0.12em */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
          className="mt-5 font-[family-name:var(--font-noto-sans)] text-[13px] tracking-[0.12em] text-gold-soft text-shadow-hero"
        >
          {t("カウンター8席限定", "Limited to 8 counter seats")}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
          <ChevronDown size={20} className="text-text-muted" />
        </motion.div>
      </motion.div>
    </section>
  );
}
