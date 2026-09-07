import { LEVEL_META, LEVEL_ORDER, type RemainLevel } from "@/lib/ev/remainSummary";

interface Props {
  variant: "dark" | "light";
  /** 표시할 레벨 (기본: 미수집 제외) */
  levels?: RemainLevel[];
  className?: string;
}

export default function MapLegend({ variant, levels, className = "" }: Props) {
  const dark = variant === "dark";
  const list = levels ?? LEVEL_ORDER.filter((l) => l !== "unknown");
  return (
    <ul className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] ${dark ? "text-emerald-100" : "text-slate-600"} ${className}`} aria-label="잔여 수준 범례">
      {list.map((l) => {
        const m = LEVEL_META[l];
        return (
          <li key={l} className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: m.fill }} aria-hidden="true" />
            <span className="font-semibold">{m.label}</span>
            <span className={dark ? "text-emerald-200/80" : "text-slate-400"}>{m.hint}</span>
          </li>
        );
      })}
    </ul>
  );
}
