import Link from "next/link";
import type { LocalPriceRow } from "@/lib/ev/types";
import { sigunguPath, sigunguSlug } from "@/data/regions";
import { won } from "@/lib/ev/summary";

/** highlight: 강조할 시·군·구명 (비교표에서 현재 지역 표시) */
export default function LocalPriceTable({ sidoSlug, rows, highlight }: { sidoSlug: string; rows: LocalPriceRow[]; highlight?: string }) {
  return (
    <div className="table-wrap">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            <th className="px-3 py-2 font-semibold">시·군·구</th>
            <th className="px-3 py-2 text-right font-semibold">수집된 지방비 최고액</th>
            <th className="hidden px-3 py-2 font-semibold md:table-cell">비고</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.sigungu}
              id={`district-${sigunguSlug(r.sigungu)}`}
              className={`border-t border-slate-100 hover:bg-emerald-50/40 ${highlight === r.sigungu ? "bg-emerald-50 font-bold" : ""}`}
              aria-current={highlight === r.sigungu ? "true" : undefined}
            >
              <td className="px-3 py-2 font-medium">
                <Link href={sigunguPath(sidoSlug, r.sigungu)} className="text-slate-900 hover:text-emerald-700 hover:underline">
                  {r.sigungu}
                </Link>
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{won(r.amount)}</td>
              <td className="hidden px-3 py-2 text-xs text-slate-500 md:table-cell">{r.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
