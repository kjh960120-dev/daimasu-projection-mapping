/**
 * DAIMASU — Operational Course Data
 *
 * Source of truth for kitchen-display systems, course-tracking, and timing dashboards.
 * Mirrors the operational manuals (daimasu_operations_unified_v2.0 + manual_kitchen_v2.0
 * + course_narration_v2.1) — keep in sync when those manuals are updated.
 *
 * Slot model:
 *   0 = Welcome video (no food)
 *   1 – 8 = the eight courses
 *   9 = Ending video (no food)
 *
 * All clock times reflect the 1st seating (17:30 doors / 17:35 Welcome / 19:00 Ending).
 * 2nd seating mirrors with a +2:30 offset (20:00 doors / 20:05 Welcome / 21:30 Ending).
 *
 * Capacity scenarios (cover counts per seating):
 *   A = 2 covers (1 pair)
 *   B = 4 covers (2 pairs)
 *   C = 6 covers (3 pairs)
 *   D = 8 covers (4 pairs, single bar table — full house)
 *
 * Plating deadline rule: ready-at-pass = slot trigger − 60 seconds.
 */

export type HoldState = "cold" | "ambient" | "warm" | "hot" | "n/a";
export type CoverScenario = "A" | "B" | "C" | "D";
export type Seating = 1 | 2;

/**
 * Narration trigger — when COUNTER speaks the line relative to the slot's
 * story video. From course_narration v2.1 §preamble:
 *   "Pre-video"  = 1 second before the story video begins.
 *   "Post-video" = immediately after the story ends, before the loop softens.
 */
export type NarrationTrigger = "pre-video-1s" | "post-video-1s" | "n/a";

export interface CourseTiming {
  /** Slot index (0 = Welcome, 1–8 = courses, 9 = Ending). */
  slot: number;
  /** Course number (null for Welcome / Ending). */
  course: number | null;
  /** Story video duration (seconds). */
  storyVideoSec: number;
  /** Standard loop length (minutes). 8 is variable on celebration count. */
  loopMin: number | "variable";
  /** Slot trigger time, 1st seating, 24-h "HH:MM". */
  triggerTime1st: string;
  /** Slot trigger time, 2nd seating. */
  triggerTime2nd: string;
  /** When the dish must be ready at the pass (= trigger − 60 s). */
  platingReadyAt1st: string;
  platingReadyAt2nd: string;
}

export interface CoverPlatingTime {
  /** Plating duration in seconds (start → ready at pass). */
  A: number; // 2 covers
  B: number; // 4 covers
  C: number; // 6 covers
  D: number; // 8 covers
}

/* ------------------------------------------------------------------------- */
/* COURSE ENTRY — narration is invariant-paired with hasNarration             */
/* ------------------------------------------------------------------------- */

interface CourseEntryBase {
  slot: number;
  /** Course number; null for Welcome / Ending. */
  course: number | null;
  category: { ja: string; en: string };
  dish: { ja: string; en: string };
  /** For multi-component courses (e.g., 春の前菜三種, 刺身三種). */
  components?: Array<{ ja: string; en: string; note?: string }>;
  hold: HoldState;
  /**
   * Optional cap on time the plate may sit on the pass before quality
   * degrades (e.g. Slot 8 ice cream melts: never on the pass more than 90 s).
   * Manual: kitchen_v2.0 §5.8 / unified §5.8 cue.
   */
  holdMaxSec?: number;
  /** Owly story-video beat description. */
  storyBeat: string | null;
  /** Owly loop-video beat description. */
  loopBeat: string | null;
  timing: CourseTiming;
  /** Plating duration by capacity scenario, in seconds. */
  platingTime: CoverPlatingTime;
  /** Runner trip count by capacity scenario. */
  trips: { A: number; B: number; C: number; D: number };
  /** Operational notes for kitchen / runner. */
  notes?: string[];
}

/**
 * Discriminated union over `hasNarration` so that `narration` and
 * `narrationTrigger` are guaranteed non-null when `hasNarration` is true,
 * and forced to `null` / `"n/a"` when false. Eliminates the
 * "narration string but trigger n/a" invariant bug class.
 */
export type CourseEntry =
  | (CourseEntryBase & {
      hasNarration: true;
      /** Counter narration verbatim (English, from course_narration v2.1). */
      narration: string;
      narrationTrigger: Exclude<NarrationTrigger, "n/a">;
    })
  | (CourseEntryBase & {
      hasNarration: false;
      narration: null;
      narrationTrigger: "n/a";
    });

/* ------------------------------------------------------------------------- */
/* SEATING SCHEDULE                                                          */
/* ------------------------------------------------------------------------- */

