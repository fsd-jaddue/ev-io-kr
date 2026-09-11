import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import { FEED_ALTERNATES, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["전기차 보조금", "전기차 보조금 조회", "지자체별 전기차 보조금", "전기차 국비", "전기차 지방비", "2026 전기차 보조금"],
  authors: [{ name: SITE.operator, url: SITE.url }],
  creator: SITE.operator,
  publisher: SITE.operator,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { types: FEED_ALTERNATES },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE.name,
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  verification: {
    google: SITE.googleVerification || undefined,
    // 네이버·Bing 은 Next 가 전용 키를 제공하지 않으므로 other 로 <meta name="…"> 출력
    other: {
      ...(SITE.naverVerification ? { "naver-site-verification": SITE.naverVerification } : {}),
      ...(SITE.bingVerification ? { "msvalidate.01": SITE.bingVerification } : {}),
    },
  },
  other: SITE.adsenseClient ? { "google-adsense-account": SITE.adsenseClient } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        {/* 애드센스 사이트 연결 스니펫. 구글 안내대로 <head>에 그대로 넣는다(메타태그는 metadata.other). */}
        {SITE.adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-screen bg-white text-slate-800 antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
        >
          본문으로 건너뛰기
        </a>
        <Header />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8">
          {children}
        </main>
        <Footer />
        {/* 방문 통계. Vercel Web Analytics 는 쿠키를 쓰지 않으며 Vercel 대시보드 → Analytics 탭에서 Enable 해야 집계된다.
            GA4 는 NEXT_PUBLIC_GA_MEASUREMENT_ID 가 있을 때만 스크립트를 넣는다(애드센스 승인 뒤 연결 예정). */}
        <Analytics />
        {SITE.gaMeasurementId && <GoogleAnalytics gaId={SITE.gaMeasurementId} />}
      </body>
    </html>
  );
}
