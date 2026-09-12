export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: "기본" | "신청" | "혜택" | "지역" | "차종" | "전망";
  published: string; // YYYY-MM-DD
  updated: string;
  keywords: string[];
  /** 본문 HTML (h2/h3/p/ul/ol/table 사용) */
  body: string;
  faq?: { q: string; a: string }[];
}

import { GUIDES_BASIC } from "./basic";
import { GUIDES_APPLY } from "./apply";
import { GUIDES_BENEFIT } from "./benefit";
import { GUIDES_REGION_CAR } from "./region-car";
import { GUIDES_REGION_DEEP } from "./region-deep";
import { GUIDES_PRACTICAL } from "./practical";

export const GUIDES: Guide[] = [...GUIDES_BASIC, ...GUIDES_APPLY, ...GUIDES_BENEFIT, ...GUIDES_REGION_CAR, ...GUIDES_REGION_DEEP, ...GUIDES_PRACTICAL].sort(
  (a, b) => (a.published < b.published ? 1 : -1),
);

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
