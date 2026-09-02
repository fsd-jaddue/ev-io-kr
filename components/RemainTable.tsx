import { EV_PORTAL } from "@/lib/ev/parse";
import type { RemainData } from "@/lib/ev/types";
import SourceNote from "./SourceNote";

function num(n: number | null) {
  return n === null ? "-" : n.toLocaleString("ko-KR");
}

export default function RemainTable({ data, title = "접수·출고·잔여 현황" }: { data: RemainData; title?: string }) {
  const rows = data.rows.filter((r) => /승용/.test(r.vehicleType) || !r.vehicleType);
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {rows.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          <p>
            접수·출고·잔여 대수는 환경부 무공해차 통합누리집에서 수집한 값이 있을 때만 표시됩니다. 지금은 표시할 수집값이
            없으므로 아래 공식 페이지에서 지역을 선택해 확인하세요.
          </p>
          <a
            href={EV_PORTAL.remain}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            무공해차 통합누리집 지자체별 현황 열기
          </a>
        </div>
      ) : (
        <div className="table-wrap mt-3">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">지역</th>
                <th className="px-3 py-2 font-semibold">차종</th>
                <th className="px-3 py-2 text-right font-semibold">공고</th>
                <th className="px-3 py-2 text-right font-semibold">접수</th>
                <th className="px-3 py-2 text-right font-semibold">출고</th>
                <th className="px-3 py-2 text-right font-semibold">잔여</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const soldOut = r.remaining !== null && r.remaining <= 0;
                return (
                  <tr key={`${r.region}-${r.vehicleType}-${i}`} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{r.region}</td>
                    <td className="px-3 py-2 text-slate-600">{r.vehicleType || "승용"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{num(r.announced)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{num(r.applied)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{num(r.released)}</td>
                    <td className={`px-3 py-2 text-right font-semibold tabular-nums ${soldOut ? "text-rose-600" : "text-emerald-700"}`}>
                      {soldOut ? "소진" : num(r.remaining)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <SourceNote source={data.source} fetchedAt={data.fetchedAt} />
    </section>
  );
}
