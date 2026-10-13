/**
 * 지역별 접수·출고·잔여 이력(data/snapshot/remain-history.json)에서 그 지역만의 사실을 뽑는다 (순수 함수).
 * 이력은 값이 바뀐 날만 저장돼 있으므로, 어떤 날의 값은 그날 이전 마지막 점의 값이다.
 * 모든 문장은 관측된 수집값에서만 만든다. 원인 해석·예측은 하지 않는다.
 */
import historyJson from "@/data/snapshot/remain-history.json";
import type { RemainRow } from "./types";

export type HistoryPoint = [string, number | null, number | null, number | null, number | null, number, 0 | 1, string];
const HISTORY = historyJson as unknown as { updatedAt: string; regions: Record<string, HistoryPoint[]> };

export interface Pt {
  date: string;
  announced: number | null;
  applied: number | null;
  released: number | null;
  remaining: number | null;
  rounds: number;
  closed: boolean;
  deadline: string;
}
const toPt = (p: HistoryPoint): Pt => ({ date: p[0], announced: p[1], applied: p[2], released: p[3], remaining: p[4], rounds: p[5], closed: p[6] === 1, deadline: p[7] });

export function historyKey(r: Pick<RemainRow, "sido" | "region">): string {
  return `${r.sido}|${r.region}`;
}
export function historyFor(r: Pick<RemainRow, "sido" | "region"> | null): Pt[] {
  if (!r) return [];
  return (HISTORY.regions[historyKey(r)] ?? []).map(toPt);
}
export function historyForSido(sidoShort: string): Map<string, Pt[]> {
  const out = new Map<string, Pt[]>();
  for (const [k, v] of Object.entries(HISTORY.regions)) if (k.startsWith(`${sidoShort}|`)) out.set(k.split("|")[1], v.map(toPt));
  return out;
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
/** 날짜 d 시점의 값(그날 이전 마지막 점) */
export function valueAt(pts: Pt[], d: string): Pt | null {
  let last: Pt | null = null;
  for (const p of pts) {
    if (p.date <= d) last = p;
    else break;
  }
  return last;
}
const addDays = (d: string, n: number) => new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10);

export interface HistoryFacts {
  first: Pt;
  last: Pt;
  days: number;
  /** 공고 물량이 바뀐 날 */
  quotaChanges: { date: string; from: number | null; to: number | null; roundsFrom: number; roundsTo: number }[];
  /** 신청마감 표시가 붙은 날 / 풀린 날 */
  closedOn: string[];
  reopenedOn: string[];
  /** 출고잔여가 처음 0 이하가 된 날 */
  soldOutOn: string | null;
  /** 최근 28일 출고 증가 대수(관측 기간이 28일보다 짧으면 관측 전체) */
  released28: number | null;
  window28: number;
  /** 주간 표: 첫날부터 7일 간격 + 마지막 날 */
  weekly: Pt[];
}

export function historyFacts(pts: Pt[]): HistoryFacts | null {
  if (pts.length === 0) return null;
  const first = pts[0];
  const last = pts[pts.length - 1];
  const quotaChanges: HistoryFacts["quotaChanges"] = [];
  const closedOn: string[] = [];
  const reopenedOn: string[] = [];
  let soldOutOn: string | null = null;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (a.announced !== b.announced || a.rounds !== b.rounds) quotaChanges.push({ date: b.date, from: a.announced, to: b.announced, roundsFrom: a.rounds, roundsTo: b.rounds });
    if (!a.closed && b.closed) closedOn.push(b.date);
    if (a.closed && !b.closed) reopenedOn.push(b.date);
  }
  for (const p of pts) if (soldOutOn === null && p.remaining !== null && p.remaining <= 0) { soldOutOn = p.date; break; }
  const startDate = addDays(last.date, -28) < first.date ? first.date : addDays(last.date, -28);
  const base = valueAt(pts, startDate);
  const released28 = base?.released != null && last.released != null ? last.released - base.released : null;
  const weekly: Pt[] = [];
  for (let d = first.date; d < last.date; d = addDays(d, 7)) { const v = valueAt(pts, d); if (v) weekly.push({ ...v, date: d }); }
  weekly.push(last);
  return { first, last, days: dayDiff(first.date, last.date), quotaChanges, closedOn, reopenedOn, soldOutOn, released28, window28: dayDiff(startDate, last.date), weekly };
}

