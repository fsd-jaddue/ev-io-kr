import { SITE } from "@/lib/site";

// 인증 주석을 포함할 수 있도록 robots.txt를 정적 텍스트 응답으로 제공한다.
export const dynamic = "force-static";

export function GET() {
  const body = [
    "User-Agent: Googlebot",
    "User-Agent: Yeti",
    "User-Agent: Daumoa",
    "User-Agent: Bingbot",
    "Allow: /",
    "Disallow: /api/",
    "",
    "User-Agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Host: ${SITE.url}`,
    `Sitemap: ${SITE.url}/sitemap.xml`,
    "#DaumWebMasterTool:067f9f6db3627193d76255b15089c6ab57aa044b535dfdedbee48444484d8197:UjR58tlt8ZMRZi79BVamzQ==",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
