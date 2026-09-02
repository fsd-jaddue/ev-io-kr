import type { LocalPriceRow } from "./types";
import { SIDO_LIST } from "@/data/regions";
import { NATIONAL_MAX } from "@/data/cars";

export interface SidoSummary {
  slug: string;
  name: string;
  short: string;
  min: number | null;
  max: number | null;
  count: number; // 시·군·구 수
  known: number; // 금액 확인된 시·군·구 수
  uniform: boolean; // 단일 공고 여부
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
      uniform: amounts.length > 0 && min === max && s.sigungu.length > 1,
    };
  });
}

/** 국비 + 지방비 (+전환지원금) 합산. 지방비는 국비 비례 지급이 원칙이므로 국비가 낮은 차종은 지방비도 비례 감소한다. */
export function estimateTotal(opts: {
  national: number; // 차종 국비(만원)
  localMax: number; // 지역 지방비 최대(만원)
  conversion?: boolean; // 전환지원금
}): { national: number; local: number; conversion: number; total: number } {
  const ratio = Math.min(1, opts.national / NATIONAL_MAX.large);
  const local = Math.round(opts.localMax * ratio);
  const conversion = opts.conversion ? NATIONAL_MAX.conversion : 0;
  return { national: opts.national, local, conversion, total: opts.national + local + conversion };
}

export function won(n: number | null | undefined, suffix = "만원"): string {
  if (n === null || n === undefined) return "공고 확인";
  return `${n.toLocaleString("ko-KR")}${suffix}`;
}
