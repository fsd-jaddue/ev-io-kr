/**
 * 정책 공지 감시. 환경부 보도·설명자료 목록과 무공해차 통합누리집 공지사항에서
 * 전기차 보조금 관련 키워드가 들어간 새 글을 찾아 보고서를 만든다(GitHub Actions 가 Issue 로 올림).
 *
 * - 본 적 있는 글은 data/snapshot/notices.json 에 기록한다. 소스별 첫 실행은 현재 목록을 조용히 저장만 한다(과거 글 폭주 방지).
 * - 페이지 구조를 미리 알 수 없으므로 목록 페이지의 모든 링크 텍스트를 읽어 키워드로 거른다(구조 변화에 둔감).
 * - ev.or.kr 은 봇 검사 때문에 헤드리스 크롬으로 연다. 메인에서 "공지" 링크를 찾아 따라간다.
 *
 * 사용: npx tsx scripts/watch-notices.ts [--out notices-new.md]
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as cheerio from "cheerio";
import { chromium, type Browser } from "playwright";

const ROOT = resolve(__dirname, "..");
const STATE = resolve(ROOT, "data/snapshot/notices.json");
const args = process.argv.slice(2);
const i = args.indexOf("--out");
const OUT = resolve(ROOT, i >= 0 && args[i + 1] ? args[i + 1] : "notices-new.md");
const TITLE_OUT = OUT.replace(/\.md$/, "-title.txt");
const log = (...a: unknown[]) => console.log("[notices]", ...a);

interface Source {
  id: string;
  name: string;
  url: string;
  /** 목록 페이지로 가기 위해 따라갈 링크 텍스트 (메인에서 공지 메뉴 찾기) */
  follow?: RegExp;
}
const SOURCES: Source[] = [
  // 환경부는 2025년 기후에너지환경부(mcee.go.kr)로 개편돼 옛 me.go.kr 주소는 404. 메인에서 보도자료 메뉴를 찾아 들어간다
  { id: "me-press", name: "기후에너지환경부 보도·설명자료", url: "https://mcee.go.kr/", follow: /보도자료|보도·설명|보도\/설명|보도 자료/ },
  // 2026-09 확인된 공지사항 목록 주소 (메인의 "공지사항" 링크가 여기로 온다)
  { id: "ev-notice", name: "무공해차 통합누리집 공지사항", url: "https://ev.or.kr/nportal/partcptn/initNoticeAction.do", follow: /공지사항/ },
];
/** 보조금 정책과 관련 있는 글만 */
const STRONG = /(보조금|지침|무공해차|전기차|전기승용)/;
const WEAK = /(개편|개정|확정|공고|지원|예산|지급|업무처리|시행)/;
/** 게시글 링크처럼 보이는 주소만 (메뉴·안내 페이지 제외). 예: board/generalView.do?ARTC_ID=…, board/read.do?…, nttId=… */
const ARTICLE_HREF = /(view|read|detail|artc_id|nttid|boardid|bbsid|articleno|seq=|idx=|\/board\/|\/news\/|\/press)/i;

export interface NoticeItem {
  source: string;
  title: string;
  href: string;
  firstSeen: string;
}
interface State {
  checkedAt: string;
  items: NoticeItem[];
}

/** 메뉴·머리글·바닥글 안의 링크는 게시글이 아니다 */
const CHROME_SELECTOR = "nav, header, footer, .gnb, .lnb, .snb, .quick, #header, #footer, #gnb, #lnb, .header, .footer, .menu, .navi";

export interface ExtractResult {
  items: { title: string; href: string }[];
  /** 진단용: 전체 링크 수, 키워드 제목 링크 수(필터 전), 샘플 */
  anchors: number;
  keywordHits: number;
  samples: string[];
}

/**
 * 목록 HTML 에서 후보 링크 추출 (제목 6자 이상, 키워드 포함).
 * - 실제 주소면 게시글형(ARTICLE_HREF)만, javascript:/# 로 여는 게시판(공공기관에 흔함)이면 목록 페이지 주소 + #제목 으로 기록한다.
 * - 메뉴·머리글·바닥글 안의 링크는 제외한다.
 */
