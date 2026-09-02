import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "憎恶社｜作品与旧档案",
  description: "一个以搜索为核心的浏览器文字解谜游戏。",
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
