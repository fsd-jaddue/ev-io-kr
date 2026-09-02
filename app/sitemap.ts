import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { SIDO_LIST, sigunguSlug } from "@/data/regions";
import { CARS } from "@/data/cars";
import { GUIDES } from "@/content/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = SITE.url;
  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/region`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/car`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/calculator`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/guide`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
  const sidos: MetadataRoute.Sitemap = SIDO_LIST.map((s) => ({
    url: `${base}/region/${s.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));
  const sigungus: MetadataRoute.Sitemap = SIDO_LIST.flatMap((s) =>
    s.sigungu.map((g) => ({
      url: `${base}/region/${s.slug}/${sigunguSlug(g)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  );
  const cars: MetadataRoute.Sitemap = CARS.map((c) => ({
    url: `${base}/car/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const guides: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${base}/guide/${g.slug}`,
    lastModified: new Date(g.updated),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...statics, ...sidos, ...sigungus, ...cars, ...guides];
}
