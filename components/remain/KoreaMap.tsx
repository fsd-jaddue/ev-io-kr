"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { KOREA_MAP } from "@/data/korea-map";
import { LEVEL_META, fmtNum, type SidoRemainSummary } from "@/lib/ev/remainSummary";

interface Props {
  summary: SidoRemainSummary[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
  className?: string;
}

const TIP_W = 220;
const TIP_H = 84;

/** 데스크톱용 간략화 대한민국 지도. 면 색 = 잔여 수준, 클릭·Enter 로 시·도 선택, 마우스 hover 툴팁. */
export default function KoreaMap({ summary, selected, onSelect, className = "" }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const bySlug = new Map(summary.map((s) => [s.slug, s]));
  const highlight = hovered ?? focused;
  const tipRegion = hovered ? bySlug.get(hovered) : undefined;

  const toggle = (slug: string) => onSelect(selected === slug ? null : slug);
  const onKey = (e: KeyboardEvent<SVGPathElement>, slug: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(slug);
    }
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== "mouse" || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height });
  };

  const pathOf = (slug: string) => KOREA_MAP.regions.find((r) => r.slug === slug)?.d;
  const tipLeft = tip ? (tip.x + 14 + TIP_W > tip.w ? Math.max(0, tip.x - TIP_W - 8) : tip.x + 14) : 0;
  const tipTop = tip ? (tip.y + 14 + TIP_H > tip.h ? Math.max(0, tip.y - TIP_H) : tip.y + 14) : 0;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <svg
        viewBox={KOREA_MAP.viewBox}
        className="mx-auto h-[340px] w-auto max-w-full lg:h-[420px]"
        role="group"
        aria-label="시·도별 전기차 보조금 잔여 현황 지도"
        onPointerMove={onMove}
        onPointerLeave={() => {
          setHovered(null);
          setTip(null);
        }}
      >
        <defs>
          <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.85" />
          </filter>
          <pattern id={`${uid}-hatch`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#94a3b8" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#e2e8f0" strokeWidth="2" />
          </pattern>
        </defs>

        <rect
          x={KOREA_MAP.jejuInset.x}
          y={KOREA_MAP.jejuInset.y}
          width={KOREA_MAP.jejuInset.width}
          height={KOREA_MAP.jejuInset.height}
          rx="6"
          fill="none"
          stroke="#ecfdf5"
          strokeOpacity="0.35"
          strokeDasharray="3 3"
        />

        {/* 1. 면 (도 → 광역시 순서로 광역시가 위에 얹힌다) */}
        <g>
          {KOREA_MAP.regions.map((r) => {
            const s = bySlug.get(r.slug);
            const level = s?.level ?? "unknown";
            const meta = LEVEL_META[level];
            const isHl = highlight === r.slug;
            const fill = level === "unknown" ? `url(#${uid}-hatch)` : isHl ? meta.fillHover : meta.fill;
            const remainText = !s || s.remaining === null ? "미수집" : `${fmtNum(s.remaining)}대`;
            return (
              <path
                key={r.slug}
                d={r.d}
                fill={fill}
                stroke="#022c22"
                strokeWidth={1.2}
                strokeLinejoin="round"
                className="cursor-pointer outline-none transition-[fill] duration-200 motion-reduce:transition-none"
                role="button"
                tabIndex={0}
                aria-pressed={selected === r.slug}
                aria-label={`${s?.name ?? r.slug} 잔여 ${remainText} (${meta.label})`}
                data-slug={r.slug}
                onClick={() => toggle(r.slug)}
                onKeyDown={(e) => onKey(e, r.slug)}
                onPointerEnter={() => setHovered(r.slug)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setFocused(r.slug)}
                onBlur={() => setFocused(null)}
              />
            );
          })}
        </g>

        {/* 2. 선택·hover 하이라이트 (외곽선만, 포인터 통과) */}
        <g className="pointer-events-none">
          {highlight && highlight !== selected && (
            <path d={pathOf(highlight)} fill="none" stroke="#ffffff" strokeWidth={1.8} strokeOpacity={0.9} strokeLinejoin="round" />
          )}
          {selected && (
            <path
              d={pathOf(selected)}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.5}
              strokeLinejoin="round"
              filter={`url(#${uid}-glow)`}
            />
          )}
        </g>

        {/* 3. 라벨 */}
        <g className="pointer-events-none select-none">
          {KOREA_MAP.regions.map((r) => {
            const s = bySlug.get(r.slug);
            const meta = LEVEL_META[s?.level ?? "unknown"];
            const [x, y] = r.label;
            if (r.small) {
              return (
                <text key={r.slug} x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={meta.labelFill}>
                  {s?.short}
                </text>
              );
            }
            const n = !s || s.remaining === null ? "-" : s.remaining <= 0 ? "소진" : fmtNum(s.remaining);
            return (
              <text key={r.slug} x={x} y={y} textAnchor="middle" fontSize={12} fontWeight={700} fill={meta.labelFill}>
                {s?.short}
                <tspan x={x} dy={12} fontSize={10} fontWeight={600}>
                  {n}
                </tspan>
              </text>
            );
          })}
        </g>
      </svg>

      {tip && tipRegion && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 rounded-lg bg-slate-900/95 px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: tipLeft, top: tipTop, width: TIP_W }}
        >
          <p className="flex items-center gap-1.5 font-bold">
            {tipRegion.name}
            <span
              className="rounded px-1 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: LEVEL_META[tipRegion.level].fill, color: LEVEL_META[tipRegion.level].labelFill }}
            >
              {LEVEL_META[tipRegion.level].label}
            </span>
          </p>
          <p className="mt-1 tabular-nums text-slate-300">
            공고 {fmtNum(tipRegion.announced)} · 접수 {fmtNum(tipRegion.applied)} · 출고 {fmtNum(tipRegion.released)}
          </p>
          <p className="tabular-nums">
            잔여 <strong className="text-sm">{tipRegion.remaining !== null && tipRegion.remaining <= 0 ? "소진" : fmtNum(tipRegion.remaining)}</strong>
            {tipRegion.remaining !== null && tipRegion.remaining > 0 && "대"}
            {tipRegion.rowCount > 1 && (
              <span className="text-slate-300">
                {" "}
                · 소진 {tipRegion.soldOutCount}/{tipRegion.rowCount} 지역
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
