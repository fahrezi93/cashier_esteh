import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teh Barudak Indonesia - POS System",
  description: "Modern Point of Sale system for Teh Barudak Indonesia franchise",
  icons: {
    icon: [
      { url: '/esteh.png' },
      { url: '/esteh.png', sizes: '32x32', type: 'image/png' },
      { url: '/esteh.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/esteh.png',
    apple: '/esteh.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/esteh.png" type="image/png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
