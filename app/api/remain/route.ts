import { NextRequest } from "next/server";
import { filterRemainBySido, getRemainData } from "@/lib/ev/getData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 지자체별 접수·출고·잔여 현황 JSON.
 * GET /api/remain            전체
 * GET /api/remain?sido=seoul 시·도 필터
 * 서버에서 1시간 캐시된 수집값을 돌려주고, 실패 시 스냅샷(source: "snapshot")을 돌려준다.
 */
export async function GET(req: NextRequest) {
  const sido = req.nextUrl.searchParams.get("sido");
  const all = await getRemainData();
  const data = sido ? filterRemainBySido(all, sido) : all;
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
