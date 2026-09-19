import Link from "next/link";
import type { Metadata } from "next";
import SidoGrid from "@/components/SidoGrid";
import RemainHero from "@/components/remain/RemainHero";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";
import { getLocalPriceData, getRemainSnapshot } from "@/lib/ev/getData";
import { summarizeBySido } from "@/lib/ev/summary";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { verifiedSupport } from "@/lib/ev/verifiedSupport";
import { CARS, NATIONAL_MAX, carName } from "@/data/cars";
import { GUIDES } from "@/content/guides";
import GuideCard from "@/components/GuideCard";
import { IconCalc, IconGift, IconPercent } from "@/components/illustrations";

export const metadata: Metadata = pageMetadata({
  // 홈은 사이트명 대신 검색어 형태(연도 + 띄어쓴 핵심어)를 앞세운다. 사이트명은 og:site_name·JSON-LD 로 전달
  title: `2026 전기차 보조금 조회 | 지역·차종별 국비·지방비 현황`,
  description: SITE.description,
  path: "/",
});

const FAQ = [
  {
    q: "2026년 전기차 보조금은 최대 얼마인가요?",
    a: "일반 승용 기본 지원과 특수 사양·개인 추가 지원을 구분해야 합니다. 같은 모델 행의 국비·거주지 지방비를 확인하고, 전환지원 국비는 자격 충족 시 차등 지급되는 최대 100만원을 별도로 확인하세요.",
  },
  {
    q: "지방비는 어디 기준으로 받나요?",
    a: "차량을 등록하는 주소지(주민등록상 거주지) 시·군·구 기준입니다. 거주 기간과 기준일, 신청 주체의 요건은 해당 지자체 공고에서 확인해야 합니다.",
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
  const remain = getRemainSnapshot();
  const summary = summarizeBySido(local.rows);
  const topCars = CARS.filter((c) => c.national !== null)
    .sort((a, b) => (b.national ?? 0) - (a.national ?? 0))
    .slice(0, 6);
  const latestGuides = GUIDES.slice(0, 6);
  const nationalMax = Math.max(...summary.map((s) => s.max ?? 0));

  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <RemainHero initial={remain}>
        <p className="text-sm font-medium text-emerald-100">2026년 지자체별 전기차 보조금 현황</p>
        <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
          내 지역 전기차 보조금,
          <br className="md:hidden" /> 국비·지방비 합산으로 한눈에
        </h1>
        <p className="mt-4 max-w-2xl text-emerald-50">
          전국 17개 시·도와 시·군·구별 승용 전기차 지방비, 차종별 국고보조금, 접수·출고·잔여 현황과 신청 절차를 정리했습니다.
          거주지 공고와 정확한 차종 금액을 확인하고, 계산기로 확인된 금액을 합산하세요.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/calculator" className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
            보조금 계산기
          </Link>
          <Link href="/region" className="rounded-lg border border-emerald-300/60 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
            지역별 보조금 보기
          </Link>
        </div>
      </RemainHero>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="승용 국비 최대" value={`${NATIONAL_MAX.large}만원`} sub={`소형 ${NATIONAL_MAX.small}만원`} />
        <Stat label="승용 전환지원 국비" value={`최대 ${NATIONAL_MAX.conversion}만원`} sub="자격 충족 시 · 차종별 차등" />
        <Stat label="수집 목록의 지방비 최고액" value={`${nationalMax.toLocaleString()}만원`} sub="특수 사양 포함 가능 · 내 차 지급액과 다름" />
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
                <th className="px-3 py-2 text-right font-semibold">국비+전환 국비</th>
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
                  <td className="px-3 py-2 text-right tabular-nums">{verifiedSupport(c,"seoul").conversion === null ? "공식 표 확인" : `${(c.national ?? 0) + verifiedSupport(c,"seoul").conversion!}만원`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">보조금은 이렇게 계산됩니다</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          <Step n={1} icon={<IconCalc />} title="국비 산정" body="성능보조금(주행거리·에너지효율)과 배터리안전보조금에 배터리효율·환경성·사후관리 계수를 곱하고, 차량가 5,300만원 미만은 100%, 8,500만원 미만은 50%를 적용합니다." />
          <Step n={2} icon={<IconPercent />} title="같은 모델의 지방비" body="지역 최고액을 내 차의 지방비로 사용할 수 없습니다. 공식 지역별 모델 표에서 같은 연식·트림 행의 국비와 지방비를 확인해 합산하세요." />
          <Step n={3} icon={<IconGift />} title="추가 인센티브" body="전환지원 국비는 최대 100만원이며 차량·보유 기간 등 자격에 따라 달라집니다. 청년·다자녀 추가 지원과 세금 감면은 별도의 조건과 재원을 확인하세요." />
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
