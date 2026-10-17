import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans, Space_Mono } from "next/font/google";
import "@skeleton-crew/blocks/tokens.css";
import "../tokens.css";
import "@skeleton-crew/blocks/blocks.css";
import { RevealScript } from "@skeleton-crew/blocks";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"], variable: "--font-fraunces", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Centrifungal - Premium Mushroom Grow Logs", template: "%s - Centrifungal" },
  description: "Grow gourmet mushrooms at home with Centrifungal's hand-inoculated hardwood grow logs.",
  icons: { icon: "/favicon.png" },
};
export const viewport: Viewport = { themeColor: "#1A3A2A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable} ${spaceMono.variable}`}>
      <head><RevealScript /></head>
      <body>{children}</body>
    </html>
  );
}
