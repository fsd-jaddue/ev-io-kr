import Link from "next/link";
import type { Metadata } from "next";
import SidoGrid from "@/components/SidoGrid";
import RemainTable from "@/components/RemainTable";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";
import { getLocalPriceData } from "@/lib/ev/getData";
import { summarizeBySido } from "@/lib/ev/summary";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { CARS, NATIONAL_MAX, carName } from "@/data/cars";
import { GUIDES } from "@/content/guides";
import GuideCard from "@/components/GuideCard";
import { HeroIllustration, IconCalc, IconGift, IconPercent } from "@/components/illustrations";

export const metadata: Metadata = pageMetadata({
  title: SITE.name,
  description: SITE.description,
  path: "/",
});

const FAQ = [
  {
    q: "2026년 전기차 보조금은 최대 얼마인가요?",
    a: "중·대형 승용 전기차 국비는 최대 580만원, 소형은 최대 530만원이며 내연기관차를 처분하고 구매하면 전환지원금 100만원이 추가됩니다. 여기에 거주 지역 지방비(서울 194만원부터 경북 울릉군 756만원까지, 2026년 9월 누리집 수집 기준)가 더해집니다.",
  },
  {
    q: "지방비는 어디 기준으로 받나요?",
    a: "차량을 등록하는 주소지(주민등록상 거주지) 시·군·구 기준입니다. 공고일 기준 해당 지역에 30일 이상 거주 또는 사업장을 둔 경우가 일반적인 요건입니다.",
  },
  {
    q: "보조금 신청은 어디서 하나요?",
    a: "차량 구매계약 후 제작·수입사(대리점)가 환경부 무공해차 통합누리집(ev.or.kr)을 통해 지자체에 구매지원 신청서를 접수합니다. 개인이 직접 서류를 제출하는 경우는 드뭅니다.",
  },
  {
    q: "이 사이트의 금액은 확정 금액인가요?",
    a: "아닙니다. 무공해차 통합누리집과 지자체 공고를 바탕으로 정리한 참고 자료이며, 실제 지급액은 차종별 국비 산정액, 예산 잔여, 추가 인센티브에 따라 달라집니다. 신청 전 반드시 지자체 공고를 확인하세요.",
  },
];

export default async function HomePage() {
  const local = await getLocalPriceData();
  const summary = summarizeBySido(local.rows);
  const topCars = CARS.filter((c) => c.national !== null)
    .sort((a, b) => (b.national ?? 0) - (a.national ?? 0))
    .slice(0, 6);
  const latestGuides = GUIDES.slice(0, 6);
  const nationalMax = Math.max(...summary.map((s) => s.max ?? 0));

  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="grid items-center gap-6 px-6 py-10 md:grid-cols-[1.2fr_1fr] md:px-10 md:py-12">
          <div>
            <p className="text-sm font-medium text-emerald-100">2026년 지자체별 전기차 보조금 현황</p>
            <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
              내 지역 전기차 보조금,
              <br className="md:hidden" /> 국비·지방비 합산으로 한눈에
            </h1>
            <p className="mt-4 max-w-2xl text-emerald-50">
              전국 17개 시·도와 시·군·구별 승용 전기차 지방비, 차종별 국고보조금, 접수·출고·잔여 현황과 신청 절차를 정리했습니다.
              거주지와 차종을 고르면 예상 지원액을 바로 계산할 수 있습니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/calculator" className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
                보조금 계산기
              </Link>
              <Link href="/region" className="rounded-lg border border-emerald-300/60 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                지역별 보조금 보기
              </Link>
            </div>
          </div>
          <HeroIllustration className="mx-auto hidden w-full max-w-md md:block" />
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="승용 국비 최대" value={`${NATIONAL_MAX.large}만원`} sub={`소형 ${NATIONAL_MAX.small}만원`} />
        <Stat label="전환지원금" value={`+${NATIONAL_MAX.conversion}만원`} sub="내연기관차 처분 후 구매 시" />
        <Stat label="지방비 최대" value={`${nationalMax.toLocaleString()}만원`} sub="경북 울릉군 기준 (시·군·구별 상이)" />
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">시·도별 승용 지방비</h2>
          <Link href="/region" className="text-sm font-medium text-emerald-700 hover:underline">
            전체 보기
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          카드를 누르면 시·군·구별 금액과 접수 현황을 볼 수 있습니다. 기준 {local.updatedAt} · {local.basis}
        </p>
        <div className="mt-4">
          <SidoGrid items={summary} />
        </div>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME} />

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">차종별 국비 보조금 상위</h2>
          <Link href="/car" className="text-sm font-medium text-emerald-700 hover:underline">
            전체 차종
          </Link>
        </div>
        <div className="table-wrap mt-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">차종</th>
                <th className="px-3 py-2 text-right font-semibold">국비</th>
                <th className="px-3 py-2 text-right font-semibold">전환지원금 포함</th>
              </tr>
            </thead>
            <tbody>
              {topCars.map((c) => (
                <tr key={c.slug} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <Link href={`/car/${c.slug}`} className="font-medium text-slate-900 hover:text-emerald-700 hover:underline">
                      {carName(c)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{c.national}만원</td>
                  <td className="px-3 py-2 text-right tabular-nums">{(c.national ?? 0) + NATIONAL_MAX.conversion}만원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <RemainTable title="전국 접수·출고·잔여 현황 (승용)" />

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">보조금은 이렇게 계산됩니다</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          <Step n={1} icon={<IconCalc />} title="국비 산정" body="성능보조금(주행거리·에너지효율)과 배터리안전보조금에 배터리효율·환경성·사후관리 계수를 곱하고, 차량가 5,300만원 미만은 100%, 8,500만원 미만은 50%를 적용합니다." />
          <Step n={2} icon={<IconPercent />} title="지방비 비례" body="지자체 지방비는 국비 산정액에 비례해 지급됩니다. 국비를 100% 받는 차종은 지방비도 최대치를, 국비가 절반이면 지방비도 절반 수준을 받습니다." />
          <Step n={3} icon={<IconGift />} title="추가 인센티브" body="내연기관차 처분 시 전환지원금 100만원, 지자체별 다자녀·청년·취약계층 추가 지원, 취득세 최대 140만원 감면이 별도로 더해집니다." />
        </ol>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">최신 가이드</h2>
          <Link href="/guide" className="text-sm font-medium text-emerald-700 hover:underline">
            전체 가이드
          </Link>
        </div>
        <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {latestGuides.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">자주 묻는 질문</h2>
        <dl className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
          {FAQ.map((f) => (
            <div key={f.q} className="px-4 py-4">
              <dt className="font-semibold text-slate-900">{f.q}</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">{icon}</span>
        <span className="text-xs font-semibold text-emerald-700">STEP {n}</span>
      </div>
      <p className="mt-3 font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
    </li>
  );
}
