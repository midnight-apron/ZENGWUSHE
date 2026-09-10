import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "憎恶社｜杜彻旧电脑",
  description: "在浏览器、回收站、录音文件与上锁文件夹之间核对材料的网页解谜游戏。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
