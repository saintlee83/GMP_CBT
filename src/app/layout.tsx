import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GMP CBT - 의료기기 RA 전문가 2급",
  description:
    "2021 의료기기 RA 전문가 2급 GMP 핵심문제집 CBT - 품질관리(GMP) 기출 문제를 컴퓨터로 풀어보세요",
  openGraph: {
    title: "GMP CBT - 의료기기 RA 전문가 2급",
    description: "2021 의료기기 RA 전문가 2급 GMP 핵심문제집 온라인 CBT",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#336cf7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
