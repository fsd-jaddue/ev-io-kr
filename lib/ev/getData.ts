import "server-only";
import type { LocalPriceData, RemainData, RemainRow } from "./types";
import { EV_PORTAL, decodeBody, parseRemainHtml } from "./parse";
import { LOCAL_PRICE_BASIS, LOCAL_PRICE_ROWS, LOCAL_PRICE_UPDATED_AT } from "@/data/snapshot/local-price";
import remainSnapshot from "@/data/snapshot/remain.json";
import localPriceJson from "@/data/snapshot/local-price.json";
import { getSido, getSidoByShort } from "@/data/regions";

/** 갱신 주기(초). 유사 서비스 관행(1시간)과 동일 */
export const REVALIDATE_SECONDS = 3600;
const FETCH_TIMEOUT_MS = 8000;

let remainPromise: Promise<RemainData> | null = null;

async function fetchLiveRemain(): Promise<RemainRow[]> {
  const res = await fetch(EV_PORTAL.remain, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ev.io.kr subsidy checker; +https://ev.io.kr/about)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`ev.or.kr responded ${res.status}`);
  const html = decodeBody(await res.arrayBuffer(), res.headers.get("content-type"));
  const rows = parseRemainHtml(html);
  if (rows.length === 0) throw new Error("ev.or.kr table not found");
  return rows;
}

/**
 * 지자체별 접수·출고·잔여 현황.
 * 1) ev.or.kr 실시간 수집(1시간 캐시) → 2) 실패 시 리포지토리 스냅샷.
 * 빌드/요청 중 한 번만 시도하도록 프로세스 단위로 메모이즈한다.
 */
export function getRemainData(): Promise<RemainData> {
  if (!remainPromise) {
    remainPromise = (async () => {
      if (process.env.EV_DISABLE_LIVE_FETCH === "1") return snapshotRemain();
      try {
        const rows = await fetchLiveRemain();
        return { source: "live", fetchedAt: new Date().toISOString(), rows };
      } catch (err) {
        console.warn("[ev] live fetch failed, using snapshot:", (err as Error).message);
        return snapshotRemain();
      }
    })();
    // 실패/성공과 무관하게 캐시 주기 이후 재시도 허용
    setTimeout(() => {
      remainPromise = null;
    }, REVALIDATE_SECONDS * 1000).unref?.();
  }
  return remainPromise;
}

function snapshotRemain(): RemainData {
  const snap = remainSnapshot as { fetchedAt: string; rows: RemainRow[] };
  return { source: "snapshot", fetchedAt: snap.fetchedAt, rows: snap.rows ?? [] };
}

/** 시·도 slug 기준 현황 필터 */
export async function getRemainForSido(slug: string): Promise<RemainData> {
  const all = await getRemainData();
  const sido = getSido(slug);
  if (!sido) return { ...all, rows: [] };
  const rows = all.rows.filter((r) => {
    const s = getSidoByShort(r.sido) ?? getSidoByShort(r.region.slice(0, 2));
    return s?.slug === slug;
  });
  return { ...all, rows };
}

/** 승용 지방비 스냅샷 (수집 JSON이 있으면 우선) */
export async function getLocalPriceData(): Promise<LocalPriceData> {
  const collected = localPriceJson as { updatedAt: string; rows: LocalPriceData["rows"] };
  if (collected.rows?.length) {
    return {
      source: "snapshot",
      basis: "무공해차 통합누리집 '지자체별 차종·모델 보조금' 수집값 (승용 지방비 최대, 만원)",
      updatedAt: collected.updatedAt,
      rows: collected.rows,
    };
  }
  return {
    source: "snapshot",
    basis: LOCAL_PRICE_BASIS,
    updatedAt: LOCAL_PRICE_UPDATED_AT,
    rows: LOCAL_PRICE_ROWS,
  };
}

export function formatFetchedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
