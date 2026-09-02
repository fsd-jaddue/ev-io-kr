import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import AdSlot from "@/components/AdSlot";
import { pageMetadata } from "@/lib/seo";
import { CARS, NATIONAL_MAX, carName } from "@/data/cars";
import { EV_PORTAL } from "@/lib/ev/parse";

export const metadata: Metadata = pageMetadata({
  title: "2026 차종별 전기차 국비 보조금",
  description:
    "2026년 환경부 확정 차종별 전기차 국고보조금: 아이오닉6 570만원, 아이오닉5 567만원, EV6 570만원, EV3 555만원, 코나 514만원, 테슬라 모델3 420만원, 모델Y 210만원 등 승용 전기차 국비와 가격 구간 정리.",
  path: "/car",
  keywords: ["차종별 전기차 보조금", "2026 전기차 국비", "아이오닉6 보조금", "EV3 보조금", "테슬라 보조금"],
});

export default function CarIndexPage() {
  const known = CARS.filter((c) => c.national !== null).sort((a, b) => (b.national ?? 0) - (a.national ?? 0));
  const unknown = CARS.filter((c) => c.national === null);
  return (
    <>
      <Breadcrumb items={[{ name: "차종별 국비", path: "/car" }]} />
      <h1 className="text-3xl font-black text-slate-900">2026 차종별 전기차 국비 보조금</h1>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        환경부는 매년 초 차종·트림별 국고보조금을 확정 공고합니다. 2026년 중·대형 승용 상한은 {NATIONAL_MAX.large}만원, 소형·경형은{" "}
        {NATIONAL_MAX.small}만원이며, 주행거리·에너지효율·배터리 안전성·사후관리 체계·차량 가격에 따라 차등 산정됩니다. 아래 표는 확정 공고와
        언론 보도를 기준으로 정리한 승용 대표 트림의 국비입니다. 지방비는 국비 비율에 비례하므로, 국비가 높은 차종일수록 지역 합산액도
        커집니다.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">국비 확정 차종</h2>
        <div className="table-wrap mt-3">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">순위</th>
                <th className="px-3 py-2 font-semibold">차종·트림</th>
                <th className="px-3 py-2 text-right font-semibold">국비</th>
                <th className="px-3 py-2 text-right font-semibold">전환 포함</th>
                <th className="hidden px-3 py-2 font-semibold md:table-cell">가격 구간</th>
                <th className="hidden px-3 py-2 text-right font-semibold md:table-cell">주행거리</th>
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
                  <td className="px-3 py-2 text-right tabular-nums">{(c.national ?? 0) + NATIONAL_MAX.conversion}만원</td>
                  <td className="hidden px-3 py-2 text-slate-600 md:table-cell">{c.priceBand}</td>
                  <td className="hidden px-3 py-2 text-right tabular-nums text-slate-600 md:table-cell">{c.range ? `${c.range}km` : "-"}</td>
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

      <section className="prose-ev mt-10 max-w-3xl">
        <h2>국비가 차종마다 다른 이유</h2>
        <p>
          2026년 국고보조금은 <strong>성능보조금</strong>(1회 충전 주행거리와 에너지효율)과 <strong>배터리안전보조금</strong>을 기본으로,
          배터리 에너지밀도에 따른 <strong>배터리효율계수</strong>, 재활용 가치를 반영한 <strong>배터리환경성계수</strong>, 직영 정비망과 부품
          공급을 평가하는 <strong>사후관리계수</strong>를 곱해 산정합니다. 여기에 차량 기본가격이 5,300만원 미만이면 100%, 8,500만원 미만이면
          50%가 적용되고 8,500만원 이상은 지급되지 않습니다.
        </p>
        <p>
          테슬라 모델 Y가 210만원, 모델 3 스탠다드가 168만원에 그친 것은 가격 구간(50% 적용)과 LFP 배터리의 환경성 계수, 사후관리 체계
          평가가 함께 작용한 결과입니다. 반대로 아이오닉 6·EV6 롱레인지가 570만원으로 상단에 있는 것은 긴 주행거리와 높은 에너지밀도, 직영
          서비스망 덕분입니다. 자세한 산정식은 <Link href="/guide/national-subsidy-calculation-2026">국고보조금 산정 기준 가이드</Link>에서 설명합니다.
        </p>
      </section>
    </>
  );
}
