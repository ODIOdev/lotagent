import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import { FormatPreview } from "@/components/dev/format-preview";
import "./globals.css";
import "./format/desktop.css";
import "./format/ipad.css";
import "./format/iphone.css";
import "./format/shell.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LOTAGENT",
  description: "Auction acquisition planning.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full min-h-full min-w-0 max-w-full bg-background text-foreground">
        <FormatPreview>
          <div className="la-app">
            {children}
            <AppNav />
          </div>
        </FormatPreview>
      </body>
    </html>
  );
}
