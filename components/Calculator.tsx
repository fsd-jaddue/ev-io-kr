"use client";

import { useMemo, useState } from "react";
import { passengerConversion } from "@/lib/ev/subsidy";

export interface CalcRegion {
  slug: string;
  name: string;
  sigungu: { name: string; amount: number | null }[];
}
export interface CalcCar {
  slug: string;
  name: string;
  national: number | null;
}

const ACQ_TAX_MAX = 140;

/** refNational: 지역 최대 지방비가 대응하는 국비(수집 목록 최고 국비). 지방비 추정 = 최대 × 국비 ÷ refNational */
export default function Calculator({ regions, cars, refNational }: { regions: CalcRegion[]; cars: CalcCar[]; refNational: number }) {
  const [sidoSlug, setSido] = useState(regions[0]?.slug ?? "");
  const sido = regions.find((r) => r.slug === sidoSlug) ?? regions[0];
  const [sigunguName, setSigungu] = useState(sido?.sigungu[0]?.name ?? "");
  const [carSlug, setCar] = useState(cars.find((c) => c.national !== null)?.slug ?? "");
  const [conversion, setConversion] = useState(false);
  const [customNational, setCustomNational] = useState<string>("");

  const sigungu = sido?.sigungu.find((g) => g.name === sigunguName) ?? sido?.sigungu[0];
  const car = cars.find((c) => c.slug === carSlug);

  const result = useMemo(() => {
    const national = customNational !== "" ? Number(customNational) : car?.national ?? null;
    const localMax = sigungu?.amount ?? null;
    if (national === null || Number.isNaN(national) || localMax === null) return null;
    const ratio = Math.min(1, Math.max(0, national / refNational));
    const local = Math.round(localMax * ratio);
    const conv = conversion ? passengerConversion(Math.max(0, national)) : 0;
    return { national, local, conv, total: national + local + conv, ratio };
  }, [car, sigungu, conversion, customNational, refNational]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form className="space-y-5 rounded-xl border border-slate-200 p-5" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            시·도
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
              value={sidoSlug}
              onChange={(e) => {
                setSido(e.target.value);
                const next = regions.find((r) => r.slug === e.target.value);
                setSigungu(next?.sigungu[0]?.name ?? "");
              }}
            >
              {regions.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            시·군·구
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
              value={sigungu?.name ?? ""}
              onChange={(e) => setSigungu(e.target.value)}
            >
              {sido?.sigungu.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name}
                  {g.amount !== null ? ` (${g.amount}만원)` : " (공고 확인)"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          차종
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
            value={carSlug}
            onChange={(e) => {
              setCar(e.target.value);
              setCustomNational("");
            }}
          >
            {cars.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
                {c.national !== null ? ` — 국비 ${c.national}만원` : " — 국비 직접 입력"}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          국비 직접 입력 (만원, 선택)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={refNational}
            placeholder={car?.national !== null && car?.national !== undefined ? String(car.national) : "예: 450"}
            value={customNational}
            onChange={(e) => setCustomNational(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            무공해차 통합누리집 &lsquo;보조금 지급대상 차종&rsquo;의 트림별 국비를 알고 있다면 입력하세요.
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={conversion} onChange={(e) => setConversion(e.target.checked)} className="h-4 w-4" />
          3년 이상 보유한 내연기관차(하이브리드 제외)를 폐차·이전하고 구매 — 전환지원 국비(최대 100만원, 국비 500만원 미만 차종은 차등)
        </label>
      </form>

      <aside className="rounded-xl bg-slate-900 p-5 text-white">
        <p className="text-sm text-slate-300">예상 보조금 합계</p>
        {result ? (
          <>
            <p className="mt-1 text-4xl font-black tabular-nums">{result.total.toLocaleString()}<span className="ml-1 text-lg font-semibold">만원</span></p>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="국비" v={`${result.national}만원`} />
              <Row k={`지방비 (${sigungu?.name}, 비율 ${Math.round(result.ratio * 100)}%)`} v={`${result.local}만원`} />
              {result.conv > 0 && <Row k="전환지원 국비" v={`${result.conv}만원`} />}
              <Row k="취득세 감면 (별도)" v={`최대 ${ACQ_TAX_MAX}만원`} muted />
            </dl>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              지방비는 지역 최고액 × (국비 ÷ 수집 최고 국비 {refNational}만원)으로 계산한 추정치입니다. 서울은 누리집 수집값과 일치하지만 다른 지역은
              공식 표의 같은 모델 행으로 다시 확인하세요. 지자체 추가 인센티브와 예산 소진 여부에 따라 실제 지급액은 달라집니다.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-300">
            선택한 지역의 지방비 또는 차종의 국비가 확인되지 않았습니다. 국비를 직접 입력하거나 다른 지역·차종을 선택하세요.
          </p>
        )}
      </aside>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${muted ? "text-slate-400" : ""}`}>
      <dt>{k}</dt>
      <dd className="font-semibold tabular-nums">{v}</dd>
    </div>
  );
}
