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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="mb-8 inline-flex items-center gap-3 border border-border/60 px-5 py-2"
        >
          <span className="text-[10px] tracking-[0.3em] text-text-muted">
            {CURRENT_CHAPTER.number}
          </span>
          <span className="text-[10px] text-gold/30">|</span>
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
          className="mb-6 font-[family-name:var(--font-cormorant)] text-xs font-medium uppercase tracking-[0.25em] text-text-secondary sm:text-sm sm:tracking-[0.4em]"
        >
          {t("プロジェクションマッピング・ダイニング", "PROJECTION MAPPING DINING")}
        </motion.p>

        {/* H1 uses pure CSS animation (not framer-motion) so Lighthouse
            detects it as an LCP candidate without waiting on JS hydration. */}
        <h1 className="hero-h1 mb-4 font-[family-name:var(--font-display)] text-3xl font-light leading-[1.05] tracking-tight text-foreground sm:text-5xl sm:tracking-[0.12em] lg:text-7xl lg:tracking-[0.15em] 2xl:text-[88px] 2xl:tracking-[0.15em]">
          {t(
            <>マスターの<span className="text-gold">食卓</span>へ</>,
            <>An evening at <span className="text-gold">Master Owly&apos;s</span> table</>
          )}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.5 }}
          className="mb-4 font-serif text-base font-normal tracking-[0.02em] text-text-secondary sm:text-xl sm:tracking-[0.05em]"
        >
          {t(SITE.tagline.ja, SITE.tagline.en)}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12 font-[family-name:var(--font-cormorant)] text-sm tracking-[0.1em] text-gold/80 sm:text-base sm:tracking-[0.15em]"
        >
          {COURSE_PRICE.amount}
          <span className="ml-1 text-gold/50 text-[0.75em]">PHP</span>
          <span className="mx-2 text-gold/40">·</span>
          {t("全8コース・約90分", "8 courses · 90 minutes")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <a
            href="#reservation"
            className="inline-flex items-center gap-2 bg-gold px-10 py-4 text-sm tracking-[0.2em] text-background transition-all duration-300 hover:bg-gold-light"
          >
            {t("ご予約", "Reserve")}
          </a>
          <a
            href={CONTACT.whatsapp.reservationHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("WhatsAppで問い合わせる", "Inquire via WhatsApp")}
            className="inline-flex items-center gap-2 border border-gold/60 bg-gold/5 px-8 py-4 text-sm tracking-[0.2em] text-gold transition-all duration-300 hover:bg-gold/15"
          >
            <MessageCircle size={16} aria-hidden="true" />
            WhatsApp
          </a>
        </motion.div>

        <motion.a
          href="#experience"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-6 inline-block text-xs tracking-[0.25em] text-text-muted underline decoration-gold/20 underline-offset-4 transition-colors duration-300 hover:text-foreground hover:decoration-gold/60"
        >
          {t("体験の流れを見る ↓", "see how the evening unfolds ↓")}
        </motion.a>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
          className="mt-8 text-[11px] tracking-[0.3em] text-text-muted"
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