export const SEATING_SCHEDULE = {
  doorsFirst: "17:30",
  welcomeStartFirst: "17:35",
  endingFirst: "19:00",
  endingFinishFirst: "19:01",
  paymentWindowFirst: { start: "19:01", end: "19:07" },
  turnaround: { start: "19:01", end: "20:00", durationMin: 59 },
  doorsSecond: "20:00",
  welcomeStartSecond: "20:05",
  endingSecond: "21:30",
  cleanup: { start: "21:30", end: "22:00" },
} as const;

/* ------------------------------------------------------------------------- */
/* CAPACITY MATRIX                                                           */
/* ------------------------------------------------------------------------- */

export const CAPACITY_MATRIX = [
  {
    scenario: "A" as CoverScenario,
    covers: 2,
    pairs: 1,
    paymentMinutes: 3,
    maxCelebrationRounds: 1,
  },
  {
    scenario: "B" as CoverScenario,
    covers: 4,
    pairs: 2,
    paymentMinutes: 7,
    maxCelebrationRounds: 2,
  },
  {
    scenario: "C" as CoverScenario,
    covers: 6,
    pairs: 3,
    paymentMinutes: 5, // with pre-bill drop
    maxCelebrationRounds: 3,
  },
  {
    scenario: "D" as CoverScenario,
    covers: 8,
    pairs: 4,
    paymentMinutes: 6, // with pre-bill drop
    maxCelebrationRounds: 4,
  },
] as const;

/* ------------------------------------------------------------------------- */
/* CELEBRATION TYPES (reservation form options)                              */
/* ------------------------------------------------------------------------- */

export const CELEBRATION_TYPES = [
  { id: "none", label: { ja: "なし", en: "None" } },
  { id: "birthday", label: { ja: "お誕生日", en: "Birthday" }, hasVideo: true },
  {
    id: "anniversary",
    label: { ja: "記念日", en: "Anniversary" },
    hasVideo: false,
  },
  { id: "proposal", label: { ja: "プロポーズ", en: "Proposal" }, hasVideo: false },
  {
    id: "milestone",
    label: { ja: "節目の年齢", en: "Milestone age" },
    hasVideo: false,
  },
  { id: "business", label: { ja: "ビジネス", en: "Business" }, hasVideo: false },
  { id: "farewell", label: { ja: "送別", en: "Farewell" }, hasVideo: false },
  { id: "other", label: { ja: "その他", en: "Other" }, hasVideo: false },
] as const;

/* ------------------------------------------------------------------------- */
/* THE 10 SLOTS                                                              */
/* ------------------------------------------------------------------------- */

