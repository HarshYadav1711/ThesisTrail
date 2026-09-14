import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
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
  title: "ThesisTrail",
  description:
    "Turn a vague market question into a testable, auditable research thesis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-tt-bg font-sans text-tt-text antialiased">
        <WorkspaceShell>{children}</WorkspaceShell>
      </body>
    </html>
  );
}
