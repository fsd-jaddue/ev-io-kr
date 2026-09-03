import * as cheerio from "cheerio";
import { EV_PORTAL } from "@/lib/ev/portal";
import { attemptLiveRemain } from "@/lib/ev/getData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 운영 진단용: ev.or.kr 수집이 왜 실패하는지 확인한다.
 * 시도별 응답 상태, 표 개수와 헤더 문구, 파싱 행 수, 페이지 안의 .do 주소 목록을 돌려준다. 개인정보 없음.
 */
export async function GET() {
  const started = Date.now();
  const out: Record<string, unknown> = { url: EV_PORTAL.remain, region: process.env.VERCEL_REGION ?? null };
  try {
    const { rows, attempts, html } = await attemptLiveRemain();
    out.attempts = attempts;
    out.parsedRows = rows.length;
    out.sampleRows = rows.slice(0, 3);
    if (html) {
      const $ = cheerio.load(html);
      out.title = $("title").first().text().trim();
      out.tables = $("table")
        .toArray()
        .slice(0, 8)
        .map((t) => ({
          caption: $(t).find("caption").text().trim() || null,
          headers: $(t)
            .find("thead th, thead td, tr:first-child th")
            .toArray()
            .map((h) => $(h).text().replace(/\s+/g, " ").trim())
            .slice(0, 30),
          bodyRows: $(t).find("tbody tr").length,
        }));
      out.forms = $("form")
        .toArray()
        .slice(0, 5)
        .map((f) => ({ action: $(f).attr("action"), method: $(f).attr("method"), inputs: $(f).find("input,select").length }));
      out.doUrls = $("script")
        .toArray()
        .map((s) => $(s).html() ?? "")
        .flatMap((s) => s.match(/[\w/.-]+\.do/g) ?? [])
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 30);
      out.snippet = html.replace(/\s+/g, " ").slice(0, 600);
    }
  } catch (err) {
    out.error = (err as Error).name + ": " + (err as Error).message;
  }
  out.elapsedMs = Date.now() - started;
  return Response.json(out, { headers: { "Cache-Control": "no-store" } });
}
