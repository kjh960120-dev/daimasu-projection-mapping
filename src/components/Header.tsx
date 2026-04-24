"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { useLang } from "@/lib/language";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleMobileKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setMobileOpen(false);
      toggleRef.current?.focus();
      return;
    }
    if (e.key === "Tab") {
      const focusable = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    document.addEventListener("keydown", handleMobileKeyDown);
    return () => document.removeEventListener("keydown", handleMobileKeyDown);
  }, [mobileOpen, handleMobileKeyDown]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex h-20 items-center justify-between">
          <a href="#top" className="relative z-10 block" aria-label="DAIMASU — Back to top">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, small brand mark */}
            <img
              src="/logo.png"
              alt="DAIMASU"
              width={440}
              height={99}
              loading="eager"
              decoding="sync"
              className="h-7 w-auto sm:h-8"
            />
          </a>

          <nav className="hidden items-center gap-10 md:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm tracking-wider text-text-secondary transition-colors duration-300 hover:text-foreground"
              >
                {lang === "ja" ? item.label : item.labelEn}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-6 md:flex">
            <button
              onClick={() => setLang(lang === "ja" ? "en" : "ja")}
              className="text-xs tracking-wider text-text-muted transition-colors hover:text-foreground"
              aria-label={lang === "ja" ? "Switch to English (EN)" : "日本語に切替 (JA)"}
            >
              {lang === "ja" ? "EN" : "JA"}
            </button>

            <a
              href="#reservation"
              className="btn-gold-ornate inline-flex items-center px-6 py-2.5 font-[family-name:var(--font-noto-serif)] text-xs font-medium tracking-[0.14em]"
            >
              {t("ご予約", "Book a Table")}
            </a>
          </div>

          <button
            ref={toggleRef}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center -m-2 p-2 text-foreground md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/98 backdrop-blur-lg md:hidden"
          >
            <nav className="flex flex-col items-center gap-8">
              {NAV_ITEMS.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-lg tracking-[0.2em] text-text-secondary transition-colors hover:text-foreground"
                >
                  {lang === "ja" ? item.label : item.labelEn}
                </motion.a>
              ))}
              <motion.button
                onClick={() => { setLang(lang === "ja" ? "en" : "ja"); }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV_ITEMS.length * 0.1 }}
                className="text-sm tracking-wider text-text-muted transition-colors hover:text-foreground"
                aria-label={lang === "ja" ? "Switch to English (EN)" : "日本語に切替 (JA)"}
              >
                {lang === "ja" ? "English" : "日本語"}
              </motion.button>
              <motion.a
                href="#reservation"
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (NAV_ITEMS.length + 1) * 0.1 }}
                className="btn-gold-ornate mt-2 inline-flex items-center px-8 py-3 font-[family-name:var(--font-noto-serif)] text-sm font-medium tracking-[0.14em]"
              >
                {t("ご予約", "Book a Table")}
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
