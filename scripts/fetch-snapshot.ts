/**
 * 무공해차 통합누리집(ev.or.kr)에서 지자체별 현황과 차종·모델 보조금을 수집해
 * data/snapshot/remain.json, data/snapshot/local-price.json 을 갱신한다.
 *
 * 사용:  npm run fetch:snapshot
 * - 국내 네트워크에서 실행하는 것을 권장 (해외 IP 차단 가능)
 * - 표 구조가 바뀌어 파싱 결과가 0건이면 기존 파일을 덮어쓰지 않는다.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EV_PORTAL, decodeBody, parseLocalPriceHtml, parseRemainHtml } from "../lib/ev/parse";

const ROOT = resolve(__dirname, "..");
const UA = "Mozilla/5.0 (compatible; ev.io.kr snapshot; +https://ev.io.kr/about)";

async function fetchHtml(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "ko-KR,ko;q=0.9", ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return decodeBody(await res.arrayBuffer(), res.headers.get("content-type"));
}

function save(file: string, data: unknown) {
  const p = resolve(ROOT, "data/snapshot", file);
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`saved ${p}`);
}

async function main() {
  const now = new Date().toISOString();

  // 1) 지자체별 보조금 현황
  try {
    const html = await fetchHtml(EV_PORTAL.remain);
    const rows = parseRemainHtml(html);
    console.log(`remain rows: ${rows.length}`);
    if (rows.length > 0) {
      const prev = JSON.parse(readFileSync(resolve(ROOT, "data/snapshot/remain.json"), "utf8"));
      save("remain.json", { ...prev, fetchedAt: now, rows });
    } else {
      console.warn("remain: 0 rows parsed — 표 구조 변경 여부를 확인하세요. 파일을 덮어쓰지 않습니다.");
      writeFileSync(resolve(ROOT, "data/snapshot/remain.debug.html"), html, "utf8");
    }
  } catch (e) {
    console.error("remain fetch failed:", (e as Error).message);
  }

  // 2) 지자체별 차종·모델 보조금 (승용 지방비)
  try {
    const html = await fetchHtml(EV_PORTAL.localPrice);
    const rows = parseLocalPriceHtml(html);
    console.log(`local-price rows: ${rows.length}`);
    if (rows.length > 0) {
      const prev = JSON.parse(readFileSync(resolve(ROOT, "data/snapshot/local-price.json"), "utf8"));
      save("local-price.json", { ...prev, updatedAt: now.slice(0, 10), rows });
    } else {
      console.warn("local-price: 0 rows parsed — 표 구조 변경 여부를 확인하세요. 파일을 덮어쓰지 않습니다.");
      writeFileSync(resolve(ROOT, "data/snapshot/local-price.debug.html"), html, "utf8");
    }
  } catch (e) {
    console.error("local-price fetch failed:", (e as Error).message);
  }
}

main();
