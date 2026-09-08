import { GUIDES } from "@/content/guides";
import { SITE } from "@/lib/site";

/**
 * /feed.xml — 가이드 16편의 RSS 2.0 피드. 네이버 서치어드바이저 "RSS 제출", 다음 검색등록(블로그 항목)에 쓴다.
 * 빌드 시 정적으로 생성되며(가이드는 코드에 들어 있음) 배포마다 갱신된다.
 */
export const dynamic = "force-static";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** "YYYY-MM-DD"(KST 자정) → RFC-822 (RSS pubDate 형식) */
function rfc822(date: string): string {
  return new Date(`${date}T00:00:00+09:00`).toUTCString();
}

export function GET() {
  const base = SITE.url;
  const lastBuild = GUIDES.reduce((m, g) => (g.updated > m ? g.updated : m), GUIDES[0]?.updated ?? "2026-01-01");
  const items = GUIDES.map((g) => {
    const link = `${base}/guide/${g.slug}`;
    return [
      "    <item>",
      `      <title>${escapeXml(g.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      `      <pubDate>${rfc822(g.published)}</pubDate>`,
      `      <category>${escapeXml(g.category)}</category>`,
      `      <description>${escapeXml(g.description)}</description>`,
      "    </item>",
    ].join("\n");
  }).join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${SITE.name} 가이드`)}</title>`,
    `    <link>${base}</link>`,
    `    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />`,
    `    <description>${escapeXml(SITE.description)}</description>`,
    "    <language>ko</language>",
    `    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>`,
    `    <generator>${escapeXml(SITE.name)}</generator>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
