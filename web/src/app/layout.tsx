import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Periodic Table for Gemini — Open-Source 118-Element Model Selector",
  description:
    "An open-source Chrome extension that upgrades Google Gemini's model picker into an interactive 118-element Periodic Table with real-time model and Thinking Level switching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-zinc-950 selection:bg-zinc-950 selection:text-white">
        {children}
      </body>
    </html>
  );
}
