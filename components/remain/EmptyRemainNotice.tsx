import { EV_PORTAL } from "@/lib/ev/portal";

/** 수집값이 전혀 없을 때: 숫자 대신 공식 페이지 링크만 보여 준다 (임의 값 금지). */
export default function EmptyRemainNotice({ variant }: { variant: "dark" | "light" }) {
  const dark = variant === "dark";
  return (
    <div
      className={`rounded-lg border border-dashed p-5 text-sm ${
        dark ? "border-white/30 text-emerald-50" : "border-slate-300 bg-slate-50 text-slate-600"
      }`}
    >
      <p>
        접수·출고·잔여 대수는 환경부 무공해차 통합누리집에서 수집한 값이 있을 때만 표시됩니다. 지금은 표시할 수집값이 없으므로
        아래 공식 페이지에서 지역을 선택해 확인하세요.
      </p>
      <a
        href={EV_PORTAL.remain}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-3 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ${
          dark ? "bg-white text-emerald-700 hover:bg-emerald-50" : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        무공해차 통합누리집 지자체별 현황 열기
      </a>
    </div>
  );
}
