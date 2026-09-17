import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zhou · 鲷哥天梯看板 | oldboys.games",
  description:
    "Zhou（鲷哥）Dota 2 天梯对局统计看板 — 英雄表现、净胜走势、胜率。",
  metadataBase: new URL("https://oldboys.games"),
  openGraph: {
    title: "Zhou · 鲷哥天梯看板",
    description: "oldboys.games — Zhou 天梯对局看板",
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
        className={`${dmSans.variable} ${geistMono.variable} bg-horizon antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
