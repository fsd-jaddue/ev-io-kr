"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { RemainData } from "@/lib/ev/types";
import {
  LEVEL_ORDER,
  nationalTotals,
  summarizeRemainBySido,
  type RemainTotals,
} from "@/lib/ev/remainSummary";
import EmptyRemainNotice from "./EmptyRemainNotice";
import FreshnessBadge, { type RefreshState } from "./FreshnessBadge";
import KoreaMap from "./KoreaMap";
import MapLegend from "./MapLegend";
import RegionPanel from "./RegionPanel";
import { CountUp } from "./useCountUp";

interface Props {
  /** 빌드 시점 스냅샷 — 첫 페인트·SEO 용. 마운트 후 /api/remain 으로 한 번 갱신한다. */
  initial: RemainData;
  /** 히어로 좌측 문구(서버 렌더 JSX) */
  children: ReactNode;
}

/**
 * 홈 히어로 보드: 좌측 문구 + 전국 KPI, 우측 지도(데스크톱 SVG / 모바일 타일), 아래 도킹 패널.
 * 선택 상태(시·도, 시·군·구)는 여기서만 소유하고 지도·타일·칩·패널이 공유한다.
 */
export default function RemainHero({ initial, children }: Props) {
  const [data, setData] = useState<RemainData>(initial);
  const [refresh, setRefresh] = useState<RefreshState>("idle");
  const [sel, setSel] = useState<{ sido: string | null; region?: string }>({
    sido: null,
  });
  const panelRef = useRef<HTMLElement>(null);

  const summary = useMemo(() => summarizeRemainBySido(data.rows), [data.rows]);
  const totals = useMemo(() => nationalTotals(data.rows), [data.rows]);
  const empty = totals.regions === 0;

  useEffect(() => {
    const ctrl = new AbortController();
    setRefresh("loading");
    fetch("/api/remain", { signal: ctrl.signal })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      )
      .then((d: RemainData) => {
        setData((prev) => {
          if (!d.rows?.length) return prev;
          const newer =
            d.source === "live" ||
            Date.parse(d.fetchedAt) >= Date.parse(prev.fetchedAt);
          return newer ? d : prev;
        });
        setRefresh("done");
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== "AbortError") setRefresh("failed");
      });
    return () => ctrl.abort();
  }, []);

  const select = (sido: string | null, region?: string) => {
    setSel({ sido, region });
  };

  /** 모바일 팝업의 "시·군·구별 보기": 아래 도킹 패널로 스크롤 (사용자 조작 직후에만 호출된다) */
  const drillDown = () => {
    const el = panelRef.current;
    if (!el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && sel.sido) {
      e.preventDefault();
      setSel({ sido: null });
    }
  };

  return (
    <div onKeyDown={onKeyDown}>
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="grid gap-8 px-6 pb-12 pt-10 md:grid-cols-[minmax(0,1fr)_minmax(0,440px)] md:items-center md:px-10 md:py-12 md:pb-14">
          <div>
            {children}
            {!empty && <KpiStrip totals={totals} />}
            <FreshnessBadge
              variant="dark"
              source={data.source}
              fetchedAt={data.fetchedAt}
              refresh={refresh}
              className="mt-4"
            />
          </div>
          <div className="rounded-2xl bg-emerald-950/25 p-3 ring-1 ring-white/10 md:p-4">
            {empty ? (
              <EmptyRemainNotice variant="dark" />
            ) : (
              <>
                <KoreaMap
                  summary={summary}
                  selected={sel.sido}
                  onSelect={select}
                  onDrillDown={drillDown}
                />
                <MapLegend
                  variant="dark"
                  className="mt-3"
                  levels={
                    summary.some((s) => s.level === "unknown")
                      ? LEVEL_ORDER
                      : undefined
                  }
                />
              </>
            )}
          </div>
        </div>
      </section>

      <RegionPanel
        ref={panelRef}
        data={data}
        summary={summary}
        totals={totals}
        selected={sel.sido}
        focusRegion={sel.region}
        onSelect={select}
        refresh={refresh}
        className="relative z-10 mx-3 -mt-6 scroll-mt-20 md:mx-6"
      />
    </div>
  );
}

function KpiStrip({ totals }: { totals: RemainTotals }) {
  const items: Array<[string, number]> = [
    ["공고", totals.announced],
    ["접수", totals.applied],
    ["출고", totals.released],
    ["잔여", totals.remaining],
  ];
  return (
    <div className="mt-6">
      <p className="text-xs font-medium text-emerald-100">
        전국 승용 접수·출고·잔여{" "}
        <span className="text-emerald-200/80">(단위: 대)</span>
      </p>
      <dl className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
        {items.map(([label, v]) => (
          <div
            key={label}
            className="rounded-lg bg-white/10 px-1.5 py-2 ring-1 ring-white/15 sm:px-3"
          >
            <dt className="text-[11px] font-medium text-emerald-100">
              {label}
            </dt>
            <dd
              className={`whitespace-nowrap text-xs font-black tabular-nums sm:text-lg ${label === "잔여" ? "text-emerald-200" : "text-white"}`}
            >
              <CountUp value={v} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
