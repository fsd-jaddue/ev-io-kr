import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import SidoGrid from "@/components/SidoGrid";
import { getLocalPriceData } from "@/lib/ev/getData";
import { summarizeBySido } from "@/lib/ev/summary";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { NATIONAL_MAX } from "@/data/cars";
import { RegionArt } from "@/components/illustrations";

export const metadata: Metadata = pageMetadata({
  title: "지역별 전기차 보조금 현황 (17개 시·도)",
  description:
    "2026년 서울·경기·부산·경북·전남 등 전국 17개 시·도의 승용 전기차 지방비 범위와 시·군·구별 보조금, 접수·잔여 현황을 한 페이지에서 비교합니다.",
  path: "/region",
  keywords: ["지역별 전기차 보조금", "시도별 전기차 보조금", "전기차 지방비"],
});

export default async function RegionIndexPage() {
  const local = await getLocalPriceData();
  const summary = summarizeBySido(local.rows);
  const sorted = [...summary].sort((a, b) => (b.max ?? 0) - (a.max ?? 0));

  return (
    <>
      <JsonLd data={itemListJsonLd("시·도별 전기차 보조금", summary.map((s) => ({ name: `${s.name} 전기차 보조금`, path: `/region/${s.slug}` })))} />
      <Breadcrumb items={[{ name: "지역별 보조금", path: "/region" }]} />
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">지역별 전기차 보조금 현황</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            전기차 보조금은 환경부 국비(승용 최대 {NATIONAL_MAX.large}만원)에 거주지 지자체의 지방비가 더해져 결정됩니다. 지방비는
            시·도가 아니라 <strong>시·군·구 단위 공고</strong>로 정해지기 때문에, 같은 도 안에서도 수백만 원 차이가 납니다. 아래 카드에서
            시·도를 선택하면 시·군·구별 수집 지방비, 접수·출고·잔여 현황을 볼 수 있습니다.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            기준 {local.updatedAt} · {local.basis}
          </p>
        </div>
        <RegionArt className="hidden w-44 shrink-0 lg:block" />
      </div>

      <div className="mt-8">
        <SidoGrid items={summary} />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">수집된 지방비 최고액 비교</h2>
        <p className="mt-2 text-sm text-slate-600">시·도 내 수집 목록에서 관측된 최고액입니다. 특수 사양을 포함할 수 있으며 본인 차량의 지급액과 다릅니다.</p>
        <div className="table-wrap mt-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">순위</th>
                <th className="px-3 py-2 font-semibold">시·도</th>
                <th className="px-3 py-2 text-right font-semibold">지방비 범위</th>
                <th className="px-3 py-2 text-right font-semibold">공고 단위</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.slug} className="border-t border-slate-100">
                  <td className="px-3 py-2 tabular-nums text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link href={`/region/${s.slug}`} className="font-medium text-slate-900 hover:text-emerald-700 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                    {s.max === null ? "공고 확인" : s.min === s.max ? `${s.max.toLocaleString()}만원` : `${s.min!.toLocaleString()}~${s.max.toLocaleString()}만원`}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">{s.uniform ? "시·도 단일" : s.equal ? `${s.count}개 시·군 동일 금액` : `${s.count}개 시·군·구`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="prose-ev mt-12 max-w-3xl">
        <h2>지역별 보조금을 볼 때 확인할 3가지</h2>
        <ol>
          <li>
            <strong>공고 단위</strong> — 서울·부산·대구·인천·광주·대전·울산·세종·제주는 시·도 단일 공고, 나머지 도 지역은 시·군별 공고입니다. 지방비는 차량 등록지 기준으로 적용됩니다.
          </li>
          <li>
            <strong>차종별 비례</strong> — 지역 최고액을 국비 상한으로 나누어 모든 차종에 적용할 수 없습니다. 같은 지역·같은 모델 행에서 확인한 지방비를 사용해야 합니다.
          </li>
          <li>
            <strong>예산 잔여</strong> — 금액이 높아도 물량이 소진되면 받을 수 없습니다. 접수·출고·잔여 대수와 추가 공고 여부를 함께 확인하세요.
          </li>
        </ol>
      </section>
    </>
  );
}
