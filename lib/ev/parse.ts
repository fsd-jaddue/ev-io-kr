import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import type { LocalPriceRow, RemainRow } from "./types";
import { getSidoByShort } from "@/data/regions";

export const EV_PORTAL = {
  remain: "https://ev.or.kr/nportal/buySupprt/initSubsidyPaymentCheckAction.do",
  localPrice: "https://ev.or.kr/nportal/buySupprt/initPsLocalCarPirceAction.do",
  localPricePopup: (localCd: string) =>
    `https://ev.or.kr/nportal/buySupprt/psPopupLocalCarPirce.do?localCd=${localCd}`,
  targetVehicle: "https://ev.or.kr/nportal/buySupprt/initSubsidyTargetVehicleAction.do",
  inquiries: "https://ev.or.kr/nportal/buySupprt/initPsLocalInquiriesAction.do",
} as const;

/** 응답 바이트를 charset에 맞게 문자열로 디코딩 (EUC-KR 대비) */
export function decodeBody(buf: ArrayBuffer, contentType: string | null): string {
  const m = /charset=([\w-]+)/i.exec(contentType ?? "");
  const cs = (m?.[1] ?? "utf-8").toLowerCase();
  const bytes = Buffer.from(buf);
  if (cs === "utf-8" || cs === "utf8") return bytes.toString("utf8");
  if (iconv.encodingExists(cs)) return iconv.decode(bytes, cs);
  return bytes.toString("utf8");
}

