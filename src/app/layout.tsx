import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Noto_Sans_JP, Noto_Serif_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";

// Cinzel: primary Latin display (logo, numerals, eyebrow). Per TOP design spec.
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-cinzel",
  display: "swap",
});

// Noto Serif JP: JA display (H1, tagline, price, button label). Per TOP design spec.
const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-serif",
  display: "swap",
  preload: false,
});

// Noto Sans JP: JA body. Swap + lazy to avoid CJK preload bloat.
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-noto-sans",
  display: "swap",
  preload: false,
});

// Legacy fonts — kept for components outside Hero that still reference
// --font-cormorant / --font-shippori (About, Experience, Menu, etc.).
// Once the full design spec cascades to all sections, these can be retired.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "500"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});
const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-shippori",
  display: "optional",
  preload: false,
});

const siteUrl = "https://daimasu.com.ph";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "DAIMASU — マスターの食卓 | Master Owly's 8-Course Kaiseki Theatre",
  description:
    "8メートルの檜カウンターに八つの情景が浮かび上がる、マスター・アウリの懐石劇場。桜の庭から甘味の宵まで、九十分・八皿・八席の没入型ダイニング。マニラ・フィリピン。 | Master Owly's eight-course kaiseki theatre. Ninety minutes, eight scenes, eight counter seats. Projection mapping dining in Manila, Philippines.",
  openGraph: {
    title: "DAIMASU — Master Owly's Table",
    description:
      "Ninety minutes. Eight kaiseki courses. One monocled owl with a golden feather pen. An immersive projection-mapped dining theatre unfolding across an eight-meter hinoki counter in Manila.",
    type: "website",
    url: siteUrl,
    siteName: "DAIMASU",
    locale: "ja_JP",
    alternateLocale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DAIMASU — Master Owly's 8-course kaiseki theatre",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DAIMASU — マスターの食卓",
    description:
      "Ninety minutes. Eight kaiseki courses. Master Owly's projection-mapped dining theatre — Manila, Philippines.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "DAIMASU",
    statusBarStyle: "black-translucent",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "DAIMASU",
  alternateName: "マスターの食卓",
  description:
    "An immersive projection-mapping kaiseki theatre. Master Owly guides guests through eight courses across an eight-meter hinoki counter — cherry gardens, temple kitchens, indigo depths, firelight, and more — in ninety minutes.",
  url: siteUrl,
  servesCuisine: "Japanese Kaiseki",
  priceRange: "$$$$",
  address: {
    "@type": "PostalAddress",
    addressCountry: "PH",
    addressLocality: "Manila",
  },
  event: {
    "@type": "FoodEvent",
    name: "Master Owly's Table — 8-Course Projection Mapping Kaiseki",
    description:
      "A ninety-minute, eight-course projection mapping kaiseki experience. Each course opens with a Master Owly vignette, then settles into ambient imagery while the dish is served across an eight-meter hinoki counter.",
    duration: "PT1H30M",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${cinzel.variable} ${notoSerifJP.variable} ${notoSansJP.variable} ${cormorant.variable} ${shipporiMincho.variable}`}>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
