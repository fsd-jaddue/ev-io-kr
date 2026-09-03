/**
 * 무공해차 통합누리집(ev.or.kr)에서 지자체별 현황과 차종·모델 보조금을 수집해
 * data/snapshot/remain.json, data/snapshot/local-price.json 을 갱신한다.
 *
 * ev.or.kr 특성
 * - 봇 차단용 자바스크립트 검사(pnp4web)를 거쳐야 실제 페이지가 나오고, AJAX 본문은 암호화되어 있다.
 *   → 헤드리스 크롬(Playwright)으로 렌더링된 DOM을 읽는다.
 * - 데이터는 <table>이 아니라 ag-Grid(div 기반, 가상 스크롤)로 그려진다. → 그리드를 스크롤하며 행을 모은다.
 * - 현황 페이지(#myGrid)는 첫 화면에 전체 지역(전기승용)이 표시된다.
 * - 차종·모델 페이지는 지자체별 아코디언(#localAccordion) 안에 그리드가 있다.
 *
 * 사용:  npm run fetch:snapshot   (사전: npx playwright install chromium, 또는 PW_CHROMIUM_PATH 지정)
 * - 결과가 0건이면 기존 파일을 덮어쓰지 않고 data/snapshot/*.debug.html/png 를 남긴다.
 * - GitHub Actions(.github/workflows/snapshot.yml)가 매시간 실행해 변경분을 커밋한다.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { EV_PORTAL } from "../lib/ev/portal";
import { agRowsToLocalPrice, agRowsToRemain, type AgGridData } from "../lib/ev/aggrid";

const ROOT = resolve(__dirname, "..");
const SNAP = resolve(ROOT, "data/snapshot");
const NAV_TIMEOUT = 45_000;
/** 전체 실행 상한 (ms). CI 스텝 타임아웃보다 짧게 */
const TOTAL_BUDGET_MS = 12 * 60 * 1000;
const startedAt = Date.now();
const elapsed = () => Date.now() - startedAt;
const log = (...a: unknown[]) => console.log(`[${(elapsed() / 1000).toFixed(1)}s]`, ...a);

function save(file: string, data: unknown) {
  const p = resolve(SNAP, file);
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  log(`saved ${p}`);
}

function readJson(file: string): Record<string, unknown> {
  const p = resolve(SNAP, file);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
}

async function describePage(page: Page, label: string) {
  const info = await page
    .evaluate(() => ({
      title: document.title,
      url: location.href,
      agGrids: document.querySelectorAll(".ag-root, .ag-grid").length,
      agRows: document.querySelectorAll(".ag-row").length,
      accordions: document.querySelectorAll(".accordion-item").length,
      selects: Array.from(document.querySelectorAll("select")).map((s) => ({
        name: s.getAttribute("name") ?? s.id,
        value: s.options[s.selectedIndex]?.text?.trim() ?? "",
      })),
    }))
    .catch((e) => ({ error: String(e) }));
  log(`[${label}] page:`, JSON.stringify(info));
}

async function dumpDebug(page: Page, name: string) {
  const html = await page.content().catch(() => "");
  writeFileSync(resolve(SNAP, `${name}.debug.html`), html, "utf8");
  await page.screenshot({ path: resolve(SNAP, `${name}.debug.png`), fullPage: true }).catch(() => {});
  log(`debug files written: ${name}.debug.html / ${name}.debug.png`);
}

