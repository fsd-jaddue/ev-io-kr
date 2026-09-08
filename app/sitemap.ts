import type { MetadataRoute } from "next";
import { LEGAL_UPDATED_AT, SITE } from "@/lib/site";
import { getSnapshotDates } from "@/lib/ev/getData";
import { SIDO_LIST, sigunguPath } from "@/data/regions";
import { CARS } from "@/data/cars";
import { GUIDES } from "@/content/guides";

/**
 * lastModified 는 실제 자료 기준 시각을 쓴다(빌드 시각 아님). 잔여 현황을 서버 렌더링하는 홈·지역 페이지는
 * 스냅샷 최신 시각, 차종 페이지는 지방비 수집일, 가이드는 updated, 정책 페이지는 LEGAL_UPDATED_AT.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const { latest, localPriceUpdatedAt } = getSnapshotDates();
  const legal = new Date(`${LEGAL_UPDATED_AT}T00:00:00+09:00`);
  const guideLatest = GUIDES.reduce((m, g) => (g.updated > m ? g.updated : m), GUIDES[0]?.updated ?? LEGAL_UPDATED_AT);
  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${base}/region`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/car`, lastModified: localPriceUpdatedAt, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/calculator`, lastModified: localPriceUpdatedAt, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/guide`, lastModified: new Date(`${guideLatest}T00:00:00+09:00`), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, lastModified: legal, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified: legal, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: legal, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/disclaimer`, lastModified: legal, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/contact`, lastModified: legal, changeFrequency: "yearly", priority: 0.3 },
  ];
  const sidos: MetadataRoute.Sitemap = SIDO_LIST.map((s) => ({
    url: `${base}/region/${s.slug}`,
    lastModified: latest,
    changeFrequency: "daily",
    priority: 0.8,
  }));
  const sigungus: MetadataRoute.Sitemap = SIDO_LIST.flatMap((s) =>
    s.sigungu.map((g) => ({
      url: `${base}${sigunguPath(s.slug, g)}`,
      lastModified: latest,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  );
  const cars: MetadataRoute.Sitemap = CARS.map((c) => ({
    url: `${base}/car/${c.slug}`,
    lastModified: localPriceUpdatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const guides: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${base}/guide/${g.slug}`,
    lastModified: new Date(`${g.updated}T00:00:00+09:00`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...statics, ...sidos, ...sigungus, ...cars, ...guides];
}
