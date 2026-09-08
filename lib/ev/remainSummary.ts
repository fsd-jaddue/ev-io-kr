import type { RemainRow } from "./types";
import { SIDO_LIST, getSido, getSidoByShort, sigunguPath } from "@/data/regions";

/**
 * 접수·출고·잔여 현황을 시·도 단위로 요약하고 "잔여 수준"을 매기는 순수 함수 모음.
 * 서버·클라이언트 모두에서 import 가능(server-only 의존 없음). 값은 수집 행을 합산할 뿐 임의로 만들지 않는다.
 */

export type RemainLevel = "high" | "mid" | "low" | "soldout" | "unknown";

export interface SidoRemainSummary {
  slug: string;
  name: string;
  short: string;
  /** 수집 행 수 (0이면 수집값 없음) */
  rowCount: number;
  announced: number | null;
  applied: number | null;
  released: number | null;
  remaining: number | null;
  level: RemainLevel;
  /** 잔여/공고 (0~1 클램프) */
  ratio: number | null;
  /** 출고/공고 (0~1 클램프) — 소진율 바 */
  releaseRatio: number | null;
  /** 잔여 0 이하 행 수 */
  soldOutCount: number;
  /** 시·도 전체 단일 공고 1행(특별·광역시·세종·제주) */
  single: boolean;
}

export interface RemainTotals {
  announced: number;
  applied: number;
  released: number;
  remaining: number;
  /** 행(지역) 수 */
  regions: number;
  soldOut: number;
}

export const LEVEL_ORDER: RemainLevel[] = ["high", "mid", "low", "soldout", "unknown"];

/**
 * 레벨별 표시 정보. 지도·타일은 hex(inline fill), 패널은 정적 Tailwind 클래스 문자열만 사용한다
 * (동적으로 조합한 클래스는 Tailwind v4 스캐너가 찾지 못한다).
 */
export const LEVEL_META: Record<
  RemainLevel,
  {
    label: string;
    hint: string;
    fill: string;
    fillHover: string;
    labelFill: string;
    tileText: string;
    text: string;
    bg: string;
    border: string;
    bar: string;
    dot: string;
    badge: string;
  }
> = {
  high: {
    label: "여유",
    hint: "잔여 15% 이상",
    fill: "#6ee7b7",
    fillHover: "#a7f3d0",
    labelFill: "#052e16",
    tileText: "text-emerald-950",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
  },
  mid: {
    label: "보통",
    hint: "잔여 5~15%",
    fill: "#fde047",
    fillHover: "#fef08a",
    labelFill: "#052e16",
    tileText: "text-yellow-950",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-yellow-400",
    dot: "bg-yellow-400",
    badge: "bg-amber-50 text-amber-700",
  },
  low: {
    label: "적음",
    hint: "잔여 5% 미만",
    fill: "#fb923c",
    fillHover: "#fdba74",
    labelFill: "#052e16",
    tileText: "text-orange-950",
    text: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    bar: "bg-orange-500",
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700",
  },
  soldout: {
    label: "소진",
    hint: "잔여 0",
    fill: "#e11d48",
    fillHover: "#f43f5e",
    labelFill: "#ffffff",
    tileText: "text-white",
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-600",
  },
  unknown: {
    label: "미수집",
    hint: "수집값 없음",
    fill: "#94a3b8",
    fillHover: "#cbd5e1",
    labelFill: "#0f172a",
    tileText: "text-slate-900",
    text: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    bar: "bg-slate-300",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
  },
};

/** 승용 행만 (RemainTable 과 동일 규칙) */
export function isPassenger(r: RemainRow): boolean {
  return /승용/.test(r.vehicleType) || !r.vehicleType;
}

export function passengerRows(rows: RemainRow[]): RemainRow[] {
  return rows.filter(isPassenger);
}

export function clampRatio(num: number | null, den: number | null): number | null {
  if (num === null || den === null || den <= 0) return null;
  return Math.min(1, Math.max(0, num / den));
}

export function remainLevel(remaining: number | null, announced: number | null): RemainLevel {
  if (remaining === null) return "unknown";
  if (remaining <= 0) return "soldout";
  if (announced === null || announced <= 0) return "unknown";
  const ratio = remaining / announced;
  if (ratio < 0.05) return "low";
  if (ratio < 0.15) return "mid";
  return "high";
}

/** 행의 시·도 slug (filterRemainBySido 와 같은 규칙) */
export function sidoSlugOfRow(r: RemainRow): string | undefined {
  return (getSidoByShort(r.sido) ?? getSidoByShort(r.region.slice(0, 2)))?.slug;
}

export function rowsForSido(rows: RemainRow[], slug: string): RemainRow[] {
  return passengerRows(rows).filter((r) => sidoSlugOfRow(r) === slug);
}

function sum(values: Array<number | null>): number | null {
  const nums = values.filter((v): v is number => v !== null);
  return nums.length ? nums.reduce((a, b) => a + b, 0) : null;
}

