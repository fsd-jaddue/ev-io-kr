/**
 * 무공해차 통합누리집(ev.or.kr)에서 지자체별 현황과 차종·모델 보조금을 수집해
 * data/snapshot/remain.json, data/snapshot/local-price.json 을 갱신한다.
 *
 * ev.or.kr 는 봇 차단용 자바스크립트 검사(pnp4web)를 거쳐야 실제 표를 내려주므로
 * 일반 HTTP 요청이 아니라 헤드리스 크롬(Playwright)으로 페이지를 열어 렌더링된 HTML을 파싱한다.
 *
 * 사용:  npm run fetch:snapshot   (사전: npx playwright install chromium)
 * - 표가 0건이면 기존 파일을 덮어쓰지 않고 data/snapshot/*.debug.html 과 *.debug.png 를 남긴다.
 * - GitHub Actions(.github/workflows/snapshot.yml)가 매시간 실행해 변경분을 커밋한다.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { EV_PORTAL } from "../lib/ev/portal";
import { parseLocalPriceHtml, parseRemainHtml } from "../lib/ev/parse";

const ROOT = resolve(__dirname, "..");
const SNAP = resolve(ROOT, "data/snapshot");
const NAV_TIMEOUT = 45_000;
/** 전체 실행 상한 (ms). CI 스텝 타임아웃보다 짧게 */
const TOTAL_BUDGET_MS = 6 * 60 * 1000;
const startedAt = Date.now();
const log = (...a: unknown[]) => console.log(`[${((Date.now() - startedAt) / 1000).toFixed(1)}s]`, ...a);

function save(file: string, data: unknown) {
  const p = resolve(SNAP, file);
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  log(`saved ${p}`);
}

function readJson(file: string): Record<string, unknown> {
  const p = resolve(SNAP, file);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
}

/** 표 헤더를 로그로 남겨 파서 조정에 쓴다 */
function logTables(html: string, label: string) {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  log(`[${label}] html ${html.length} chars, tables: ${tables.length}`);
  tables.slice(0, 6).forEach((t, i) => {
    const heads = (t.match(/<th[^>]*>[\s\S]*?<\/th>/gi) ?? [])
      .map((h) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 25);
    const rows = (t.match(/<tr/gi) ?? []).length;
    log(`  table#${i}: rows=${rows} headers=${JSON.stringify(heads)}`);
  });
}

async function describePage(page: Page, label: string) {
  const info = await page
    .evaluate(() => ({
      title: document.title,
      url: location.href,
      tables: document.querySelectorAll("table").length,
      tbodyRows: document.querySelectorAll("table tbody tr").length,
      selects: Array.from(document.querySelectorAll("select")).map((s) => ({
        name: s.getAttribute("name") ?? s.id,
        options: Array.from(s.options).slice(0, 25).map((o) => o.text.trim()),
      })),
      bodyText: document.body?.innerText?.replace(/\s+/g, " ").slice(0, 300) ?? "",
    }))
    .catch((e) => ({ error: String(e) }));
  log(`[${label}] page:`, JSON.stringify(info));
}

