"use client";

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { KOREA_MAP, type MapRegion } from "@/data/korea-map";
import { LEVEL_META, fmtNum, type SidoRemainSummary } from "@/lib/ev/remainSummary";

interface Props {
  summary: SidoRemainSummary[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
  className?: string;
}

const TIP_W = 220;
const TIP_H = 84;
/** 면 두께 (viewBox 단위) */
const DEPTH = 7;
/** 선택 시 떠오르는 높이 */
const LIFT = 6;
/** 보드 기울기 */
const TILT: CSSProperties = { transform: "rotateX(14deg)", transformOrigin: "50% 62%" };

/** hex 색을 k(0~1)만큼 어둡게 */
function darken(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) =>
    Math.round(v * (1 - k))
      .toString(16)
      .padStart(2, "0");
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

/**
 * 데스크톱용 간략화 대한민국 지도.
 * 면 색 = 잔여 수준, 아래 두께 레이어 + 그림자 + 윗면 광택으로 입체감을 주고, 선택한 시·도는 위로 떠오른다.
 * 클릭·Enter/Space 로 시·도 선택, 마우스 hover 툴팁.
 */
export default function KoreaMap({ summary, selected, onSelect, className = "" }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const bySlug = new Map(summary.map((s) => [s.slug, s]));
  const highlight = hovered ?? focused;
  const tipRegion = hovered ? bySlug.get(hovered) : undefined;
  const selectedRegion = selected ? KOREA_MAP.regions.find((r) => r.slug === selected) : undefined;

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

  const faceFill = (r: MapRegion) => {
    const s = bySlug.get(r.slug);
    const level = s?.level ?? "unknown";
    if (level === "unknown") return `url(#${uid}-hatch)`;
    const meta = LEVEL_META[level];
    return highlight === r.slug ? meta.fillHover : meta.fill;
  };
  const sideFill = (r: MapRegion) => darken(LEVEL_META[bySlug.get(r.slug)?.level ?? "unknown"].fill, 0.42);

  const tipLeft = tip ? (tip.x + 14 + TIP_W > tip.w ? Math.max(0, tip.x - TIP_W - 8) : tip.x + 14) : 0;
  const tipTop = tip ? (tip.y + 14 + TIP_H > tip.h ? Math.max(0, tip.y - TIP_H) : tip.y + 14) : 0;

  const renderLabel = (r: MapRegion, key?: string) => {
    const s = bySlug.get(r.slug);
    const meta = LEVEL_META[s?.level ?? "unknown"];
    const [x, y] = r.label;
    if (r.small) {
      return (
        <text key={key ?? r.slug} x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={meta.labelFill}>
          {s?.short}
        </text>
      );
    }
    const n = !s || s.remaining === null ? "-" : s.remaining <= 0 ? "소진" : fmtNum(s.remaining);
    return (
      <text key={key ?? r.slug} x={x} y={y} textAnchor="middle" fontSize={12} fontWeight={700} fill={meta.labelFill}>
        {s?.short}
        <tspan x={x} dy={12} fontSize={10} fontWeight={600}>
          {n}
        </tspan>
      </text>
    );
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`} style={{ perspective: "1100px" }}>
      <svg
        viewBox={KOREA_MAP.viewBox}
        className="mx-auto h-[340px] w-auto max-w-full lg:h-[420px]"
        style={TILT}
        role="group"
        aria-label="시·도별 전기차 보조금 잔여 현황 지도"
        onPointerMove={onMove}
        onPointerLeave={() => {
          setHovered(null);
          setTip(null);
        }}
      >
        <defs>
          <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000000" floodOpacity="0.38" />
          </filter>
          <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#ffffff" floodOpacity="0.9" />
          </filter>
          <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.08" />
          </linearGradient>
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
          rx="8"
          fill="none"
          stroke="#ecfdf5"
          strokeOpacity="0.3"
          strokeDasharray="3 3"
        />

        {/* 0. 두께(측면) + 그림자 */}
        <g filter={`url(#${uid}-shadow)`} className="pointer-events-none" aria-hidden="true">
          {KOREA_MAP.regions.map((r) => (
            <path key={r.slug} d={r.d} transform={`translate(0 ${DEPTH})`} fill={sideFill(r)} stroke={darken(sideFill(r), 0.25)} strokeWidth={1} />
          ))}
        </g>

        {/* 1. 윗면 (인터랙션) */}
        <g>
          {KOREA_MAP.regions.map((r) => {
            const s = bySlug.get(r.slug);
            const meta = LEVEL_META[s?.level ?? "unknown"];
            const remainText = !s || s.remaining === null ? "미수집" : `${fmtNum(s.remaining)}대`;
            return (
              <path
                key={r.slug}
                d={r.d}
                fill={faceFill(r)}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={0.9}
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

        {/* 2. 윗면 광택 + hover 외곽선 + 라벨 (포인터 통과) */}
        <g className="pointer-events-none select-none" aria-hidden="true">
          {KOREA_MAP.regions.map((r) => (
            <path key={r.slug} d={r.d} fill={`url(#${uid}-sheen)`} />
          ))}
          {highlight && highlight !== selected && (
            <path
              d={KOREA_MAP.regions.find((r) => r.slug === highlight)?.d}
              fill="none"
              stroke="#ffffff"
              strokeWidth={1.8}
              strokeOpacity={0.95}
              strokeLinejoin="round"
            />
          )}
          {KOREA_MAP.regions.map((r) => (r.slug === selected ? null : renderLabel(r)))}
        </g>

        {/* 3. 선택한 시·도: 블록째 위로 떠오름 */}
        {selectedRegion && (
          <g key={selectedRegion.slug} className="pointer-events-none animate-lift motion-reduce:animate-none" aria-hidden="true">
            <path d={selectedRegion.d} transform={`translate(0 ${DEPTH})`} fill={sideFill(selectedRegion)} stroke={darken(sideFill(selectedRegion), 0.25)} strokeWidth={1} />
            <path
              d={selectedRegion.d}
              fill={faceFill(selectedRegion)}
              stroke="#ffffff"
              strokeWidth={2.2}
              strokeLinejoin="round"
              filter={`url(#${uid}-glow)`}
            />
            <path d={selectedRegion.d} fill={`url(#${uid}-sheen)`} />
            {renderLabel(selectedRegion, `${selectedRegion.slug}-lifted`)}
          </g>
        )}
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
