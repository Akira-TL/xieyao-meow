import type { Metadata } from "next";
import "./globals.css";
import "./target-parity.css";

export const metadata: Metadata = {
  title: "谢邀喵",
  description: "用你的知乎人格，孵化一只会替你表达的赛博宠物。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
