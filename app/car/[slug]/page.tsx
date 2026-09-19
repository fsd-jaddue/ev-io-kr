import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import AdSlot from "@/components/AdSlot";
import FaqList from "@/components/FaqList";
import { getLocalPriceData } from "@/lib/ev/getData";
import { summarizeBySido, won } from "@/lib/ev/summary";
import { faqJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { CARS, CARS_SNAPSHOT, carName, getCar } from "@/data/cars";
import { normalizeModel } from "@/lib/ev/carsOverlay";
import { verifiedSupport } from "@/lib/ev/verifiedSupport";
import { getCarContent } from "@/content/cars";
import { EV_PORTAL } from "@/lib/ev/parse";
import { CarArt } from "@/components/illustrations";

export function generateStaticParams() {
  return CARS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const car = getCar(slug);
  if (!car) notFound();
  return pageMetadata({
    title: `${car.brand} ${car.model} ${car.trim.replace(/\s*\(.*\)\s*$/, "")} 보조금 2026`,
    description: `2026년 ${car.brand} ${car.model} ${car.trim} 전기차 보조금: 국비 ${car.national === null ? "트림별 확인" : `${car.national}만원`}, 전환지원 국비는 자격·차종별 차등, 동일 트림의 서울 지방비 수집값, 트림별 국비 비교와 확인 방법, 구매 전 확인할 점 정리.`,
    path: `/car/${slug}`,
    noindex: car.national === null,
    keywords: [`${car.model} 보조금`, `${car.brand} ${car.model} 보조금 2026`, `${car.model} 국비`],
  });
}

/** 누리집 수집 목록에서 같은 계열(family) 트림을 국비 내림차순으로 */
function familyRows(family: string) {
  let re: RegExp;
  try {
    re = new RegExp(family, "i");
  } catch {
    return [];
  }
  return CARS_SNAPSHOT.rows
    .filter((r) => re.test(normalizeModel(r.maker, r.model)))
    .sort((a, b) => (b.national ?? -1) - (a.national ?? -1) || a.model.localeCompare(b.model, "ko"));
}

export default async function CarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = getCar(slug);
  if (!car) notFound();
  const local = await getLocalPriceData();
  const summary = summarizeBySido(local.rows).filter((s) => s.max !== null);
  const support = verifiedSupport(car, "seoul");
  const content = getCarContent(car, getCar);
  const trims = content ? familyRows(content.family) : [];
  const rivals = (content?.rivals ?? []).map((r) => ({ ...r, car: getCar(r.slug) })).filter((r) => r.car);
  const others = CARS.filter((c) => c.slug !== slug && c.brand === car.brand && !rivals.some((r) => r.slug === c.slug)).slice(0, 4);
  const faq = content?.faq ?? [];
  const title = `${car.model} ${car.trim} 보조금 2026`;

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            name: `${carName(car)} 보조금 2026`,
            description: `${carName(car)} 2026년 국비 보조금, 트림별 국비 차이, 동일 트림의 서울 지방비와 확인 방법`,
            path: `/car/${slug}`,
            dateModified: CARS_SNAPSHOT.updatedAt > "2026-09-20" ? CARS_SNAPSHOT.updatedAt : "2026-09-20",
          }),
          ...(faq.length ? [faqJsonLd(faq)] : []),
        ]}
      />
      <Breadcrumb items={[{ name: "차종별 국비", path: "/car" }, { name: `${car.brand} ${car.model}`, path: `/car/${slug}` }]} />
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-emerald-700">{car.brand}</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">{title}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            {car.brand} {car.model} {car.trim}의 수집된 보조금과 모델별 차이를 정리했습니다. {car.slug === "musso-ev" ? "화물 분류 확인이 필요한 픽업으로 승용 계산식을 적용하지 않습니다." : "계약서의 연식·구동방식·휠·가격 조건을 공식 표와 대조하세요."}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            국비 기준: {car.nationalSource === "collected" ? `무공해차 통합누리집 ${CARS_SNAPSHOT.updatedAt} 수집값` : "해당 트림 수집값 미확인"} · 지방비 기준 {local.updatedAt}
          </p>
        </div>
        <CarArt className="hidden w-44 shrink-0 lg:block" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card
          label="2026 국비"
          value={car.national === null ? "트림별 확인" : `${car.national}만원`}
          sub={
            car.nationalSource === "collected" && car.evModels?.length
              ? `누리집 수집값 · ${car.evModels.join(", ")}`
              : "공식 지급대상 차종과 분류를 확인하세요"
          }
        />
        <Card label="전환지원 국비" value={support.conversion === null ? "공식 표 확인" : `${support.conversion}만원`} sub="자격 충족 시 별도 추가 · 지방비 제외" />
        <Card label="서울 지방비" value={support.local === null ? "공식 표 확인" : `${support.local}만원`} sub="동일 대표 트림 수집값" />
      </div>

      {car.national === null && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          이 차종은 누리집 승용 수집 목록에서 확정 국비를 찾지 못해 금액을 표시하지 않았습니다.{" "}
          <a href={EV_PORTAL.targetVehicle} target="_blank" rel="noopener noreferrer" className="underline">
            무공해차 통합누리집 보조금 지급대상 차종
          </a>
          에서 제조사와 모델을 선택해 확인하세요.
        </div>
      )}

      {content && (
        <section className="prose-ev mt-8 max-w-3xl">
          <h2>{car.model}, 어떤 차인가</h2>
          {content.intro.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </section>
      )}

      {trims.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{car.model} 트림별 국비 (누리집 등록 {trims.length}종)</h2>
          <p className="mt-1 text-sm text-slate-500">
            무공해차 통합누리집 &lsquo;지자체별 차종·모델 보조금&rsquo;에 등록된 {car.model} 계열 모델의 국비입니다({CARS_SNAPSHOT.updatedAt} 수집). 굵게 표시한 행이 이 페이지의 기준 트림입니다.
          </p>
          <div className="table-wrap mt-3">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">누리집 등록 모델명</th>
                  <th className="px-3 py-2 text-right font-semibold">국비</th>
                  <th className="px-3 py-2 text-right font-semibold">기준 트림 대비</th>
                  <th className="px-3 py-2 text-right font-semibold">전환지원금(국비)</th>
                </tr>
              </thead>
              <tbody>
                {trims.map((r) => {
                  const mine = car.evModels?.includes(r.model);
                  const diff = car.national !== null && r.national !== null ? r.national - car.national : null;
                  return (
                    <tr key={`${r.maker}|${r.model}`} className={`border-t border-slate-100 ${mine ? "bg-emerald-50 font-bold" : ""}`}>
                      <td className="px-3 py-2">{r.model}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-emerald-700">{won(r.national)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-500">
                        {diff === null ? "-" : diff === 0 ? "같음" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)}만원`}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600">{won(r.conversionNational)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            전환지원금(국비) 열은 누리집이 모델별로 표시하는 전환지원 국비 항목입니다. 지방비는 국비 비율에 따라 지역별로 달라집니다.
          </p>
        </section>
      )}

      {content && (
        <section className="prose-ev mt-10 max-w-3xl">
          <h2>지급액과 산정 원인을 구분하세요</h2>
          <ul>
            {content.points.map((p) => (
              <li key={p.slice(0, 40)}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {car.national !== null && <section className="prose-ev mt-10 max-w-3xl">
        <h2>거주지 지방비를 함께 확인하세요</h2>
        {support.local !== null && <p>대표 트림의 서울 기본 합계는 국비 {car.national}만원 + 지방비 {support.local}만원 = <strong>{car.national + support.local}만원</strong>입니다. {support.conversion !== null ? "전환 요건 충족 시 국비 " + support.conversion + "만원이 별도 추가됩니다." : "전환지원은 공식 표를 확인하세요."} 다른 추가금과 전환지원 지방비는 제외했습니다.</p>}
        <p>다른 지역의 모델별 지방비는 지역 최고액으로 역산하지 않습니다. <a href={EV_PORTAL.localPrice} target="_blank" rel="noopener noreferrer">공식 지역별 모델 표</a>에서 정확한 금액을 확인한 뒤 <Link href="/calculator">계산기</Link>에 입력하세요.</p>
        <p><Link href="/guide/national-subsidy-calculation-2026">최고액으로 비례 계산하면 틀리는 실제 사례</Link></p>
        <ul className="flex flex-wrap gap-x-4">{summary.map(s=><li key={s.slug}><Link href={"/region/"+s.slug}>{s.short} 현황</Link></li>)}</ul>
      </section>}

      {car.national !== null && <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CAR} />}

      {content && (
        <section className="prose-ev mt-10 max-w-3xl">
          <h2>{car.model} 계약 전에 확인할 점</h2>
          <ul>
            {content.tips.map((p) => (
              <li key={p.slice(0, 40)}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {rivals.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{car.model}와 함께 비교하는 차종</h2>
          <div className="table-wrap mt-3">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">차종</th>
                  <th className="px-3 py-2 text-right font-semibold">국비</th>
                  <th className="px-3 py-2 font-semibold">비교 포인트</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 bg-emerald-50 font-bold">
                  <td className="px-3 py-2">{carName(car)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{won(car.national)}</td>
                  <td className="px-3 py-2 text-slate-500">이 페이지</td>
                </tr>
                {rivals.map((r) => (
                  <tr key={r.slug} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <Link href={`/car/${r.slug}`} className="font-medium text-slate-900 hover:text-emerald-700 hover:underline">
                        {carName(r.car!)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-emerald-700">{won(r.car!.national)}</td>
                    <td className="px-3 py-2 text-slate-600">{r.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="prose-ev mt-10 max-w-3xl">
        <h2>{car.model} 구매 시 함께 챙길 혜택</h2>
        <p>취득세 감면은 차종·용도·취득일과 법정 요건에 따라 확인해야 합니다. 제작사 가격에 이미 반영된 세제 혜택을 다시 차감하지 마세요. <Link href="/guide/ev-tax-benefits-2026">취득세 감면과 견적서 확인 방법</Link>에서 산출 항목을 확인할 수 있습니다. 주차장·통행료 등 할인은 이용 시설의 현재 적용 조건을 확인하세요.</p>
        <p>
          보조금 신청 절차는 <Link href="/guide/how-to-apply-ev-subsidy-2026">신청 절차 7단계 가이드</Link>, 정확한 지역별 계산은{" "}
          <Link href="/calculator">보조금 계산기</Link>를 참고하세요. 국비 산정 방식 자체가 궁금하다면{" "}
          <Link href="/guide/national-subsidy-calculation-2026">국고보조금 산정 기준 해설</Link>을 읽어 보세요.
        </p>
      </section>

      <FaqList items={faq} title={`${car.model} 보조금 자주 묻는 질문`} />

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
