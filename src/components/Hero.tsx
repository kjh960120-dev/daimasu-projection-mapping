"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="btn-ornate-ghost mb-8 inline-flex items-center gap-3 px-6 py-2.5 text-shadow-hero"
        >
          <span className="text-[11px] tracking-[0.3em] text-gold/90">
            {CURRENT_CHAPTER.number}
          </span>
          <span className="text-[11px] text-gold/40">|</span>
          <span className="font-serif text-xs tracking-wider text-gold">
            {t(CURRENT_CHAPTER.name.ja, CURRENT_CHAPTER.name.en)}
          </span>
        </motion.div>


        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.25, delay: 0.45, ease: "easeOut" }}
          className="gold-line mx-auto mb-12 w-24"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mb-6 font-[family-name:var(--font-cormorant)] text-xs font-medium uppercase tracking-[0.25em] text-text-secondary text-shadow-hero sm:text-sm sm:tracking-[0.4em]"
        >
          {t("プロジェクションマッピング・ダイニング", "PROJECTION MAPPING DINING")}
        </motion.p>

        {/* H1 uses pure CSS animation (not framer-motion) so Lighthouse
            detects it as an LCP candidate without waiting on JS hydration. */}
        <h1 className="hero-h1 text-shadow-hero mb-4 font-[family-name:var(--font-display)] text-3xl font-light leading-[1.05] tracking-tight text-foreground sm:text-5xl sm:tracking-[0.12em] lg:text-7xl lg:tracking-[0.15em] 2xl:text-[88px] 2xl:tracking-[0.15em]">
          {t(
            <>マスターの<span className="text-gold">食卓</span>へ</>,
            <>An evening at <span className="text-gold">Master Owly&apos;s</span> table</>
          )}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.5 }}
          className="mb-4 font-serif text-base font-normal tracking-[0.02em] text-text-secondary text-shadow-hero sm:text-xl sm:tracking-[0.05em]"
        >
          {t(SITE.tagline.ja, SITE.tagline.en)}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8 text-shadow-hero font-[family-name:var(--font-cormorant),var(--font-shippori),serif] text-sm tracking-[0.1em] text-gold/90 sm:text-base sm:tracking-[0.15em]"
        >
          {COURSE_PRICE.amount}
          <span className="ml-1 text-gold/60 text-[0.75em]">PHP</span>
          <span className="mx-3 text-gold/50">|</span>
          {t("全8コース・約90分", "8 courses · 90 minutes")}
        </motion.p>

        {/* Ornate horizontal divider between price and CTA stack. */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.4, delay: 0.6 }}
          className="ornate-divider mb-8 mx-auto w-full max-w-md"
          aria-hidden="true"
        >
          <span className="text-xs text-gold/70">◆</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mx-auto flex w-full max-w-md flex-col items-stretch gap-3"
        >
          <a
            href="#reservation"
            className="btn-gold-ornate inline-flex items-center justify-between gap-2 px-8 py-4 text-sm tracking-[0.2em]"
          >
            <span aria-hidden="true" className="w-4" />
            <span className="flex-1 text-center">{t("ご予約はこちら", "Reserve your seat")}</span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
          <a
            href={CONTACT.whatsapp.reservationHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("WhatsAppで問い合わせる", "Inquire via WhatsApp")}
            className="btn-ornate-ghost inline-flex items-center justify-between gap-2 px-8 py-4 text-sm tracking-[0.2em]"
          >
            <MessageCircle size={16} aria-hidden="true" />
            <span className="flex-1 text-center">{t("WhatsAppでお問い合わせ", "Inquire via WhatsApp")}</span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        </motion.div>

        <motion.a
          href="#experience"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-6 inline-block text-xs tracking-[0.25em] text-text-secondary text-shadow-hero transition-colors duration-300 hover:text-foreground"
        >
          {t("体験の流れを見る ↓", "see how the evening unfolds ↓")}
        </motion.a>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.4, delay: 0.85 }}
          className="gold-line mx-auto mt-10 w-24"
          aria-hidden="true"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
          className="mt-4 text-[11px] tracking-[0.3em] text-text-secondary text-shadow-hero"
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
