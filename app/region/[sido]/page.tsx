import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import LocalPriceTable from "@/components/LocalPriceTable";
import RemainTable from "@/components/RemainTable";
import AdSlot from "@/components/AdSlot";
import { getLocalPriceData, getRemainForSido } from "@/lib/ev/getData";
import { estimateTotal, won } from "@/lib/ev/summary";
import { pageMetadata } from "@/lib/seo";
import { SIDO_LIST, getSido } from "@/data/regions";
import { SIDO_INTRO } from "@/data/sido-intro";
import { CARS, NATIONAL_MAX, carName } from "@/data/cars";
import { GUIDES } from "@/content/guides";
import { EV_PORTAL } from "@/lib/ev/parse";
import { RegionArt } from "@/components/illustrations";

export const revalidate = 3600;

export function generateStaticParams() {
  return SIDO_LIST.map((s) => ({ sido: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ sido: string }> }): Promise<Metadata> {
  const { sido: slug } = await params;
  const sido = getSido(slug);
  if (!sido) return {};
  const local = await getLocalPriceData();
  const amounts = local.rows.filter((r) => r.sido === slug).map((r) => r.amount).filter((a): a is number => a !== null);
  const max = amounts.length ? Math.max(...amounts) : null;
  const min = amounts.length ? Math.min(...amounts) : null;
  const rangeText = max === null ? "" : min === max ? `지방비 ${max}만원` : `지방비 ${min}~${max}만원`;
  return pageMetadata({
    title: `${sido.name} 전기차 보조금 현황 2026`,
    description: `2026년 ${sido.name} 전기차 보조금: 승용 ${rangeText}, 국비 최대 ${NATIONAL_MAX.large}만원 합산 시 최대 ${max === null ? "" : (max + NATIONAL_MAX.large).toLocaleString() + "만원"}. ${sido.short} 시·군·구별 지방비, 접수·출고·잔여 현황과 신청 방법.`,
    path: `/region/${slug}`,
    keywords: [`${sido.short} 전기차 보조금`, `${sido.name} 전기차 보조금`, `2026 ${sido.short} 전기차 지방비`],
  });
}

export default async function SidoPage({ params }: { params: Promise<{ sido: string }> }) {
  const { sido: slug } = await params;
  const sido = getSido(slug);
  if (!sido) notFound();
  const [local, remain] = await Promise.all([getLocalPriceData(), getRemainForSido(slug)]);
  const rows = local.rows.filter((r) => r.sido === slug);
  const amounts = rows.map((r) => r.amount).filter((a): a is number => a !== null);
  const max = amounts.length ? Math.max(...amounts) : null;
  const min = amounts.length ? Math.min(...amounts) : null;
  const uniform = amounts.length > 0 && min === max;
  const intro = SIDO_INTRO[slug];
  const exampleCars = CARS.filter((c) => c.national !== null).slice(0, 5);
  const relatedGuides = GUIDES.filter((g) => g.category === "지역" || g.category === "신청").slice(0, 4);

  return (
    <>
      <Breadcrumb items={[{ name: "지역별 보조금", path: "/region" }, { name: sido.name, path: `/region/${slug}` }]} />
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{sido.name} 전기차 보조금 현황 2026</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">{intro?.summary}</p>
        </div>
        <RegionArt className="hidden w-44 shrink-0 lg:block" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card label="승용 지방비" value={max === null ? "공고 확인" : uniform ? won(max) : `${min}~${max}만원`} />
        <Card label="국비 최대" value={won(NATIONAL_MAX.large)} sub={`소형 ${NATIONAL_MAX.small}만원`} />
        <Card label="합산 최대" value={max === null ? "-" : won(max + NATIONAL_MAX.large)} sub="전환지원금 +100만원 별도" />
      </div>

      {intro?.points && (
        <ul className="mt-5 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
          {intro.points.map((p) => (
            <li key={p} className="rounded-lg bg-slate-50 px-3 py-2">
              {p}
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">{sido.short} 시·군·구별 승용 지방비</h2>
        <p className="mt-1 text-sm text-slate-500">
          국비 100% 지급 차종 기준 최대액. 기준 {local.updatedAt} · {local.basis}
        </p>
        <div className="mt-3">
          <LocalPriceTable sidoSlug={slug} rows={rows} />
        </div>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_REGION} />

      <RemainTable data={remain} title={`${sido.short} 접수·출고·잔여 현황`} />

      {max !== null && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{sido.short} 최대 지방비 기준 차종별 예상 지원액</h2>
          <p className="mt-1 text-sm text-slate-500">
            지방비는 국비 산정액에 비례합니다. 표는 {sido.short} 내 최대 지방비({won(max)}) 지역, 전환지원금 미적용 기준입니다.
          </p>
          <div className="table-wrap mt-3">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">차종</th>
                  <th className="px-3 py-2 text-right font-semibold">국비</th>
                  <th className="px-3 py-2 text-right font-semibold">지방비(비례)</th>
                  <th className="px-3 py-2 text-right font-semibold">예상 합계</th>
                </tr>
              </thead>
              <tbody>
                {exampleCars.map((c) => {
                  const e = estimateTotal({ national: c.national!, localMax: max });
                  return (
                    <tr key={c.slug} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <Link href={`/car/${c.slug}`} className="font-medium text-slate-900 hover:text-emerald-700 hover:underline">
                          {carName(c)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{e.national}만원</td>
                      <td className="px-3 py-2 text-right tabular-nums">{e.local}만원</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-emerald-700">{e.total.toLocaleString()}만원</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            <Link href="/calculator" className="text-emerald-700 underline">
              보조금 계산기
            </Link>
            에서 시·군·구와 차종을 직접 선택해 계산할 수 있습니다.
          </p>
        </section>
      )}

      <section className="prose-ev mt-10 max-w-3xl">
        <h2>{sido.short}에서 전기차 보조금 신청하는 순서</h2>
        <ol>
          <li>{sido.name}(또는 해당 시·군·구) 2026년 전기차 보급사업 공고 확인 — 접수 기간, 물량, 우선순위 대상, 추가 인센티브</li>
          <li>구매하려는 차종의 국비 산정액을 <Link href="/car">차종별 국비</Link>에서 확인</li>
          <li>대리점과 구매계약 체결 → 대리점이 무공해차 통합누리집에 구매지원 신청서 접수</li>
          <li>지자체 대상자 선정(출고 선착순 또는 접수 순) → 2개월 이내 출고·등록</li>
          <li>출고 후 10일 이내 지급 신청 서류 제출 → 지자체가 제작사에 보조금 지급(구매자는 보조금 차감액만 결제)</li>
        </ol>
        <p>
          공고 원문과 잔여 물량은{" "}
          <a href={EV_PORTAL.remain} target="_blank" rel="noopener noreferrer">
            무공해차 통합누리집 지자체별 보조금 현황
          </a>
          에서, 지자체 담당 부서 연락처는{" "}
          <a href={EV_PORTAL.inquiries} target="_blank" rel="noopener noreferrer">
            지자체 문의처
          </a>
          에서 확인할 수 있습니다.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">함께 보면 좋은 가이드</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {relatedGuides.map((g) => (
            <li key={g.slug} className="rounded-lg border border-slate-200 p-3">
              <Link href={`/guide/${g.slug}`} className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline">
                {g.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{g.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">다른 시·도 보기</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SIDO_LIST.filter((s) => s.slug !== slug).map((s) => (
            <li key={s.slug}>
              <Link href={`/region/${s.slug}`} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-emerald-300 hover:text-emerald-700">
                {s.short}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-emerald-700">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
