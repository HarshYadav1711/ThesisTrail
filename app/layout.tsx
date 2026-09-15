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
  title: "ThesisTrail — auditable NIFTY research workflow",
  description:
    "Turn a vague market question into a testable, auditable NIFTY research experiment. Deterministic historical evidence with explicit assumptions; optional AI only for question clarification phrasing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-tt-bg font-sans text-tt-text antialiased">
        {children}
      </body>
    </html>
  );
}
