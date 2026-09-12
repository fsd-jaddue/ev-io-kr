import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import AdSlot from "@/components/AdSlot";
import FaqList from "@/components/FaqList";
import { getLocalPriceData } from "@/lib/ev/getData";
import { estimateTotal, summarizeBySido, won } from "@/lib/ev/summary";
import { faqJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { CARS, CARS_SNAPSHOT, NATIONAL_MAX, carName, getCar } from "@/data/cars";
import { normalizeModel } from "@/lib/ev/carsOverlay";
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
    description: `2026년 ${car.brand} ${car.model} ${car.trim} 전기차 보조금: 국비 ${car.national === null ? "트림별 확인" : `${car.national}만원`}, 전환지원금 +100만원, 서울·경기·경북 등 지역별 지방비 합산 예상액, 트림별 국비 차이와 산정 배경, 구매 전 확인할 점 정리.`,
    path: `/car/${slug}`,
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
            description: `${carName(car)} 2026년 국비 보조금, 트림별 국비 차이, 시·도별 지방비 합산 예상액`,
            path: `/car/${slug}`,
            dateModified: local.updatedAt,
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
            {car.brand} {car.model} {car.trim}은(는) {car.segment} 승용 전기차로 차량 기본가격 구간이 {car.priceBand}에 해당합니다.
            {car.range ? ` 1회 충전 주행거리는 약 ${car.range}km(인증 기준)입니다.` : ""}
            {car.note ? ` ${car.note}.` : ""}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            국비 기준: {car.nationalSource === "collected" ? `무공해차 통합누리집 ${CARS_SNAPSHOT.updatedAt} 수집값` : "환경부 지침·누리집 확인값(수기)"} · 지방비 기준 {local.updatedAt}
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
              : `상한 ${car.segment === "중대형" ? NATIONAL_MAX.large : NATIONAL_MAX.small}만원`
          }
        />
        <Card label="전환지원금 포함" value={car.national === null ? "-" : `${car.national + NATIONAL_MAX.conversion}만원`} sub="내연기관차 처분 시" />
        <Card label="가격 구간" value={car.priceBand} sub="5,300만원 미만 100% · 8,500만원 미만 50%" />
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
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{won(r.national)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                        {diff === null ? "-" : diff === 0 ? "같음" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)}만원`}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">{won(r.conversionNational)}</td>
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
          <h2>국비 {car.national === null ? "산정" : `${car.national}만원`}, 이렇게 나왔습니다</h2>
          <ul>
            {content.points.map((p) => (
              <li key={p.slice(0, 40)}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {car.national !== null && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{car.model} 시·도별 예상 지원액 (지방비 최대 지역 기준)</h2>
          <p className="mt-1 text-sm text-slate-500">
            지방비는 국비 산정액 비율({Math.round((car.national / NATIONAL_MAX.large) * 100)}%)에 비례해 계산했습니다. 시·군·구별 금액은 지역 페이지에서 확인하세요.
          </p>
          <div className="table-wrap mt-3">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">시·도</th>
                  <th className="px-3 py-2 text-right font-semibold">지방비(비례)</th>
                  <th className="px-3 py-2 text-right font-semibold">합계</th>
                  <th className="px-3 py-2 text-right font-semibold">전환 포함</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => {
                  const e = estimateTotal({ national: car.national!, localMax: s.max! });
                  return (
                    <tr key={s.slug} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <Link href={`/region/${s.slug}`} className="font-medium text-slate-900 hover:text-emerald-700 hover:underline">
                          {s.name}
                        </Link>
                        {!s.uniform && !s.equal && <span className="ml-1 text-xs text-slate-400">최대 기준</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{e.local}만원</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-emerald-700">{e.total.toLocaleString()}만원</td>
                      <td className="px-3 py-2 text-right tabular-nums">{(e.total + NATIONAL_MAX.conversion).toLocaleString()}만원</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CAR} />

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
                  <th className="px-3 py-2 text-right font-semibold">주행거리</th>
                  <th className="px-3 py-2 font-semibold">비교 포인트</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 bg-emerald-50 font-bold">
                  <td className="px-3 py-2">{carName(car)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{won(car.national)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{car.range ? `${car.range}km` : "-"}</td>
                  <td className="px-3 py-2 text-slate-500">이 페이지</td>
                </tr>
                {rivals.map((r) => (
                  <tr key={r.slug} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <Link href={`/car/${r.slug}`} className="font-medium text-slate-900 hover:text-emerald-700 hover:underline">
                        {carName(r.car!)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{won(r.car!.national)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.car!.range ? `${r.car!.range}km` : "-"}</td>
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
        <ul>
          <li><strong>취득세 감면</strong> — 전기차 취득세 최대 140만원 감면(2026년 기준, 일몰 여부는 매년 확인)</li>
          <li><strong>개별소비세 감면</strong> — 최대 300만원 한도 개소세 감면 및 교육세 연동 감면</li>
          <li><strong>자동차세</strong> — 배기량 기준이 아닌 정액 연 13만원(지방교육세 포함)</li>
          <li><strong>공영주차장·고속도로 통행료</strong> — 지자체 공영주차장 50% 할인, 고속도로 통행료 감면(2026년 축소 단계 확인)</li>
        </ul>
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