export const COURSES: CourseEntry[] = [
  /* ============== SLOT 0 — WELCOME ============== */
  {
    slot: 0,
    course: null,
    category: { ja: "ウェルカム", en: "Welcome" },
    dish: { ja: "—", en: "—" },
    hold: "n/a",
    hasNarration: true,
    narration:
      "Welcome to DAIMASU. That's Owly — our host, on the wall. He's about to set this table eight times tonight. Watch closely.",
    narrationTrigger: "pre-video-1s",
    storyBeat:
      "Golden particles. Owly straightens his bow tie, draws a circle of light with his feather pen, winks.",
    loopBeat: "Golden ambient particles; Owly polishes his monocle in the corner.",
    timing: {
      slot: 0,
      course: null,
      storyVideoSec: 30,
      loopMin: 0,
      triggerTime1st: "17:35",
      triggerTime2nd: "20:05",
      platingReadyAt1st: "—",
      platingReadyAt2nd: "—",
    },
    platingTime: { A: 0, B: 0, C: 0, D: 0 },
    trips: { A: 0, B: 0, C: 0, D: 0 },
    notes: ["No food served during Welcome. Course 1 plates already pre-staged on pass."],
  },

  /* ============== SLOT 1 — COURSE 1 春の前菜三種 ============== */
  {
    slot: 1,
    course: 1,
    category: { ja: "春の前菜三種", en: "Spring Appetizer Trio" },
    dish: { ja: "春の前菜三種", en: "Spring Appetizer Trio" },
    components: [
      {
        ja: "ホタルイカの梅ジュレ和え",
        en: "Firefly squid with plum jelly",
      },
      {
        ja: "菜の花の酢味噌和え",
        en: "Rape blossom with vinegar miso",
      },
      {
        ja: "鯛の煮こごり",
        en: "Sea bream aspic",
        note: "Cold / aspic — held at ambient",
      },
    ],
    hold: "ambient",
    hasNarration: true,
    narration:
      "There — a sneeze, three flavors of spring! Firefly squid, rape blossom, sea bream aspic. Itadakimasu!",
    narrationTrigger: "post-video-1s",
    storyBeat:
      "Owly summons cherry blossoms by accident, sneezes — petals settle into a Japanese pattern.",
    loopBeat: "Petal pattern with snowing blossoms; Owly watches guests through a magnifying glass.",
    timing: {
      slot: 1,
      course: 1,
      storyVideoSec: 60,
      loopMin: 7,
      triggerTime1st: "17:36",
      triggerTime2nd: "20:06",
      platingReadyAt1st: "17:35",
      platingReadyAt2nd: "20:05",
    },
    platingTime: { A: 45, B: 75, C: 120, D: 150 },
    trips: { A: 1, B: 1, C: 2, D: 2 },
    notes: [
      "Cold dish — never hold warm.",
      "Sea bream aspic must be set; check at 17:25 briefing.",
      "Plate counts: A=2 sets / B=4 / C=6 / D=8.",
    ],
  },

  /* ============== SLOT 2 — COURSE 2 椀物 ============== */
  {
    slot: 2,
    course: 2,
    category: { ja: "椀物", en: "Wanmono" },
    dish: { ja: "つみれの清まし仕立て", en: "Tsumire no sumashi (clear soup)" },
    hold: "hot",
    hasNarration: true,
    narration:
      "He fell straight in! And out of that bowl came yours — tsumire no sumashi. Lift the lid first, then drink.",
    narrationTrigger: "post-video-1s",
    storyBeat:
      "Owly tumbles into a simmering pot and rises again as golden steam from his feather pen.",
    loopBeat: "Soft golden steam ambience; Owly blow-drying his soaked feathers.",
    timing: {
      slot: 2,
      course: 2,
      storyVideoSec: 60,
      loopMin: 7,
      triggerTime1st: "17:44",
      triggerTime2nd: "20:14",
      platingReadyAt1st: "17:43",
      platingReadyAt2nd: "20:13",
    },
    platingTime: { A: 40, B: 60, C: 90, D: 120 },
    trips: { A: 1, B: 1, C: 2, D: 3 },
    notes: [
      "Broth at 75–80 °C, lids on.",
      "Single tsumire centered in each bowl.",
      "Pass at T −10 s so Runner picks up exactly at NEXT.",
    ],
  },

  /* ============== SLOT 3 — COURSE 3 刺身三種 ============== */
  {
    slot: 3,
    course: 3,
    category: { ja: "刺身三種", en: "Sashimi Three Selections" },
    dish: { ja: "刺身三種", en: "Sashimi Three Selections" },
    components: [
      { ja: "ハマチ", en: "Hamachi (yellowtail)" },
      { ja: "中トロ", en: "Chu-toro (medium fatty tuna)" },
      { ja: "ホタテ", en: "Hotate (scallop)" },
    ],
    hold: "cold",
    hasNarration: true,
    narration:
      "Octopus loses tonight! Hamachi, chu-toro, hotate — three slices, left to right, light to rich.",
    narrationTrigger: "post-video-1s",
    storyBeat:
      "Owly dives deep, tug-of-war with an octopus, hauls a golden net up full.",
    loopBeat: "Underwater bubbles drifting past schools of fish; Owly floats on a tube smiling.",
    timing: {
      slot: 3,
      course: 3,
      storyVideoSec: 60,
      loopMin: 7,
      triggerTime1st: "17:52",
      triggerTime2nd: "20:22",
      platingReadyAt1st: "17:51",
      platingReadyAt2nd: "20:21",
    },
    platingTime: { A: 50, B: 80, C: 120, D: 150 },
    trips: { A: 1, B: 2, C: 3, D: 4 },
    notes: [
      "Chilled plate; centerpiece visual — peak presentation.",
      "Cut window: 17:48 – 17:51:30 (1st seating).",
      "Land slowly and deliberately — sashimi visual is the centerpiece.",
    ],
  },

  /* ============== SLOT 4 — COURSE 4 焼物 銀鱈 ============== */
  {
    slot: 4,
    course: 4,
    category: { ja: "焼物", en: "Yakimono" },
    dish: { ja: "銀鱈の西京焼き", en: "Gindara Saikyo-yaki (black cod)" },
    hold: "warm",
    hasNarration: true,
    narration:
      "Tail in the bucket — lesson learned. Gindara saikyo-yaki — black cod, three days in miso, then the grill. While it's warm.",
    narrationTrigger: "post-video-1s",
    storyBeat:
      "Owly aims a magnifying glass at the sun; tail catches fire; dunks rear in bucket; magnifies a sphere — POOF, grilled fish appears.",
    loopBeat: "Soft charcoal ember haze; Owly with ice pack on tail dozes in corner.",
    timing: {
      slot: 4,
      course: 4,
      storyVideoSec: 60,
      loopMin: 7,
      triggerTime1st: "18:01",
      triggerTime2nd: "20:31",
      platingReadyAt1st: "18:00",
      platingReadyAt2nd: "20:30",
    },
    platingTime: { A: 45, B: 70, C: 110, D: 140 },
    trips: { A: 1, B: 1, C: 2, D: 3 },
    notes: [
      "Salamander finish in last 30 s.",
      "Plate temperature is the cue — warmed plates only.",
      "Cod plated on warmed plates with grated daikon.",
    ],
  },

  /* ============== SLOT 5 — COURSE 5 揚物 海老 ============== */
  {
    slot: 5,
    course: 5,
    category: { ja: "揚物", en: "Agemono" },
    dish: {
      ja: "海老と季節野菜の天ぷら",
      en: "Ebi to yasai no tempura (prawn & seasonal vegetables)",
    },
    hold: "hot",
    hasNarration: true,
    narration:
      "He fried himself first! Ebi to yasai no tempura — paper-thin batter, prawn, vegetables. Salt first, sauce second, eat quickly.",
    narrationTrigger: "post-video-1s",
    storyBeat:
      "Owly sprinkles golden magic powder; wind blows it onto him; he becomes a tempura himself; magic shatters batter into pieces.",
    loopBeat: "Tiny golden tempura crumbs rising slowly with bubbles in clear oil.",
    timing: {
      slot: 5,
      course: 5,
      storyVideoSec: 60,
      loopMin: 7,
      triggerTime1st: "18:10",
      triggerTime2nd: "20:40",
      platingReadyAt1st: "18:09",
      platingReadyAt2nd: "20:39",
    },
    platingTime: { A: 60, B: 90, C: 120, D: 180 },
    trips: { A: 1, B: 2, C: 3, D: 4 },
    notes: [
      "FRESHNESS CLOCK STARTS at ready-at-pass. Fast pickup mandatory.",
      "Never hold fried food on the pass.",
      "8 covers requires 2-wave fry (1st wave held under heat lamp 30 s).",
      "Pickup must be immediate at NEXT — fastest of all courses.",
      "Salt first, sauce second.",
    ],
  },

  /* ============== SLOT 6 — COURSE 6 蒸物 茶碗蒸し ============== */
  {
    slot: 6,
    course: 6,
    category: { ja: "蒸物", en: "Mushimono" },
    dish: { ja: "茶碗蒸し", en: "Chawanmushi (egg custard)" },
    hold: "hot",
    hasNarration: true,
    narration:
      "Trapped in the cup, he was! Chawanmushi — egg custard over dashi, treasures hiding below. Find them slowly.",
    narrationTrigger: "post-video-1s",
    storyBeat:
      "Owly arrives on a cotton-candy cloud; traps steam in a cup; jelly engulfs him; pudding scatters into thousands of golden droplets falling into a single cup.",
    loopBeat: "White particles rising softly like heat shimmer; Owly napping on a cloud pillow.",
    timing: {
      slot: 6,
      course: 6,
      storyVideoSec: 60,
      loopMin: 7,
      triggerTime1st: "18:19",
      triggerTime2nd: "20:49",
      platingReadyAt1st: "18:18",
      platingReadyAt2nd: "20:48",
    },
    platingTime: { A: 40, B: 60, C: 90, D: 120 },
    trips: { A: 1, B: 2, C: 3, D: 3 },
    notes: [
      "Out of steamer, lids on.",
      "Cups must be hot to the touch.",
      "Group photo offer window for celebration tables (during loop).",
    ],
  },

  /* ============== SLOT 7 — COURSE 7 食事 寿司五貫 ============== */
  {
    slot: 7,
    course: 7,
    category: { ja: "食事", en: "Shokuji" },
    dish: { ja: "本日の握り寿司五貫", en: "Today's nigiri five pieces" },
    hold: "warm", // rice tepid, neta chilled — composite
    hasNarration: true,
    narration:
      "Five orbs, five rays! Nigiri go-kan — five pieces, chef's choice. Fingers, fish down on tongue. One bite each.",
    narrationTrigger: "post-video-1s",
    storyBeat:
      "Master headband; rice avalanche; rodeo on rice; sticky rice covers him into onigiri; shakes off into 5 lumps; 5 rays of light land (pink/silver/orange/white/brown).",
    loopBeat: "Rice plain with wasabi and yuzu particles drifting like jewels.",
    timing: {
      slot: 7,
      course: 7,
      storyVideoSec: 60,
      loopMin: 7,
      triggerTime1st: "18:28",
      triggerTime2nd: "20:58",
      platingReadyAt1st: "18:27",
      platingReadyAt2nd: "20:57",
    },
    platingTime: { A: 50, B: 100, C: 150, D: 200 },
    trips: { A: 1, B: 2, C: 3, D: 4 },
    notes: [
      "Rice at body temperature, neta brushed with nikiri.",
      "Form nigiri at the very last moment.",
      "5 nigiri × cover count: A=10, B=20, C=30, D=40 pieces.",
      "Begin forming earlier on D (e.g., 18:23:40 for 8 cov).",
      "COUNTER prepares 4 bill folders during this loop (Pre-Bill prep window).",
    ],
  },

  /* ============== SLOT 8 — COURSE 8 甘味 抹茶アイス ============== */
  {
    slot: 8,
    course: 8,
    category: { ja: "甘味", en: "Kanmi (Dessert)" },
    dish: { ja: "抹茶アイス", en: "Matcha ice cream" },
    /**
     * "cold" not "frozen" — kitchen_v2.0 §5.8 cue: "Scoops sit on chilled
     * bowls; never on the pass more than 90 s." The dish is melting on the
     * pass; we hold cold and cap the pass-time hard at 90 s.
     */
    hold: "cold",
    holdMaxSec: 90,
    hasNarration: true,
    narration:
      "One small scoop survived the sugar fog! Matcha ice — bitter first, then sweet. Take your time.",
    narrationTrigger: "post-video-1s",
    storyBeat:
      "Golden party hat; sugar particles rise; Owly is buried in candy particles, shakes free into a fine sugar fog, ends up cradling a tiny ice cream.",
    loopBeat: "Rose-gold and pink night sky; gold dust like fireflies; Owly enjoying a small ice cream.",
    timing: {
      slot: 8,
      course: 8,
      storyVideoSec: 60,
      loopMin: "variable", // 7 (A/B/C base) – 19 (D + 4 cel) min, worst-case ~33 min
      triggerTime1st: "18:37",
      triggerTime2nd: "21:07",
      platingReadyAt1st: "18:36",
      platingReadyAt2nd: "21:06",
    },
    platingTime: { A: 120, B: 180, C: 240, D: 300 },
    trips: { A: 1, B: 1, C: 2, D: 2 },
    notes: [
      "Scoops sit on chilled bowls; never on the pass more than 90 s (holdMaxSec).",
      "Up to 4 sequential celebration rounds inserted into Slot 8 (D worst case ~19 min total Slot 8, photo overrun up to ~33 min).",
      "Each celebration round: announce + 30 s 8b video + cake-on-candle + Owly card + photo + closing line (~2.5 min).",
      "Cake plates pre-staged in cake fridge during 17:25 mise; candles inserted but unlit.",
      "RUNNER lights candle at pickup (not Kitchen).",
      "RUNNER pre-bill drop (Tables A–D) during this slot — silent face-down placement.",
    ],
  },

  /* ============== SLOT 9 — ENDING ============== */
  {
    slot: 9,
    course: null,
    category: { ja: "エンディング", en: "Ending" },
    dish: { ja: "—", en: "—" },
    hold: "n/a",
    hasNarration: true,
    narration:
      "Eight courses... one small magnificent owl... one quiet evening of yours. Thank you. Until we meet again.",
    narrationTrigger: "post-video-1s",
    storyBeat:
      "All course props as light traces racing past; Owly bows; draws a final circle of light; fades.",
    loopBeat: "Golden bokeh particles; Owly's bow tie and monocle floating, glinting.",
    timing: {
      slot: 9,
      course: null,
      storyVideoSec: 30,
      loopMin: 0,
      triggerTime1st: "19:00",
      triggerTime2nd: "21:30",
      platingReadyAt1st: "—",
      platingReadyAt2nd: "—",
    },
    platingTime: { A: 0, B: 0, C: 0, D: 0 },
    trips: { A: 0, B: 0, C: 0, D: 0 },
    notes: [
      "Ending plays ~1 min, then RUNNER directs guests to counter for fast post-Ending payment.",
      "Pre-Bill folders already on tables; payment becomes card-swipe only (~6 min for 4 tables).",
    ],
  },
];

