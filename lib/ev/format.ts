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
