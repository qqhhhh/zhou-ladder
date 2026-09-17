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
  title: "Zhou · 鲷哥天梯看板 | oldboys.games",
  description:
    "Zhou（鲷哥）Dota 2 天梯对局统计看板 — 英雄表现、净胜走势、胜率。数据来自 OpenDota，不展示伪 MMR。",
  metadataBase: new URL("https://oldboys.games"),
  openGraph: {
    title: "Zhou · 鲷哥天梯看板",
    description: "oldboys.games — dense ladder dashboard for Zhou",
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-grid antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
