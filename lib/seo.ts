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

/** 페이지별 메타데이터 생성 (title 은 "페이지 제목 | 사이트명" 형식, 홈은 title 을 그대로 사용) */
export function pageMetadata(m: PageMeta): Metadata {
  const url = `${SITE.url}${m.path}`;
  const fullTitle = m.path === "/" ? m.title : `${m.title} | ${SITE.name}`;
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

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;
const LOGO = { "@type": "ImageObject", url: `${SITE.url}/logo.svg`, width: 512, height: 512 };

/** 운영 주체. 루트 레이아웃에서 WebSite 와 함께 출력하고, 다른 스키마는 @id 로 참조한다 */
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.operator,
    url: SITE.url,
    email: SITE.email,
    logo: LOGO,
    description: SITE.description,
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "ko-KR",
    publisher: { "@id": ORG_ID },
  };
}

/** 목록 페이지(/region, /car, /guide)의 항목 목록 */
export function itemListJsonLd(name: string, items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: `${SITE.url}${it.path}` })),
  };
}

/** 데이터 페이지(지역·차종)의 WebPage — dateModified 로 신선도(스냅샷 시각)를 알린다 */
export function webPageJsonLd(p: { name: string; description: string; path: string; dateModified: string; datePublished?: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE.url}${p.path}`,
    url: `${SITE.url}${p.path}`,
    name: p.name,
    description: p.description,
    inLanguage: "ko-KR",
    isPartOf: { "@id": SITE_ID },
    publisher: { "@id": ORG_ID },
    dateModified: p.dateModified,
    ...(p.datePublished ? { datePublished: p.datePublished } : {}),
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
    image: [`${SITE.url}/og.png`],
    author: { "@type": "Organization", name: SITE.operator, url: SITE.url },
    publisher: { "@type": "Organization", "@id": ORG_ID, name: SITE.operator, url: SITE.url, logo: LOGO },
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
