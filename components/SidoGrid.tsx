import Link from "next/link";
import type { SidoSummary } from "@/lib/ev/summary";

function range(s: SidoSummary) {
  if (s.max === null) return "공고 확인";
  if (s.min === s.max) return `${s.max.toLocaleString()}만원`;
  return `${s.min!.toLocaleString()}~${s.max.toLocaleString()}만원`;
}

export default function SidoGrid({ items }: { items: SidoSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((s) => (
        <li key={s.slug}>
          <Link
            href={`/region/${s.slug}`}
            className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
          >
            <p className="text-base font-bold text-slate-900">{s.short}</p>
            <p className="mt-0.5 text-xs text-slate-500">{s.name}</p>
            <p className="mt-3 text-sm text-slate-500">승용 지방비</p>
            <p className="text-lg font-bold tabular-nums text-emerald-700">{range(s)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {s.uniform ? "단일 공고" : `${s.count}개 시·군·구`}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
