/**
 * 지역별 접수·출고·잔여 일별 이력(data/snapshot/remain-history.json).
 * - `--rebuild`: git 이력(data/snapshot/remain.json 의 모든 커밋)에서 처음부터 다시 만든다. 전체 이력이 필요하므로 unshallow 클론에서 실행.
 * - 기본(append): 현재 remain.json 을 기존 이력에 그날(KST) 값으로 덮어쓴다. 수집 워크플로가 매 실행마다 호출한다.
 * 한 지역·하루에 한 점(그날 마지막 수집값). 승용 행만. 값은 임의로 만들지 않는다.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { RemainRow } from "../lib/ev/types";
import { parseRemainNote } from "../lib/ev/remainSummary";

const OUT = "data/snapshot/remain-history.json";
const SRC = "data/snapshot/remain.json";

/** [KST 날짜, 공고, 접수, 출고, 출고잔여, 공고 차수 수, 신청마감(1/0), 마감 표시] */
export type HistoryPoint = [string, number | null, number | null, number | null, number | null, number, 0 | 1, string];
export interface RemainHistory {
  updatedAt: string;
  /** key = `${시·도 약칭}|${지역명}` */
  regions: Record<string, HistoryPoint[]>;
}

const kstDate = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
};

function points(snap: { fetchedAt: string; rows: RemainRow[] }): [string, HistoryPoint][] {
  const day = kstDate(snap.fetchedAt);
  return (snap.rows ?? [])
    .filter((r) => /승용/.test(r.vehicleType) || !r.vehicleType)
    .map((r) => {
      const n = parseRemainNote(r.note);
      const rounds = n.rounds ? n.rounds.split("·").filter(Boolean).length : 0;
      const closed: 0 | 1 = n.status?.includes("마감") ? 1 : 0;
      return [`${r.sido}|${r.region}`, [day, r.announced, r.applied, r.released, r.remaining, rounds, closed, n.deadline ?? ""]];
    });
}

function upsert(h: RemainHistory, snap: { fetchedAt: string; rows: RemainRow[] }) {
  if (!snap.rows?.length || Number.isNaN(new Date(snap.fetchedAt).getTime())) return;
  for (const [key, p] of points(snap)) {
    const list = (h.regions[key] ??= []);
    const i = list.findIndex((x) => x[0] === p[0]);
    if (i >= 0) list[i] = p;
    else list.push(p);
    list.sort((a, b) => a[0].localeCompare(b[0]));
  }
  if (snap.fetchedAt > h.updatedAt) h.updatedAt = snap.fetchedAt;
}

function main() {
  const rebuild = process.argv.includes("--rebuild");
  const h: RemainHistory = !rebuild && existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { updatedAt: "", regions: {} };
  if (rebuild) {
    const shas = execFileSync("git", ["log", "--format=%H", "--reverse", "HEAD", "--", SRC], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const sha of shas) {
      try {
        upsert(h, JSON.parse(execFileSync("git", ["show", `${sha}:${SRC}`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })));
      } catch {
        /* 깨진 커밋은 건너뛴다 */
      }
    }
  }
  upsert(h, JSON.parse(readFileSync(SRC, "utf8")));
  // 값이 바뀐 날과 마지막 날만 남긴다(같은 값이 이어지는 날은 앞 점으로 복원 가능)
  const compact = (list: HistoryPoint[]) =>
    list.filter((p, i) => i === 0 || i === list.length - 1 || JSON.stringify(p.slice(1)) !== JSON.stringify(list[i - 1].slice(1)));
  const sorted: RemainHistory = { updatedAt: h.updatedAt, regions: Object.fromEntries(Object.keys(h.regions).sort().map((k) => [k, compact(h.regions[k])])) };
  writeFileSync(OUT, JSON.stringify(sorted) + "\n");
  const n = Object.values(sorted.regions);
  console.log(`remain history: ${n.length} regions, ${n.reduce((a, l) => a + l.length, 0)} points, ${n[0]?.[0]?.[0] ?? "-"} ~ ${kstDate(sorted.updatedAt || new Date().toISOString())}`);
}
main();
