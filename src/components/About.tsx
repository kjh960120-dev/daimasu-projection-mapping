"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AESTHETICS } from "@/lib/constants";
import { useLang } from "@/lib/language";

export default function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLang();

  return (
    <section id="about" className="relative overflow-hidden py-20 lg:py-28" ref={ref}>
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col justify-center">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="mb-4 text-xs tracking-[0.3em] text-gold"
            >
              {t("マスター・アウリの食卓", "MASTER OWLY'S TABLE")}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-8 font-[family-name:var(--font-noto-serif)] text-3xl font-medium leading-[1.4] tracking-[0.02em] sm:text-4xl"
            >
              {t(
                <>八皿に綴られる<br /><span className="text-gold-gradient">一夜</span>の物語</>,
                <>An evening written<br />in <span className="text-gold-gradient">eight courses</span></>
              )}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6 text-base leading-loose text-text-secondary"
            >
              {t(
                "8メートルの檜カウンターに、八つの場面が次々と浮かび上がる九十分の懐石劇場。先付の桜から甘味の宵まで、一皿ごとにマスター・アウリの物語が展開し、その余韻とともに料理をお楽しみいただきます。",
                "A ninety-minute kaiseki theatre where eight scenes unfold across an eight-meter hinoki counter. From the cherry garden of the first course to the lantern-warmth of the last, Master Owly's tales lead each dish to the table."
              )}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-8 text-base leading-loose text-text-secondary"
            >
              {t(
                "黄金の単眼鏡を掛けた一羽の梟が、桜の庭、寺院の勝手口、深き蒼の海底、夜の焚き火、冬の銀景色を巡ります。見事な登場、可笑しな失敗、魔法のような解決 — 物語が収まるその瞬間、完璧な一皿が目の前に届きます。",
                "A monocled owl with a golden feather pen moves through cherry gardens, temple kitchens, indigo depths, campfires, and silver-snow landscapes. Grand entrance, gentle mishap, magical recovery — and as each tale resolves, the perfect dish lands before you.",
              )}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex gap-12"
            >
              <div>
                <p className="font-[family-name:var(--font-cinzel)] text-4xl font-normal text-gold">8</p>
                <p className="mt-1 text-xs tracking-wider text-text-muted">
                  {t("コース", "Courses")}
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-cinzel)] text-4xl font-normal text-gold">90</p>
                <p className="mt-1 text-xs tracking-wider text-text-muted">
                  {t("分", "min")}
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-cinzel)] text-4xl font-normal text-gold">8m</p>
                <p className="mt-1 text-xs tracking-wider text-text-muted">
                  {t("カウンター", "Counter")}
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-cinzel)] text-4xl font-normal text-gold">8</p>
                <p className="mt-1 text-xs tracking-wider text-text-muted">
                  {t("席", "Seats")}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Aesthetics cards */}
          <div className="space-y-4">
            {AESTHETICS.map((item, i) => (
              <motion.div
                key={item.principle.ja}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }}
                className="group border border-border bg-surface/60 p-5 transition-all duration-500 hover:border-gold/30"
              >
                <p className="mb-1 font-serif text-sm font-medium text-gold">
                  {t(item.principle.ja, item.principle.en)}
                </p>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {t(item.description.ja, item.description.en)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
