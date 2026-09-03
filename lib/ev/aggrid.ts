/**
 * ev.or.kr ag-Grid 에서 긁어온 원시 행(열 id → 셀 텍스트)을 도메인 모델로 변환한다.
 * 브라우저·서버 어디서든 쓸 수 있도록 의존성이 없다.
 *
 * 2026-09 기준 현황 그리드(#myGrid) 열: 지역(sido) | 차종(carNm) | 공고종류(noticeKind) | 공고별 접수기간(period)
 *   | 신청 마감(deadline) | 공고(stepCnt) | 접수(recei) | 선정(choice) | 출고(relea) | 선정잔여(choiceRemain) | 출고잔여(resi) | 상세(button)
 * 지역 셀 텍스트 예: "즐겨찾기 서울 마감 서울특별시", "즐겨찾기 경기 수원시" (버튼 라벨 + 시도 약칭 + 배지 + 지역명)
 * 같은 지역이 공고종류(본공고/추경n차)별로 여러 행 나오며 대수는 누적 동일값이다.
 */
import type { LocalPriceRow, RemainRow } from "./types";
import { getSidoByShort } from "@/data/regions";

export interface AgGridData {
  headers: { id: string; text: string }[];
  rows: Record<string, string>[];
}

function toNum(text: string | undefined): number | null {
  if (text === undefined) return null;
  const t = text.replace(/[,\s]/g, "").replace(/대$/, "");
  if (t === "" || t === "-") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const BADGE_WORDS = /(신청마감|접수마감|마감|소진|접수중|신청가능|NEW)/g;
const BUTTON_WORDS = /(즐겨찾기|상세보기|상세)/g;

/** 지역 셀 텍스트 → { sidoShort, name, badge } */
export function parseRegionCell(text: string): { sidoShort: string; name: string; badge?: string } {
  const badges = Array.from(new Set(text.match(BADGE_WORDS) ?? []));
  const tokens = text
    .replace(BUTTON_WORDS, " ")
    .replace(BADGE_WORDS, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return { sidoShort: "", name: "" };
  const name = tokens[tokens.length - 1];
  const sidoShort = tokens.length > 1 ? tokens[0] : (getSidoByShort(name.slice(0, 2))?.short ?? name.slice(0, 2));
  return { sidoShort, name, badge: badges.length ? badges.join(",") : undefined };
}

/** 헤더 문구에 정규식이 맞는 열 id 를 찾는다 (패턴 우선순위 순서대로) */
function findCol(headers: AgGridData["headers"], patterns: RegExp[]): string | undefined {
  for (const p of patterns) {
    const h = headers.find((x) => p.test(x.text.replace(/\s/g, "")));
    if (h) return h.id;
  }
  return undefined;
}

/** 현황 그리드 → RemainRow[] (지역·차종당 1행으로 합침) */
export function agRowsToRemain(grid: AgGridData): RemainRow[] {
  const H = grid.headers;
  const cRegion = findCol(H, [/^지역$/, /^시도$/, /지역|지자체|시군구|시\/군\/구|시·도|시\/도|시도/]);
  const cType = findCol(H, [/^차종$/, /세부차종/, /^구분$/]);
  const cNoticeKind = findCol(H, [/공고종류/]);
  const cPeriod = findCol(H, [/접수기간/]);
  const cDeadline = findCol(H, [/신청마감|^마감$/]);
  const cAnnounced = findCol(H, [/^공고대수$/, /^공고$/, /공고대수/]);
  const cApplied = findCol(H, [/^접수대수$/, /^접수$/, /접수대수/]);
  const cReleased = findCol(H, [/^출고대수$/, /^출고$/, /출고대수/]);
  // 선정잔여·출고잔여가 함께 있으면 출고잔여를 우선
  const cRemaining = findCol(H, [/^출고잔여/, /^잔여대수$/, /^잔여$/, /출고잔여/, /잔여/]);
  const cNote = findCol(H, [/^비고$/]);

  const byKey = new Map<string, RemainRow & { kinds: string[] }>();
  let carrySido = "";
  for (const r of grid.rows) {
    const cell = parseRegionCell(cRegion ? r[cRegion] ?? "" : "");
    if (!cell.name) continue;
    if (cell.sidoShort) carrySido = cell.sidoShort;
    const sido = getSidoByShort(carrySido || cell.name.slice(0, 2));
    if (!sido && /공단|협회|공사/.test(cell.name)) continue; // 한국환경공단·협회 등 비지자체 행 제외
    const sidoShort = sido?.short ?? (carrySido || cell.name.slice(0, 2));
    const vehicleType = cType ? (r[cType] ?? "").replace(/^전기/, "").trim() || "승용" : "승용";
    const key = `${sidoShort}|${cell.name}|${vehicleType}`;
    const kind = cNoticeKind ? (r[cNoticeKind] ?? "").replace(/[[\]]/g, "").trim() : "";
    const deadline = cDeadline ? (r[cDeadline] ?? "").trim() : "";
    const period = cPeriod ? (r[cPeriod] ?? "").trim() : "";
    const numbers = {
      announced: toNum(cAnnounced ? r[cAnnounced] : undefined),
      applied: toNum(cApplied ? r[cApplied] : undefined),
      released: toNum(cReleased ? r[cReleased] : undefined),
      remaining: toNum(cRemaining ? r[cRemaining] : undefined),
    };
    if (numbers.announced === null && numbers.applied === null && numbers.released === null && numbers.remaining === null) continue;

    const existing = byKey.get(key);
    const notes: string[] = [];
    if (cell.badge) notes.push(cell.badge === "마감" ? "신청마감" : cell.badge);
    if (deadline) notes.push(`마감 ${deadline}`);
    else if (period) notes.push(`접수 ${period}`);
    if (cNote && r[cNote]) notes.push(r[cNote]);

    if (existing) {
      // 최신 공고(뒤 행) 기준으로 대수·비고 갱신, 공고종류는 누적
      Object.assign(existing, numbers);
      if (kind && !existing.kinds.includes(kind)) existing.kinds.push(kind);
      existing.note = [existing.kinds.join("·"), ...notes].filter(Boolean).join(" · ");
    } else {
      byKey.set(key, {
        sido: sidoShort,
        region: cell.name,
        vehicleType,
        ...numbers,
        note: [kind, ...notes].filter(Boolean).join(" · ") || undefined,
        kinds: kind ? [kind] : [],
      });
    }
  }
  return Array.from(byKey.values()).map((r) => {
    const row: RemainRow = { sido: r.sido, region: r.region, vehicleType: r.vehicleType, announced: r.announced, applied: r.applied, released: r.released, remaining: r.remaining };
    if (r.note) row.note = r.note;
    return row;
  });
}

/**
 * 차종·모델 그리드(지자체 1곳) → 승용 지방비 최대 LocalPriceRow.
 * sidoText: 시·도명 또는 약칭(예: "경기", "서울특별시"), regionText: 지역명(예: "수원시", 광역시는 시·도명)
 */
export function agRowsToLocalPrice(grid: AgGridData, sidoText: string, regionText: string): LocalPriceRow[] {
  const sido = getSidoByShort(sidoText.replace(/\s/g, "")) ?? getSidoByShort(regionText.replace(/\s/g, "").slice(0, 2));
  if (!sido) return [];
  const H = grid.headers;
  const cLocal = findCol(H, [/^지방비/, /지방비|지자체보조금|지방보조금/]);
  if (!cLocal) return [];
  const cClass = findCol(H, [/^차급$/, /^차종$/, /차종\/차급/, /^구분$/, /차급|차종/]);
  const cModel = findCol(H, [/^모델$/, /모델|차량명|차명/]);
  // 차종/차급 값 예: "전기승용 일반승용", "전기승용 택시", "전기화물 소형". 일반승용만 대상으로 하고, 없으면 택시·법인 제외한 승용.
  const classOf = (r: Record<string, string>) => (cClass ? r[cClass] ?? "" : "").replace(/\s/g, "");
  const hasGeneral = grid.rows.some((r) => /일반승용/.test(classOf(r)));
  let max: number | null = null;
  for (const r of grid.rows) {
    const cls = classOf(r);
    const model = cModel ? r[cModel] ?? "" : "";
    if (cClass && cls) {
      if (!/승용/.test(cls)) continue;
      if (hasGeneral ? !/일반승용/.test(cls) : /택시|법인|영업|초소형/.test(cls)) continue;
    } else if (/화물|승합|이륜|버스|택시/.test(model)) continue;
    const v = toNum(r[cLocal]);
    if (v !== null && (max === null || v > max)) max = v;
  }
  if (max === null) return [];
  const region = regionText.replace(/\s/g, "");
  const isWholeSido = !region || region === sido.name || region === sido.short || getSidoByShort(region)?.slug === sido.slug;
  return [{ sido: sido.slug, sigungu: isWholeSido ? "전체" : region, amount: max }];
}