const n = (v: number | null | undefined) => (v === null || v === undefined ? "-" : v.toLocaleString("ko-KR"));
const md = (d: string) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일`;

/** 시·도 안 비교: 출고율(출고/공고)·최근 28일 출고 증가 순위 */
export function sidoPeers(sidoShort: string, self: string) {
  const rows = [...historyForSido(sidoShort)].map(([region, pts]) => ({ region, f: historyFacts(pts) })).filter((x): x is { region: string; f: HistoryFacts } => !!x.f);
  // 출고가 공고 표시보다 많은 행(누리집 표시 방식 차이)은 비율 비교에서 뺀다
  const ratio = (f: HistoryFacts) => (f.last.announced && f.last.released !== null && f.last.released <= f.last.announced ? f.last.released / f.last.announced : null);
  const byRatio = rows.filter((x) => ratio(x.f) !== null).sort((a, b) => ratio(b.f)! - ratio(a.f)!);
  const byPace = rows.filter((x) => x.f.released28 !== null).sort((a, b) => b.f.released28! - a.f.released28!);
  return {
    count: rows.length,
    ratioRank: byRatio.findIndex((x) => x.region === self) + 1 || null,
    ratioTotal: byRatio.length,
    paceRank: byPace.findIndex((x) => x.region === self) + 1 || null,
    paceTotal: byPace.length,
    reopenedCount: rows.filter((x) => x.f.reopenedOn.length > 0).length,
    quotaRaisedCount: rows.filter((x) => x.f.quotaChanges.some((c) => (c.to ?? 0) > (c.from ?? 0))).length,
  };
}

/** 이 지역만의 물량 흐름 문단들 (관측 사실만) */
export function historyParagraphs(label: string, sidoShort: string, region: string, f: HistoryFacts): string[] {
  const out: string[] = [];
  const { first, last } = f;
  out.push(
    `이 사이트가 ${md(first.date)}부터 ${md(last.date)}까지 ${f.days + 1}일 동안 수집한 ${label} 승용 공고는 처음 관측 때 공고 ${n(first.announced)}대·출고 ${n(first.released)}대·출고잔여 ${n(first.remaining)}대였고, ${md(last.date)} 기준 공고 ${n(last.announced)}대·출고 ${n(last.released)}대·출고잔여 ${n(last.remaining)}대입니다.`,
  );
  const raised = f.quotaChanges.filter((c) => (c.to ?? 0) > (c.from ?? 0));
  if (raised.length) {
    out.push(
      `관측 기간에 공고 물량이 ${raised.length}번 늘었습니다: ${raised.map((c) => `${md(c.date)} ${n(c.from)}대 → ${n(c.to)}대${c.roundsTo > c.roundsFrom ? `(공고 차수 ${c.roundsFrom}→${c.roundsTo})` : ""}`).join(", ")}. 추경이나 출고 취소분 재공고가 반영된 시점으로, 이때 신규 접수 기회가 다시 생깁니다.`,
    );
  } else if (f.quotaChanges.length) {
    out.push(`관측 기간에 공고 물량 표시가 ${f.quotaChanges.length}번 바뀌었지만 늘어난 적은 없습니다(${f.quotaChanges.map((c) => `${md(c.date)} ${n(c.from)}→${n(c.to)}대`).join(", ")}).`);
  } else {
    out.push(`관측 기간 동안 공고 물량은 ${n(last.announced)}대로 바뀌지 않았습니다. 추경 공고가 아직 반영되지 않았거나 편성되지 않은 상태입니다.`);
  }
  const events = [...f.closedOn.map((d) => ({ d, t: "신청마감 표시" })), ...f.reopenedOn.map((d) => ({ d, t: "접수 재개" }))].sort((a, b) => a.d.localeCompare(b.d));
  if (events.length) out.push(`접수 상태는 ${first.closed ? "신청마감으로 시작해" : "접수 가능으로 시작해"} ${events.map((e) => `${md(e.d)} ${e.t}`).join(", ")} 순으로 바뀌었고, 현재는 ${last.closed ? "신청마감" : "접수 가능"} 상태입니다.`);
  else out.push(last.closed ? `관측 기간 내내 신청마감 상태였습니다.${last.remaining !== null && last.remaining > 0 ? " 출고잔여가 남아 보여도 신규 접수는 받지 않는 상태입니다." : ""} 다시 신청하려면 추경 공고를 기다려야 합니다.` : `관측 기간 내내 신청마감 표시 없이 접수 가능 상태로 표시됐습니다${last.deadline ? `(누리집 마감 표시 ${last.deadline})` : ""}.`);
  if (f.soldOutOn) out.push(`${f.soldOutOn === first.date ? `관측을 시작한 ${md(f.soldOutOn)}에 이미 출고잔여가 0이었습니다` : `출고잔여가 처음 0이 된 날은 ${md(f.soldOutOn)}입니다`}${last.remaining !== null && last.remaining > 0 ? `. 이후 물량이 다시 늘어 현재 잔여는 ${n(last.remaining)}대입니다` : ""}.`);
  const peers = sidoPeers(sidoShort, region);
  if (f.released28 !== null && f.released28 > 0) {
    const perWeek = f.window28 > 0 ? Math.round((f.released28 / f.window28) * 7) : null;
    const rank = peers.paceRank && peers.paceTotal > 1 ? ` ${sidoShort} ${peers.paceTotal}개 공고 중 ${peers.paceRank === 1 ? "가장 많은" : `${peers.paceRank}번째로 많은`} 증가입니다.` : "";
    out.push(`최근 ${f.window28}일 동안 출고는 ${n(f.released28)}대 늘었습니다${perWeek ? `(주당 약 ${n(perWeek)}대)` : ""}.${rank}`);
  } else if (f.released28 === 0) {
    out.push(`최근 ${f.window28}일 동안 출고 대수는 늘지 않았습니다. 새 공고가 없으면 선정·출고가 더 진행되지 않는 상태입니다.`);
  }
  const ownRatioOk = last.announced !== null && last.announced > 0 && last.released !== null && last.released <= last.announced;
  if (ownRatioOk && peers.ratioRank && peers.ratioTotal > 1) {
    const pct = last.released !== null && last.announced ? Math.round((last.released / last.announced) * 100) : null;
    out.push(`공고 대비 출고 비율은 ${pct ?? "-"}%로 ${sidoShort} ${peers.ratioTotal}개 공고 중 ${peers.ratioRank}위입니다. 같은 기간 ${sidoShort}에서 공고 물량이 늘어난 곳은 ${peers.quotaRaisedCount}곳, 마감 뒤 다시 열린 곳은 ${peers.reopenedCount}곳입니다.`);
  }
  return out;
}

export const HISTORY_UPDATED_AT = HISTORY.updatedAt;
