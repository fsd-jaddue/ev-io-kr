"use client";

import { useState } from "react";
import { passengerConversion, sumSubsidy } from "@/lib/ev/subsidy";
import { EV_PORTAL } from "@/lib/ev/portal";

export interface CalcRegion { slug: string; name: string; sigungu: { name: string; amount: number | null }[] }
export interface CalcCar { slug: string; name: string; national: number | null; localBySido: Record<string, number | null>; conversion: number | null }
const parseAmount = (text: string) => text.trim() !== "" && Number.isFinite(Number(text)) && Number(text) >= 0 && Number(text) <= 10000 ? Number(text) : null;

export default function Calculator({ regions, cars }: { regions: CalcRegion[]; cars: CalcCar[] }) {
  const [sidoSlug, setSido] = useState(regions[0]?.slug ?? "");
  const sido = regions.find((r) => r.slug === sidoSlug)!;
  const [district, setDistrict] = useState(sido.sigungu[0]?.name ?? "");
  const [carSlug, setCar] = useState(cars[0]?.slug ?? "");
  const [customNational, setCustomNational] = useState("");
  const [customLocal, setCustomLocal] = useState("");
  const [conversion, setConversion] = useState(false);
  const car = cars.find((c) => c.slug === carSlug)!;
  const national = customNational === "" ? car.national : parseAmount(customNational);
  // 직접 입력 국비는 다른 트림일 수 있으므로 기존 트림 지방비를 재사용하지 않는다.
  const knownLocal = customNational === "" ? car.localBySido[sidoSlug] ?? null : null;
  const local = customLocal === "" ? knownLocal : parseAmount(customLocal);
  const conv = national === null ? null : customNational === "" ? car.conversion ?? passengerConversion(national) : passengerConversion(national);
  const total = national === null || local === null || conv === null ? null : sumSubsidy(national, local, conversion ? conv : 0);
  const invalid = (customNational !== "" && parseAmount(customNational) === null) || (customLocal !== "" && parseAmount(customLocal) === null);
  const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base";

  return <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
    <form className="space-y-5 rounded-xl border border-slate-200 p-5" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">시·도<select className={inputClass} value={sidoSlug} onChange={(e) => { setSido(e.target.value); setDistrict(regions.find(r => r.slug === e.target.value)!.sigungu[0]?.name ?? ""); setCustomLocal(""); }}>
          {regions.map(r => <option key={r.slug} value={r.slug}>{r.name}</option>)}
        </select></label>
        <label className="block text-sm font-medium">시·군·구<select className={inputClass} value={district} onChange={(e) => { setDistrict(e.target.value); setCustomLocal(""); }}>
          {sido.sigungu.map(g => <option key={g.name}>{g.name}</option>)}
        </select></label>
      </div>
      <label className="block text-sm font-medium">차종<select className={inputClass} value={carSlug} onChange={(e) => { setCar(e.target.value); setCustomNational(""); setCustomLocal(""); }}>
        {cars.map(c => <option key={c.slug} value={c.slug}>{c.name} — 국비 {c.national}만원</option>)}
      </select></label>
      <label className="block text-sm font-medium">국비 직접 입력 (만원, 다른 트림을 계산할 때)
        <input type="number" min="0" max="10000" step="0.01" inputMode="decimal" className={inputClass} placeholder={String(car.national ?? "")} value={customNational} onChange={e => {setCustomNational(e.target.value);setCustomLocal("");}} />
      </label>
      <label className="block text-sm font-medium">해당 트림 지방비 (만원)
        <input type="number" min="0" max="10000" step="0.01" inputMode="decimal" className={inputClass} placeholder={knownLocal === null ? "공식 표의 지방비 입력" : String(knownLocal)} value={customLocal} onChange={e => setCustomLocal(e.target.value)} />
        <span className="mt-2 block text-xs font-normal leading-5 text-slate-600">{knownLocal === null ? "이 지역의 모델별 지방비는 자동 입력하지 않습니다." : `동일 트림의 ${sido.name} 수집값 ${knownLocal}만원을 사용합니다.`} <a href={EV_PORTAL.localPrice} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">공식 차종·모델 보조금 표</a>에서 거주 지역과 정확한 트림을 선택해 확인하세요. 지역 최고액을 입력하면 과대 계산될 수 있습니다.</span>
      </label>
      <label className="flex items-start gap-2 text-sm leading-6"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={conversion} onChange={e => setConversion(e.target.checked)} />승용 전환지원금 조건 충족 시 국비 포함 (최대 100만원)</label>
      <p className="text-xs leading-5 text-slate-600">최초등록·보유 3년 이상 내연기관차의 판매·폐차, 개인 구매 등 요건을 확인해야 합니다. 하이브리드는 제외되며 가족 간 거래 제한이 있습니다. 체크만으로 자격이 판정되지는 않습니다.</p>
      {invalid && <p role="alert" className="text-sm text-rose-700">금액은 0~10,000만원 범위의 숫자로 입력하세요.</p>}
    </form>
    <aside className="rounded-xl bg-slate-900 p-5 text-white" aria-live="polite">
      <p className="text-sm text-slate-300">입력·수집 금액 합계</p>
      {total !== null && !invalid ? <>
        <p className="mt-2 text-4xl font-black tabular-nums">{total.toLocaleString()}<span className="ml-1 text-lg">만원</span></p>
        <dl className="mt-5 space-y-3 text-sm">
          <Row label="국비" value={national!} /><Row label={`지방비 (${district})`} value={local!} />
          {conversion && <Row label="전환지원 국비 (요건 충족 가정)" value={conv!} />}
        </dl>
        <p className="mt-5 text-xs leading-5 text-slate-300">지방비 출처: {customLocal !== "" ? "사용자 입력" : "무공해차 통합누리집 동일 트림 수집값"}. 전환지원 지방비·청년·다자녀 등 추가금과 세제 혜택은 제외했습니다. 예산과 자격 심사에 따라 지급 여부가 달라집니다.</p>
      </> : <p className="mt-3 text-sm leading-6 text-slate-300">{invalid ? "입력 금액을 확인해 주세요." : "해당 트림의 지방비를 입력하면 합계를 표시합니다. 미확인 금액을 0원이나 지역 최고액으로 대체하지 않습니다."}</p>}
    </aside>
  </div>;
}
function Row({ label, value }: { label: string; value: number }) { return <div className="flex justify-between gap-3"><dt>{label}</dt><dd className="whitespace-nowrap font-semibold">{value.toLocaleString()}만원</dd></div>; }
