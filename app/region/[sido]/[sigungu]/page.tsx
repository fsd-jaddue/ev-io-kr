import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import RemainTable from "@/components/RemainTable";
import LocalPriceTable from "@/components/LocalPriceTable";
import FaqList from "@/components/FaqList";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";
import { filterRemainBySido, formatFetchedAt, getLocalPriceData, getRemainSnapshot } from "@/lib/ev/getData";
import { LOCAL_REF_NATIONAL, TOP_CAR_LABEL, estimateTotal, headlineTotal, won } from "@/lib/ev/summary";
import { passengerConversion } from "@/lib/ev/subsidy";
import { neighborRows, rankInSido, rankNational, sidoMaxRanking, sidoPriceStats } from "@/lib/ev/localPriceStats";
import { matchRemainRows } from "@/lib/ev/remainSummary";
import { eunNeun, sigunguChecklist, sigunguComparison, sigunguFaq, type SigunguFacts } from "@/lib/ev/regionCopy";
import { historyFacts, historyFor, historyParagraphs } from "@/lib/ev/remainHistory";
import { faqJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { SIDO_LIST, decodeSigungu, getSido, sigunguPath, sigunguSlug } from "@/data/regions";
import { CARS, NATIONAL_MAX, carName } from "@/data/cars";
import { EV_PORTAL } from "@/lib/ev/parse";

export function generateStaticParams() {
  return SIDO_LIST.flatMap((s) => s.sigungu.map((g) => ({ sido: s.slug, sigungu: sigunguSlug(g) })));
}

type Params = Promise<{ sido: string; sigungu: string }>;

async function load(params: Params) {
  const { sido: slug, sigungu: gSlug } = await params;
  const sido = getSido(slug);
  const name = decodeSigungu(gSlug);
  if (!sido || !sido.sigungu.includes(name)) return null;
  const local = await getLocalPriceData();
  const row = local.rows.find((r) => r.sido === slug && r.sigungu === name) ?? { sido: slug, sigungu: name, amount: null };
  // 접수·출고·잔여: 빌드 시 스냅샷을 HTML 에 싣고(검색엔진용), 브라우저에서 /api/remain 으로 갱신
  const remain = filterRemainBySido(getRemainSnapshot(), slug);
  const remainRow = matchRemainRows(remain.rows, name, sido.name)[0] ?? null;
  const stats = sidoPriceStats(local.rows, slug);
  const topCar = CARS.filter((c) => c.national !== null).sort((a, b) => (b.national ?? 0) - (a.national ?? 0))[0];
  const facts: SigunguFacts = {
    sido,
    name,
    amount: row.amount,
    stats,
    rankSido: rankInSido(local.rows, slug, name),
    rankNational: rankNational(local.rows, slug, name),
    sidoRank: sidoMaxRanking(local.rows).find((s) => s.slug === slug),
    remainRow,
    fetchedAt: remain.fetchedAt,
    topCar,
  };
  return { sido, name, local, row, remain, remainRow, stats, facts };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = await load(params);
  if (!d) notFound();
  const total = headlineTotal(d.row.amount);
  const remainText =
    d.remainRow && d.remainRow.remaining !== null ? ` 잔여 ${d.remainRow.remaining.toLocaleString()}대(${formatFetchedAt(d.remain.fetchedAt)} 기준).` : "";
  return pageMetadata({
    title: `${d.sido.short} ${d.name} 전기차 보조금 2026`,
    description: `2026년 ${d.sido.name} ${d.name} 승용 전기차 보조금: 지방비 ${won(d.row.amount)}${total ? `, ${TOP_CAR_LABEL} 기준 합산 예상 ${total.toLocaleString()}만원` : ""}.${remainText} 차종별 예상 지원액, ${d.sido.short} 시·군·구 비교, 신청 방법 정리.`,
    path: sigunguPath(d.sido.slug, d.name),
    // 시·도 단일 공고 지역의 구·군 페이지는 시·도 페이지와 내용이 같으므로 색인에서 뺀다(중복·얇은 페이지 방지, 2026-09-12)
    noindex: d.stats.uniform,
    keywords: [`${d.name} 전기차 보조금`, `${d.sido.short} ${d.name} 전기차 보조금`, `${d.name} 전기차 지방비`, `2026 ${d.name} 전기차 보조금`],
  });
}

export default async function SigunguPage({ params }: { params: Params }) {
  const d = await load(params);
  if (!d) notFound();
  const { sido, name, local, row, remain, remainRow, stats, facts } = d;
  // 다른 시·군 링크: 지방비 순위에서 가까운 8곳 (도 전체 목록은 시·도 페이지에 있음)
  const sortedSido = stats.sorted.filter((r) => r.sigungu !== name);
  const selfIdx = stats.sorted.findIndex((r) => r.sigungu === name);
  const siblings = sortedSido
    .map((r, i) => ({ r, d: Math.abs((i >= selfIdx ? i + 1 : i) - selfIdx) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 8)
    .map((x) => x.r);
  // 차종 표: 국비 확인된 대표 차종 중 국비 상위 8종 (전체는 /car·계산기)
  const cars = CARS.filter((c) => c.national !== null).sort((a, b) => (b.national ?? 0) - (a.national ?? 0)).slice(0, 8);
  const neighbors = neighborRows(local.rows, sido.slug, name);
  const sidoRanking = stats.uniform ? sidoMaxRanking(local.rows) : [];
  const faq = sigunguFaq(facts);
  const checklist = sigunguChecklist(facts);
  // 이 지역 공고의 9월 이후 수집 이력: 물량 증감·마감·재개·출고 속도 (지역마다 다른 내용)
  const hist = remainRow ? historyFacts(historyFor(remainRow)) : null;
  const histLabel = remainRow && remainRow.region === sido.name ? `${sido.name}(단일 공고)` : name;
  const histParas = hist && remainRow ? historyParagraphs(histLabel, remainRow.sido, remainRow.region, hist) : [];
  const path = sigunguPath(sido.slug, name);
  const title = `${sido.short} ${name} 전기차 보조금 2026`;

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            name: title,
            description: `${sido.name} ${name} 승용 전기차 지방비·국비 합산액, 접수·출고·잔여 현황, 차종별 예상 지원액`,
            path,
            dateModified: remain.fetchedAt,
          }),
          ...(faq.length ? [faqJsonLd(faq)] : []),
        ]}
      />
      <Breadcrumb
        items={[
          { name: "지역별 보조금", path: "/region" },
          { name: sido.name, path: `/region/${sido.slug}` },
          { name, path },
        ]}
      />
      <h1 className="text-3xl font-black text-slate-900">{title}</h1>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        {sido.name} {name}에 주소를 둔 개인·법인이 승용 전기차를 구매할 때 받을 수 있는 지방비와 국비 합산 예상액입니다.
        {row.note ? ` ${row.note}.` : ""} 실제 지급액은 차종별 국비 산정액에 비례하며, 공고 물량이 소진되면 지급되지 않습니다.
      </p>
      <p className="mt-3 max-w-3xl leading-7 text-slate-700">{sigunguComparison(facts)}</p>
      {stats.uniform && (
        <p className="mt-3 max-w-3xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {sido.name}는 {stats.count}개 구·군 구분 없이 하나의 공고로 운영하므로 이 페이지의 금액·접수 현황은{" "}
          <Link href={`/region/${sido.slug}`} className="text-emerald-700 underline">
            {sido.name} 페이지
          </Link>
          와 같습니다. 구·군별 추가 인센티브가 있는지는 {name} 홈페이지 고시·공고에서 확인하세요.
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500">
        데이터 기준: 지방비 {local.updatedAt} · 접수 현황 {formatFetchedAt(remain.fetchedAt)} · 출처 무공해차 통합누리집
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label={`${name} 지방비 최대`} value={won(row.amount)} sub={stats.uniform ? `${sido.name} 단일 공고` : stats.equal ? `${sido.short} ${stats.count}개 시·군 동일 금액` : facts.rankSido ? `${sido.short} ${facts.rankSido.total}곳 중 ${facts.rankSido.rank}위` : undefined} />
        <Card label="국비 최대" value={won(NATIONAL_MAX.large)} sub={`소형 ${NATIONAL_MAX.small}만원`} />
        <Card
          label="합산 예상"
          value={won(headlineTotal(row.amount))}
          sub={`${TOP_CAR_LABEL} 기준(지방비 비례 추정) · 전환지원 국비 포함 ${won(headlineTotal(row.amount, true))}`}
        />
        <Card
          label={remainRow && remainRow.region === sido.name ? `${sido.short} 잔여 대수` : `${name} 잔여 대수`}
          value={remainRow && remainRow.remaining !== null ? (remainRow.remaining <= 0 ? "소진" : `${remainRow.remaining.toLocaleString()}대`) : "수집값 없음"}
          sub={remainRow ? `공고 ${remainRow.announced?.toLocaleString() ?? "-"}대 · ${formatFetchedAt(remain.fetchedAt)} 기준` : "누리집 수집값이 있을 때만 표시"}
          tone={remainRow && remainRow.remaining !== null && remainRow.remaining <= 0 ? "rose" : "emerald"}
        />
      </div>

      {row.amount === null && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {name}의 2026년 승용 지방비는 아직 이 사이트에 반영되지 않았습니다.{" "}
          <a href={EV_PORTAL.localPrice} target="_blank" rel="noopener noreferrer" className="underline">
            무공해차 통합누리집 지자체별 차종·모델 보조금
          </a>
          에서 {sido.short} › {name}을 선택해 확인하세요.
        </div>
      )}

      {hist && histParas.length > 0 && (
        <section className="prose-ev mt-10 max-w-3xl">
          <h2>{histLabel} 보조금 물량 흐름 ({Number(hist.first.date.slice(5, 7))}월 {Number(hist.first.date.slice(8, 10))}일 이후 수집 기록)</h2>
          {histParas.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
          <div className="table-wrap" tabIndex={0} role="region" aria-label={`${histLabel} 주간 물량 기록`}>
            <table className="nowrap">
              <thead>
                <tr><th>날짜</th><th>공고</th><th>접수</th><th>출고</th><th>출고잔여</th><th>상태</th></tr>
              </thead>
              <tbody>
                {hist.weekly.map((w) => (
                  <tr key={w.date}>
                    <td>{w.date.slice(5).replace("-", ".")}</td>
                    <td>{w.announced?.toLocaleString() ?? "-"}</td>
                    <td>{w.applied?.toLocaleString() ?? "-"}</td>
                    <td>{w.released?.toLocaleString() ?? "-"}</td>
                    <td>{w.remaining === null ? "-" : w.remaining <= 0 ? "소진" : w.remaining.toLocaleString()}</td>
                    <td>{w.closed ? "신청마감" : "접수 가능"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">
            무공해차 통합누리집 &lsquo;지자체별 보조금 현황&rsquo;을 매시간 수집해 하루 마지막 값을 7일 간격으로 정리한 표입니다(단위: 대). 누리집 표시값 그대로이며 행정기관의 처리 시각과 다를 수 있습니다.
          </p>
        </section>
      )}

      {neighbors.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{sido.short} 시·군·구 지방비 비교</h2>
          <p className="mt-1 text-sm text-slate-500">
            {sido.short} 최고·최저 지역과 지방비 순위에서 {name} 앞뒤 지역을 함께 놓은 표입니다. 전체 {stats.count}곳 목록은{" "}
            <Link href={`/region/${sido.slug}`} className="text-emerald-700 underline">
              {sido.name} 페이지
            </Link>
            에서 볼 수 있습니다.
          </p>
          <div className="mt-3">
            <LocalPriceTable sidoSlug={sido.slug} rows={neighbors} highlight={name} />
          </div>
        </section>
      )}

      {sidoRanking.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">17개 시·도 지방비 최대액 비교</h2>
          <p className="mt-1 text-sm text-slate-500">
            {eunNeun(sido.name)} 단일 공고라 {name}의 지방비가 곧 {sido.short} 전체 금액입니다. 다른 시·도의 최대액과 비교해 보세요.
          </p>
          <div className="table-wrap mt-3">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">순위</th>
                  <th className="px-3 py-2 font-semibold">시·도</th>
                  <th className="px-3 py-2 text-right font-semibold">승용 지방비 최대</th>
                  <th className="px-3 py-2 text-right font-semibold">합산 예상(대표 차종)</th>
                </tr>
              </thead>
              <tbody>
                {sidoRanking.map((s) => (
                  <tr key={s.slug} className={`border-t border-slate-100 ${s.slug === sido.slug ? "bg-emerald-50 font-bold" : ""}`}>
                    <td className="px-3 py-2 tabular-nums text-slate-500">{s.rank ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Link href={`/region/${s.slug}`} className="text-slate-900 hover:text-emerald-700 hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{won(s.max)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{won(headlineTotal(s.max))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {row.amount !== null && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{name} 차종별 예상 지원액</h2>
          <p className="mt-1 text-sm text-slate-500">
            {name} 지방비 최대 {won(row.amount)}에 차종 국비 비율(국비 ÷ {LOCAL_REF_NATIONAL})을 곱한 비례 추정치입니다. 계산 근거는{" "}
            <Link href="/calculator" className="text-emerald-700 underline">계산기 설명</Link>에 있고, 계약 전에는 공식 표의 같은 모델 행으로 확인하세요.
          </p>
          <div className="table-wrap mt-3">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">차종</th>
                  <th className="px-3 py-2 text-right font-semibold">국비</th>
                  <th className="px-3 py-2 text-right font-semibold">지방비</th>
                  <th className="px-3 py-2 text-right font-semibold">합계</th>
                  <th className="px-3 py-2 text-right font-semibold">전환 포함</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((c) => {
                  const e = estimateTotal({ national: c.national!, localMax: row.amount! });
                  return (
                    <tr key={c.slug} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <Link href={`/car/${c.slug}`} className="font-medium text-slate-900 hover:text-emerald-700 hover:underline">
                          {carName(c)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{e.national}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{e.local}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-emerald-700">{e.total.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{(e.total + passengerConversion(c.national!)).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            단위: 만원. 국비 상위 8개 차종만 실었습니다. 다른 차종은 <Link href="/car" className="text-emerald-700 underline">차종별 국비</Link>와{" "}
            <Link href="/calculator" className="text-emerald-700 underline">계산기</Link>에서 확인하세요.
          </p>
        </section>
      )}

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_REGION} />

      <RemainTable sido={sido.slug} regionFilter={name} sidoName={sido.name} initial={remain} title={`${name} 접수·출고·잔여 현황`} />

      <section className="prose-ev mt-10 max-w-3xl">
        <h2>{name}에서 신청하기 전에</h2>
        <p>{checklist[0]}.</p>
        <p>
          거주 기간·재지원 제한·차량가 기준선·전환지원 자격·출고 기한처럼 모든 지역에 공통인 확인 사항은{" "}
          <Link href="/guide/ev-subsidy-documents-checklist">서류 체크리스트</Link>와{" "}
          <Link href="/guide/ev-subsidy-common-mistakes">자주 하는 실수 10가지</Link>에 정리해 두었습니다. {sido.short} 공고의 특징은{" "}
          <Link href={`/region/${sido.slug}`}>{sido.name} 페이지</Link>에서 볼 수 있습니다.
        </p>
        <p>
          공고 원문은 <a href={EV_PORTAL.remain} target="_blank" rel="noopener noreferrer">무공해차 통합누리집</a>과 {sido.name} 또는 {name} 홈페이지 고시·공고에서 확인할 수 있습니다.
        </p>
      </section>

      <FaqList items={faq} title={`${name} 전기차 보조금 자주 묻는 질문`} />

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">{waGwa(name)} 지방비가 비슷한 {sido.short} 시·군</h2>
        <p className="mt-1 text-sm text-slate-500">
          지방비 순위에서 {waGwa(name)} 가까운 지역입니다. {sido.short} 전체 {stats.count}곳은{" "}
          <Link href={`/region/${sido.slug}`} className="text-emerald-700 underline">{sido.name} 페이지</Link>에서 볼 수 있습니다.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {siblings.map((s) => (
            <li key={s.sigungu}>
              <Link
                href={sigunguPath(sido.slug, s.sigungu)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
              >
                <span className="font-medium">{s.sigungu}</span>
                <span className="text-xs text-slate-500">
                  {s.amount === null ? "공고 확인" : `지방비 ${won(s.amount)}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Card({ label, value, sub, tone = "emerald" }: { label: string; value: string; sub?: string; tone?: "emerald" | "rose" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums ${tone === "rose" ? "text-rose-600" : "text-emerald-700"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

/** 와/과 조사: 마지막 글자 받침 유무 */
function waGwa(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}와(과)`;
  return `${word}${code % 28 === 0 ? "와" : "과"}`;
}