/* ------------------------------------------------------------------------- */
/* INTERCOM CODEWORDS                                                        */
/* ------------------------------------------------------------------------- */

export const INTERCOM_CODEWORDS = {
  cueCheck: {
    phrase: "Cue check",
    meaning: "Something is wrong with the projection. Hold position.",
    speakers: "Either → the other",
  },
  houseLights: {
    phrase: "House lights",
    meaning:
      "COUNTER enters the room and starts hospitality fill / RUNNER initiates tech recovery (concurrent dispatch).",
    speakers: "COUNTER → RUNNER",
  },
  finalPour: {
    phrase: "Final pour",
    meaning: "Tier-1 recovery failed. Begin graceful service termination.",
    speakers: "COUNTER → all",
  },
  standBy5: {
    phrase: "Stand by 5",
    meaning: "Hold all action for 5 seconds (micro-hold).",
    speakers: "Any → all",
  },
  pauseOneBeat: {
    phrase: "Pause one beat",
    meaning: "Counter is timing-adjusting; hold next move.",
    speakers: "COUNTER → all",
  },
  holdAll: {
    phrase: "Hold all — [reason]",
    meaning: "Emergency stop everything; wait for Resume.",
    speakers: "Any → all",
  },
  slotPressed: {
    phrase: "Slot N pressed",
    meaning: "COUNTER triggered slot N. KITCHEN+RUNNER sync next-course timing.",
    speakers: "COUNTER → all",
  },
  slotComplete: {
    phrase: "Slot N complete",
    meaning: "Story video ended. Final plating push for Course N+1.",
    speakers: "COUNTER → all",
  },
} as const;

