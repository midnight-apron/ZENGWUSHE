import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "憎恶社 V2｜杜彻旧电脑",
  description: "在浏览器、回收站、录音文件与上锁文件夹之间核对材料的网页解谜游戏。",
};

export default function V2Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