function toNum(text: string): number | null {
  const t = text.replace(/[,\s]/g, "");
  if (t === "" || t === "-") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * 표 헤더 텍스트를 키워드로 분류. ev.or.kr 표 구조가 바뀌어도 열 순서에 의존하지 않도록 한다.
 * 우선순위(합계 열)를 찾기 위해 "합계"가 포함된 열을 우선한다.
 */
function classifyHeader(h: string): keyof RemainRow | "skip" {
  const s = h.replace(/\s/g, "");
  if (/시도|시·도|광역/.test(s)) return "sido";
  if (/지역|지자체|시군구/.test(s)) return "region";
  if (/차종|구분/.test(s) && !/접수|공고/.test(s)) return "vehicleType";
  if (/잔여/.test(s)) return "remaining";
  if (/출고/.test(s)) return "released";
  if (/접수/.test(s)) return "applied";
  if (/공고/.test(s)) return "announced";
  if (/비고/.test(s)) return "note";
  return "skip";
}

/**
 * "지자체별 보조금 현황" HTML → RemainRow[]
 * - 다단 헤더(공고대수 하위에 우선순위/법인/일반/합계 등)가 있는 경우, 각 그룹의 마지막(합계) 열을 사용한다.
 * - rowspan(시·도 셀 병합)을 처리한다.
 */
export function parseRemainHtml(html: string): RemainRow[] {
  const $ = cheerio.load(html);
  const rows: RemainRow[] = [];

  $("table").each((_, table) => {
    const $t = $(table);
    const headerRows = $t.find("thead tr");
    if (headerRows.length === 0) return;

    // 헤더 그리드 전개 (colspan/rowspan 반영)
    const grid: string[][] = [];
    headerRows.each((ri, tr) => {
      grid[ri] = grid[ri] ?? [];
      let ci = 0;
      $(tr)
        .find("th,td")
        .each((_, th) => {
          while (grid[ri][ci] !== undefined) ci++;
          const $th = $(th);
          const text = clean($th.text());
          const colspan = Number($th.attr("colspan") ?? 1);
          const rowspan = Number($th.attr("rowspan") ?? 1);
          for (let r = 0; r < rowspan; r++) {
            grid[ri + r] = grid[ri + r] ?? [];
            for (let c = 0; c < colspan; c++) grid[ri + r][ci + c] = text;
          }
          ci += colspan;
        });
    });
    const colCount = Math.max(...grid.map((g) => g.length));
    if (colCount === 0) return;

    // 열별 최종 키 결정: 상위 헤더 기준 분류, 하위 헤더에 "합계"가 있으면 그 열만 채택
    const colKeys: (keyof RemainRow | "skip")[] = [];
    const groupHasTotal: Record<string, boolean> = {};
    for (let c = 0; c < colCount; c++) {
      const top = grid[0]?.[c] ?? "";
      const bottom = grid[grid.length - 1]?.[c] ?? "";
      const key = classifyHeader(top) === "skip" ? classifyHeader(bottom) : classifyHeader(top);
      if (/합계|계$/.test(bottom.replace(/\s/g, ""))) groupHasTotal[key] = true;
      colKeys[c] = key;
    }
    const colFinal: (keyof RemainRow | "skip")[] = [];
    for (let c = 0; c < colCount; c++) {
      const key = colKeys[c];
      const bottom = (grid[grid.length - 1]?.[c] ?? "").replace(/\s/g, "");
      if (key !== "skip" && groupHasTotal[key] && !/합계|계$/.test(bottom)) colFinal[c] = "skip";
      else colFinal[c] = key;
    }
    if (!colFinal.includes("remaining") && !colFinal.includes("released")) return;

    // 본문 행 (rowspan 병합 처리)
    const carry: Record<number, { text: string; left: number }> = {};
    $t.find("tbody tr").each((_, tr) => {
      const cells: string[] = [];
      let ci = 0;
      const tds = $(tr).find("td,th").toArray();
      let ti = 0;
      while (ci < colCount) {
        if (carry[ci] && carry[ci].left > 0) {
          cells[ci] = carry[ci].text;
          carry[ci].left--;
          ci++;
          continue;
        }
        const td = tds[ti++];
        if (!td) break;
        const $td = $(td);
        const text = clean($td.text());
        const colspan = Number($td.attr("colspan") ?? 1);
        const rowspan = Number($td.attr("rowspan") ?? 1);
        for (let c = 0; c < colspan; c++) {
          cells[ci + c] = text;
          if (rowspan > 1) carry[ci + c] = { text, left: rowspan - 1 };
        }
        ci += colspan;
      }
      if (cells.length === 0) return;

      const row: RemainRow = {
        sido: "",
        region: "",
        vehicleType: "",
        announced: null,
        applied: null,
        released: null,
        remaining: null,
      };
      cells.forEach((text, c) => {
        const key = colFinal[c];
        if (!key || key === "skip") return;
        if (key === "sido" || key === "region" || key === "vehicleType" || key === "note") {
          row[key] = text;
        } else {
          row[key] = toNum(text);
        }
      });
      if (!row.region && row.sido) row.region = row.sido;
      if (!row.sido && row.region) row.sido = getSidoByShort(row.region.slice(0, 2))?.short ?? row.region.slice(0, 2);
      if (row.region && (row.remaining !== null || row.released !== null || row.applied !== null)) {
        rows.push(row);
      }
    });
  });

  return rows;
}

/**
 * "지자체별 차종·모델 보조금" HTML → LocalPriceRow[] (승용 지방비 최대)
 * 표 구조: 시도 | 지역 | 차종 | 지방비 최대 ... 형태를 가정하고 키워드로 열을 찾는다.
 */
export function parseLocalPriceHtml(html: string): LocalPriceRow[] {
  const $ = cheerio.load(html);
  const out: LocalPriceRow[] = [];
  $("table").each((_, table) => {
    const headers = $(table)
      .find("thead th, thead td")
      .toArray()
      .map((h) => clean($(h).text()).replace(/\s/g, ""));
    const iSido = headers.findIndex((h) => /시도|시·도/.test(h));
    const iRegion = headers.findIndex((h) => /지역|지자체|시군구/.test(h));
    const iAmount = headers.findIndex((h) => /지방비|지자체보조금|지방보조금/.test(h));
    const iType = headers.findIndex((h) => /차종|구분/.test(h));
    if (iAmount < 0 || iRegion < 0) return;
    $(table)
      .find("tbody tr")
      .each((_, tr) => {
        const tds = $(tr)
          .find("td")
          .toArray()
          .map((td) => clean($(td).text()));
        if (iType >= 0 && tds[iType] && !/승용/.test(tds[iType])) return;
        const sidoShort = iSido >= 0 ? tds[iSido] : tds[iRegion]?.slice(0, 2);
        const sido = getSidoByShort(sidoShort ?? "");
        if (!sido) return;
        const region = tds[iRegion] ?? "";
        const amount = toNum(tds[iAmount] ?? "");
        out.push({ sido: sido.slug, sigungu: region.replace(sido.name, "").trim() || "전체", amount });
      });
  });
  return out;
}
