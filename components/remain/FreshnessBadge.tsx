"use client";

import { useEffect, useState } from "react";
import { EV_PORTAL } from "@/lib/ev/portal";
import { formatFetchedAt } from "@/lib/ev/format";
import type { DataSource } from "@/lib/ev/types";

export type RefreshState = "idle" | "loading" | "done" | "failed";

interface Props {
  source: DataSource;
  fetchedAt: string;
  variant: "dark" | "light";
  refresh?: RefreshState;
  className?: string;
}

/**
 * 기준 시각·출처 배지. SourceNote 와 같은 규칙(live 이거나 6시간 이내면 "누리집 수집")이지만,
 * 신선도 판정은 마운트 후에만 하여 서버·클라이언트 마크업이 어긋나지 않게 한다.
 */
export default function FreshnessBadge({ source, fetchedAt, variant, refresh, className = "" }: Props) {
  const [fresh, setFresh] = useState<boolean | null>(null);

  useEffect(() => {
    const age = Date.now() - new Date(fetchedAt).getTime();
    setFresh(source === "live" || (Number.isFinite(age) && age < 6 * 60 * 60 * 1000));
  }, [source, fetchedAt]);

  const dark = variant === "dark";
  const pill = fresh
    ? dark
      ? "bg-white/15 text-emerald-50"
      : "bg-emerald-50 text-emerald-700"
    : dark
      ? "bg-white/10 text-emerald-100/80"
      : "bg-slate-100 text-slate-600";

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${dark ? "text-emerald-100/90" : "text-slate-500"} ${className}`}>
      {fresh !== null && (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ${pill}`}>
          {fresh ? (
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${dark ? "bg-emerald-300" : "bg-emerald-400"} animate-pulse-dot motion-reduce:animate-none`}
              />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${dark ? "bg-emerald-200" : "bg-emerald-500"}`} />
            </span>
          ) : (
            <span className={`h-2 w-2 rounded-full ${dark ? "bg-emerald-100/60" : "bg-slate-400"}`} />
          )}
          {fresh ? "누리집 수집" : "스냅샷 (오래됨)"}
        </span>
      )}
      <span>기준 {formatFetchedAt(fetchedAt)}</span>
      <a
        href={EV_PORTAL.remain}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline ${dark ? "hover:text-white" : "hover:text-emerald-700"}`}
      >
        출처: 무공해차 통합누리집
      </a>
      {refresh === "failed" && (
        <span className={dark ? "text-amber-200" : "text-amber-700"}>최신 수집값을 불러오지 못해 스냅샷 기준으로 표시합니다</span>
      )}
    </div>
  );
}
