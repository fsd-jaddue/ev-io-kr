import type { Metadata } from "next";
import { SITE } from "./site";

/** 가이드 RSS. Next 메타데이터 병합에서 alternates 는 세그먼트 단위로 통째 교체되므로 pageMetadata 와 루트 레이아웃 양쪽에 넣는다 */
export const FEED_ALTERNATES = {
  "application/rss+xml": [{ url: `${SITE.url}/feed.xml`, title: `${SITE.name} 가이드 RSS` }],
};

interface PageMeta {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  noindex?: boolean;
}

/** 페이지별 메타데이터 생성 (title 은 "페이지 제목 | 사이트명" 형식) */
export function pageMetadata(m: PageMeta): Metadata {
  const url = `${SITE.url}${m.path}`;
  const fullTitle = m.path === "/" ? `${SITE.name} | ${SITE.tagline}` : `${m.title} | ${SITE.name}`;
  return {
    title: { absolute: fullTitle },
    description: m.description,
    keywords: m.keywords,
    alternates: { canonical: url, types: FEED_ALTERNATES },
    robots: m.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: fullTitle,
      description: m.description,
      url,
      siteName: SITE.name,
      locale: "ko_KR",
      type: m.type ?? "website",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE.name }],
      ...(m.type === "article"
        ? { publishedTime: m.publishedTime, modifiedTime: m.modifiedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: m.description,
      images: ["/og.png"],
    },
  };
}

export type JsonLd = Record<string, unknown>;

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "ko-KR",
    publisher: { "@type": "Organization", name: SITE.operator, url: SITE.url, email: SITE.email },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.path}`,
    })),
  };
}

export function articleJsonLd(a: {
  title: string;
  description: string;
  path: string;
  published: string;
  modified: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    url: `${SITE.url}${a.path}`,
    datePublished: a.published,
    dateModified: a.modified,
    inLanguage: "ko-KR",
    author: { "@type": "Organization", name: SITE.operator, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.operator, url: SITE.url },
    mainEntityOfPage: `${SITE.url}${a.path}`,
  };
}

export function faqJsonLd(items: { q: string; a: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
