import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { config } from "@/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: config.app.name,
    template: `%s | ${config.app.brandName}`,
  },
  description: "Event Documentation Gallery Platform — Waroeng SS Archery",
  metadataBase: new URL(config.app.url),
  openGraph: {
    type: "website",
    siteName: config.app.brandName,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