export function summarizeRemainBySido(rows: RemainRow[]): SidoRemainSummary[] {
  const passenger = passengerRows(rows);
  return SIDO_LIST.map((s) => {
    const mine = passenger.filter((r) => sidoSlugOfRow(r) === s.slug);
    const announced = sum(mine.map((r) => r.announced));
    const applied = sum(mine.map((r) => r.applied));
    const released = sum(mine.map((r) => r.released));
    const remaining = sum(mine.map((r) => r.remaining));
    return {
      slug: s.slug,
      name: s.name,
      short: s.short,
      rowCount: mine.length,
      announced,
      applied,
      released,
      remaining,
      level: mine.length === 0 ? "unknown" : remainLevel(remaining, announced),
      ratio: clampRatio(remaining, announced),
      releaseRatio: clampRatio(released, announced),
      soldOutCount: mine.filter((r) => r.remaining !== null && r.remaining <= 0).length,
      single: mine.length === 1 && mine[0].region === s.name,
    };
  });
}

export function nationalTotals(rows: RemainRow[]): RemainTotals {
  const passenger = passengerRows(rows);
  return {
    announced: sum(passenger.map((r) => r.announced)) ?? 0,
    applied: sum(passenger.map((r) => r.applied)) ?? 0,
    released: sum(passenger.map((r) => r.released)) ?? 0,
    remaining: sum(passenger.map((r) => r.remaining)) ?? 0,
    regions: passenger.length,
    soldOut: passenger.filter((r) => r.remaining !== null && r.remaining <= 0).length,
  };
}

export type TopSigunguRow = RemainRow & { sidoSlug: string; sidoShort: string };

/** 잔여 많은 순 상위 n개 (시·도 미확인 행 제외) */
export function topSigungu(rows: RemainRow[], n = 8): TopSigunguRow[] {
  const out: TopSigunguRow[] = [];
  for (const r of passengerRows(rows)) {
    if (r.remaining === null) continue;
    const slug = sidoSlugOfRow(r);
    const sido = slug ? getSido(slug) : undefined;
    if (!slug || !sido) continue;
    out.push({ ...r, sidoSlug: slug, sidoShort: sido.short });
  }
  return out
    .sort((a, b) => (b.remaining ?? 0) - (a.remaining ?? 0) || a.region.localeCompare(b.region, "ko"))
    .slice(0, n);
}

export function sortSigungu(rows: RemainRow[], by: "remaining" | "name"): RemainRow[] {
  const copy = [...rows];
  if (by === "name") return copy.sort((a, b) => a.region.localeCompare(b.region, "ko"));
  return copy.sort((a, b) => (b.remaining ?? -1) - (a.remaining ?? -1) || a.region.localeCompare(b.region, "ko"));
}

/** 시·군·구 페이지 경로 — 목록에 있는 이름일 때만 (시·도 전체 행 등은 null) */
export function sigunguHref(slug: string, region: string): string | null {
  const sido = getSido(slug);
  if (!sido || !sido.sigungu.includes(region)) return null;
  return sigunguPath(slug, region);
}

export function fmtNum(n: number | null | undefined): string {
  return n === null || n === undefined ? "-" : n.toLocaleString("ko-KR");
}

/**
 * 시·군·구명으로 현황 행 찾기 — RemainTable 의 regionFilter 규칙과 같다(페이지 SSR 과 표가 같은 행을 보게).
 * "수원시" → 접미사(시·군·구)를 뗀 "수원"이 지역명에 포함되는 행, sidoName 이 있으면 시·도 단일 공고 행(region === sidoName)도 포함.
 */
export function matchRemainRows(rows: RemainRow[], regionFilter: string, sidoName?: string): RemainRow[] {
  const key = regionFilter.replace(/(시|군|구)$/, "");
  return passengerRows(rows).filter((r) => r.region.includes(key) || (sidoName ? r.region === sidoName : false));
}

export interface RemainNoteParts {
  /** 공고 종류 누적 (예: "본공고·추경1차·추경2차") */
  rounds?: string;
  /** 신청 상태 (예: "신청마감") */
  status?: string;
  /** 마감 시각 (예: "2026.08.18 12:28") */
  deadline?: string;
  /** 접수 기간 (마감 대신 있을 때) */
  period?: string;
}

/** 현황 행의 note("본공고·추경1차 · 신청마감 · 마감 2026.08.18 12:28") 분해 */
export function parseRemainNote(note?: string): RemainNoteParts {
  const out: RemainNoteParts = {};
  if (!note) return out;
  for (const part of note.split(" · ").map((p) => p.trim()).filter(Boolean)) {
    if (/^마감\s/.test(part)) out.deadline = part.replace(/^마감\s+/, "");
    else if (/^접수\s/.test(part)) out.period = part.replace(/^접수\s+/, "");
    else if (/마감|소진|접수중|신청가능/.test(part) && !/공고|추경/.test(part)) out.status = part;
    else if (/공고|추경/.test(part)) out.rounds = part;
  }
  return out;
}
