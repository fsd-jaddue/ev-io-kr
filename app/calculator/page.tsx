import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import Calculator, { type CalcCar, type CalcRegion } from "@/components/Calculator";
import AdSlot from "@/components/AdSlot";
import { getLocalPriceData } from "@/lib/ev/getData";
import { pageMetadata } from "@/lib/seo";
import { SIDO_LIST } from "@/data/regions";
import { CARS, carName } from "@/data/cars";
import { LOCAL_REF_NATIONAL } from "@/lib/ev/summary";
import { CalcArt } from "@/components/illustrations";

export const metadata: Metadata = pageMetadata({
  title: "전기차 보조금 계산기 (지역·차종별 국비+지방비)",
  description:
    "거주 시·군·구와 차종을 선택하면 2026년 전기차 국비, 지방비(비례 추정), 전환지원 국비를 합산한 예상 보조금을 계산합니다. 취득세 감면까지 한 번에 확인하세요.",
  path: "/calculator",
  keywords: ["전기차 보조금 계산기", "전기차 보조금 계산", "지역별 전기차 보조금 계산"],
});

export default async function CalculatorPage() {
  const local = await getLocalPriceData();
  const regions: CalcRegion[] = SIDO_LIST.map((s) => ({
    slug: s.slug,
    name: s.name,
    sigungu: s.sigungu.map((name) => ({
      name,
      amount: local.rows.find((r) => r.sido === s.slug && r.sigungu === name)?.amount ?? null,
    })),
  }));
  const cars: CalcCar[] = CARS.map((c) => ({ slug: c.slug, name: carName(c), national: c.national }));

  return (
    <>
      <Breadcrumb items={[{ name: "보조금 계산기", path: "/calculator" }]} />
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">전기차 보조금 계산기</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            거주지 시·군·구와 구매 예정 차종을 고르면 국비, 지방비, 전환지원금을 합산한 예상 보조금이 계산됩니다. 지방비는 해당 지역의
            2026년 승용 최대액에 차종의 국비 비율(국비 ÷ 수집 최고 국비 {LOCAL_REF_NATIONAL}만원)을 곱해 추정합니다. 기준 {local.updatedAt}.
          </p>
        </div>
        <CalcArt className="hidden w-44 shrink-0 lg:block" />
      </div>
      <div className="mt-8">
        <Calculator regions={regions} cars={cars} refNational={LOCAL_REF_NATIONAL} />
      </div>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CALC} />

      <section className="prose-ev mt-12 max-w-3xl">
        <h2>계산 방식 설명</h2>
        <ol>
          <li>
            <strong>국비</strong>는 환경부가 차종·트림별로 확정한 금액을 그대로 사용합니다. 목록에 없거나 트림이 다르면 무공해차
            통합누리집의 금액을 직접 입력하세요.
          </li>
          <li>
            <strong>지방비</strong>는 &ldquo;국비에 비례 지급&rdquo;하는 지자체 원칙에 따라 <em>지역 최대 지방비 × (차종 국비 ÷ {LOCAL_REF_NATIONAL}만원)</em>으로
            추정합니다. 지역 최대액은 국비가 가장 높은 모델({LOCAL_REF_NATIONAL}만원) 기준이라 국비 420만원인 차종은 최대액의 약 {Math.round((420 / LOCAL_REF_NATIONAL) * 100)}%를 받습니다. 서울은 누리집
            수집값 125행과 일치하지만, 다른 지역은 공식 표의 같은 모델 행으로 다시 확인하세요.
          </li>
          <li>
            <strong>전환지원 국비</strong>는 본인 명의로 최초등록 후 3년 이상 지나고 3년 이상 보유한 내연기관차(하이브리드 제외)를 폐차·이전하고
            구매하는 경우 더해지는 2026년 신설 항목입니다. 국비 500만원 이상 차종은 100만원, 미만이면 국비 ÷ 500 × 100만원(만원 반올림)입니다.
          </li>
          <li>
            <strong>취득세 감면</strong>(최대 140만원)은 보조금이 아니라 세제 혜택이므로 합계에서 제외하고 별도 표시했습니다.
          </li>
        </ol>
        <h2>계산 결과가 실제와 다를 수 있는 경우</h2>
        <ul>
          <li>지자체가 지방비를 정액으로 지급하거나 비례 방식을 다르게 적용하는 경우</li>
          <li>다자녀·청년·취약계층·소상공인 등 추가 인센티브 대상인 경우(더 받을 수 있음)</li>
          <li>공고 물량이 소진되었거나 추경 편성으로 금액이 바뀐 경우</li>
          <li>법인·리스·렌트 구매로 별도 물량·기준이 적용되는 경우</li>
        </ul>
        <p>
          지역별 상세 금액은 <Link href="/region">지역별 보조금</Link>, 차종별 국비는 <Link href="/car">차종별 국비</Link> 페이지를 참고하세요.
        </p>
      </section>
    </>
  );
}
