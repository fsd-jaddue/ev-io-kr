import type { LocalPriceRow } from "./types";
import { SIDO_LIST } from "@/data/regions";

export interface SidoSummary {
  slug: string;
  name: string;
  short: string;
  min: number | null;
  max: number | null;
  count: number; // 시·군·구 수
  known: number; // 금액 확인된 시·군·구 수
  /** 시·도 전역 단일 공고(특별·광역시·세종·제주). 금액만 같은 시·군별 공고는 equal */
  uniform: boolean;
  /** 확인된 시·군·구가 2곳 이상이고 금액이 모두 같음(단일 공고 포함) */
  equal: boolean;
}

export function summarizeBySido(rows: LocalPriceRow[]): SidoSummary[] {
  return SIDO_LIST.map((s) => {
    const mine = rows.filter((r) => r.sido === s.slug);
    const amounts = mine.map((r) => r.amount).filter((a): a is number => a !== null);
    const min = amounts.length ? Math.min(...amounts) : null;
    const max = amounts.length ? Math.max(...amounts) : null;
    return {
      slug: s.slug,
      name: s.name,
      short: s.short,
      min,
      max,
      count: s.sigungu.length,
      known: amounts.length,
      uniform: amounts.length > 0 && mine.every((r) => r.amount === null || r.single),
      equal: amounts.length > 1 && min === max,
    };
  });
}

export function won(n: number | null | undefined, suffix = "만원"): string {
  if (n === null || n === undefined) return "공고 확인";
  return `${n.toLocaleString("ko-KR")}${suffix}`;
}
