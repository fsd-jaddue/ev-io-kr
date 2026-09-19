export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: "기본" | "신청" | "혜택" | "지역" | "차종" | "전망";
  published: string;
  updated: string;
  keywords: string[];
  body: string;
  sources?: { title: string; url: string }[];
  faq?: { q: string; a: string }[];
}
import { REVIEWED_GUIDES } from "./reviewed";
export const GUIDES = REVIEWED_GUIDES.sort((a,b) => b.published.localeCompare(a.published));
export const GUIDE_REDIRECTS: Record<string,string> = {
  ...Object.fromEntries(["gyeonggi","gangwon","chungbuk","chungnam","jeonbuk","jeonnam","gyeongbuk","gyeongnam"].map(s => [`${s}-ev-subsidy-by-city-2026`,`/region/${s}`])),
  "ev-subsidy-common-mistakes":"/guide/how-to-apply-ev-subsidy-2026#mistakes",
  "ev-subsidy-faq-30":"/guide/how-to-apply-ev-subsidy-2026",
  "priority-vs-general-vs-corporate":"/guide/how-to-apply-ev-subsidy-2026#priority",
  "seoul-vs-gyeonggi-vs-rural":"/guide/national-subsidy-calculation-2026",
  "why-tesla-subsidy-is-low":"/car/model3-premium-long-range",
  "top10-ev-subsidy-ranking-2026":"/car",
};
export function getGuide(slug:string) { return GUIDES.find(g => g.slug === slug); }
