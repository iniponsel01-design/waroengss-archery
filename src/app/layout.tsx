import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { config } from "@/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const APP_NAME = "Waroeng SS Archery Gallery";
const APP_DESCRIPTION = "Dokumentasi foto event panahan Waroeng SS Archery — Lihat dan unduh foto tanpa login";

export const metadata: Metadata = {
  // App identity
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | Waroeng SS Archery`,
  },
  description: APP_DESCRIPTION,
  keywords: ["panahan", "archery", "waroeng ss", "dokumentasi foto", "gallery event"],

  // Canonical
  metadataBase: new URL(config.app.url),

  // Open Graph
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    locale: "id_ID",
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },

  // Icons
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico",          sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/icon.svg", color: "#ec4899" },
    ],
  },

  // PWA manifest
  manifest: "/manifest.json",

  // App capable
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WSS Archery",
    startupImage: ["/icons/icon-512.png"],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

// Viewport terpisah (Next.js 14+)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ec4899" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Extra meta untuk PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="WSS Archery" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-sans">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
// build trigger 1789669297
