import type { LocalPriceRow } from "./types";
import { SIDO_LIST } from "@/data/regions";
import { CARS, CARS_SNAPSHOT, NATIONAL_MAX } from "@/data/cars";
import { passengerConversion } from "./subsidy";

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

/**
 * 지역 '지방비 최대'가 대응하는 국비. 누리집 지자체별 표의 최고 지방비는 국비가 가장 높은 모델(2026-09 기준 PV5 WAV 648만원) 행에서 나오므로
 * 차종별 지방비는 최고액 × (차종 국비 ÷ 이 값)으로 추정한다. 서울 수집 125행 전부가 이 식과 ±1만원 안에서 일치한다(tests/subsidy.test.ts).
 * 국비 상한 580으로 나누면 서울 기준 20만원가량 과대 추정되므로 쓰지 않는다(2026-09-20 검토 지적).
 */
export const LOCAL_REF_NATIONAL = Math.max(NATIONAL_MAX.large, ...CARS_SNAPSHOT.rows.map((r) => r.national ?? 0));

/** 차종별 지방비 추정(만원). 서울은 수집값과 일치, 다른 지역은 비례 지급 원칙에 따른 추정치 */
export function estimateLocal(localMax: number, national: number): number {
  const n = Math.min(Math.max(national, 0), LOCAL_REF_NATIONAL);
  return Math.round((localMax * n) / LOCAL_REF_NATIONAL);
}

/** 국비 + 지방비 추정 (+전환지원 국비). 전환지원 국비는 차종 국비에 따라 차등(lib/ev/subsidy.ts) */
export function estimateTotal(opts: {
  national: number; // 차종 국비(만원)
  localMax: number; // 지역 지방비 최대(만원)
  conversion?: boolean; // 전환지원 국비 포함 여부
}): { national: number; local: number; conversion: number; total: number } {
  const local = estimateLocal(opts.localMax, opts.national);
  const conversion = opts.conversion ? passengerConversion(Math.max(opts.national, 0)) : 0;
  return { national: opts.national, local, conversion, total: opts.national + local + conversion };
}

/** 합산 예시의 기준 차종: 수집 국비가 가장 높은 대표 트림 */
export const TOP_CAR = [...CARS].filter((c) => c.national !== null).sort((a, b) => (b.national ?? 0) - (a.national ?? 0))[0] ?? null;
export const TOP_CAR_LABEL = TOP_CAR ? `${TOP_CAR.brand} ${TOP_CAR.model} 국비 ${TOP_CAR.national}만원` : "국비 최고 차종";

/**
 * 지역 요약 카드의 '합산 예상': 국비 최고 차종의 국비 + 그 차종의 비례 추정 지방비.
 * 예전 '지방비 최대 + 국비 상한 580' 은 최대 행(국비 648)과 상한을 섞어 서울 기준 30만원가량 과대였다.
 */
export function headlineTotal(localMax: number | null | undefined, conversion = false): number | null {
  if (localMax === null || localMax === undefined || !TOP_CAR || TOP_CAR.national === null) return null;
  return estimateTotal({ national: TOP_CAR.national, localMax, conversion }).total;
}

export function won(n: number | null | undefined, suffix = "만원"): string {
  if (n === null || n === undefined) return "공고 확인";
  return `${n.toLocaleString("ko-KR")}${suffix}`;
}
