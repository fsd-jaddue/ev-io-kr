"use client";

import Link from "next/link";
import { useState, type Ref } from "react";
import RemainTable from "@/components/RemainTable";
import { getSido, sigunguPath } from "@/data/regions";
import { EV_PORTAL } from "@/lib/ev/portal";
import type { RemainData, RemainRow } from "@/lib/ev/types";
import type { Sido } from "@/lib/ev/types";
import {
  LEVEL_META,
  clampRatio,
  fmtNum,
  remainLevel,
  rowsForSido,
  sigunguHref,
  sortSigungu,
  topSigungu,
  type RemainTotals,
  type SidoRemainSummary,
} from "@/lib/ev/remainSummary";
import EmptyRemainNotice from "./EmptyRemainNotice";
import FreshnessBadge, { type RefreshState } from "./FreshnessBadge";
import SidoChips from "./SidoChips";
import { CountUp } from "./useCountUp";

interface Props {
  ref?: Ref<HTMLElement>;
  data: RemainData;
  summary: SidoRemainSummary[];
  totals: RemainTotals;
  selected: string | null;
  /** TOP 리스트에서 골라 들어왔을 때 펼쳐 둘 시·군·구 */
  focusRegion?: string;
  onSelect: (slug: string | null, region?: string) => void;
  refresh: RefreshState;
  className?: string;
}

