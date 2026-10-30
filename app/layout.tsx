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
  title: "Watchlist - Movies & TV Shows Tracker",
  description: "Track movies, TV series episodes, ratings, and backlogs with TMDB integration.",
  icons: {
    icon: [
      { url: "/app-icon.svg?v=8", type: "image/svg+xml" },
      { url: "/app-icon.png?v=8", type: "image/png" },
    ],
    shortcut: "/app-icon.png?v=8",
    apple: "/app-icon.png?v=8",
  },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
