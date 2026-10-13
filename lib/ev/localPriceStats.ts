/**
 * 시·군·구 지방비 비교 통계 (순수 함수). 시·군·구 페이지의 비교 문단·순위·인근 표, 시·도 페이지 FAQ 에 쓴다.
 * 모든 수치는 getLocalPriceData() 결과(수집값 우선)에서만 파생한다.
 */
import type { LocalPriceRow } from "./types";
import { SIDO_LIST } from "@/data/regions";
import { summarizeBySido } from "./summary";

export interface SidoPriceStats {
  slug: string;
  /** 시·군·구 수 */
  count: number;
  /** 금액 확인된 시·군·구 수 */
  known: number;
  max: number | null;
  min: number | null;
  /** 평균 (정수 반올림, 만원) */
  avg: number | null;
  /** 최고액 시·군·구(동률 전부) */
  maxNames: string[];
  minNames: string[];
  /** 시·도 전역 단일 공고(행이 "전체" 1건에서 복제됨). 시·군별 공고인데 금액만 같은 경우는 equal 만 true */
  uniform: boolean;
  /** 확인된 곳이 2곳 이상이고 금액이 모두 같음 (단일 공고 포함) */
  equal: boolean;
  /** 금액 내림차순, null 은 뒤로, 동률은 이름순 */
  sorted: LocalPriceRow[];
}

export interface RankInfo {
  /** 경쟁 순위(1224 방식): 나보다 큰 금액의 수 + 1 */
  rank: number;
  /** 순위 산정에 포함된 수 (금액 확인된 곳) */
  total: number;
  /** 같은 금액인 곳 수 (본인 포함) */
  ties: number;
}

const byAmountDesc = (a: LocalPriceRow, b: LocalPriceRow) =>
  (b.amount ?? -1) - (a.amount ?? -1) || a.sigungu.localeCompare(b.sigungu, "ko");

export function sidoPriceStats(rows: LocalPriceRow[], sidoSlug: string): SidoPriceStats {
  const mine = rows.filter((r) => r.sido === sidoSlug);
  const known = mine.filter((r): r is LocalPriceRow & { amount: number } => r.amount !== null);
  const amounts = known.map((r) => r.amount);
  const max = amounts.length ? Math.max(...amounts) : null;
  const min = amounts.length ? Math.min(...amounts) : null;
  const avg = amounts.length ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) : null;
  return {
    slug: sidoSlug,
    count: mine.length,
    known: known.length,
    max,
    min,
    avg,
    maxNames: known.filter((r) => r.amount === max).map((r) => r.sigungu),
    minNames: known.filter((r) => r.amount === min).map((r) => r.sigungu),
    uniform: known.length > 0 && known.every((r) => r.single),
    equal: known.length > 1 && min === max,
    sorted: [...mine].sort(byAmountDesc),
  };
}

function rankAmong(pool: LocalPriceRow[], mine: number): RankInfo {
  const known = pool.map((r) => r.amount).filter((a): a is number => a !== null);
  return {
    rank: known.filter((a) => a > mine).length + 1,
    total: known.length,
    ties: known.filter((a) => a === mine).length,
  };
}

export function rankInSido(rows: LocalPriceRow[], sidoSlug: string, sigungu: string): RankInfo | null {
  const me = rows.find((r) => r.sido === sidoSlug && r.sigungu === sigungu);
  if (!me || me.amount === null) return null;
  return rankAmong(
    rows.filter((r) => r.sido === sidoSlug),
    me.amount,
  );
}

export function rankNational(rows: LocalPriceRow[], sidoSlug: string, sigungu: string): RankInfo | null {
  const me = rows.find((r) => r.sido === sidoSlug && r.sigungu === sigungu);
  if (!me || me.amount === null) return null;
  return rankAmong(rows, me.amount);
}

/**
 * 같은 시·도 안에서 비교표에 실을 행: 최고·최저 1곳 + 금액 순위에서 본인 앞뒤 n곳 + 본인. 금액 내림차순. 단일 공고·동일 금액 시·도면 빈 배열.
 * 페이지마다 본인 주변 지역이 달라 같은 도의 시·군 페이지끼리 표가 똑같아지지 않는다(2026-10-13).
 */
export function neighborRows(rows: LocalPriceRow[], sidoSlug: string, sigungu: string, n = 3): LocalPriceRow[] {
  const stats = sidoPriceStats(rows, sidoSlug);
  if (stats.uniform || stats.equal || stats.known === 0) return [];
  const known = stats.sorted.filter((r) => r.amount !== null);
  const idx = known.findIndex((r) => r.sigungu === sigungu);
  const picked = new Map<string, LocalPriceRow>();
  picked.set(known[0].sigungu, known[0]);
  picked.set(known[known.length - 1].sigungu, known[known.length - 1]);
  if (idx >= 0) for (const r of known.slice(Math.max(0, idx - n), idx + n + 1)) picked.set(r.sigungu, r);
  return Array.from(picked.values()).sort(byAmountDesc);
}

export interface SidoMaxRank {
  slug: string;
  name: string;
  short: string;
  max: number | null;
  rank: number | null;
}

/** 17개 시·도를 승용 지방비 최대액 순으로 (동률은 같은 순위) */
export function sidoMaxRanking(rows: LocalPriceRow[]): SidoMaxRank[] {
  const summary = summarizeBySido(rows);
  const maxes = summary.map((s) => s.max).filter((m): m is number => m !== null);
  return SIDO_LIST.map((s) => {
    const sm = summary.find((x) => x.slug === s.slug);
    const max = sm?.max ?? null;
    return {
      slug: s.slug,
      name: s.name,
      short: s.short,
      max,
      rank: max === null ? null : maxes.filter((m) => m > max).length + 1,
    };
  }).sort((a, b) => (b.max ?? -1) - (a.max ?? -1) || a.short.localeCompare(b.short, "ko"));
}
