/**
 * ev.or.kr ag-Grid 에서 긁어온 원시 행(열 id → 셀 텍스트)을 도메인 모델로 변환한다.
 * 브라우저·서버 어디서든 쓸 수 있도록 의존성이 없다.
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

function cleanRegion(text: string): { name: string; note?: string } {
  const badges = text.match(BADGE_WORDS) ?? [];
  const name = text.replace(BADGE_WORDS, "").replace(/\s+/g, " ").trim();
  return { name, note: badges.length ? Array.from(new Set(badges)).join(",") : undefined };
}

/** 헤더 문구에 정규식이 맞는 열 id 를 찾는다 (여러 개면 우선순위 순서대로 첫 번째) */
function findCol(headers: AgGridData["headers"], patterns: RegExp[]): string | undefined {
  for (const p of patterns) {
    const h = headers.find((x) => p.test(x.text.replace(/\s/g, "")));
    if (h) return h.id;
  }
  return undefined;
}

/** 현황 그리드 → RemainRow[] */
export function agRowsToRemain(grid: AgGridData): RemainRow[] {
  const H = grid.headers;
  const cSido = findCol(H, [/^시도$/, /시·도|시\/도|시도|광역/]);
  const cRegion = findCol(H, [/지역|지자체|시군구|시\/군\/구/]);
  const cType = findCol(H, [/^차종$/, /세부차종|차종|구분/]);
  const cAnnounced = findCol(H, [/공고대수/, /공고/]);
  const cApplied = findCol(H, [/접수대수/, /접수/]);
  const cReleased = findCol(H, [/출고대수/, /^출고$/]);
  // 선정잔여·출고잔여가 함께 있으면 출고잔여를 우선
  const cRemaining = findCol(H, [/출고잔여/, /잔여대수/, /잔여/]);
  const cNote = findCol(H, [/비고/]);

  const out: RemainRow[] = [];
  let carrySido = "";
  for (const r of grid.rows) {
    const rawRegion = cRegion ? r[cRegion] ?? "" : "";
    const rawSido = cSido ? r[cSido] ?? "" : "";
    if (rawSido) carrySido = cleanRegion(rawSido).name;
    const { name: region, note: badge } = cleanRegion(rawRegion || rawSido);
    if (!region) continue;
    const sidoShort = getSidoByShort(carrySido || region.slice(0, 2))?.short ?? (carrySido || region).slice(0, 2);
    const row: RemainRow = {
      sido: sidoShort,
      region,
      vehicleType: cType ? (r[cType] ?? "").replace(/^전기/, "") || "승용" : "승용",
      announced: toNum(cAnnounced ? r[cAnnounced] : undefined),
      applied: toNum(cApplied ? r[cApplied] : undefined),
      released: toNum(cReleased ? r[cReleased] : undefined),
      remaining: toNum(cRemaining ? r[cRemaining] : undefined),
    };
    const note = [badge, cNote ? r[cNote] : ""].filter(Boolean).join(" ").trim();
    if (note) row.note = note;
    if (row.announced !== null || row.applied !== null || row.released !== null || row.remaining !== null) out.push(row);
  }
  return out;
}

/**
 * 차종·모델 그리드(지자체 1곳) → 승용 지방비 최대 LocalPriceRow.
 * district: 시·도명(예: 경기도), city: 시·군·구명(광역시·세종·제주는 빈 문자열)
 */
export function agRowsToLocalPrice(grid: AgGridData, district: string, city: string): LocalPriceRow[] {
  const sido = getSidoByShort(district.replace(/\s/g, ""));
  if (!sido) return [];
  const H = grid.headers;
  const cLocal = findCol(H, [/지방비|지자체보조금|지방보조금/]);
  if (!cLocal) return [];
  const cClass = findCol(H, [/차급|차종|구분/]);
  const cModel = findCol(H, [/모델|차량명|차명/]);
  let max: number | null = null;
  for (const r of grid.rows) {
    const cls = cClass ? r[cClass] ?? "" : "";
    const model = cModel ? r[cModel] ?? "" : "";
    if (cClass && cls && !/승용/.test(cls)) continue;
    if (!cClass && /화물|승합|이륜|버스/.test(model)) continue;
    const v = toNum(r[cLocal]);
    if (v !== null && (max === null || v > max)) max = v;
  }
  if (max === null) return [];
  return [{ sido: sido.slug, sigungu: city.replace(/\s/g, "") || "전체", amount: max }];
}