export function extractCandidates(html: string, baseUrl: string): ExtractResult {
  const $ = cheerio.load(html);
  const items: { title: string; href: string }[] = [];
  const seen = new Set<string>();
  const samples: string[] = [];
  let keywordHits = 0;
  const anchors = $("a[href]").length;
  $("a[href]").each((_, a) => {
    const title = $(a).text().replace(/\s+/g, " ").trim();
    const raw = ($(a).attr("href") ?? "").trim();
    if (title.length < 6 || !raw || /^mailto:/i.test(raw)) return;
    if (!STRONG.test(title) || !(WEAK.test(title) || /보조금/.test(title))) return;
    keywordHits++;
    if (samples.length < 6) samples.push(`${title.slice(0, 40)} | ${raw.slice(0, 80)}`);
    if ($(a).closest(CHROME_SELECTOR).length > 0) return;
    const isScript = /^(javascript:|#)/i.test(raw);
    if (!isScript && !ARTICLE_HREF.test(raw)) return;
    let href: string;
    try {
      href = isScript ? `${baseUrl.split("#")[0]}#${encodeURIComponent(title.slice(0, 60))}` : new URL(raw, baseUrl).toString();
    } catch {
      return;
    }
    const key = `${title}|${href}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ title, href });
  });
  return { items, anchors, keywordHits, samples };
}

function readState(): State {
  if (!existsSync(STATE)) return { checkedAt: "", items: [] };
  try {
    return JSON.parse(readFileSync(STATE, "utf8")) as State;
  } catch {
    return { checkedAt: "", items: [] };
  }
}

async function loadHtml(browser: Browser, src: Source): Promise<{ html: string; url: string }> {
  const ctx = await browser.newContext({
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20_000);
  await page.goto(src.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  // 봇 검사 재로딩 대기: 링크가 충분히 생길 때까지 폴링
  for (let k = 0; k < 20; k++) {
    const n = await page.locator("a[href]").count().catch(() => 0);
    if (n > 20) break;
    await page.waitForTimeout(1500);
  }
  if (src.follow) {
    const target = await page.evaluate((pattern) => {
      const re = new RegExp(pattern);
      const a = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).find(
        (el) => re.test((el.textContent ?? "").trim()) && !/^(javascript:|#)/.test(el.getAttribute("href") ?? ""),
      );
      return a ? a.href : null;
    }, src.follow.source);
    if (target && target.split("#")[0] === page.url().split("#")[0]) {
      log(`${src.id}: already on ${target}`);
    } else if (target) {
      log(`${src.id}: follow → ${target}`);
      await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => {});
      await page.waitForTimeout(2500);
    } else {
      log(`${src.id}: no link matching ${src.follow} on ${src.url}; scanning main page instead`);
    }
  }
  // 목록이 AJAX 로 늦게 그려지는 게시판이 많으므로 네트워크가 잠잠해질 때까지 + 여유 대기
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const html = await page.content();
  const url = page.url();
  await ctx.close();
  return { html, url };
}

async function main() {
  const state = readState();
  const now = new Date().toISOString();
  const known = new Set(state.items.map((it) => `${it.source}|${it.title}|${it.href}`));
  const fresh: NoticeItem[] = [];
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PW_CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });
  try {
    for (const src of SOURCES) {
      try {
        const { html, url } = await loadHtml(browser, src);
        const { items: cands, anchors, keywordHits, samples } = extractCandidates(html, url);
        const seeded = state.items.some((it) => it.source === src.id);
        log(`${src.id}: ${cands.length} candidate links at ${url} (anchors ${anchors}, keyword titles ${keywordHits})${seeded ? "" : " (first run — seeding only)"}`);
        for (const smp of samples) log(`  sample: ${smp}`);
        for (const c of cands.slice(0, 40)) {
          const key = `${src.id}|${c.title}|${c.href}`;
          if (known.has(key)) continue;
          known.add(key);
          const item: NoticeItem = { source: src.id, title: c.title, href: c.href, firstSeen: now };
          state.items.unshift(item);
          if (seeded) fresh.push(item);
          else log(`  seed: ${c.title}`);
        }
      } catch (e) {
        log(`${src.id} failed: ${(e as Error).message.split("\n")[0]}`);
      }
    }
  } finally {
    await browser.close();
  }
  state.checkedAt = now;
  state.items = state.items.slice(0, 400);
  writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n", "utf8");

  const found = fresh.length > 0;
  if (found) {
    const today = now.slice(0, 10);
    const names = new Map(SOURCES.map((s) => [s.id, s.name]));
    const body = [
      "전기차 보조금 정책과 관련해 보이는 새 공지·보도자료입니다. 내용을 확인하고 국비·지방비 상한, 가격 구간, 전환지원금, 가이드 본문, `data/cars.ts` 등에 반영할 것이 있는지 판단하세요.",
      "",
      ...fresh.map((it) => `- [${names.get(it.source) ?? it.source}] [${it.title}](${it.href})`),
      "",
      "---",
      "_이 이슈는 `.github/workflows/notices.yml` 의 `scripts/watch-notices.ts` 가 자동으로 만들었습니다._",
    ];
    writeFileSync(OUT, body.join("\n") + "\n", "utf8");
    writeFileSync(TITLE_OUT, `[정책 공지] ${today} 새 글 ${fresh.length}건\n`, "utf8");
    for (const it of fresh) log(`NEW: ${it.title} — ${it.href}`);
  }
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `found=${found ? "true" : "false"}\n`);
  log(`done: ${fresh.length} new`);
}

if (process.env.NOTICES_NO_RUN !== "1") main();
