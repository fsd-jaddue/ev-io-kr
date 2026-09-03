import * as cheerio from "cheerio";
import { EV_PORTAL, decodeBody, parseRemainHtml } from "@/lib/ev/parse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 운영 진단용: ev.or.kr 수집이 왜 실패하는지 확인한다.
 * 응답 상태, 인코딩, 표 개수와 헤더 문구, 파싱 행 수를 돌려준다. 개인정보 없음.
 */
export async function GET() {
  const started = Date.now();
  const out: Record<string, unknown> = { url: EV_PORTAL.remain, region: process.env.VERCEL_REGION ?? null };
  try {
    const res = await fetch(EV_PORTAL.remain, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    out.status = res.status;
    out.contentType = res.headers.get("content-type");
    out.finalUrl = res.url;
    const html = decodeBody(await res.arrayBuffer(), res.headers.get("content-type"));
    out.htmlLength = html.length;
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
        rows: $(t).find("tbody tr").length,
      }));
    out.forms = $("form")
      .toArray()
      .slice(0, 5)
      .map((f) => ({ action: $(f).attr("action"), method: $(f).attr("method"), inputs: $(f).find("input,select").length }));
    out.scriptsWithAjax = $("script")
      .toArray()
      .map((s) => $(s).html() ?? "")
      .filter((s) => /\.do/.test(s))
      .flatMap((s) => s.match(/[\w/]+\.do/g) ?? [])
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 20);
    out.parsedRows = parseRemainHtml(html).length;
    out.snippet = html.replace(/\s+/g, " ").slice(0, 600);
  } catch (err) {
    out.error = (err as Error).name + ": " + (err as Error).message;
  }
  out.elapsedMs = Date.now() - started;
  return Response.json(out, { headers: { "Cache-Control": "no-store" } });
}
