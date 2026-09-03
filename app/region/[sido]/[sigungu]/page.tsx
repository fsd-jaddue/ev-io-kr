import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import RemainTable from "@/components/RemainTable";
import AdSlot from "@/components/AdSlot";
import { getLocalPriceData } from "@/lib/ev/getData";
import { estimateTotal, won } from "@/lib/ev/summary";
import { pageMetadata } from "@/lib/seo";
import { SIDO_LIST, decodeSigungu, getSido, sigunguSlug } from "@/data/regions";
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
  return { sido, name, local, row };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = await load(params);
  if (!d) return {};
  const total = d.row.amount === null ? null : d.row.amount + NATIONAL_MAX.large;
  return pageMetadata({
    title: `${d.sido.short} ${d.name} 전기차 보조금 2026`,
    description: `2026년 ${d.sido.name} ${d.name} 승용 전기차 보조금: 지방비 ${won(d.row.amount)}${total ? `, 국비 ${NATIONAL_MAX.large}만원 합산 최대 ${total.toLocaleString()}만원` : ""}. 차종별 예상 지원액, 전환지원금, 신청 방법 정리.`,
    path: `/region/${d.sido.slug}/${sigunguSlug(d.name)}`,
    keywords: [`${d.name} 전기차 보조금`, `${d.sido.short} ${d.name} 전기차 보조금`, `${d.name} 전기차 지방비`],
  });
}

export default async function SigunguPage({ params }: { params: Params }) {
  const d = await load(params);
  if (!d) notFound();
  const { sido, name, local, row } = d;
  const siblings = local.rows.filter((r) => r.sido === sido.slug && r.sigungu !== name);
  const cars = CARS.filter((c) => c.national !== null);

  return (
    <>
      <Breadcrumb
        items={[
          { name: "지역별 보조금", path: "/region" },
          { name: sido.name, path: `/region/${sido.slug}` },
          { name, path: `/region/${sido.slug}/${sigunguSlug(name)}` },
        ]}
      />
      <h1 className="text-3xl font-black text-slate-900">
        {sido.short} {name} 전기차 보조금 2026
      </h1>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        {sido.name} {name}에 주소를 둔 개인·법인이 승용 전기차를 구매할 때 받을 수 있는 지방비와 국비 합산 예상액입니다.
        {row.note ? ` ${row.note}.` : ""} 실제 지급액은 차종별 국비 산정액에 비례하며, 공고 물량이 소진되면 지급되지 않습니다.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card label={`${name} 지방비 최대`} value={won(row.amount)} />
        <Card label="국비 최대" value={won(NATIONAL_MAX.large)} sub={`소형 ${NATIONAL_MAX.small}만원`} />
        <Card
          label="합산 최대"
          value={row.amount === null ? "-" : won(row.amount + NATIONAL_MAX.large)}
          sub={`전환지원금 적용 시 ${row.amount === null ? "-" : won(row.amount + NATIONAL_MAX.large + NATIONAL_MAX.conversion)}`}
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

      {row.amount !== null && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{name} 차종별 예상 지원액</h2>
          <p className="mt-1 text-sm text-slate-500">지방비는 국비 산정액 비율에 따라 비례 지급되는 것으로 계산했습니다. 전환지원금은 내연기관차 처분 시 +100만원.</p>
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

      <RemainTable sido={sido.slug} regionFilter={name} sidoName={sido.name} title={`${name} 접수·출고·잔여 현황`} />

      <section className="prose-ev mt-10 max-w-3xl">
        <h2>{name} 보조금 신청 전 체크리스트</h2>
        <ul>
          <li>공고일 기준 {name}에 30일 이상 주민등록(법인은 사업장 소재지)이 되어 있는지</li>
          <li>최근 2년 내 전기차 보조금을 받은 이력이 없는지(재지원 제한 지역 확인)</li>
          <li>구매 차종이 보조금 지급대상 차종 목록에 있는지, 차량가 5,300만원·8,500만원 기준선 어디에 해당하는지</li>
          <li>내연기관차를 처분(폐차·이전)하면 전환지원금 100만원 대상이 되는지</li>
          <li>대상자 선정 후 2개월 내 출고 가능한 계약인지(출고 지연 시 자격 취소)</li>
        </ul>
        <p>
          공고 원문은 <a href={EV_PORTAL.remain} target="_blank" rel="noopener noreferrer">무공해차 통합누리집</a>과 {sido.name} 또는 {name} 홈페이지 고시·공고에서 확인할 수 있습니다.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">{sido.short} 다른 시·군·구</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {siblings.map((s) => (
            <li key={s.sigungu}>
              <Link
                href={`/region/${sido.slug}/${sigunguSlug(s.sigungu)}`}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
              >
                {s.sigungu} {s.amount !== null && <span className="text-slate-400">{s.amount}</span>}
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
