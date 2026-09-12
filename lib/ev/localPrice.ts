/**
 * 지방비 스냅샷 정규화 (순수 함수, 서버 전용 아님). 가이드 본문처럼 빌드 시 데이터를 읽어야 하는 곳에서도 쓴다.
 * 수집 JSON 행을 시·군·구 목록에 맞춘다: 시·도 단일 공고("전체")는 모든 시·군·구에 복제(single=true),
 * 수집되지 않은 시·군·구는 수기 취합값으로 보완.
 */
import type { LocalPriceData, LocalPriceRow } from "./types";
import { LOCAL_PRICE_BASIS, LOCAL_PRICE_ROWS, LOCAL_PRICE_UPDATED_AT } from "@/data/snapshot/local-price";
import localPriceJson from "@/data/snapshot/local-price.json";
import { SIDO_LIST } from "@/data/regions";

export function normalizeLocalPrice(collected: { updatedAt: string; rows: LocalPriceRow[] }): LocalPriceData {
  if (collected.rows?.length) {
    const manual = new Map(LOCAL_PRICE_ROWS.map((r) => [`${r.sido}|${r.sigungu}`, r]));
    const rows: LocalPriceRow[] = [];
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
          ...(exact ? {} : whole ? { single: true } : fallback?.single ? { single: true } : {}),
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
  return { source: "snapshot", basis: LOCAL_PRICE_BASIS, updatedAt: LOCAL_PRICE_UPDATED_AT, rows: LOCAL_PRICE_ROWS };
}

/** 저장소 스냅샷 기준 지방비 (동기). 빌드 시 가이드 본문·통계용 */
export function getLocalPriceSnapshot(): LocalPriceData {
  return normalizeLocalPrice(localPriceJson as { updatedAt: string; rows: LocalPriceRow[] });
}
