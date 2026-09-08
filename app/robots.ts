import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * robots.txt. 네이버(Yeti)·다음(Daumoa)·구글·빙 크롤러를 명시적으로 허용하고(서치어드바이저 권장),
 * JSON API 만 수집에서 제외한다. /_next/ 는 렌더링용 CSS·JS 이므로 막지 않는다.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/"];
  return {
    rules: [
      { userAgent: ["Googlebot", "Yeti", "Daumoa", "Bingbot"], allow: "/", disallow },
      { userAgent: "*", allow: "/", disallow },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
