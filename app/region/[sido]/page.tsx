import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import LocalPriceTable from "@/components/LocalPriceTable";
import RemainTable from "@/components/RemainTable";
import JsonLd from "@/components/JsonLd";
import { filterRemainBySido, formatFetchedAt, getLocalPriceData, getRemainSnapshot } from "@/lib/ev/getData";
import { sidoPriceStats } from "@/lib/ev/localPriceStats";
import { summarizeRemainBySido } from "@/lib/ev/remainSummary";
import { pageMetadata, webPageJsonLd } from "@/lib/seo";
import { SIDO_LIST, getSido } from "@/data/regions";
import { EV_PORTAL } from "@/lib/ev/portal";

export function generateStaticParams() { return SIDO_LIST.map(s=>({sido:s.slug})); }
export async function generateMetadata({params}:{params:Promise<{sido:string}>}):Promise<Metadata> {
  const {sido:slug}=await params; const sido=getSido(slug); if(!sido)notFound();
  return pageMetadata({title:`${sido.name} 전기차 보조금 현황 2026`,description:`${sido.name}의 지역별 수집 지방비와 접수·출고·잔여 현황을 비교합니다. 지역 최고액과 실제 모델별 금액의 차이, 공고 확인 방법을 안내합니다.`,path:`/region/${slug}`});
}
export default async function SidoPage({params}:{params:Promise<{sido:string}>}) {
  const {sido:slug}=await params; const sido=getSido(slug); if(!sido)notFound();
  const local=await getLocalPriceData(); const rows=local.rows.filter(r=>r.sido===slug); const stats=sidoPriceStats(rows,slug);
  const remain=filterRemainBySido(getRemainSnapshot(),slug); const summary=summarizeRemainBySido(remain.rows).find(s=>s.slug===slug);
  const range=stats.max===null?"미확인":stats.min===stats.max?`${stats.max}만원`:`${stats.min}~${stats.max}만원`;
  return <>
    <JsonLd data={webPageJsonLd({name:`${sido.name} 전기차 보조금 현황`,description:`${sido.name} 지역별 수집 금액과 접수 현황`,path:`/region/${slug}`,dateModified:remain.fetchedAt})} />
    <Breadcrumb items={[{name:"지역별 보조금",path:"/region"},{name:sido.name,path:`/region/${slug}`}]} />
    <h1 className="text-3xl font-black text-slate-900">{sido.name} 전기차 보조금 현황 2026</h1>
    <p className="mt-4 max-w-3xl leading-7 text-slate-600">{stats.uniform ? `${sido.name}는 수집 자료에서 하나의 지역 공고로 집계됩니다. 아래 구·군 금액은 같은 공고의 값을 표시하며 각각 별도 예산을 뜻하지 않습니다.` : `${sido.name}는 시·군별 공고를 확인해야 합니다. ${stats.known}개 지역에서 관측된 지방비 최고액의 범위는 ${range}입니다. 금액이 같아도 접수 기간·물량·마감 상태는 다를 수 있습니다.`}</p>
    <p className="mt-2 text-xs text-slate-500">지방비 수집 기준 {local.updatedAt} · 현황 {formatFetchedAt(remain.fetchedAt)} · 출처 무공해차 통합누리집</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <Card label="지역별 수집 최고액 범위" value={range} sub="모든 구매자의 지급액이 아닙니다" />
      <Card label="공고 단위" value={stats.uniform?"시·도 단일":"시·군별 확인"} sub={stats.equal&&!stats.uniform?"관측 금액이 같아도 공고는 별도":"신청 주체·차종별 공고 확인"} />
      <Card label="승용 출고잔여" value={summary?.remaining===null||summary?.remaining===undefined?"미확인":`${summary.remaining.toLocaleString()}대`} sub="신규 신청 가능 대수와 다를 수 있음" />
    </div>
    <section className="prose-ev mt-8 max-w-3xl">
      <h2>이 지역 금액을 읽는 방법</h2>
      <p>아래 값은 누리집 일반승용 목록에서 수집된 지방비 중 가장 큰 값입니다. 특수 사양·단종 재고 차량이 포함될 수 있어 일반 승용차의 공통 지급액으로 사용할 수 없습니다. 국비 상한과 이 최고액을 더한 ‘합산 최대’는 표시하지 않습니다.</p>
      {!stats.uniform&&stats.min!==stats.max&&<p>현재 관측 최고액이 큰 지역은 {stats.maxNames.join("·")}({stats.max}만원), 작은 지역은 {stats.minNames.join("·")}({stats.min}만원)입니다. 이는 서로 다른 지역의 목록 최고값 비교이며, 같은 차량의 지역별 차액은 공식 모델별 표로 다시 확인해야 합니다.</p>}
      {stats.equal&&!stats.uniform&&<p>{stats.count}개 지역의 관측 금액이 같다는 사실만으로 예산·도비 분담 구조나 선정 난도가 같다고 결론 낼 수는 없습니다. 아래 접수 현황과 각 공고의 대상·물량을 비교하세요.</p>}
      <p><Link href="/guide/national-subsidy-calculation-2026">서울 실제 수집 행으로 보는 잘못된 최대액 계산 사례</Link>와 <Link href="/calculator">확인 금액 합산 도구</Link>를 참고하세요.</p>
    </section>
    <section className="mt-8"><h2 className="text-xl font-bold">{sido.short} 시·군·구별 지방비 수집값</h2><p className="my-3 text-sm leading-6 text-slate-600">최고액은 비교용 관측값입니다. 본인 차량의 지방비는 공식 표에서 정확한 트림으로 확인하세요. 수집되지 않은 행을 보완한 경우 비고에 기존 자료 기준일을 표시합니다.</p><LocalPriceTable sidoSlug={slug} rows={rows} /></section>
    <RemainTable sido={slug} initial={remain} title={`${sido.short} 접수·출고·출고잔여 현황`} />
    <section className="prose-ev mt-10 max-w-3xl">
      <h2>{sido.short} 거주자가 계약 전에 확인할 순서</h2>
      <ol><li><a href={EV_PORTAL.remain} target="_blank" rel="noopener noreferrer">공식 공고·지급현황</a>에서 {sido.short}와 주소지 지역을 선택하고 최신 차수의 공고문을 읽습니다.</li><li>거주 기간과 기준일, 신청 가능한 개인·법인 구분, 일반·우선순위 물량을 확인합니다. 전국 공통 30일로 가정하지 않습니다.</li><li><a href={EV_PORTAL.localPrice} target="_blank" rel="noopener noreferrer">차종·모델별 표</a>에서 연식·구동방식·휠·가격 조건까지 일치하는 행의 국비와 지방비를 기록합니다.</li><li>차량 출고 가능일을 선정 후 기한과 대조하고 대리점의 접수 완료 여부를 확인합니다.</li></ol>
      <h2>잔여 대수가 있어도 마감일 수 있습니다</h2><p>이 표의 잔여는 출고 기준입니다. 접수·선정된 차량이 아직 출고되지 않은 경우, 출고잔여가 남아도 신규 접수는 종료됐을 수 있습니다. 표의 비고와 공식 신청마감 상태를 함께 보세요. 2026년 9월 이후 지방비 소진 시 개인의 국비만 지원하는 민간보조사업 적용 가능성도 최신 시행 공고에서 확인해야 합니다.</p>
      <p><a href={EV_PORTAL.inquiries} target="_blank" rel="noopener noreferrer">공식 지자체 문의처</a> · <Link href="/guide/how-to-check-remaining-quota">잔여대수 해설</Link> · <Link href="/guide/how-to-apply-ev-subsidy-2026">신청 절차</Link> · <Link href="/guide/ev-subsidy-documents-checklist">서류 확인표</Link></p>
    </section>
    <section className="mt-10"><h2 className="text-lg font-bold">다른 시·도</h2><ul className="mt-3 flex flex-wrap gap-3">{SIDO_LIST.filter(s=>s.slug!==slug).map(s=><li key={s.slug}><Link href={`/region/${s.slug}`} className="text-sm text-emerald-700 underline">{s.name}</Link></li>)}</ul></section>
  </>;
}
function Card({label,value,sub}:{label:string;value:string;sub:string}) {return <div className="rounded-xl border border-slate-200 p-4"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-2xl font-bold text-emerald-700">{value}</p><p className="mt-2 text-xs text-slate-500">{sub}</p></div>;}
