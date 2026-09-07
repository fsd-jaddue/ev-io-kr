"use client";

import { useEffect, useRef } from "react";
import { LEVEL_META, type SidoRemainSummary } from "@/lib/ev/remainSummary";

interface Props {
  summary: SidoRemainSummary[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
  className?: string;
}

/** 전국 + 17개 시·도 칩. 지도의 접근성 대체 수단이며 선택 상태를 지도와 공유한다. */
export default function SidoChips({ summary, selected, onSelect, className = "" }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // 지도에서 고른 시·도 칩이 보이도록 가로 스크롤만 이동 (페이지 세로 스크롤은 건드리지 않는다)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const el = scroller.querySelector<HTMLElement>(`[data-chip="${selected ?? "all"}"]`);
    if (!el) return;
    const left = el.offsetLeft - scroller.clientWidth / 2 + el.offsetWidth / 2;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({ left: Math.max(0, left), behavior: reduced ? "auto" : "smooth" });
  }, [selected]);

  const base = "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs transition";
  const active = "bg-emerald-700 font-semibold text-white";
  const idle = "border border-slate-200 bg-white font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700";

  return (
    <div ref={scrollerRef} className={`-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0 ${className}`}>
      <div role="group" aria-label="시·도 선택" className="flex w-max gap-1.5 pb-1">
        <button
          type="button"
          data-chip="all"
          aria-pressed={selected === null}
          onClick={() => onSelect(null)}
          className={`${base} ${selected === null ? active : idle}`}
        >
          전국
        </button>
        {summary.map((s) => {
          const isSel = selected === s.slug;
          return (
            <button
              key={s.slug}
              type="button"
              data-chip={s.slug}
              aria-pressed={isSel}
              onClick={() => onSelect(s.slug)}
              className={`${base} ${isSel ? active : idle}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isSel ? "bg-white" : LEVEL_META[s.level].dot}`} aria-hidden="true" />
              {s.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
