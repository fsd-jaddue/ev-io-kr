/**
 * 지역 페이지의 데이터 기반 문장·체크리스트·FAQ 생성기 (순수 함수).
 * 모든 숫자는 수집값·통계에서만 나온다. 잔여 대수는 수집 행이 있을 때만 언급한다(임의 값 금지).
 * FAQ 배열은 화면 <dl> 과 faqJsonLd() 에 같은 것을 넘긴다(본문·JSON-LD 불일치 금지).
 */
import type { Car, RemainRow, Sido } from "./types";
import type { RankInfo, SidoMaxRank, SidoPriceStats } from "./localPriceStats";
import { LEVEL_META, parseRemainNote, remainLevel, type SidoRemainSummary, type TopSigunguRow } from "./remainSummary";
import { estimateTotal } from "./summary";
import { formatFetchedAt } from "./format";
import { NATIONAL_MAX } from "@/data/cars";
import { SIDO_INTRO } from "@/data/sido-intro";

export interface Faq {
  q: string;
  a: string;
}

const n = (v: number) => v.toLocaleString("ko-KR");

/** 은/는 조사: 마지막 글자의 받침 유무로 고른다 (한글이 아니면 "은(는)") */
export function eunNeun(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}은(는)`;
  return `${word}${code % 28 === 0 ? "는" : "은"}`;
}
const rankText = (r: RankInfo) => `${r.rank}위${r.ties > 1 ? ` (공동 ${r.ties}곳)` : ""}`;

export interface SigunguFacts {
  sido: Sido;
  name: string;
  amount: number | null;
  stats: SidoPriceStats;
  rankSido: RankInfo | null;
  rankNational: RankInfo | null;
  /** 17개 시·도 최대액 순위에서 이 시·도의 위치 */
  sidoRank: SidoMaxRank | undefined;
  remainRow: RemainRow | null;
  /** remain.json fetchedAt (ISO) */
  fetchedAt: string;
  /** 국비 최고 차종 (예시 계산용) */
  topCar: Car;
}

/** 도입부 비교 문단 */
export function sigunguComparison(f: SigunguFacts): string {
  const { sido, name, amount, stats } = f;
  if (amount === null) {
    const range =
      stats.known > 0 && stats.min !== null && stats.max !== null
        ? ` ${sido.short} 안에서 확인된 ${stats.known}곳은 ${stats.min === stats.max ? `${n(stats.max)}만원` : `${n(stats.min)}~${n(stats.max)}만원`} 범위입니다.`
        : "";
    return `${sido.name} ${name}의 2026년 승용 전기차 지방비는 아직 이 사이트에 반영되지 않았습니다.${range} 국비는 차종에 따라 최대 ${NATIONAL_MAX.large}만원이며, 실제 지방비는 공고에서 확인해야 합니다.`;
  }
  const total = amount + NATIONAL_MAX.large;
  const sums = `국비 최대 ${NATIONAL_MAX.large}만원과 합산하면 ${n(total)}만원, 내연기관차를 처분하는 전환지원금까지 더하면 ${n(total + NATIONAL_MAX.conversion)}만원까지 받을 수 있습니다.`;
  if (stats.uniform) {
    const rank = f.sidoRank?.rank ? ` 17개 시·도 최대 지방비 기준으로는 ${f.sidoRank.rank}위입니다.` : "";
    return `${eunNeun(sido.name)} ${stats.count}개 시·군·구 구분 없이 단일 공고로 운영되어 ${name}도 다른 지역과 같은 ${n(amount)}만원을 받습니다.${rank} ${sums}`;
  }
  if (stats.equal) {
    const rank = f.sidoRank?.rank ? ` 17개 시·도 최대 지방비 기준으로 ${sido.short}는 ${f.sidoRank.rank}위입니다.` : "";
    const remain =
      f.remainRow && f.remainRow.region !== sido.name
        ? ` 다만 공고는 ${name}이 따로 내므로 물량과 잔여 대수는 ${sido.short} 다른 시·군과 다릅니다.`
        : ` 다만 공고와 물량은 시·군별로 따로 운영되므로 잔여 대수는 지역마다 다릅니다.`;
    return `${sido.short} ${stats.count}개 시·군은 2026년 승용 지방비를 모두 ${n(amount)}만원으로 공고해 ${name}도 같은 금액입니다.${rank}${remain} ${sums}`;
  }
  const parts: string[] = [];
  if (f.rankSido) parts.push(`${name} 승용 지방비 ${n(amount)}만원은 ${sido.short} ${f.rankSido.total}개 시·군·구 중 ${rankText(f.rankSido)}입니다.`);
  if (stats.max !== null && stats.min !== null && stats.avg !== null) {
    const diff = amount - stats.avg;
    const cmp = diff === 0 ? "평균과 같습니다" : `평균 ${n(stats.avg)}만원보다 ${n(Math.abs(diff))}만원 ${diff > 0 ? "높습니다" : "낮습니다"}`;
    parts.push(`${sido.short} 최고는 ${stats.maxNames.slice(0, 3).join("·")} ${n(stats.max)}만원, 최저는 ${stats.minNames.slice(0, 3).join("·")} ${n(stats.min)}만원이며 ${eunNeun(name)} ${cmp}.`);
  }
  if (f.rankNational) parts.push(`전국 ${f.rankNational.total}개 시·군·구 중에서는 ${rankText(f.rankNational)}입니다.`);
  parts.push(sums);
  return parts.join(" ");
}

/** 신청 전 체크리스트 — 시·도·공고 상황을 반영 */
export function sigunguChecklist(f: SigunguFacts): string[] {
  const { sido, name, stats, remainRow } = f;
  const note = parseRemainNote(remainRow?.note);
  const out: string[] = [];
  if (stats.uniform || (remainRow && remainRow.region === sido.name)) {
    out.push(`공고 주체가 ${sido.name}(단일 공고)인지 확인 — ${name} 별도 공고가 아니라 ${sido.name} 공고의 접수 상태와 잔여 물량이 적용됩니다`);
  } else if (remainRow) {
    const bits = [note.rounds ? `공고 종류 ${note.rounds}` : "", note.status ? `상태 ${note.status}` : "", note.deadline ? `마감 ${note.deadline}` : note.period ? `접수 ${note.period}` : ""].filter(Boolean);
    out.push(`${name} 자체 공고의 접수 상태 확인${bits.length ? ` — ${formatFetchedAt(f.fetchedAt)} 기준 ${bits.join(", ")}` : ""}`);
  } else {
    out.push(`${sido.name} 또는 ${name} 2026년 전기차 보급사업 공고에서 접수 기간·물량·우선순위 대상 확인`);
  }
  out.push(`공고일 기준 ${name}에 30일 이상 주민등록(법인은 사업장 소재지)이 되어 있는지`);
  out.push("최근 2년 내 전기차 보조금을 받은 이력이 없는지(재지원 제한 지역 확인)");
  out.push("구매 차종이 보조금 지급대상 차종 목록에 있는지, 차량가 5,300만원·8,500만원 기준선 어디에 해당하는지");
  out.push(`내연기관차를 처분(폐차·이전)하면 전환지원금 ${NATIONAL_MAX.conversion}만원 대상이 되는지`);
  out.push("대상자 선정 후 2개월 내 출고 가능한 계약인지(출고 지연 시 자격 취소)");
  return out;
}

/** 시·도 공고 특징 (SIDO_INTRO points) */
export function sidoPoints(sidoSlug: string): string[] {
  return SIDO_INTRO[sidoSlug]?.points ?? [];
}

function remainAnswer(label: string, row: RemainRow, fetchedAt: string): string {
  const note = parseRemainNote(row.note);
  const level = LEVEL_META[remainLevel(row.remaining, row.announced)];
  const nums = [
    row.announced !== null ? `공고 ${n(row.announced)}대` : "",
    row.applied !== null ? `접수 ${n(row.applied)}대` : "",
    row.released !== null ? `출고 ${n(row.released)}대` : "",
    row.remaining !== null ? `잔여 ${n(row.remaining)}대(${level.label})` : "",
  ].filter(Boolean);
  const tail = [note.status ? note.status : "", note.deadline ? `마감 ${note.deadline}` : note.period ? `접수 기간 ${note.period}` : ""].filter(Boolean).join(", ");
  return `${formatFetchedAt(fetchedAt)} 기준 ${label} 승용 전기차 ${nums.join(", ")}입니다.${tail ? ` 공고 상태는 ${tail}.` : ""} 잔여 대수는 무공해차 통합누리집 수집값이며 매시간 갱신됩니다.`;
}

export function sigunguFaq(f: SigunguFacts): Faq[] {
  const { sido, name, amount, stats } = f;
  const out: Faq[] = [];
  if (amount === null) {
    out.push({
      q: `${sido.short} ${name} 2026년 전기차 보조금은 최대 얼마인가요?`,
      a: `${name}의 승용 지방비는 아직 확인되지 않았습니다. 국비는 차종별로 최대 ${NATIONAL_MAX.large}만원(소형 ${NATIONAL_MAX.small}만원)이며, 여기에 ${name} 공고의 지방비가 더해집니다. 정확한 지방비는 무공해차 통합누리집의 지자체별 차종·모델 보조금에서 확인하세요.`,
    });
  } else {
    const total = amount + NATIONAL_MAX.large;
    out.push({
      q: `${sido.short} ${name} 2026년 전기차 보조금은 최대 얼마인가요?`,
      a: `승용 지방비 최대 ${n(amount)}만원에 국비 최대 ${NATIONAL_MAX.large}만원을 더해 ${n(total)}만원까지 받을 수 있습니다. 내연기관차를 처분하고 구매하면 전환지원금 ${NATIONAL_MAX.conversion}만원이 추가돼 ${n(total + NATIONAL_MAX.conversion)}만원이 됩니다. 지방비는 국비 산정액에 비례하므로 국비가 낮은 차종은 지방비도 줄어듭니다.`,
    });
    if (stats.uniform) {
      out.push({
        q: `${name} 지방비는 ${sido.short} 다른 지역과 다른가요?`,
        a: `아닙니다. ${eunNeun(sido.name)} ${stats.count}개 시·군·구 구분 없이 단일 공고로 운영해 어디에 살든 같은 ${n(amount)}만원입니다.${f.sidoRank?.rank ? ` 17개 시·도의 최대 지방비를 비교하면 ${f.sidoRank.rank}위입니다.` : ""}`,
      });
    } else if (stats.equal) {
      out.push({
        q: `${name} 지방비는 ${sido.short} 다른 시·군과 다른가요?`,
        a: `금액은 같습니다. ${sido.short} ${stats.count}개 시·군이 2026년 승용 지방비를 모두 ${n(amount)}만원으로 공고했습니다. 다만 공고 주체·물량·접수 기간은 시·군별로 달라서 ${name}의 잔여 대수와 마감 시점은 다른 시·군과 다를 수 있습니다.`,
      });
    } else if (f.rankSido && stats.max !== null && stats.min !== null) {
      out.push({
        q: `${name} 지방비는 ${sido.short} 다른 시·군·구와 비교하면 어떤가요?`,
        a: `${sido.short} ${f.rankSido.total}개 시·군·구 중 ${rankText(f.rankSido)}입니다. 최고는 ${stats.maxNames.slice(0, 3).join("·")} ${n(stats.max)}만원, 최저는 ${stats.minNames.slice(0, 3).join("·")} ${n(stats.min)}만원이고, ${sido.short} 평균은 ${stats.avg !== null ? `${n(stats.avg)}만원` : "-"}입니다.`,
      });
    }
  }
  if (f.remainRow) {
    const label = f.remainRow.region === sido.name ? `${sido.name}(단일 공고)` : name;
    out.push({ q: `지금 ${name} 전기차 보조금 잔여 물량이 남아 있나요?`, a: remainAnswer(label, f.remainRow, f.fetchedAt) });
  }
  if (amount !== null && f.topCar.national !== null) {
    const e = estimateTotal({ national: f.topCar.national, localMax: amount });
    out.push({
      q: `${name}에서 ${f.topCar.brand} ${f.topCar.model}를 사면 보조금을 얼마나 받나요?`,
      a: `${f.topCar.brand} ${f.topCar.model} ${f.topCar.trim}의 국비 ${n(e.national)}만원에 ${name} 지방비 ${n(e.local)}만원을 더해 약 ${n(e.total)}만원, 전환지원금 포함 ${n(e.total + NATIONAL_MAX.conversion)}만원입니다. 다른 차종은 위 표와 보조금 계산기에서 확인할 수 있습니다.`,
    });
  }
  return out;
}

export interface SidoFacts {
  sido: Sido;
  stats: SidoPriceStats;
  summary: SidoRemainSummary | null;
  top: TopSigunguRow[];
  fetchedAt: string;
  sidoRank: SidoMaxRank | undefined;
}

export function sidoFaq(f: SidoFacts): Faq[] {
  const { sido, stats, summary } = f;
  const out: Faq[] = [];
  if (stats.max !== null && stats.min !== null) {
    const total = stats.max + NATIONAL_MAX.large;
    out.push({
      q: `${sido.name} 전기차 보조금은 2026년 최대 얼마인가요?`,
      a: stats.uniform
        ? `${eunNeun(sido.name)} 단일 공고로 승용 지방비 ${n(stats.max)}만원입니다. 국비 최대 ${NATIONAL_MAX.large}만원을 더하면 ${n(total)}만원, 전환지원금 포함 ${n(total + NATIONAL_MAX.conversion)}만원입니다.`
        : `시·군·구에 따라 승용 지방비 ${n(stats.min)}~${n(stats.max)}만원입니다. 가장 많은 곳은 ${stats.maxNames.slice(0, 3).join("·")}(${n(stats.max)}만원)이며 국비 최대 ${NATIONAL_MAX.large}만원을 더하면 ${n(total)}만원, 전환지원금 포함 ${n(total + NATIONAL_MAX.conversion)}만원입니다.`,
    });
    out.push({
      q: `${eunNeun(sido.short)} 시·군·구마다 보조금이 다른가요?`,
      a: stats.uniform
        ? `아닙니다. ${sido.name}가 ${stats.count}개 시·군·구 구분 없이 하나의 공고로 운영하므로 거주 구·군과 관계없이 같은 금액과 같은 잔여 물량이 적용됩니다.${f.sidoRank?.rank ? ` 17개 시·도 최대 지방비 순위는 ${f.sidoRank.rank}위입니다.` : ""}`
        : stats.equal
          ? `금액은 같고 물량은 다릅니다. ${sido.short} ${stats.count}개 시·군이 모두 승용 지방비 ${n(stats.max)}만원을 공고했지만, 공고는 시·군별로 따로 내기 때문에 공고 대수·접수 기간·잔여 대수는 지역마다 다릅니다. 지방비는 차량 등록 주소지 시·군 기준입니다.`
          : `네. ${eunNeun(sido.short)} ${stats.count}개 시·군·구가 각자 공고를 내며 확인된 ${stats.known}곳의 지방비는 ${n(stats.min)}~${n(stats.max)}만원으로 최대 ${n(stats.max - stats.min)}만원 차이가 납니다. 최저는 ${stats.minNames.slice(0, 3).join("·")}(${n(stats.min)}만원), 평균은 ${stats.avg !== null ? `${n(stats.avg)}만원` : "-"}입니다. 지방비는 차량 등록 주소지 시·군·구 기준입니다.`,
    });
  }
  if (summary && summary.rowCount > 0) {
    const nums = [
      summary.announced !== null ? `공고 ${n(summary.announced)}대` : "",
      summary.applied !== null ? `접수 ${n(summary.applied)}대` : "",
      summary.released !== null ? `출고 ${n(summary.released)}대` : "",
      summary.remaining !== null ? `잔여 ${n(summary.remaining)}대` : "",
    ].filter(Boolean);
    const topText = !summary.single && f.top.length ? ` 잔여가 많은 곳은 ${f.top.map((t) => `${t.region} ${n(t.remaining ?? 0)}대`).join(", ")}입니다.` : "";
    const soldOut = !summary.single && summary.soldOutCount > 0 ? ` 소진된 시·군·구는 ${summary.soldOutCount}곳입니다.` : "";
    out.push({
      q: `지금 ${sido.short} 전기차 보조금 잔여 물량이 남아 있나요?`,
      a: `${formatFetchedAt(f.fetchedAt)} 기준 ${sido.short} 승용 전기차 ${nums.join(", ")}입니다.${soldOut}${topText} 무공해차 통합누리집 수집값이며 매시간 갱신됩니다.`,
    });
  }
  out.push({
    q: `${sido.short}에서 전기차 보조금은 어떻게 신청하나요?`,
    a: `${sido.name}${stats.uniform ? "" : " 또는 해당 시·군·구"}의 2026년 전기차 보급사업 공고를 확인한 뒤 대리점과 구매계약을 맺으면, 대리점이 무공해차 통합누리집에 구매지원 신청서를 접수합니다. 지자체가 대상자를 선정하면 2개월 안에 출고·등록하고, 출고 후 10일 안에 지급 신청 서류를 내면 보조금이 제작사로 지급돼 구매자는 차감된 금액만 결제합니다.`,
  });
  return out;
}
