import type { Car, CarSubsidyRow, CarsSnapshot } from "./types";

/** 누리집 모델 문자열 정규화: 공백 제거·소문자 (예: "현대 아이오닉6 롱레인지 2WD 18인치" → "현대아이오닉6롱레인지2wd18인치") */
export function normalizeModel(maker: string, model: string): string {
  return `${maker}${model}`.replace(/\s+/g, "").toLowerCase();
}

export interface CarMatch {
  slug: string;
  matched: CarSubsidyRow[];
  /** 적용된 국비 (모든 매칭 행의 국비가 같을 때만) */
  applied: number | null;
  reason: "applied" | "no-match" | "ambiguous" | "no-pattern";
}

/** car.evMatch 로 누리집 행을 찾는다 */
export function matchCarRows(car: Car, rows: CarSubsidyRow[]): CarMatch {
  if (!car.evMatch) return { slug: car.slug, matched: [], applied: null, reason: "no-pattern" };
  let re: RegExp;
  try {
    re = new RegExp(car.evMatch, "i");
  } catch {
    return { slug: car.slug, matched: [], applied: null, reason: "no-pattern" };
  }
  const matched = rows.filter((r) => re.test(normalizeModel(r.maker, r.model)));
  if (matched.length === 0) return { slug: car.slug, matched, applied: null, reason: "no-match" };
  const values = Array.from(new Set(matched.map((r) => r.national).filter((v): v is number => v !== null)));
  if (values.length !== 1 || values[0] <= 0) return { slug: car.slug, matched, applied: null, reason: "ambiguous" };
  return { slug: car.slug, matched, applied: values[0], reason: "applied" };
}

/**
 * 수기 목록(base)에 누리집 수집 국비를 덮어씌운다. 매칭이 없거나 매칭 행들의 국비가 서로 다르면 수기값을 유지한다
 * (잘못된 금액이 나가는 것보다 수기값이 낫다). 판정 내역은 snapshot-diff 가 Issue 에 적는다.
 */
export function applyCollectedNational(base: Car[], snap: CarsSnapshot | { rows?: CarSubsidyRow[] }): Car[] {
  const rows = snap.rows ?? [];
  if (rows.length === 0) return base.map((c) => ({ ...c, nationalSource: "manual" as const }));
  return base.map((c) => {
    const m = matchCarRows(c, rows);
    if (m.reason !== "applied" || m.applied === null) return { ...c, nationalSource: "manual" as const };
    return { ...c, national: m.applied, nationalSource: "collected" as const, evModels: m.matched.map((r) => r.model) };
  });
}
