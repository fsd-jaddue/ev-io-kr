import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import AdSlot from "@/components/AdSlot";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { verifiedSupport } from "@/lib/ev/verifiedSupport";
import { CARS, CARS_SNAPSHOT, NATIONAL_MAX, carName } from "@/data/cars";
import { EV_PORTAL } from "@/lib/ev/parse";
import { CarArt } from "@/components/illustrations";

export const metadata: Metadata = pageMetadata({
  title: "2026 차종별 전기차 국비 보조금",
  description:
    "2026년 무공해차 통합누리집 수집값으로 대표 트림과 전체 모델의 국비·전환지원 국비를 비교합니다. 지역별 지방비 확인 방법과 데이터 기준일을 제공합니다.",
  path: "/car",
  keywords: ["차종별 전기차 보조금", "2026 전기차 국비", "아이오닉6 보조금", "EV3 보조금", "테슬라 보조금"],
});

export default function CarIndexPage() {
  const known = CARS.filter((c) => c.national !== null).sort((a, b) => (b.national ?? 0) - (a.national ?? 0));
  const unknown = CARS.filter((c) => c.national === null);
  return (
    <>
      <JsonLd data={itemListJsonLd("2026 차종별 전기차 국비 보조금", [...known, ...unknown].map((c) => ({ name: `${carName(c)} 보조금`, path: `/car/${c.slug}` })))} />
      <Breadcrumb items={[{ name: "차종별 국비", path: "/car" }]} />
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">2026 차종별 전기차 국비 보조금</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            환경부는 매년 초 차종·트림별 국고보조금을 확정 공고합니다. 2026년 중·대형 승용 일반 기본 지원 기준은 최대 {NATIONAL_MAX.large}만원, 소형·경형은{" "}
            {NATIONAL_MAX.small}만원이며, 주행거리·에너지효율·배터리 안전성·사후관리 체계·차량 가격에 따라 차등 산정됩니다. 아래 표는 무공해차 통합누리집에서 수집한 승용 대표 트림의 국비입니다. 특수 사양과 개인 추가 지원은 별도입니다. 지방비는 같은 지역·동일 모델 행에서 확인해야 합니다.
          </p>
        </div>
        <CarArt className="hidden w-44 shrink-0 lg:block" />
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">수집값이 확인된 대표 트림</h2>
        <div className="table-wrap mt-3">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">순위</th>
                <th className="px-3 py-2 font-semibold">차종·트림</th>
                <th className="px-3 py-2 text-right font-semibold">국비</th>
                <th className="px-3 py-2 text-right font-semibold">국비+전환 국비</th>
              </tr>
            </thead>
            <tbody>
              {known.map((c, i) => (
                <tr key={c.slug} className="border-t border-slate-100">
                  <td className="px-3 py-2 tabular-nums text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link href={`/car/${c.slug}`} className="font-medium text-slate-900 hover:text-emerald-700 hover:underline">
                      {carName(c)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-emerald-700">{c.national}만원</td>
                  <td className="px-3 py-2 text-right tabular-nums">{verifiedSupport(c,"seoul").conversion === null ? "확인 필요" : `${(c.national ?? 0) + verifiedSupport(c,"seoul").conversion!}만원`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CAR} />

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">트림별 확인이 필요한 차종</h2>
        <p className="mt-1 text-sm text-slate-600">
          트림·옵션에 따라 국비가 달라지거나 가격 구간 경계에 있는 차종입니다. 정확한 금액은{" "}
          <a href={EV_PORTAL.targetVehicle} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
            보조금 지급대상 차종
          </a>
          에서 확인하세요.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {unknown.map((c) => (
            <li key={c.slug} className="rounded-lg border border-slate-200 p-3">
              <Link href={`/car/${c.slug}`} className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline">
                {carName(c)}
              </Link>
              <p className="mt-1 text-xs text-slate-500">
                {c.segment} · {c.priceBand}
                {c.note ? ` · ${c.note}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {CARS_SNAPSHOT.rows.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">누리집 등록 승용 전기차 국비 수집 목록 ({CARS_SNAPSHOT.rows.length}종)</h2>
          <p className="mt-1 text-sm text-slate-500">
            무공해차 통합누리집 &lsquo;지자체별 차종·모델 보조금&rsquo;에서 {CARS_SNAPSHOT.updatedAt} 수집한 일반승용 모델별 국비입니다. 지방비는 거주 지역에 따라
            달라지므로 <Link href="/calculator" className="text-emerald-700 underline">계산기</Link>에서 지역을 골라 확인하세요. 단위: 만원.
          </p>
          <div className="table-wrap mt-3">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">제조사</th>
                  <th className="px-3 py-2 font-semibold">모델</th>
                  <th className="px-3 py-2 text-right font-semibold">국비</th>
                  <th className="hidden px-3 py-2 text-right font-semibold md:table-cell">전환지원금(국비)</th>
                </tr>
              </thead>
              <tbody>
                {[...CARS_SNAPSHOT.rows]
                  .sort((a, b) => a.maker.localeCompare(b.maker, "ko") || (b.national ?? 0) - (a.national ?? 0))
                  .map((r) => (
                    <tr key={`${r.maker}-${r.model}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-600">{r.maker}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{r.model}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-emerald-700">{r.national === null ? "-" : r.national.toLocaleString()}</td>
                      <td className="hidden px-3 py-2 text-right tabular-nums text-slate-600 md:table-cell">{r.conversionNational === null ? "-" : r.conversionNational}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="prose-ev mt-10 max-w-3xl">
        <h2>국비가 차종마다 다른 이유</h2>
        <p>
          2026년 국고보조금은 <strong>성능보조금</strong>(1회 충전 주행거리와 에너지효율)과 <strong>배터리안전보조금</strong>을 기본으로,
          배터리 에너지밀도에 따른 <strong>배터리효율계수</strong>, 재활용 가치를 반영한 <strong>배터리환경성계수</strong>, 직영 정비망과 부품
          공급을 평가하는 <strong>사후관리계수</strong>를 곱해 산정합니다. 여기에 차량 기본가격이 5,300만원 미만이면 100%, 8,500만원 미만이면
          50%가 적용되고 8,500만원 이상은 지급되지 않습니다.
        </p>
        <p>
          차종별 최종 금액만으로 어떤 계수가 얼마 적용됐는지를 특정할 수 없습니다. 아래 링크에서는 공식 표의 동일 모델 금액을 대조하고 잘못된 최대액 계산을 피하는 방법을 설명합니다. <Link href="/guide/national-subsidy-calculation-2026">국비·지방비 표 읽는 법</Link>을 참고하세요.
        </p>
      </section>
    </>
  );
}