/** 히어로 아래 도킹 패널: 전국 요약 → 시·도 상세(시·군·구 타일 / 단일 공고 카드 / 표) */
export default function RegionPanel({ ref, data, summary, totals, selected, focusRegion, onSelect, refresh, className = "" }: Props) {
  const empty = totals.regions === 0;
  const sel = selected ? summary.find((s) => s.slug === selected) : undefined;

  return (
    <section
      ref={ref}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5 md:p-6 ${className}`}
      aria-labelledby="remain-panel-title"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="remain-panel-title" className="text-lg font-bold text-slate-900">
          접수·출고·잔여 현황 <span className="text-sm font-medium text-slate-500">(승용)</span>
        </h2>
        <p className="text-xs text-slate-500">지도나 아래 시·도를 고르면 시·군·구별 현황이 펼쳐집니다</p>
      </div>

      {!empty && <SidoChips summary={summary} selected={selected} onSelect={(slug) => onSelect(slug)} className="mt-3" />}

      <div className="mt-4" aria-live="polite">
        {empty ? (
          <EmptyRemainNotice variant="light" />
        ) : sel ? (
          <SidoDetail
            key={sel.slug}
            summary={sel}
            rows={rowsForSido(data.rows, sel.slug)}
            data={data}
            initialExpanded={focusRegion}
            onBack={() => onSelect(null)}
          />
        ) : (
          <NationalView totals={totals} rows={data.rows} onSelect={onSelect} />
        )}
      </div>

      <FreshnessBadge variant="light" source={data.source} fetchedAt={data.fetchedAt} refresh={refresh} className="mt-5" />
    </section>
  );
}

/* ───────────────────────── 전국 ───────────────────────── */

function NationalView({
  totals,
  rows,
  onSelect,
}: {
  totals: RemainTotals;
  rows: RemainRow[];
  onSelect: (slug: string | null, region?: string) => void;
}) {
  const top = topSigungu(rows, 8);
  return (
    <div className="animate-fade-up motion-reduce:animate-none">
      <p className="text-sm text-slate-700">
        전국 잔여 <strong className="text-xl font-black tabular-nums text-emerald-700">{fmtNum(totals.remaining)}</strong>대
        <span className="text-slate-400"> · </span>
        소진 <strong className="tabular-nums text-rose-600">{totals.soldOut}</strong>/{totals.regions} 지역
        <span className="hidden sm:inline">
          <span className="text-slate-400"> · </span>
          공고 {fmtNum(totals.announced)} · 접수 {fmtNum(totals.applied)} · 출고 {fmtNum(totals.released)}
        </span>
      </p>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900">잔여 많은 시·군·구 TOP {top.length}</h3>
        <span className="text-xs text-slate-500">누르면 해당 시·도로 이동</span>
      </div>
      <ol className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {top.map((r, i) => (
          <li key={`${r.sidoSlug}-${r.region}`} className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: `${i * 30}ms` }}>
            <button
              type="button"
              onClick={() => onSelect(r.sidoSlug, r.region)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-bold text-emerald-700">{i + 1}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{r.sidoShort}</span>
              </div>
              <p className="mt-1 truncate font-semibold text-slate-900">{r.region}</p>
              <p className="text-lg font-black tabular-nums text-emerald-700">
                {fmtNum(r.remaining)}
                <span className="text-xs font-medium text-slate-500"> 대</span>
              </p>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ───────────────────────── 시·도 상세 ───────────────────────── */

function SidoDetail({
  summary: s,
  rows,
  data,
  initialExpanded,
  onBack,
}: {
  summary: SidoRemainSummary;
  rows: RemainRow[];
  data: RemainData;
  initialExpanded?: string;
  onBack: () => void;
}) {
  const sido = getSido(s.slug);
  const meta = LEVEL_META[s.level];
  const [sort, setSort] = useState<"remaining" | "name">("remaining");
  const [view, setView] = useState<"tiles" | "table">("tiles");
  const [expanded, setExpanded] = useState<string | null>(initialExpanded ?? null);
  const pct = s.releaseRatio === null ? null : Math.round(s.releaseRatio * 100);
  const single = s.single && rows.length === 1;
  const showGrid = !single && rows.length > 0;

  return (
    <div className="animate-fade-up motion-reduce:animate-none">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
        >
          ← 전국
        </button>
        <h3 className="text-xl font-bold text-slate-900">{s.name}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badge}`}>
          {meta.label}
          {s.ratio !== null && ` · 잔여율 ${Math.round(s.ratio * 100)}%`}
        </span>
        <Link href={`/region/${s.slug}`} className="ml-auto text-sm font-medium text-emerald-700 hover:underline">
          {s.short} 지방비·상세 →
        </Link>
      </div>

      {rows.length === 0 ? (
        <MissingNotice slug={s.slug} short={s.short} />
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Kpi label="공고" value={s.announced} />
            <Kpi label="접수" value={s.applied} />
            <Kpi label="출고" value={s.released} />
            <Kpi label="잔여" value={s.remaining} valueClass={meta.text} boxClass={`${meta.bg} ${meta.border}`} soldOut={s.level === "soldout"} />
          </dl>

          {pct !== null && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  출고율 <strong className="tabular-nums text-slate-700">{pct}%</strong> (출고 {fmtNum(s.released)} / 공고 {fmtNum(s.announced)})
                </span>
                {s.rowCount > 1 && (
                  <span>
                    소진 <strong className="tabular-nums text-rose-600">{s.soldOutCount}</strong>/{s.rowCount} 지역
                  </span>
                )}
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full origin-left rounded-full ${meta.bar} animate-bar-grow motion-reduce:animate-none`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {single && sido && <SingleCard sido={sido} row={rows[0]} />}

          {showGrid && (
            <>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  시·군·구별 현황 <span className="font-medium text-slate-500">{rows.length}곳</span>
                </h4>
                <div className="flex items-center gap-1.5">
                  <div role="group" aria-label="정렬" className="inline-flex rounded-md border border-slate-200 p-0.5 text-xs">
                    <SortButton active={sort === "remaining"} onClick={() => setSort("remaining")}>
                      잔여 많은 순
                    </SortButton>
                    <SortButton active={sort === "name"} onClick={() => setSort("name")}>
                      가나다순
                    </SortButton>
                  </div>
                  <button
                    type="button"
                    aria-pressed={view === "table"}
                    onClick={() => setView(view === "table" ? "tiles" : "table")}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    {view === "table" ? "타일로 보기" : "표로 보기"}
                  </button>
                </div>
              </div>
              {view === "table" ? (
                <div className="mt-3">
                  <RemainTable embedded data={{ ...data, rows }} />
                </div>
              ) : (
                <SigunguGrid
                  rows={sortSigungu(rows, sort)}
                  slug={s.slug}
                  expanded={expanded}
                  onToggle={(region) => setExpanded(expanded === region ? null : region)}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function SortButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded px-2 py-1 ${active ? "bg-emerald-600 font-semibold text-white" : "text-slate-600 hover:bg-slate-50"}`}
    >
      {children}
    </button>
  );
}

function Kpi({
  label,
  value,
  valueClass,
  boxClass,
  soldOut,
}: {
  label: string;
  value: number | null;
  valueClass?: string;
  boxClass?: string;
  soldOut?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${boxClass ?? "border-slate-200 bg-white"}`}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-2xl font-black tabular-nums ${valueClass ?? "text-slate-900"}`}>
        {soldOut ? "소진" : <CountUp value={value} fromZero />}
      </dd>
    </div>
  );
}

