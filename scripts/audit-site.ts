/**
 * 사이트 구조 감사: 사이트맵 전수(200·canonical·h1·JSON-LD·색인), 내부 링크·앵커·자산, 시·군·구 페이지(단일 공고 시·도는 noindex),
 * 미확인 차종·철회 글 noindex, 404, ads.txt, robots. 로컬: npm start -- --port 3100 뒤 npm run audit:site. 운영: AUDIT_ORIGIN=https://ev.io.kr
 */
import assert from "node:assert/strict";
import { load } from "cheerio";
import { SIDO_LIST, sigunguPath } from "../data/regions";
import { CARS } from "../data/cars";
import { GUIDES } from "../content/guides";
import { getLocalPriceSnapshot } from "../lib/ev/localPrice";
import { summarizeBySido } from "../lib/ev/summary";

const origin = process.env.AUDIT_ORIGIN ?? "http://localhost:3100";
const publicOrigin = "https://ev.io.kr";
const cache = new Map<string, Promise<{ response: Response; text: string }>>();
function get(path: string) {
  const url = new URL(path, origin); url.hash = ""; url.host = new URL(origin).host; url.protocol = new URL(origin).protocol;
  const key = url.href;
  if (!cache.has(key)) cache.set(key, fetch(key, { redirect: "manual" }).then(async (response) => ({ response, text: await response.text() })));
  return cache.get(key)!;
}
async function main() {
  const single = new Set(summarizeBySido(getLocalPriceSnapshot().rows).filter((s) => s.uniform).map((s) => s.slug));
  const indexedDistricts = SIDO_LIST.filter((s) => !single.has(s.slug)).reduce((n, s) => n + s.sigungu.length, 0);
  const sitemap = await get("/sitemap.xml");
  assert.equal(sitemap.response.status, 200);
  const urls = load(sitemap.text, { xmlMode: true })("loc").map((_, el) => load(el).text()).get();
  assert.equal(urls.length, 10 + SIDO_LIST.length + indexedDistricts + CARS.filter((c) => c.national !== null).length + GUIDES.length);
  const links = new Set<string>();
  const assets = new Set<string>();
  for (const url of urls) {
    const { response, text } = await get(url);
    assert.equal(response.status, 200, url);
    const $ = load(text);
    assert.equal($("h1").length, 1, `h1: ${url}`);
    assert.equal(new URL($("link[rel=canonical]").attr("href")!).href, new URL(url).href, `canonical: ${url}`);
    assert(!$("meta[name=robots]").attr("content")?.includes("noindex"), `index: ${url}`);
    $("script[type='application/ld+json']").each((_, el) => { JSON.parse($(el).text()); });
    $("a[href]").each((_, el) => {
      const link = new URL($(el).attr("href")!, url);
      if (link.origin === publicOrigin) links.add(link.pathname + link.search + link.hash);
    });
    $("script[src],link[rel=stylesheet],img[src]").each((_, el) => {
      const asset = new URL($(el).attr("src") ?? $(el).attr("href")!, url);
      if (asset.origin === publicOrigin) assets.add(asset.pathname + asset.search);
    });
  }
  for (const link of links) {
    const { response, text } = await get(link);
    assert.equal(response.status, 200, `internal link: ${link}`);
    const hash = new URL(link, publicOrigin).hash;
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      assert(load(text)("[id]").toArray().some((el) => el.attribs.id === id), `anchor: ${link}`);
    }
  }
  for (const asset of assets) assert.equal((await get(asset)).response.status, 200, `asset: ${asset}`);
  // 시·군·구 페이지: 전부 200. 단일 공고 시·도(특별·광역시·세종·제주)의 구·군은 noindex + 사이트맵 제외, 나머지는 색인 + 사이트맵 포함
  let districtPages = 0; let noindexDistricts = 0;
  for (const sido of SIDO_LIST) for (const district of sido.sigungu) {
    const path = sigunguPath(sido.slug, district);
    const { response, text } = await get(path);
    assert.equal(response.status, 200, `district: ${path}`);
    const noindex = load(text)("meta[name=robots]").attr("content")?.includes("noindex") ?? false;
    assert.equal(noindex, single.has(sido.slug), `district noindex: ${path}`);
    assert.equal(urls.includes(publicOrigin + path), !single.has(sido.slug), `district sitemap: ${path}`);
    districtPages++; if (noindex) noindexDistricts++;
  }
  const excluded = [...CARS.filter((c) => c.national === null).map((c) => `/car/${c.slug}`), "/guide/ev-subsidy-outlook-2027"];
  for (const path of excluded) {
    const { response, text } = await get(path);
    assert.equal(response.status, 200, path);
    assert(load(text)("meta[name=robots]").attr("content")?.includes("noindex"), path);
    assert(!urls.includes(publicOrigin + path), `excluded sitemap: ${path}`);
  }
  for (const path of ["/car/not-a-car", "/guide/not-a-guide", "/region/not-a-region", "/region/seoul/not-a-district"]) assert.equal((await get(path)).response.status, 404, path);
  const ads = await get("/ads.txt");
  assert.equal(ads.response.status, 200);
  assert(ads.text.includes("google.com, pub-9408914409364609, DIRECT, f08c47fec0942fa0"));
  const robots = await get("/robots.txt");
  assert.equal(robots.response.status, 200);
  assert(!/Disallow: \/\s*\n/.test(robots.text));
  console.log(JSON.stringify({ origin, sitemapPages: urls.length, internalLinksAndAnchors: links.size, assets: assets.size, districtPages, noindexDistricts, noindexPages: excluded.length, unknown404s: 4, adsTxt: "valid", checks: "passed" }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
