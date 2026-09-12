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
import { estimateTotal, won } from "@/lib/ev/summary";
import { neighborRows, rankInSido, rankNational, sidoMaxRanking, sidoPriceStats } from "@/lib/ev/localPriceStats";
import { matchRemainRows } from "@/lib/ev/remainSummary";
import { eunNeun, sidoPoints, sigunguChecklist, sigunguComparison, sigunguFaq, type SigunguFacts } from "@/lib/ev/regionCopy";
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
  const total = d.row.amount === null ? null : d.row.amount + NATIONAL_MAX.large;
  const remainText =
    d.remainRow && d.remainRow.remaining !== null ? ` 잔여 ${d.remainRow.remaining.toLocaleString()}대(${formatFetchedAt(d.remain.fetchedAt)} 기준).` : "";
  return pageMetadata({
    title: `${d.sido.short} ${d.name} 전기차 보조금 2026`,
    description: `2026년 ${d.sido.name} ${d.name} 승용 전기차 보조금: 지방비 ${won(d.row.amount)}${total ? `, 국비 ${NATIONAL_MAX.large}만원 합산 최대 ${total.toLocaleString()}만원` : ""}.${remainText} 차종별 예상 지원액, ${d.sido.short} 시·군·구 비교, 신청 방법 정리.`,
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
  const siblings = local.rows.filter((r) => r.sido === sido.slug && r.sigungu !== name);
  const cars = CARS.filter((c) => c.national !== null);
  const neighbors = neighborRows(local.rows, sido.slug, name);
  const sidoRanking = stats.uniform ? sidoMaxRanking(local.rows) : [];
  const faq = sigunguFaq(facts);
  const checklist = sigunguChecklist(facts);
  const points = sidoPoints(sido.slug);
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
          label="합산 최대"
          value={row.amount === null ? "-" : won(row.amount + NATIONAL_MAX.large)}
          sub={`전환지원금 적용 시 ${row.amount === null ? "-" : won(row.amount + NATIONAL_MAX.large + NATIONAL_MAX.conversion)}`}
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

      {neighbors.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{sido.short} 시·군·구 지방비 비교</h2>
          <p className="mt-1 text-sm text-slate-500">
            {sido.short} 안에서 지방비가 가장 많은 곳과 적은 곳, 그리고 {name}을 함께 놓은 표입니다. 전체 {stats.count}곳 목록은{" "}
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
                  <th className="px-3 py-2 text-right font-semibold">국비 합산 최대</th>
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
                    <td className="px-3 py-2 text-right tabular-nums">{s.max === null ? "-" : won(s.max + NATIONAL_MAX.large)}</td>
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
          <p className="mt-1 text-sm text-slate-500">지방비는 국비 산정액 비율에 따라 비례 지급되는 것으로 계산했습니다. 전환지원금은 내연기관차 처분 시 +{NATIONAL_MAX.conversion}만원.</p>
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
                      <td className="px-3 py-2 text-right tabular-nums">{(e.total + NATIONAL_MAX.conversion).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-xs text-slate-500">단위: 만원</p>
        </section>
      )}

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_REGION} />

      <RemainTable sido={sido.slug} regionFilter={name} sidoName={sido.name} initial={remain} title={`${name} 접수·출고·잔여 현황`} />

      <section className="prose-ev mt-10 max-w-3xl">
        <h2>{name} 보조금 신청 전 체크리스트</h2>
        <ul>
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {points.length > 0 && (
          <>
            <h3>{sido.short} 공고 특징</h3>
            <ul>
              {points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </>
        )}
        <p>
          공고 원문은 <a href={EV_PORTAL.remain} target="_blank" rel="noopener noreferrer">무공해차 통합누리집</a>과 {sido.name} 또는 {name} 홈페이지 고시·공고에서 확인할 수 있습니다.
        </p>
      </section>

      <FaqList items={faq} title={`${name} 전기차 보조금 자주 묻는 질문`} />

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">{sido.short} 다른 시·군·구</h2>
        <p className="mt-1 text-sm text-slate-500">지역명 옆 금액은 2026년 승용 전기차 지방비 최대액입니다. 국비 최대 {won(NATIONAL_MAX.large)}은 별도로 더해집니다.</p>
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
