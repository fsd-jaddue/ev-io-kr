import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import AdSlot from "@/components/AdSlot";
import { getLocalPriceData } from "@/lib/ev/getData";
import { estimateTotal, summarizeBySido } from "@/lib/ev/summary";
import { pageMetadata } from "@/lib/seo";
import { CARS, NATIONAL_MAX, carName, getCar } from "@/data/cars";
import { EV_PORTAL } from "@/lib/ev/parse";
import { CarArt } from "@/components/illustrations";

export function generateStaticParams() {
  return CARS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const car = getCar(slug);
  if (!car) return {};
  return pageMetadata({
    title: `${carName(car)} 보조금 2026 (국비·지역별 합산)`,
    description: `2026년 ${car.brand} ${car.model} ${car.trim} 전기차 보조금: 국비 ${car.national === null ? "트림별 확인" : `${car.national}만원`}, 전환지원금 +100만원, 서울·경기·경북 등 지역별 지방비 합산 예상액과 가격 구간(${car.priceBand}) 정리.`,
    path: `/car/${slug}`,
    keywords: [`${car.model} 보조금`, `${car.brand} ${car.model} 보조금 2026`, `${car.model} 국비`],
  });
}

export default async function CarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = getCar(slug);
  if (!car) notFound();
  const local = await getLocalPriceData();
  const summary = summarizeBySido(local.rows).filter((s) => s.max !== null);
  const others = CARS.filter((c) => c.slug !== slug && c.brand === car.brand).slice(0, 4);

  return (
    <>
      <Breadcrumb items={[{ name: "차종별 국비", path: "/car" }, { name: `${car.brand} ${car.model}`, path: `/car/${slug}` }]} />
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-emerald-700">{car.brand}</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">{car.model} {car.trim} 보조금 2026</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            {car.brand} {car.model} {car.trim}은(는) {car.segment} 승용 전기차로 차량 기본가격 구간이 {car.priceBand}에 해당합니다.
            {car.range ? ` 1회 충전 주행거리는 약 ${car.range}km(인증 기준)입니다.` : ""}
            {car.note ? ` ${car.note}.` : ""}
          </p>
        </div>
        <CarArt className="hidden w-44 shrink-0 lg:block" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card label="2026 국비" value={car.national === null ? "트림별 확인" : `${car.national}만원`} sub={`상한 ${car.segment === "중대형" ? NATIONAL_MAX.large : NATIONAL_MAX.small}만원`} />
        <Card label="전환지원금 포함" value={car.national === null ? "-" : `${car.national + NATIONAL_MAX.conversion}만원`} sub="내연기관차 처분 시" />
        <Card label="가격 구간" value={car.priceBand} sub="5,300만원 미만 100% · 8,500만원 미만 50%" />
      </div>

      {car.national === null && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          이 차종은 트림·옵션별 국비 편차가 있어 확정 금액을 표시하지 않았습니다.{" "}
          <a href={EV_PORTAL.targetVehicle} target="_blank" rel="noopener noreferrer" className="underline">
            무공해차 통합누리집 보조금 지급대상 차종
          </a>
          에서 제조사와 모델을 선택해 확인하세요.
        </div>
      )}

      {car.national !== null && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{car.model} 시·도별 예상 지원액 (지방비 최대 지역 기준)</h2>
          <p className="mt-1 text-sm text-slate-500">
            지방비는 국비 산정액 비율({Math.round((car.national / NATIONAL_MAX.large) * 100)}%)에 비례해 계산했습니다. 시·군·구별 금액은 지역 페이지에서 확인하세요.
          </p>
          <div className="table-wrap mt-3">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">시·도</th>
                  <th className="px-3 py-2 text-right font-semibold">지방비(비례)</th>
                  <th className="px-3 py-2 text-right font-semibold">합계</th>
                  <th className="px-3 py-2 text-right font-semibold">전환 포함</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => {
                  const e = estimateTotal({ national: car.national!, localMax: s.max! });
                  return (
                    <tr key={s.slug} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <Link href={`/region/${s.slug}`} className="font-medium text-slate-900 hover:text-emerald-700 hover:underline">
                          {s.name}
                        </Link>
                        {!s.uniform && <span className="ml-1 text-xs text-slate-400">최대 기준</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{e.local}만원</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-emerald-700">{e.total.toLocaleString()}만원</td>
                      <td className="px-3 py-2 text-right tabular-nums">{(e.total + NATIONAL_MAX.conversion).toLocaleString()}만원</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CAR} />

      <section className="prose-ev mt-10 max-w-3xl">
        <h2>{car.model} 구매 시 함께 챙길 혜택</h2>
        <ul>
          <li><strong>취득세 감면</strong> — 전기차 취득세 최대 140만원 감면(2026년 기준, 일몰 여부는 매년 확인)</li>
          <li><strong>개별소비세 감면</strong> — 최대 300만원 한도 개소세 감면 및 교육세 연동 감면</li>
          <li><strong>자동차세</strong> — 배기량 기준이 아닌 정액 연 13만원(지방교육세 포함)</li>
          <li><strong>공영주차장·고속도로 통행료</strong> — 지자체 공영주차장 50% 할인, 고속도로 통행료 감면(2026년 축소 단계 확인)</li>
        </ul>
        <p>
          보조금 신청 절차는 <Link href="/guide/how-to-apply-ev-subsidy-2026">신청 절차 7단계 가이드</Link>, 정확한 지역별 계산은{" "}
          <Link href="/calculator">보조금 계산기</Link>를 참고하세요.
        </p>
      </section>

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">{car.brand} 다른 차종</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((c) => (
              <li key={c.slug}>
                <Link href={`/car/${c.slug}`} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-emerald-300 hover:text-emerald-700">
                  {c.model} {c.trim}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
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
