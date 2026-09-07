"use client";

import { TILE_LAYOUT } from "@/data/korea-map";
import { LEVEL_META, fmtNum, type SidoRemainSummary } from "@/lib/ev/remainSummary";

interface Props {
  summary: SidoRemainSummary[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
  className?: string;
}

/** 모바일용 타일 카토그램. 대략의 지리 관계대로 4열에 배치하고 약칭 + 잔여 대수를 보여 준다. */
export default function TileMap({ summary, selected, onSelect, className = "" }: Props) {
  const bySlug = new Map(summary.map((s) => [s.slug, s]));
  return (
    <div role="group" aria-label="시·도별 전기차 보조금 잔여 현황" className={`grid grid-cols-4 gap-1.5 ${className}`}>
      {TILE_LAYOUT.cells.map((c) => {
        const s = bySlug.get(c.slug);
        const level = s?.level ?? "unknown";
        const meta = LEVEL_META[level];
        const isSel = selected === c.slug;
        const value = !s || s.remaining === null ? "-" : s.remaining <= 0 ? "소진" : fmtNum(s.remaining);
        const remainText = !s || s.remaining === null ? "미수집" : `${fmtNum(s.remaining)}대`;
        return (
          <button
            key={c.slug}
            type="button"
            aria-pressed={isSel}
            aria-label={`${s?.name ?? c.slug} 잔여 ${remainText} (${meta.label})`}
            onClick={() => onSelect(isSel ? null : c.slug)}
            style={{ gridRow: c.row, gridColumn: c.col, backgroundColor: meta.fill }}
            className={`rounded-lg px-2 py-2 text-left leading-tight transition-transform active:scale-95 motion-reduce:transition-none ${meta.tileText} ${
              isSel ? "ring-2 ring-white ring-offset-2 ring-offset-emerald-800" : ""
            } ${level === "unknown" ? "border border-dashed border-white/50" : ""}`}
          >
            <span className="block text-[11px] font-bold">{s?.short}</span>
            <span className="mt-0.5 block text-sm font-black tabular-nums">{value}</span>
          </button>
        );
      })}
    </div>
  );
}
