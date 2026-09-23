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
    <html lang="en" className={`${manrope.variable} ${bricolage.variable}`}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
