import "server-only";
import { unstable_cache } from "next/cache";
import type { LocalPriceData, RemainData, RemainRow } from "./types";
import { EV_PORTAL } from "./portal";
import { decodeBody, parseRemainHtml } from "./parse";
import { LOCAL_PRICE_BASIS, LOCAL_PRICE_ROWS, LOCAL_PRICE_UPDATED_AT } from "@/data/snapshot/local-price";
import remainSnapshot from "@/data/snapshot/remain.json";
import localPriceJson from "@/data/snapshot/local-price.json";
import { SIDO_LIST, getSido, getSidoByShort } from "@/data/regions";

export { formatFetchedAt } from "./format";

/** 갱신 주기(초). 유사 서비스 관행(1시간)과 동일 */
export const REVALIDATE_SECONDS = 3600;
const FETCH_TIMEOUT_MS = 12000;
/** 수집 실패 후 재시도까지 대기(ms). 실패 시 매 요청마다 누리집을 두드리지 않도록 */
const FAIL_BACKOFF_MS = 10 * 60 * 1000;

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://ev.or.kr/nportal/buySupprt/initSubsidyPaymentCheckAction.do",
  "Upgrade-Insecure-Requests": "1",
};

export interface FetchAttempt {
  method: "GET" | "POST";
  status?: number;
  contentType?: string | null;
  htmlLength?: number;
  rows?: number;
  error?: string;
  ms: number;
}

/**
 * ev.or.kr 지자체별 현황 수집. GET → (0건이면) POST 순으로 시도한다.
 * 진단 라우트에서도 쓰므로 시도 내역과 마지막 HTML을 함께 돌려준다.
 */
export async function attemptLiveRemain(): Promise<{ rows: RemainRow[]; attempts: FetchAttempt[]; html: string }> {
  const attempts: FetchAttempt[] = [];
  let lastHtml = "";
  for (const method of ["GET", "POST"] as const) {
    const t0 = Date.now();
    const a: FetchAttempt = { method, ms: 0 };
    try {
      const res = await fetch(EV_PORTAL.remain, {
        method,
        headers:
          method === "POST"
            ? { ...BROWSER_HEADERS, "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }
            : BROWSER_HEADERS,
        body: method === "POST" ? "" : undefined,
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      a.status = res.status;
      a.contentType = res.headers.get("content-type");
      const html = decodeBody(await res.arrayBuffer(), a.contentType);
      lastHtml = html;
      a.htmlLength = html.length;
      const rows = res.ok ? parseRemainHtml(html) : [];
      a.rows = rows.length;
      a.ms = Date.now() - t0;
      attempts.push(a);
      if (rows.length > 0) return { rows, attempts, html };
    } catch (err) {
      a.error = `${(err as Error).name}: ${(err as Error).message}`;
      a.ms = Date.now() - t0;
      attempts.push(a);
    }
  }
  return { rows: [], attempts, html: lastHtml };
}

/** 성공한 수집 결과만 1시간 캐시 (실패는 throw → 캐시되지 않음) */
const getCachedLiveRemain = unstable_cache(
  async (): Promise<{ fetchedAt: string; rows: RemainRow[] }> => {
    const { rows, attempts } = await attemptLiveRemain();
    if (rows.length === 0) {
      throw new Error("ev.or.kr fetch failed: " + JSON.stringify(attempts));
    }
    return { fetchedAt: new Date().toISOString(), rows };
  },
  ["ev-remain-v2"],
  { revalidate: REVALIDATE_SECONDS, tags: ["ev-remain"] },
);

let failUntil = 0;

/**
 * 지자체별 접수·출고·잔여 현황.
 * 1) ev.or.kr 수집(성공 시 1시간 캐시) → 2) 실패 시 리포지토리 스냅샷.
 */
export async function getRemainData(): Promise<RemainData> {
  if (process.env.EV_DISABLE_LIVE_FETCH === "1") return snapshotRemain();
  if (Date.now() < failUntil) return snapshotRemain();
  try {
    const live = await getCachedLiveRemain();
    return { source: "live", fetchedAt: live.fetchedAt, rows: live.rows };
  } catch (err) {
    failUntil = Date.now() + FAIL_BACKOFF_MS;
    console.warn("[ev] live fetch failed, using snapshot:", (err as Error).message.slice(0, 500));
    return snapshotRemain();
  }
}

function snapshotRemain(): RemainData {
  const snap = remainSnapshot as { fetchedAt: string; rows: RemainRow[] };
  return { source: "snapshot", fetchedAt: snap.fetchedAt, rows: snap.rows ?? [] };
}

/** 시·도 slug 기준 현황 필터 */
export function filterRemainBySido(all: RemainData, slug: string): RemainData {
  const sido = getSido(slug);
  if (!sido) return { ...all, rows: [] };
  const rows = all.rows.filter((r) => {
    const s = getSidoByShort(r.sido) ?? getSidoByShort(r.region.slice(0, 2));
    return s?.slug === slug;
  });
  return { ...all, rows };
}

export async function getRemainForSido(slug: string): Promise<RemainData> {
  return filterRemainBySido(await getRemainData(), slug);
}

/** 승용 지방비 스냅샷 (수집 JSON이 있으면 우선) */
export async function getLocalPriceData(): Promise<LocalPriceData> {
  const collected = localPriceJson as { updatedAt: string; rows: LocalPriceData["rows"] };
  if (collected.rows?.length) {
    // 수집값을 시·군·구 목록에 맞춰 정규화: 시·도 단일 공고("전체")는 모든 시·군·구에 복제,
    // 수집되지 않은 시·군·구는 수기 취합값으로 보완
    const manual = new Map(LOCAL_PRICE_ROWS.map((r) => [`${r.sido}|${r.sigungu}`, r]));
    const rows: LocalPriceData["rows"] = [];
    for (const sido of SIDO_LIST) {
      const mine = collected.rows.filter((r) => r.sido === sido.slug);
      const whole = mine.find((r) => r.sigungu === "전체");
      for (const name of sido.sigungu) {
        const exact = mine.find((r) => r.sigungu === name || name.startsWith(r.sigungu) || r.sigungu.startsWith(name));
        const fallback = manual.get(`${sido.slug}|${name}`);
        rows.push({
          sido: sido.slug,
          sigungu: name,
          amount: exact?.amount ?? whole?.amount ?? fallback?.amount ?? null,
          note: exact || whole ? "누리집 수집값" : fallback?.note,
        });
      }
    }
    return {
      source: "snapshot",
      basis: "무공해차 통합누리집 '지자체별 차종·모델 보조금' 수집값 (승용 지방비 최대, 만원)",
      updatedAt: collected.updatedAt,
      rows,
    };
  }
  return {
    source: "snapshot",
    basis: LOCAL_PRICE_BASIS,
    updatedAt: LOCAL_PRICE_UPDATED_AT,
    rows: LOCAL_PRICE_ROWS,
  };
}