/* ------------------------------------------------------------------------- */
/* CELEBRATION TIMING (Slot 8 dynamic schedule by celebration count)         */
/* ------------------------------------------------------------------------- */

export type CelebrationCount = 0 | 1 | 2 | 3 | 4;

/**
 * Per-scenario base Slot 8 minutes (no celebrations).
 * Source: unified §5.8.4 + §5.8 capacity table — A/B/C base ~7 min,
 * D base ~9 min (8-cover scoop time + cleanup is the differentiator).
 */
const SLOT8_BASE_MIN_BY_SCENARIO: Record<CoverScenario, number> = {
  A: 7,
  B: 7,
  C: 7,
  D: 9,
};

/**
 * Standard ceremonial round adder (announce + 30 s video + cake + photo +
 * applause + closing). Source: unified §5.8.4 "~2.5 min per table".
 */
const STANDARD_ROUND_MIN = 2.5;

/**
 * Compressed round seconds, used when slow pace + 4 celebrations triggers
 * the §W6 compression override.
 */
const COMPRESSED_ROUND_SEC = 90;

export const CELEBRATION_TIMING = {
  /**
   * Per-round duration (seconds), inserted into Slot 8.
   * standard: full ceremony (announce + video + serve + applause + close)
   * compressed: forced shorter when slow pace + 4 celebrations combination
   */
  perRoundDurationSec: {
    standard: 150, // 2.5 min: 10s announce + 30s video + 30s cake serve + 60s applause/photo + 20s close
    compressed: COMPRESSED_ROUND_SEC, // slow pace + 4 celebrations override
  },

  /**
   * Total Slot 8 duration in minutes, indexed by **scenario × celebration
   * count**. Manual reference (unified §5.8.4):
   *   A: base 7 → +1 round ≈ 9.5
   *   B: base 7 → +2 rounds ≈ 12
   *   C: base 7 → +3 rounds ≈ 14.5
   *   D: base 9 → +4 rounds ≈ 19 (worst case ~33 with photo overrun)
   * Cells unreachable per CAPACITY_MATRIX maxCelebrationRounds are `null`.
   */
  slot8DurationMinByScenarioAndCount: {
    A: { 0: 7, 1: 9.5, 2: null, 3: null, 4: null },
    B: { 0: 7, 1: 9.5, 2: 12, 3: null, 4: null },
    C: { 0: 7, 1: 9.5, 2: 12, 3: 14.5, 4: null },
    D: { 0: 9, 1: 11.5, 2: 14, 3: 16.5, 4: 19 },
  } as Record<CoverScenario, Record<CelebrationCount, number | null>>,

  /**
   * Realistic worst-case minutes (D scenario) with photo overrun absorbed.
   * Manual: unified §5.8.4 wrap "~19:08-19:10" → ~31–33 min from 18:37.
   * Used for "never run later than ~19:12" budget guardrail.
   */
  slot8DurationWorstCaseMin: {
    D: { 4: 33 }, // 18:37 + 33 = 19:10 absolute hard ceiling
  } as Record<CoverScenario, Partial<Record<CelebrationCount, number>>>,

  /**
   * Cake release sequence within Slot 8 (relative to Slot 8 trigger T+0=18:37).
   * Format: "MM:SS" — when KITCHEN releases each cake plate to RUNNER.
   * RUNNER lights candle at pickup (NOT Kitchen).
   *
   * Source: unified §5.8.4 announce table —
   *   R1 announce ~18:53 → T+16:00
   *   R2 announce ~18:55:30 → T+18:30
   *   R3 announce ~18:58:00 → T+21:00
   *   R4 announce ~19:00:30 → T+23:30
   * Cake plate is released ~at announce so candle is lit and on-table at
   * the firework beat (16 s into the 30 s 8b video).
   */
  cakeReleaseSequence: {
    1: [{ round: 1, releaseAt: "16:00" }],
    2: [
      { round: 1, releaseAt: "16:00" },
      { round: 2, releaseAt: "18:30" },
    ],
    3: [
      { round: 1, releaseAt: "16:00" },
      { round: 2, releaseAt: "18:30" },
      { round: 3, releaseAt: "21:00" },
    ],
    4: [
      { round: 1, releaseAt: "16:00" },
      { round: 2, releaseAt: "18:30" },
      { round: 3, releaseAt: "21:00" },
      { round: 4, releaseAt: "23:30" },
    ],
  } as Record<
    Exclude<CelebrationCount, 0>,
    Array<{ round: number; releaseAt: string }>
  >,

  /**
   * Per-round beat structure (T+0 = round start within Slot 8 ceremony).
   * Used by kitchen display to know what is happening every few seconds.
   */
  roundBeats: [
    { offsetSec: 0, beat: "announce", actor: "COUNTER", description: "Speak the celebration announce line, holding mic eye-contact." },
    { offsetSec: 10, beat: "video-start", actor: "COUNTER", description: "Press B to trigger 8b video (or generic loop for non-Birthday types)." },
    { offsetSec: 10, beat: "cake-serve", actor: "RUNNER", description: "Carry cake-on-candle to celebrant table; light candle at pickup." },
    { offsetSec: 26, beat: "firework-applause", actor: "COUNTER+ROOM", description: "At ~16s into video (firework beat), lead applause; the room joins." },
    { offsetSec: 40, beat: "video-end", actor: "—", description: "Video ends; cake remains lit on table." },
    { offsetSec: 40, beat: "photo-window", actor: "RUNNER", description: "Offer photo (30s window); booker phone preferred." },
    { offsetSec: 130, beat: "close-line", actor: "COUNTER", description: "Brief close: \"On behalf of DAIMASU, happy [type], [Name].\"" },
    { offsetSec: 150, beat: "round-complete", actor: "COUNTER", description: 'Push intercom: "Counter to all — Round R complete." Move to next round.' },
  ],

  /**
   * Booking-time policy: which reservation states arm Slot 8 visual.
   */
  bookingArmCondition:
    "Reservation `celebration` field is one of: birthday, anniversary, proposal, milestone, business, farewell, other (i.e. != 'none').",

  /**
   * Soft-cap policy on celebrations per seating (manager override possible).
   * Keeps the room manageable for the 2-staff floor + single bar table.
   */
  softCapPerSeating: 2, // recommended max
  hardCapPerSeating: 4, // absolute max (D scenario, all four pairs)

  /**
   * Slow-pace + max celebrations combination override.
   * If COUNTER declared "slow pace" at slot 1-2 AND celebration count == 4,
   * Slot 8 ceremony rounds compress from 150 s to 90 s each.
   */
  slowPaceCompressionTrigger: {
    paceProfile: "slow" as const,
    celebrationCountThreshold: 4 as CelebrationCount,
    compressionToSec: COMPRESSED_ROUND_SEC,
  },
} as const;