async function openPage(browser: Browser, url: string, label: string): Promise<Page> {
  const ctx = await browser.newContext({
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    viewport: { width: 1400, height: 1000 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20_000);
  page.setDefaultNavigationTimeout(NAV_TIMEOUT);
  log(`[${label}] goto ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
  log(`[${label}] domcontentloaded → ${page.url()}`);
  // 봇 검사 스크립트가 리다이렉트/재로딩을 하므로 표 행이 생길 때까지 폴링 (최대 40초)
  for (let i = 0; i < 20; i++) {
    const rows = await page.locator("table tbody tr").count().catch(() => 0);
    if (rows > 0) break;
    await page.waitForTimeout(2000);
  }
  await describePage(page, label);
  return page;
}

async function dumpDebug(page: Page, html: string, name: string) {
  writeFileSync(resolve(SNAP, `${name}.debug.html`), html, "utf8");
  await page.screenshot({ path: resolve(SNAP, `${name}.debug.png`), fullPage: false }).catch(() => {});
  log(`debug files written: ${name}.debug.html / ${name}.debug.png`);
}

/**
 * 현황 페이지. 첫 화면에 전체 표가 있으면 그대로 쓰고, 시·도 셀렉트가 있고 행이 적으면
 * 시·도를 순회한다(예산 시간 안에서만).
 */
async function collectRemainHtml(page: Page): Promise<string[]> {
  const htmls: string[] = [];
  const firstHtml = await page.content();
  htmls.push(firstHtml);
  const firstRows = parseRemainHtml(firstHtml).length;
  log(`remain first view parsed rows: ${firstRows}`);
  if (firstRows >= 50) return htmls;

  const selectInfo = await page.evaluate(() =>
    Array.from(document.querySelectorAll("select")).map((s, i) => ({
      index: i,
      name: s.getAttribute("name") ?? s.id ?? "",
      options: Array.from(s.options).map((o) => ({ value: o.value, text: o.text.trim() })),
    })),
  );
  const sidoSel = selectInfo.find((s) => s.options.some((o) => /서울/.test(o.text)) && s.options.some((o) => /경기/.test(o.text)));
  if (!sidoSel) return htmls;
  log(`sido select found: ${sidoSel.name} (${sidoSel.options.length} options)`);

  for (const opt of sidoSel.options) {
    if (Date.now() - startedAt > TOTAL_BUDGET_MS * 0.7) {
      log("time budget reached, stop iterating sido");
      break;
    }
    if (!opt.value || /전체|선택/.test(opt.text)) continue;
    try {
      await page.locator("select").nth(sidoSel.index).selectOption(opt.value, { timeout: 10_000 });
      const btn = page.locator("button, a, input[type=button], input[type=submit]").filter({ hasText: /조회|검색/ }).first();
      if ((await btn.count().catch(() => 0)) > 0) {
        await Promise.all([
          page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => {}),
          btn.click({ timeout: 10_000 }).catch(() => {}),
        ]);
      }
      await page.waitForTimeout(1500);
      const html = await page.content();
      const n = parseRemainHtml(html).length;
      log(`  ${opt.text}: parsed rows ${n}`);
      if (n > 0) htmls.push(html);
    } catch (e) {
      log(`  ${opt.text}: failed ${(e as Error).message.split("\n")[0]}`);
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
  const killer = setTimeout(() => {
    console.error("total time budget exceeded, aborting");
    process.exit(3);
  }, TOTAL_BUDGET_MS);
  let ok = false;
  try {
    // 1) 지자체별 보조금 현황
    try {
      const page = await openPage(browser, EV_PORTAL.remain, "remain");
      const htmls = await collectRemainHtml(page);
      const seen = new Set<string>();
      const rows = htmls.flatMap(parseRemainHtml).filter((r) => {
        const k = `${r.region}|${r.vehicleType}|${r.announced}|${r.applied}|${r.released}|${r.remaining}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      log(`remain rows: ${rows.length}`);
      if (rows.length > 0) {
        save("remain.json", { ...readJson("remain.json"), fetchedAt: now, rows });
        ok = true;
      } else {
        logTables(htmls[0] ?? "", "remain");
        await dumpDebug(page, htmls[0] ?? "", "remain");
        console.warn("remain: 0 rows — 표 헤더를 보고 lib/ev/parse.ts 의 classifyHeader 를 조정하세요.");
      }
      await page.context().close();
    } catch (e) {
      console.error("remain failed:", (e as Error).message.split("\n")[0]);
    }

    // 2) 지자체별 차종·모델 보조금 (승용 지방비)
    if (Date.now() - startedAt < TOTAL_BUDGET_MS * 0.75) {
      try {
        const page = await openPage(browser, EV_PORTAL.localPrice, "local-price");
        const html = await page.content();
        const rows = parseLocalPriceHtml(html);
        log(`local-price rows: ${rows.length}`);
        if (rows.length > 0) {
          save("local-price.json", { ...readJson("local-price.json"), updatedAt: now.slice(0, 10), rows });
        } else {
          logTables(html, "local-price");
          await dumpDebug(page, html, "local-price");
        }
        await page.context().close();
      } catch (e) {
        console.error("local-price failed:", (e as Error).message.split("\n")[0]);
      }
    }
  } finally {
    clearTimeout(killer);
    await browser.close();
  }
  if (!ok && process.env.CI) process.exitCode = 2;
}

main();