/* ───────────────────────── 시·군·구 타일 ───────────────────────── */

function SigunguGrid({
  rows,
  slug,
  expanded,
  onToggle,
}: {
  rows: RemainRow[];
  slug: string;
  expanded: string | null;
  onToggle: (region: string) => void;
}) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {rows.flatMap((r, i) => {
        const level = remainLevel(r.remaining, r.announced);
        const meta = LEVEL_META[level];
        const soldOut = level === "soldout";
        const ratio = clampRatio(r.released, r.announced);
        const pct = ratio === null ? 0 : Math.round(ratio * 100);
        const isOpen = expanded === r.region;
        const href = sigunguHref(slug, r.region);
        const items = [
          <li key={`${r.sido}-${r.region}`} className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: `${Math.min(i, 14) * 25}ms` }}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => onToggle(r.region)}
              className={`w-full rounded-xl border p-3 text-left transition hover:border-emerald-300 ${
                isOpen ? "border-emerald-400 ring-1 ring-emerald-200" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="truncate font-semibold text-slate-900">{r.region}</span>
                {soldOut && <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${meta.badge}`}>소진</span>}
              </div>
              <p className={`mt-1 text-lg font-black tabular-nums ${meta.text}`}>
                {soldOut ? "소진" : fmtNum(r.remaining)}
                {!soldOut && r.remaining !== null && <span className="text-xs font-medium text-slate-500"> 대</span>}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div className={`h-full origin-left rounded-full ${meta.bar} animate-bar-grow motion-reduce:animate-none`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                출고 {fmtNum(r.released)} / 공고 {fmtNum(r.announced)}
              </p>
            </button>
          </li>,
        ];
        if (isOpen) {
          items.push(
            <li key={`${r.sido}-${r.region}-detail`} className="col-span-full animate-fade-up rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 motion-reduce:animate-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-900">
                  {r.region} <span className="text-sm font-normal text-slate-500">{r.vehicleType || "승용"}</span>
                </p>
                {href && (
                  <Link href={href} className="text-sm font-medium text-emerald-700 hover:underline">
                    {r.region} 보조금 페이지 →
                  </Link>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    ["공고", r.announced],
                    ["접수", r.applied],
                    ["출고", r.released],
                    ["잔여", r.remaining],
                  ] as const
                ).map(([label, v]) => (
                  <div key={label} className="rounded-lg bg-white px-3 py-2">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className={`text-lg font-black tabular-nums ${label === "잔여" ? meta.text : "text-slate-900"}`}>
                      {label === "잔여" && soldOut ? "소진" : fmtNum(v)}
                    </dd>
                  </div>
                ))}
              </dl>
              {r.note && <p className="mt-2 text-xs text-slate-500">{r.note}</p>}
            </li>,
          );
        }
        return items;
      })}
    </ul>
  );
}

/* ───────────────────────── 광역시·세종·제주 단일 공고 ───────────────────────── */

function SingleCard({ sido, row }: { sido: Sido; row: RemainRow }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-700">
        접수·출고는 <strong>{sido.name}</strong> 전체 단일 공고로 관리됩니다. 구·군별 지방비와 추가 지원은 각 페이지에서 확인하세요.
      </p>
      {row.note && <p className="mt-1 text-xs text-slate-500">{row.note}</p>}
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`${sido.short} 구·군 페이지`}>
        {sido.sigungu.map((name) => (
          <li key={name}>
            <Link
              href={sigunguPath(sido.slug, name)}
              className="inline-block rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MissingNotice({ slug, short }: { slug: string; short: string }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
      <p>{short} 지역의 접수·출고·잔여 수집값이 없습니다. 무공해차 통합누리집에서 직접 확인하거나 {short} 보조금 페이지를 참고하세요.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={EV_PORTAL.remain}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          무공해차 통합누리집 열기
        </a>
        <Link href={`/region/${slug}`} className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-emerald-300">
          {short} 보조금 페이지
        </Link>
      </div>
    </div>
  );
}
