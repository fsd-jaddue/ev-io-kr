import { SITE } from "@/lib/site";

/**
 * /ads.txt — 애드센스 게시자 ID(기본값 lib/site.ts ADSENSE_CLIENT_DEFAULT, NEXT_PUBLIC_ADSENSE_CLIENT 로 덮어쓰기)가 있으면
 * "google.com, pub-XXXX, DIRECT, f08c47fec0942fa0" 한 줄을 반환한다. off 로 끄면 빈 파일.
 *
 * 빌드 시 정적으로 고정한다(force-static): 서버 함수 호출·콜드스타트 없이 CDN 에서 바로 내려가므로
 * 애드센스 크롤러가 어떤 상황에서도 같은 내용을 받는다. 값은 빌드 시점 환경변수로 결정된다.
 */
export const dynamic = "force-static";

export function GET() {
  const pub = SITE.adsenseClient.replace(/^ca-/, "");
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "";
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