/* ------------------------------------------------------------------------- */
/* HELPERS                                                                   */
/* ------------------------------------------------------------------------- */

/**
 * Parse "HH:MM" → minutes-since-midnight. Returns NaN on bad input.
 */
function parseClockToMin(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Format minutes-since-midnight (rounded down) → "HH:MM".
 * Allows fractional minutes (rounded down to whole minute for clock display).
 */
function formatMinToClock(totalMin: number): string {
  const t = Math.floor(totalMin);
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Get total Slot 8 duration in minutes for a given scenario + celebration
 * count. Returns null if the (scenario, count) is impossible per the
 * capacity matrix (e.g. A + 4 celebrations).
 */
export function getSlot8Duration(
  scenario: CoverScenario,
  count: CelebrationCount,
): number | null {
  return CELEBRATION_TIMING.slot8DurationMinByScenarioAndCount[scenario][count];
}

/**
 * Programmatic computation of Slot 8 minutes from base + adders. Used as a
 * cross-check / fallback. Mirrors the lookup table for the valid cells.
 */
export function computeSlot8DurationMin(
  scenario: CoverScenario,
  count: CelebrationCount,
): number {
  return SLOT8_BASE_MIN_BY_SCENARIO[scenario] + count * STANDARD_ROUND_MIN;
}

/**
 * Worst-case (photo overrun) Slot 8 minutes for a given (scenario, count).
 * Falls back to the standard duration if no worst-case override is defined.
 */
export function getSlot8DurationWorstCase(
  scenario: CoverScenario,
  count: CelebrationCount,
): number | null {
  const worst =
    CELEBRATION_TIMING.slot8DurationWorstCaseMin[scenario]?.[count];
  if (worst != null) return worst;
  return getSlot8Duration(scenario, count);
}

/**
 * Get the actual Ending video start time, given scenario + celebration count.
 * Returns "HH:MM" string. Defaults to 1st seating.
 *
 * Computes from slot-8 trigger (18:37 / 21:07) + slot-8 duration. Returns
 * null if the (scenario, count) combination is impossible.
 */
export function getEndingTime(
  scenario: CoverScenario,
  count: CelebrationCount,
  seating: Seating = 1,
): string | null {
  const dur = getSlot8Duration(scenario, count);
  if (dur == null) return null;
  const slot8 = COURSES.find((c) => c.slot === 8);
  if (!slot8) return null;
  const triggerStr =
    seating === 1 ? slot8.timing.triggerTime1st : slot8.timing.triggerTime2nd;
  const trigger = parseClockToMin(triggerStr);
  if (Number.isNaN(trigger)) return null;
  return formatMinToClock(trigger + dur);
}

/**
 * Worst-case ending time (photo overrun absorbed). Used to validate the
 * "never run later than ~19:12" budget guardrail.
 */
export function getEndingTimeWorstCase(
  scenario: CoverScenario,
  count: CelebrationCount,
  seating: Seating = 1,
): string | null {
  const dur = getSlot8DurationWorstCase(scenario, count);
  if (dur == null) return null;
  const slot8 = COURSES.find((c) => c.slot === 8);
  if (!slot8) return null;
  const triggerStr =
    seating === 1 ? slot8.timing.triggerTime1st : slot8.timing.triggerTime2nd;
  const trigger = parseClockToMin(triggerStr);
  if (Number.isNaN(trigger)) return null;
  return formatMinToClock(trigger + dur);
}

/**
 * Get the available turnaround minutes between 1st seating ending and
 * 2nd seating doors (20:00 target) for a given (scenario, count).
 * Returns null if combination is impossible.
 */
export function getTurnaroundMinutes(
  scenario: CoverScenario,
  count: CelebrationCount,
): number | null {
  const ending = getEndingTime(scenario, count, 1);
  if (ending == null) return null;
  const endMin = parseClockToMin(ending);
  const doorsSecond = parseClockToMin(SEATING_SCHEDULE.doorsSecond);
  // Add ~1 min for ending video to actually finish + payment buffer.
  const endingFinishMin = endMin + 1;
  return doorsSecond - endingFinishMin;
}

/**
 * Get the cake-release schedule (within Slot 8) for given celebration count.
 * Returns empty array for count = 0.
 */
export function getCakeReleaseSchedule(
  count: CelebrationCount,
): Array<{ round: number; releaseAt: string }> {
  if (count === 0) return [];
  return CELEBRATION_TIMING.cakeReleaseSequence[count];
}

/**
 * Determine effective per-round duration (seconds), accounting for slow
 * pace + 4-celebration compression rule.
 */
export function getEffectiveRoundDuration(
  count: CelebrationCount,
  paceProfile: "fast" | "average" | "slow",
): number {
  const trigger = CELEBRATION_TIMING.slowPaceCompressionTrigger;
  if (
    paceProfile === trigger.paceProfile &&
    count >= trigger.celebrationCountThreshold
  ) {
    return trigger.compressionToSec;
  }
  return CELEBRATION_TIMING.perRoundDurationSec.standard;
}

/**
 * Check whether a reservation should arm the celebration video slot (8b).
 * Returns true if the celebration field is anything other than 'none'.
 */
export function shouldArmCelebrationSlot(
  celebrationId: string | null | undefined,
): boolean {
  if (!celebrationId) return false;
  return celebrationId !== "none";
}

/**
 * Get the slot active at a given clock time (HH:MM).
 * Used for kitchen-display "what's next" logic.
 *
 * Numeric comparison (minutes-since-midnight) — string lex-compare would
 * fail across midnight or with single-digit hours, so we convert.
 */
export function getSlotAt(
  timeHHMM: string,
  seating: Seating = 1,
): CourseEntry | null {
  const target = parseClockToMin(timeHHMM);
  if (Number.isNaN(target)) return null;
  const key = seating === 1 ? "triggerTime1st" : "triggerTime2nd";
  let latest: CourseEntry | null = null;
  for (const c of COURSES) {
    const t = c.timing[key];
    if (t === "—") continue;
    const tMin = parseClockToMin(t);
    if (Number.isNaN(tMin)) continue;
    if (tMin <= target) latest = c;
  }
  return latest;
}

/**
 * Get the next slot to trigger, given current time.
 */
export function getNextSlot(
  timeHHMM: string,
  seating: Seating = 1,
): CourseEntry | null {
  const target = parseClockToMin(timeHHMM);
  if (Number.isNaN(target)) return null;
  const key = seating === 1 ? "triggerTime1st" : "triggerTime2nd";
  for (const c of COURSES) {
    const t = c.timing[key];
    if (t === "—") continue;
    const tMin = parseClockToMin(t);
    if (Number.isNaN(tMin)) continue;
    if (tMin > target) return c;
  }
  return null;
}

/**
 * Get plating-ready deadline for a course at given cover scenario.
 * Returns clock-time string and the start-plating clock (= ready − duration).
 */
export function getPlatingWindow(
  slot: number,
  scenario: CoverScenario,
  seating: Seating = 1,
): { startPlating: string; readyAtPass: string; durationSec: number } | null {
  const c = COURSES.find((x) => x.slot === slot);
  if (!c || !c.timing) return null;
  const ready =
    seating === 1 ? c.timing.platingReadyAt1st : c.timing.platingReadyAt2nd;
  if (ready === "—") return null;
  const dur = c.platingTime[scenario];
  // Subtract dur seconds from ready time
  const [hh, mm] = ready.split(":").map(Number);
  const totalSec = hh * 3600 + mm * 60 - dur;
  const sh = Math.floor(totalSec / 3600);
  const sm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  const startPlating = `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}${
    ss > 0 ? `:${String(ss).padStart(2, "0")}` : ""
  }`;
  return { startPlating, readyAtPass: ready, durationSec: dur };
}
