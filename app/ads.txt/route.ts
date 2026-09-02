import { SITE } from "@/lib/site";

/**
 * /ads.txt — 애드센스 게시자 ID(NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXX)가 설정되면
 * "google.com, pub-XXXX, DIRECT, f08c47fec0942fa0" 한 줄을 반환한다. 설정 전에는 빈 파일.
 */
export function GET() {
  const pub = SITE.adsenseClient.replace(/^ca-/, "");
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "";
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
