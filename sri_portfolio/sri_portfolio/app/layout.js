import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
const manrope = localFont({
  src: "./fonts/Manrope.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});
const bricolage = localFont({
  src: "./fonts/BricolageGrotesque.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});
// Room voices: declared once, fetched by the browser only where a room uses them.
const newsreader = localFont({
  src: [
    { path: "./fonts/Newsreader.woff2", style: "normal" },
    { path: "./fonts/Newsreader-Italic.woff2", style: "italic" },
  ],
  variable: "--font-newsreader",
  weight: "200 800",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});
const jetbrains = localFont({
  src: "./fonts/JetBrainsMono.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const fraunces = localFont({
  src: [
    { path: "./fonts/Fraunces.woff2", style: "normal" },
    { path: "./fonts/Fraunces-Italic.woff2", style: "italic" },
  ],
  variable: "--font-fraunces",
  weight: "300 700",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});
const shippori = localFont({
  src: [
    { path: "./fonts/ShipporiMincho-Regular.woff2", weight: "400" },
    { path: "./fonts/ShipporiMincho-SemiBold.woff2", weight: "600" },
  ],
  variable: "--font-shippori",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});
const caveat = localFont({
  src: "./fonts/Caveat.woff2",
  variable: "--font-caveat",
  weight: "400 700",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const courier = localFont({
  src: [
    { path: "./fonts/CourierPrime-Regular.woff2", weight: "400" },
    { path: "./fonts/CourierPrime-Bold.woff2", weight: "700" },
  ],
  variable: "--font-courier",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const instrument = localFont({
  src: [
    { path: "./fonts/InstrumentSerif-Regular.woff2", style: "normal" },
    { path: "./fonts/InstrumentSerif-Italic.woff2", style: "italic" },
  ],
  variable: "--font-instrument",
  weight: "400",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});
const fontVariables = [
  manrope,
  bricolage,
  newsreader,
  jetbrains,
  fraunces,
  shippori,
  caveat,
  courier,
  instrument,
]
  .map((f) => f.variable)
  .join(" ");
export const metadata = {
  metadataBase: new URL("https://www.sriujjwalreddy.com"),
  title: "Sri Ujjwal Reddy — A little world of my own.",
  description:
    "Founding Engineer at Offseason in San Francisco. A curious builder who cares about how things work, how they feel, and life beyond the screen.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sri Ujjwal Reddy — A little world of my own.",
    description: "Building, exploring, and finding joy in the little things.",
    url: "/",
    siteName: "Sri Ujjwal Reddy",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sri Ujjwal Reddy — A little world of my own.",
  },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d1422",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
