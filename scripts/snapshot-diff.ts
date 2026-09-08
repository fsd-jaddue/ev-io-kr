/**
 * 수집 스냅샷 변경 감지. 커밋 전에 실행해 `git show <base>:data/snapshot/*.json`(직전 값)과 작업본을 비교하고,
 * 의미 있는 변경(지방비 금액, 공고 물량·종류, 소진/재개, 모델별 국비, 차종 매칭 상태)만 골라 마크다운 보고서를 만든다.
 * 접수·출고·잔여 대수의 단순 증감은 매시간 바뀌므로 보고하지 않는다.
 *
 * 사용: npx tsx scripts/snapshot-diff.ts [--base HEAD] [--out snapshot-diff.md]
 * - 변경이 있으면 보고서와 제목 파일(snapshot-diff-title.txt)을 쓰고, GITHUB_OUTPUT 에 changed=true 를 기록한다.
 */
import { execSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CarSubsidyRow, CarsSnapshot, LocalPriceRow, RemainRow } from "../lib/ev/types";
import { getSido } from "../data/regions";
import { CARS } from "../data/cars";
import { matchCarRows } from "../lib/ev/carsOverlay";

const ROOT = resolve(__dirname, "..");
const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const BASE = opt("--base", "HEAD");
const OUT = resolve(ROOT, opt("--out", "snapshot-diff.md"));
const TITLE_OUT = OUT.replace(/\.md$/, "-title.txt");

function readPrev<T>(file: string): T | null {
  try {
    const txt = execSync(`git show ${BASE}:data/snapshot/${file}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}
function readCur<T>(file: string): T | null {
  const p = resolve(ROOT, "data/snapshot", file);
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : null;
}

const won = (n: number | null | undefined) => (n === null || n === undefined ? "공고 확인" : `${n.toLocaleString("ko-KR")}만원`);
const sidoName = (slug: string) => getSido(slug)?.short ?? slug;

interface Section {
  title: string;
  lines: string[];
}

/** 지방비(시·군·구별 승용 최대액) 변경 */
export function diffLocalPrice(prev: LocalPriceRow[] | undefined, cur: LocalPriceRow[] | undefined): Section {
  const lines: string[] = [];
  if (!prev || !cur) return { title: "지방비", lines };
  const key = (r: LocalPriceRow) => `${r.sido}|${r.sigungu}`;
  const p = new Map(prev.map((r) => [key(r), r]));
  const c = new Map(cur.map((r) => [key(r), r]));
  for (const [k, r] of c) {
    const o = p.get(k);
    const label = `${sidoName(r.sido)} ${r.sigungu}`;
    if (!o) lines.push(`- 신규: ${label} ${won(r.amount)}`);
    else if (o.amount !== r.amount) lines.push(`- ${label}: ${won(o.amount)} → **${won(r.amount)}**`);
  }
  for (const [k, r] of p) if (!c.has(k)) lines.push(`- 삭제: ${sidoName(r.sido)} ${r.sigungu} (${won(r.amount)})`);
  return { title: "지방비 변경 (시·군·구별 승용 최대액)", lines };
}

function kindsOf(note?: string): string {
  return (note ?? "").split(" · ")[0] ?? "";
}
function closedOf(note?: string): boolean {
  return /신청마감|접수마감/.test(note ?? "");
}

/** 접수·출고·잔여 현황에서 공고 단위의 변화만 추린다 */
export function diffRemain(prev: RemainRow[] | undefined, cur: RemainRow[] | undefined): Section {
  const lines: string[] = [];
  if (!prev || !cur) return { title: "공고", lines };
  const key = (r: RemainRow) => `${r.sido}|${r.region}|${r.vehicleType}`;
  const p = new Map(prev.map((r) => [key(r), r]));
  const c = new Map(cur.map((r) => [key(r), r]));
  for (const [k, r] of c) {
    const o = p.get(k);
    const label = `${r.sido} ${r.region}${r.vehicleType && r.vehicleType !== "승용" ? ` (${r.vehicleType})` : ""}`;
    if (!o) {
      lines.push(`- 신규 지역: ${label} 공고 ${won(r.announced).replace("만원", "대")}`);
      continue;
    }
    if (o.announced !== r.announced) lines.push(`- ${label}: 공고 물량 ${o.announced ?? "-"}대 → **${r.announced ?? "-"}대**`);
    const ok = kindsOf(o.note);
    const nk = kindsOf(r.note);
    if (ok !== nk && nk) lines.push(`- ${label}: 공고 종류 ${ok || "-"} → **${nk}**`);
    const wasOut = o.remaining !== null && o.remaining <= 0;
    const isOut = r.remaining !== null && r.remaining <= 0;
    if (!wasOut && isOut) lines.push(`- ${label}: **소진** (잔여 ${o.remaining} → ${r.remaining})`);
    if (wasOut && !isOut) lines.push(`- ${label}: **잔여 재개** (잔여 ${o.remaining} → ${r.remaining})`);
    if (closedOf(o.note) !== closedOf(r.note)) lines.push(`- ${label}: ${closedOf(r.note) ? "**신청 마감**" : "**접수 재개**"}`);
  }
  for (const [k, r] of p) if (!c.has(k)) lines.push(`- 목록에서 사라짐: ${r.sido} ${r.region}`);
  return { title: "공고 변경 (물량·종류·소진·마감)", lines };
}

/** 모델별 국비 변경 */
export function diffCars(prev: CarSubsidyRow[] | undefined, cur: CarSubsidyRow[] | undefined): Section {
  const lines: string[] = [];
  if (!prev || !cur || cur.length === 0) return { title: "국비", lines };
  const key = (r: CarSubsidyRow) => `${r.maker}|${r.model}`;
  const p = new Map(prev.map((r) => [key(r), r]));
  const c = new Map(cur.map((r) => [key(r), r]));
  for (const [k, r] of c) {
    const o = p.get(k);
    if (!o) lines.push(`- 신규 모델: ${r.maker} ${r.model} 국비 ${won(r.national)}`);
    else if (o.national !== r.national) lines.push(`- ${r.maker} ${r.model}: 국비 ${won(o.national)} → **${won(r.national)}**`);
  }
  for (const [k, r] of p) if (!c.has(k)) lines.push(`- 목록에서 사라짐: ${r.maker} ${r.model} (${won(r.national)})`);
  return { title: "모델별 국비 변경 (누리집 차종·모델 보조금)", lines };
}

/** 사이트 차종 목록과 누리집 모델의 매칭 상태 (cars.json 이 바뀐 회차에만 첨부) */
export function carMatchReport(rows: CarSubsidyRow[]): string[] {
  if (rows.length === 0) return [];
  const lines: string[] = [];
  for (const car of CARS) {
    const m = matchCarRows(car, rows);
    const name = `${car.brand} ${car.model} ${car.trim}`;
    if (m.reason === "applied") lines.push(`- ✅ ${name} → ${m.matched.map((r) => r.model).join(", ")} = ${won(m.applied)}`);
    else if (m.reason === "ambiguous")
      lines.push(`- ⚠️ ${name}: 매칭 행의 국비가 서로 달라 수기값(${won(car.national)}) 유지 — ${m.matched.map((r) => `${r.model} ${won(r.national)}`).join(", ")}. \`data/cars.ts\` 의 evMatch 를 좁히세요.`);
    else lines.push(`- ❌ ${name}: 누리집 행 없음 (evMatch \`${car.evMatch ?? "-"}\`), 수기값 ${won(car.national)} 유지`);
  }
  return lines;
}

