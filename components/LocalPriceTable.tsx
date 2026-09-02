import Link from "next/link";
import type { LocalPriceRow } from "@/lib/ev/types";
import { NATIONAL_MAX } from "@/data/cars";
import { sigunguSlug } from "@/data/regions";
import { won } from "@/lib/ev/summary";

export default function LocalPriceTable({ sidoSlug, rows }: { sidoSlug: string; rows: LocalPriceRow[] }) {
  return (
    <div className="table-wrap">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            <th className="px-3 py-2 font-semibold">시·군·구</th>
            <th className="px-3 py-2 text-right font-semibold">지방비 최대</th>
            <th className="px-3 py-2 text-right font-semibold">국비 최대</th>
            <th className="px-3 py-2 text-right font-semibold">합산 최대</th>
            <th className="hidden px-3 py-2 font-semibold md:table-cell">비고</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sigungu} className="border-t border-slate-100 hover:bg-emerald-50/40">
              <td className="px-3 py-2 font-medium">
                <Link href={`/region/${sidoSlug}/${sigunguSlug(r.sigungu)}`} className="text-slate-900 hover:text-emerald-700 hover:underline">
                  {r.sigungu}
                </Link>
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{won(r.amount)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-600">{NATIONAL_MAX.large.toLocaleString()}만원</td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                {r.amount === null ? "-" : `${(r.amount + NATIONAL_MAX.large).toLocaleString()}만원`}
              </td>
              <td className="hidden px-3 py-2 text-xs text-slate-500 md:table-cell">{r.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