async function openPage(browser: Browser, url: string, label: string): Promise<Page> {
  const ctx = await browser.newContext({
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    viewport: { width: 1500, height: 1100 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20_000);
  page.setDefaultNavigationTimeout(NAV_TIMEOUT);
  log(`[${label}] goto ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
  log(`[${label}] domcontentloaded → ${page.url()}`);
  // 봇 검사 스크립트가 재로딩하므로 그리드/아코디언이 생길 때까지 폴링 (최대 60초)
  for (let i = 0; i < 30; i++) {
    const n = await page.locator(".ag-row, .accordion-item, table tbody tr").count().catch(() => 0);
    if (n > 0) break;
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(1500);
  await describePage(page, label);
  return page;
}

/**
 * ag-Grid 를 스크롤하며 모든 행을 수집한다. rootSel 은 그리드를 포함하는 요소 선택자.
 * 헤더는 .ag-header-cell[col-id], 행은 .ag-row[row-index] 의 .ag-cell[col-id] 를 읽는다.
 */
async function scrapeAgGrid(page: Page, rootSel: string, maxSteps = 120): Promise<AgGridData> {
  const headers = await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return [] as { id: string; text: string }[];
    return Array.from(root.querySelectorAll(".ag-header-cell[col-id]")).map((h) => ({
      id: h.getAttribute("col-id") ?? "",
      text: (h.textContent ?? "").replace(/\s+/g, " ").trim(),
    }));
  }, rootSel);

  const collected = new Map<number, Record<string, string>>();
  for (let step = 0; step < maxSteps; step++) {
    const batch = await page.evaluate((sel) => {
      const root = document.querySelector(sel);
      if (!root) return [] as { index: number; cells: Record<string, string> }[];
      return Array.from(root.querySelectorAll(".ag-row[row-index]")).map((r) => ({
        index: Number(r.getAttribute("row-index")),
        cells: Object.fromEntries(
          Array.from(r.querySelectorAll(".ag-cell[col-id]")).map((c) => [
            c.getAttribute("col-id") ?? "",
            ((c as HTMLElement).innerText ?? c.textContent ?? "").replace(/\s+/g, " ").trim(),
          ]),
        ),
      }));
    }, rootSel);
    for (const b of batch) {
      if (Number.isNaN(b.index)) continue;
      collected.set(b.index, { ...(collected.get(b.index) ?? {}), ...b.cells });
    }
    const atEnd = await page.evaluate((sel) => {
      const vp = document.querySelector(`${sel} .ag-body-viewport`) as HTMLElement | null;
      if (!vp) return true;
      const before = vp.scrollTop;
      vp.scrollTop = before + Math.max(200, vp.clientHeight * 0.8);
      return vp.scrollTop === before || vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 2;
    }, rootSel);
    await page.waitForTimeout(200);
    if (atEnd) {
      // 마지막 화면의 행도 한 번 더 수집
      const tail = await page.evaluate((sel) => {
        const root = document.querySelector(sel);
        if (!root) return [] as { index: number; cells: Record<string, string> }[];
        return Array.from(root.querySelectorAll(".ag-row[row-index]")).map((r) => ({
          index: Number(r.getAttribute("row-index")),
          cells: Object.fromEntries(
            Array.from(r.querySelectorAll(".ag-cell[col-id]")).map((c) => [
              c.getAttribute("col-id") ?? "",
              ((c as HTMLElement).innerText ?? c.textContent ?? "").replace(/\s+/g, " ").trim(),
            ]),
          ),
        }));
      }, rootSel);
      for (const b of tail) if (!Number.isNaN(b.index)) collected.set(b.index, { ...(collected.get(b.index) ?? {}), ...b.cells });
      break;
    }
  }
  const rows = [...collected.entries()].sort((a, b) => a[0] - b[0]).map(([, cells]) => cells);
  return { headers, rows };
}

/**
 * 페이지네이션(ag-Grid 내장 또는 사이트 공통 pagination__button)이 있으면 다음 페이지로 넘긴다.
 * 넘길 수 없으면 false.
 */
async function nextPage(page: Page, rootSel: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel) ?? document;
    const candidates = [
      ...Array.from(root.querySelectorAll('.ag-paging-button[ref="btNext"], .ag-paging-button.ag-paging-next, [aria-label*="다음"], [aria-label*="Next"]')),
      ...Array.from(document.querySelectorAll(".pagination__button, .pagination__link, .pagination a, .pagination button")).filter((el) =>
        /다음|next|›|>/i.test((el.textContent ?? "") + (el.getAttribute("aria-label") ?? "") + (el.getAttribute("class") ?? "")),
      ),
    ] as HTMLElement[];
    for (const el of candidates) {
      const disabled =
        el.classList.contains("ag-disabled") ||
        el.getAttribute("aria-disabled") === "true" ||
        (el as HTMLButtonElement).disabled ||
        el.classList.contains("is-disabled") ||
        el.classList.contains("disabled");
      if (disabled) continue;
      el.click();
      return true;
    }
    return false;
  }, rootSel);
}

/** 그리드 전체(스크롤 + 페이지 넘김) 수집 */
async function scrapeAgGridAllPages(page: Page, rootSel: string, maxPages = 60): Promise<AgGridData> {
  const first = await scrapeAgGrid(page, rootSel);
  const all: Record<string, string>[] = [...first.rows];
  const seen = new Set(first.rows.map((r) => JSON.stringify(r)));
  for (let p = 1; p < maxPages; p++) {
    const moved = await nextPage(page, rootSel);
    if (!moved) break;
    await page.waitForTimeout(700);
    const next = await scrapeAgGrid(page, rootSel);
    let added = 0;
    for (const r of next.rows) {
      const k = JSON.stringify(r);
      if (seen.has(k)) continue;
      seen.add(k);
      all.push(r);
      added++;
    }
    if (added === 0) break;
  }
  return { headers: first.headers, rows: all };
}

async function collectRemain(page: Page) {
  const gridSel = (await page.locator("#myGrid").count()) > 0 ? "#myGrid" : ".ag-root-wrapper";
  const grid = await scrapeAgGridAllPages(page, gridSel);
  log(`remain grid headers: ${JSON.stringify(grid.headers)}`);
  log(`remain grid raw rows: ${grid.rows.length}; sample: ${JSON.stringify(grid.rows.slice(0, 2))}`);
  const rows = agRowsToRemain(grid);
  log(`remain parsed sample: ${JSON.stringify(rows.slice(0, 3))}`);
  return rows;
}

async function collectLocalPrice(page: Page) {
  // 페이지 자체 필터(조회 결과 내 클라이언트 필터)로 전기승용만 남겨 그리드 행 수를 줄인다
  const filtered = await page.evaluate(() => {
    const sel = document.querySelector<HTMLSelectElement>("#carTypeFilter, select[name=carTypeFilter]");
    if (!sel) return "no-filter";
    const opt = Array.from(sel.options).find((o) => /전기승용/.test(o.text));
    if (!opt) return "no-option";
    sel.value = opt.value;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    return `set:${opt.text}`;
  });
  log(`local-price carTypeFilter → ${filtered}`);
  await page.waitForTimeout(1500);

  const items = await page.evaluate(() =>
    Array.from(document.querySelectorAll("#localAccordion .accordion-item, .accordion-item")).map((el, i) => ({
      index: i,
      district: (el.querySelector(".location__district")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      city: (el.querySelector(".location__city")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      header: (el.querySelector(".accordion-header")?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
    })),
  );
  log(`local-price accordion items: ${items.length}; first: ${JSON.stringify(items.slice(0, 3))}`);
  const out: ReturnType<typeof agRowsToLocalPrice> = [];
  let logged = 0;
  for (const it of items) {
    if (elapsed() > TOTAL_BUDGET_MS * 0.92) {
      log("time budget reached, stop expanding accordions");
      break;
    }
    const itemSel = `.accordion-item:nth-of-type(${it.index + 1})`;
    try {
      // 일반 클릭은 오버레이/가시성 문제로 타임아웃이 나므로 JS 로 직접 클릭
      const clicked = await page.evaluate((sel) => {
        const item = document.querySelector(sel);
        if (!item) return "no-item";
        const btn = (item.querySelector(".accordion-button") ?? item.querySelector(".accordion-header button") ?? item.querySelector(".accordion-header")) as HTMLElement | null;
        if (!btn) return "no-button";
        item.scrollIntoView({ block: "center" });
        btn.click();
        return btn.getAttribute("aria-expanded") ?? "clicked";
      }, itemSel);
      // 그리드 행이 생길 때까지 최대 3초 폴링
      let rowsInItem = 0;
      for (let i = 0; i < 15; i++) {
        rowsInItem = await page.locator(`${itemSel} .ag-row`).count().catch(() => 0);
        if (rowsInItem > 0) break;
        await page.waitForTimeout(200);
      }
      const grid = await scrapeAgGrid(page, itemSel, 8);
      if (logged < 3) {
        log(`  [${it.city} ${it.district}] click=${clicked} rows=${grid.rows.length} headers: ${JSON.stringify(grid.headers)} sample: ${JSON.stringify(grid.rows.slice(0, 2))}`);
        logged++;
      }
      // .location__city = 시·도 약칭, .location__district = 지역명 (광역시는 시·도명)
      const rows = agRowsToLocalPrice(grid, it.city, it.district);
      out.push(...rows);
      if (rows.length === 0 && logged < 6) {
        log(`  [${it.city} ${it.district}] no local-price row (rows=${grid.rows.length})`);
        logged++;
      }
      // 접어서 DOM 크기 유지
      await page.evaluate((sel) => {
        const item = document.querySelector(sel);
        const btn = item?.querySelector(".accordion-button") as HTMLElement | null;
        if (btn && btn.getAttribute("aria-expanded") === "true") btn.click();
      }, itemSel).catch(() => {});
    } catch (e) {
      log(`  [${it.city} ${it.district}] failed: ${(e as Error).message.split("\n")[0]}`);
    }
  }
  return out;
}

async function main() {
  const now = new Date().toISOString();
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const killer = setTimeout(() => {
    console.error("total time budget exceeded, aborting");
    process.exit(3);
  }, TOTAL_BUDGET_MS + 30_000);
  let ok = false;
  try {
    // 1) 지자체별 보조금 현황
    try {
      const page = await openPage(browser, EV_PORTAL.remain, "remain");
      const rows = await collectRemain(page);
      log(`remain rows: ${rows.length}`);
      if (rows.length > 0) {
        save("remain.json", { ...readJson("remain.json"), fetchedAt: now, rows });
        ok = true;
      } else {
        await dumpDebug(page, "remain");
        console.warn("remain: 0 rows — 로그의 grid headers 를 보고 lib/ev/aggrid.ts 의 열 분류를 조정하세요.");
      }
      await page.context().close();
    } catch (e) {
      console.error("remain failed:", (e as Error).message.split("\n")[0]);
    }

    // 2) 지자체별 차종·모델 보조금 (승용 지방비)
    if (elapsed() < TOTAL_BUDGET_MS * 0.5) {
      try {
        const page = await openPage(browser, EV_PORTAL.localPrice, "local-price");
        const rows = await collectLocalPrice(page);
        log(`local-price rows: ${rows.length}; sample: ${JSON.stringify(rows.slice(0, 3))}`);
        if (rows.length > 0) {
          save("local-price.json", { ...readJson("local-price.json"), updatedAt: now.slice(0, 10), rows });
        } else {
          await dumpDebug(page, "local-price");
        }
        await page.context().close();
      } catch (e) {
        console.error("local-price failed:", (e as Error).message.split("\n")[0]);
      }
    } else {
      log("skipping local-price (time budget)");
    }
  } finally {
    clearTimeout(killer);
    await browser.close();
  }
  if (!ok && process.env.CI) process.exitCode = 2;
}

main();