function main() {
  const prevLocal = readPrev<{ rows: LocalPriceRow[] }>("local-price.json");
  const curLocal = readCur<{ rows: LocalPriceRow[]; updatedAt: string }>("local-price.json");
  const prevRemain = readPrev<{ rows: RemainRow[] }>("remain.json");
  const curRemain = readCur<{ rows: RemainRow[]; fetchedAt: string }>("remain.json");
  const prevCars = readPrev<CarsSnapshot>("cars.json");
  const curCars = readCur<CarsSnapshot>("cars.json");

  const sections = [
    diffLocalPrice(prevLocal?.rows, curLocal?.rows),
    diffRemain(prevRemain?.rows, curRemain?.rows),
    diffCars(prevCars?.rows, curCars?.rows),
  ];
  const carsChanged = JSON.stringify(prevCars?.rows ?? []) !== JSON.stringify(curCars?.rows ?? []);
  const counts = sections.map((s) => s.lines.length);
  const changed = counts.some((n) => n > 0) || carsChanged;

  const today = new Date().toISOString().slice(0, 10);
  const summary = [
    counts[0] ? `지방비 ${counts[0]}건` : "",
    counts[1] ? `공고 ${counts[1]}건` : "",
    counts[2] ? `국비 ${counts[2]}건` : carsChanged ? "국비 목록 갱신" : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const title = `[자료 변경] ${today} ${summary || "변경 없음"}`;

  const body: string[] = [
    `무공해차 통합누리집 수집값이 직전 스냅샷과 달라졌습니다. 사이트에는 이미 자동 반영되었고, 아래 항목이 가이드·소개문·차종 설명과 어긋나지 않는지 확인하세요.`,
    "",
    `- 접수 현황 기준: ${curRemain?.fetchedAt ?? "-"} · 지방비 기준: ${curLocal?.updatedAt ?? "-"} · 국비 목록 기준: ${curCars?.updatedAt || "-"}`,
    "",
  ];
  for (const s of sections) {
    if (s.lines.length === 0) continue;
    body.push(`## ${s.title}`, ...s.lines, "");
  }
  if (carsChanged && curCars?.rows?.length) {
    body.push("## 사이트 차종 ↔ 누리집 모델 매칭 상태", ...carMatchReport(curCars.rows), "");
  }
  body.push("---", "_이 이슈는 `.github/workflows/snapshot.yml` 의 `scripts/snapshot-diff.ts` 가 자동으로 만들었습니다._");

  console.log(`snapshot-diff: base=${BASE} changed=${changed} (${summary || "none"})`);
  for (const s of sections) for (const l of s.lines) console.log("  " + l);
  if (changed) {
    writeFileSync(OUT, body.join("\n") + "\n", "utf8");
    writeFileSync(TITLE_OUT, title + "\n", "utf8");
  }
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed ? "true" : "false"}\n`);
}

main();
