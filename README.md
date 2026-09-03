# 전기차보조금 조회 (ev.io.kr)

지자체별 전기차 구매 보조금 현황을 정리하는 정보 사이트. Next.js 15 (App Router) + TypeScript + Tailwind CSS v4, Vercel 배포.

## 구조

```
app/                    라우트 (홈, /region, /region/[sido], /region/[sido]/[sigungu], /car, /car/[slug],
                        /calculator, /guide, /guide/[slug], /about, /privacy, /terms, /disclaimer, /contact,
                        sitemap.ts, robots.ts, ads.txt/route.ts, not-found.tsx)
components/             Header, Footer, MobileNav, AdSlot, Breadcrumb, JsonLd, SidoGrid, LocalPriceTable,
                        RemainTable, SourceNote, Calculator(client)
content/guides/         가이드 16편 (HTML 본문 + FAQ)
data/regions.ts         17개 시·도 + 시·군·구 목록
data/cars.ts            차종별 2026 국비
data/sido-intro.ts      시·도별 소개 문단
data/snapshot/          지방비 스냅샷(local-price.ts / .json), 접수·출고·잔여 스냅샷(remain.json)
lib/ev/parse.ts         ev.or.kr HTML 파서 (cheerio)
lib/ev/getData.ts       실시간 수집(1시간 캐시) → 실패 시 스냅샷 폴백
lib/seo.ts, lib/site.ts 메타데이터·JSON-LD 헬퍼, 사이트 상수
scripts/fetch-snapshot.ts  로컬에서 스냅샷 JSON 갱신
DEPLOY.md               Vercel 배포 + 가비아 DNS + 애드센스 절차
```

## 개발

```bash
npm install
cp .env.example .env.local   # 필요 시 값 입력
npm run dev                  # http://localhost:3000
npm run lint
npm run build && npm start
npm run fetch:snapshot       # ev.or.kr 수집 → data/snapshot/*.json 갱신 (국내 네트워크 권장)
```

## 데이터 원칙

- 접수·출고·잔여 대수는 무공해차 통합누리집에서 수집한 값이 있을 때만 표시하고, 없으면 공식 페이지 링크만 보여준다(임의 값 없음).
- 지방비 스냅샷은 2026년 공개 자료 취합값이며 각 표에 기준일과 출처를 표기한다. 확인되지 않은 시·군·구는 "공고 확인"으로 둔다.
- 애드센스 게시자 ID(`ca-pub-9408914409364609`)는 `lib/site.ts` 기본값으로 항상 켜져 있고, `NEXT_PUBLIC_ADSENSE_CLIENT=off` 로 끌 수 있다. 광고 단위는 슬롯 ID 환경변수가 있을 때만 렌더링된다.

배포·도메인·애드센스 절차는 [DEPLOY.md](./DEPLOY.md) 참고.
