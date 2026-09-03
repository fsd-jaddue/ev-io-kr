/**
 * 무공해차 통합누리집(ev.or.kr)에서 지자체별 현황과 차종·모델 보조금을 수집해
 * data/snapshot/remain.json, data/snapshot/local-price.json 을 갱신한다.
 *
 * ev.or.kr 는 봇 차단용 자바스크립트 검사(pnp4web)를 거쳐야 실제 표를 내려주므로
 * 일반 HTTP 요청이 아니라 헤드리스 크롬(Playwright)으로 페이지를 열어 렌더링된 HTML을 파싱한다.
 *
 * 사용:  npm run fetch:snapshot   (사전: npx playwright install chromium)
 * - 표가 0건이면 기존 파일을 덮어쓰지 않고 data/snapshot/*.debug.html 을 남긴다.
 * - GitHub Actions(.github/workflows/snapshot.yml)가 매시간 실행해 변경분을 커밋한다.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { EV_PORTAL } from "../lib/ev/portal";
import { parseLocalPriceHtml, parseRemainHtml } from "../lib/ev/parse";

const ROOT = resolve(__dirname, "..");
const SNAP = resolve(ROOT, "data/snapshot");
const NAV_TIMEOUT = 60_000;

function save(file: string, data: unknown) {
  const p = resolve(SNAP, file);
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`saved ${p}`);
}

function readJson(file: string): Record<string, unknown> {
  const p = resolve(SNAP, file);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
}

/** 표 헤더를 로그로 남겨 파서 조정에 쓴다 */
function logTables(html: string, label: string) {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  console.log(`[${label}] html ${html.length} chars, tables: ${tables.length}`);
  tables.slice(0, 6).forEach((t, i) => {
    const heads = (t.match(/<th[^>]*>[\s\S]*?<\/th>/gi) ?? [])
      .map((h) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 25);
    const rows = (t.match(/<tr/gi) ?? []).length;
    console.log(`  table#${i}: rows=${rows} headers=${JSON.stringify(heads)}`);
  });
}

async function openPage(browser: Browser, url: string): Promise<Page> {
  const ctx = await browser.newContext({
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    viewport: { width: 1400, height: 1000 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(NAV_TIMEOUT);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
  // 봇 검사 스크립트가 리다이렉트/재로딩을 하므로 표 또는 안정 상태까지 대기
  try {
    await page.waitForSelector("table tbody tr", { timeout: 45_000 });
  } catch {
    console.warn(`no table rows appeared for ${url}`);
  }
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  return page;
}

/**
 * 현황 페이지: 시·도 선택 없이 전체가 나오면 그대로, 시·도별로만 조회되면 셀렉트를 순회한다.
 */
async function collectRemainHtml(page: Page): Promise<string[]> {
  const htmls: string[] = [];
  const firstHtml = await page.content();
  htmls.push(firstHtml);
  const firstRows = parseRemainHtml(firstHtml).length;
  console.log(`remain first view rows: ${firstRows}`);

  // 시·도 셀렉트가 있고 첫 화면에 행이 적으면 시·도를 순회
  const selects = page.locator("select");
  const n = await selects.count();
  let sidoSelect = -1;
  for (let i = 0; i < n; i++) {
    const opts = await selects.nth(i).locator("option").allTextContents();
    if (opts.some((o) => /서울/.test(o)) && opts.some((o) => /경기/.test(o))) {
      sidoSelect = i;
      break;
    }
  }
  if (sidoSelect >= 0 && firstRows < 50) {
    const opts = await selects.nth(sidoSelect).locator("option").all();
    for (const opt of opts) {
      const value = await opt.getAttribute("value");
      const label = (await opt.textContent())?.trim() ?? "";
      if (!value || !label || /전체|선택/.test(label)) continue;
      await selects.nth(sidoSelect).selectOption(value);
      const btn = page.locator("button, a, input[type=button], input[type=submit]").filter({ hasText: /조회|검색/ }).first();
      if (await btn.count()) await btn.click().catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(800);
      const html = await page.content();
      console.log(`  ${label}: rows ${parseRemainHtml(html).length}`);
      htmls.push(html);
    }
  }
  return htmls;
}

async function main() {
  const now = new Date().toISOString();
  const browser = await chromium.launch({
    headless: true,
    // 로컬에 설치된 크롬을 쓰려면 PW_CHROMIUM_PATH 지정 (CI에서는 playwright install chromium 사용)
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  let ok = false;
  try {
    // 1) 지자체별 보조금 현황
    try {
      const page = await openPage(browser, EV_PORTAL.remain);
      const htmls = await collectRemainHtml(page);
      const seen = new Set<string>();
      const rows = htmls.flatMap(parseRemainHtml).filter((r) => {
        const k = `${r.region}|${r.vehicleType}|${r.announced}|${r.applied}|${r.released}|${r.remaining}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      console.log(`remain rows: ${rows.length}`);
      if (rows.length > 0) {
        save("remain.json", { ...readJson("remain.json"), fetchedAt: now, rows });
        ok = true;
      } else {
        logTables(htmls[0] ?? "", "remain");
        writeFileSync(resolve(SNAP, "remain.debug.html"), htmls[0] ?? "", "utf8");
        console.warn("remain: 0 rows — remain.debug.html 저장. 표 헤더를 보고 lib/ev/parse.ts 의 classifyHeader 를 조정하세요.");
      }
      await page.context().close();
    } catch (e) {
      console.error("remain failed:", (e as Error).message);
    }

    // 2) 지자체별 차종·모델 보조금 (승용 지방비)
    try {
      const page = await openPage(browser, EV_PORTAL.localPrice);
      const html = await page.content();
      const rows = parseLocalPriceHtml(html);
      console.log(`local-price rows: ${rows.length}`);
      if (rows.length > 0) {
        save("local-price.json", { ...readJson("local-price.json"), updatedAt: now.slice(0, 10), rows });
      } else {
        logTables(html, "local-price");
        writeFileSync(resolve(SNAP, "local-price.debug.html"), html, "utf8");
        console.warn("local-price: 0 rows — local-price.debug.html 저장.");
      }
      await page.context().close();
    } catch (e) {
      console.error("local-price failed:", (e as Error).message);
    }
  } finally {
    await browser.close();
  }
  if (!ok && process.env.CI) process.exitCode = 2;
}

main();
