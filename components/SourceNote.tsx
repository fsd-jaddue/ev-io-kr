import { EV_PORTAL } from "@/lib/ev/portal";
import { formatFetchedAt } from "@/lib/ev/format";
import type { DataSource } from "@/lib/ev/types";

export default function SourceNote({
  source,
  fetchedAt,
  basis,
}: {
  source: DataSource;
  fetchedAt: string;
  basis?: string;
}) {
  // GitHub Actions 가 매시간 수집해 커밋한 스냅샷도 누리집 수집값이다. 6시간 이내면 "누리집 수집", 그보다 오래됐으면 "스냅샷(오래됨)".
  const ageMs = Date.now() - new Date(fetchedAt).getTime();
  const fresh = source === "live" || (Number.isFinite(ageMs) && ageMs < 6 * 60 * 60 * 1000);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
          fresh ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${fresh ? "bg-emerald-500" : "bg-slate-400"}`} />
        {fresh ? "누리집 수집" : "스냅샷 (오래됨)"}
      </span>
      <span>기준 {formatFetchedAt(fetchedAt)}</span>
      {basis && <span>· {basis}</span>}
      <a href={EV_PORTAL.remain} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-700">
        출처: 무공해차 통합누리집
      </a>
    </div>
  );
}
