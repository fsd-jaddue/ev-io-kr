import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import Calculator, { type CalcCar, type CalcRegion } from "@/components/Calculator";
import { getLocalPriceData } from "@/lib/ev/getData";
import { pageMetadata } from "@/lib/seo";
import { SIDO_LIST } from "@/data/regions";
import { CARS, CARS_SNAPSHOT, carName } from "@/data/cars";
import { verifiedSupport } from "@/lib/ev/verifiedSupport";

export const metadata: Metadata = pageMetadata({ title: "전기차 보조금 계산기: 확인한 국비·지방비 합산", description: "동일 트림의 국비와 지방비를 합산합니다. 승용 전환지원 국비는 차종별 차등액을 반영하고, 미확인 지방비는 직접 입력하도록 구분합니다.", path: "/calculator" });
export default async function CalculatorPage() {
  const local = await getLocalPriceData();
  const regions: CalcRegion[] = SIDO_LIST.map(s => ({slug:s.slug,name:s.name,sigungu:s.sigungu.map(name => ({name,amount:local.rows.find(r=>r.sido===s.slug&&r.sigungu===name)?.amount??null}))}));
  const cars: CalcCar[] = CARS.filter(c => c.national !== null && c.nationalSource === "collected").map(c => ({slug:c.slug,name:carName(c),national:c.national,localBySido:Object.fromEntries(SIDO_LIST.map(s=>[s.slug,verifiedSupport(c,s.slug).local])),conversion:verifiedSupport(c,"seoul").conversion}));
  return <>
    <Breadcrumb items={[{name:"보조금 계산기",path:"/calculator"}]} />
    <h1 className="text-3xl font-black text-slate-900">전기차 보조금 계산기</h1>
    <p className="mt-3 max-w-3xl leading-7 text-slate-600">거주지와 차종을 선택하고 공식 표에서 확인한 지방비를 더해 계산하세요. 동일 트림의 지역별 수집값이 있는 경우에만 자동 입력합니다. 국비·서울 지방비 기준 {CARS_SNAPSHOT.updatedAt}.</p>
    <div className="mt-8"><Calculator regions={regions} cars={cars} /></div>
    <section className="prose-ev mt-12 max-w-3xl">
      <h2>계산에 사용하는 금액</h2>
      <ol>
        <li><strong>국비</strong>는 수집된 대표 트림 금액입니다. 다른 트림은 공식 표에서 확인해 직접 입력하세요.</li>
        <li><strong>지방비</strong>는 지역 최고액으로 역산하지 않습니다. 서울은 수집된 동일 트림의 지방비를 사용하고, 다른 지역은 공식 표에서 확인한 금액을 입력해야 합니다.</li>
        <li><strong>승용 전환지원 국비</strong>는 일반 국비 500만원 이상이면 100만원, 미만이면 국비 ÷ 500 × 100만원으로 계산합니다(만원 단위 반올림). 자격을 충족한 경우에만 합산하세요.</li>
        <li>전환지원 지방비·다자녀·청년 등 추가 지원과 취득세 감면은 별도 확인 항목이며 이 합계에 포함되지 않습니다.</li>
      </ol>
      <h2>같은 트림끼리 더하는 예시</h2>
      <p>모델 3 프리미엄 롱레인지 RWD의 수집값은 국비 420만원, 서울 지방비 126만원입니다. 기본 합계는 546만원이며, 전환 요건 충족 시 국비 84만원을 더하면 630만원입니다. 서울의 다른 차량에서 관측된 지방비 최고액 194만원을 대신 더하면 같은 차종의 지원액을 과대 계산하게 됩니다.</p>
      <p>계약 견적서의 모델·연식·구동방식·휠 규격·가격 조건이 공식 표와 같은지 먼저 확인하세요. 지역이나 트림을 바꾸면 입력한 지방비를 다시 확인해야 합니다.</p>
      <h2>합계가 곧 지급 확정액은 아닙니다</h2>
      <p>잔여 예산, 거주 요건, 추가 지원 자격과 출고 기한은 별도 심사 사항입니다. 이 도구는 입력한 금액의 합을 계산하며 보조금 신청 자격이나 물량을 예약하지 않습니다.</p>
      <p><Link href="/guide/conversion-incentive-100">전환지원금 조건·계산 예시</Link> · <Link href="/guide/national-subsidy-calculation-2026">국비·지방비 표 읽는 법</Link> · <Link href="/region">지역별 접수 현황</Link></p>
    </section>
  </>;
}
