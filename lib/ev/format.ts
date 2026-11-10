import type { DataSource } from "./types";

/**
 * 수집 기준 시각(ISO) → "2026.09.07 10:05" (Asia/Seoul).
 * 숫자 파트만 조합해 서버(Node ICU)와 브라우저(Chrome ICU)의 오전/오후·공백 표기 차이로 hydration 이 어긋나지 않게 한다.
 */
export function formatFetchedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}.${get("month")}.${get("day")} ${hour}:${get("minute")}`;
}

/**
 * "누리집 수집" 배지 기준: live 이거나 수집 후 12시간 이내.
 * GitHub Actions 예약 실행이 매시간 cron 이어도 실제로는 하루 3~6회만 돌아(2026-09 이후) 6시간 기준이면
 * 정상 수집 중에도 "스냅샷 (오래됨)"이 자주 떴다. 2026-11-10 12시간으로 완화.
 */
export const FRESH_WINDOW_MS = 12 * 60 * 60 * 1000;

export function isFreshFetch(source: DataSource, fetchedAt: string, now = Date.now()): boolean {
  if (source === "live") return true;
  const age = now - new Date(fetchedAt).getTime();
  return Number.isFinite(age) && age < FRESH_WINDOW_MS;
}
