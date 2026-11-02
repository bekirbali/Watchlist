import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#090a0f",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://watchlist.130.61.20.107.sslip.io"),
  title: "Watchlist - Movies & TV Shows Tracker",
  description: "Track movies, TV series episodes, ratings, and backlogs with TMDB integration.",
  icons: {
    icon: [
      { url: "/app-icon.svg?v=10", type: "image/svg+xml" },
      { url: "/app-icon.png?v=10", type: "image/png" },
    ],
    shortcut: "/app-icon.png?v=10",
    apple: "/app-icon.png?v=10",
  },
  openGraph: {
    title: "Watchlist - Movies & TV Shows Tracker",
    description: "Track movies, TV series episodes, ratings, and backlogs with TMDB integration.",
    url: "https://watchlist.130.61.20.107.sslip.io",
    siteName: "Watchlist",
    images: [
      {
        url: "/app-icon.png?v=10",
        width: 512,
        height: 512,
        alt: "Watchlist Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Watchlist - Movies & TV Shows Tracker",
    description: "Track movies, TV series episodes, ratings, and backlogs with TMDB integration.",
    images: ["/app-icon.png?v=10"],
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
