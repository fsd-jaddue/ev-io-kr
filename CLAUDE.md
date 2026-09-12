# CLAUDE.md — 전기차보조금 조회 (ev.io.kr)

이 파일은 새 작업 세션이 프로젝트 맥락을 바로 이어받기 위한 안내서다. 작업 전 반드시 읽고, 큰 결정이 바뀌면 이 파일도 갱신한다.

## 프로젝트 한 줄 요약
구글 애드센스 승인을 목표로 만든 정보 사이트. 전국 17개 시·도 / 229개 시·군·구별 전기차 구매 보조금(국비·지방비), 차종별 국비(20종, 각 수기 해설), 보조금 계산기, 가이드 27편, 정책 페이지를 제공한다. 사이트명은 **"전기차보조금 조회"** ('실시간'이라는 표현은 쓰지 않기로 결정). 운영자 표기도 사이트명, 문의 이메일 `eviokr@icloud.com`.

## 기술 스택 / 실행
- Next.js 15 App Router + TypeScript + Tailwind v4, Node 22. DB 없음.
- `npm run dev` (localhost:3000) · `npm run lint` · `npm run typecheck` · `npm run build && npm start`
- `npm run fetch:snapshot` — Playwright 헤드리스 크롬으로 ev.or.kr 표를 수집해 `data/snapshot/*.json` 갱신 (로컬에선 `npx playwright install chromium` 필요, 또는 `PW_CHROMIUM_PATH=경로`)
- 이미지 인포그래픽 재생성: `node scripts/gen-guide-figures.mjs` → `public/images/guides/*.svg`

## 배포 상태 (2026-09-07 기준)
- GitHub: `fsd-jaddue/ev-io-kr`, 기본·배포 브랜치는 **`main`** (Vercel Production 브랜치). `main`에 푸시하면 Vercel이 자동 배포하고, 수집 워크플로도 `main`에서 돌며 `main`에 커밋한다.
  - 2026-09-07 브랜치 정리: 예전 배포 브랜치 `claude/adsense-ev-subsidy-site-10f3l9`를 `main`으로 바꿨다. GitHub 기본 브랜치·Vercel Production Branch를 `main`으로 전환한 뒤 옛 브랜치는 삭제한다(절차는 `DEPLOY.md` 1-1 참고).
- Vercel 프로젝트 `ev-io-kr`, 리전 `icn1`(vercel.json). 환경변수는 `NEXT_PUBLIC_SITE_URL=https://ev.io.kr` 만 설정됨. 애드센스 관련 변수는 아직 비어 있음(승인 전).
- **방문 통계**(2026-09-11): `@vercel/analytics`의 `<Analytics />`가 루트 레이아웃에 들어 있다(쿠키 없음, 동의 배너 불필요). 집계는 Vercel 대시보드 → 프로젝트 → Analytics 탭에서 **Enable** 해야 시작된다. GA4는 `@next/third-parties`의 `GoogleAnalytics`를 `NEXT_PUBLIC_GA_MEASUREMENT_ID`(G-…)가 있을 때만 렌더하므로, 애드센스 승인 뒤 Vercel 환경변수에 넣고 Redeploy 하면 코드 수정 없이 켜진다. 개인정보처리방침에는 두 도구 사용 가능 문구가 이미 있다.
- 도메인: 가비아에서 `ev.io.kr` 구입 완료, DNS A `@`→76.76.21.21, CNAME `www`→cname.vercel-dns.com 설정 완료. www→ev.io.kr 308 리다이렉트 설정. Vercel이 "DNS Change Recommended"(새 IP 권장)를 표시하지만 동작에는 문제 없음.
- 절차 문서: `DEPLOY.md` (Vercel·가비아·애드센스·자료 갱신 루틴).

## 디렉터리
```
app/                 라우트. /, /region, /region/[sido], /region/[sido]/[sigungu](한글 slug), /car, /car/[slug],
                     /calculator, /guide, /guide/[slug], /about /privacy /terms /disclaimer /contact,
                     sitemap.ts robots.ts ads.txt/route.ts feed.xml/route.ts, api/remain
components/          Header Footer MobileNav AdSlot Breadcrumb JsonLd SidoGrid LocalPriceTable(highlight) RemainTable(client, initial SSR)
                     FaqList SourceNote Calculator(client) GuideCard illustrations.tsx(원본 SVG)
components/remain/   홈 히어로 잔여 현황 보드(전부 client). RemainHero(상태 소유·fetch) KoreaMap(SVG 지도, PC·모바일 공용 + 모바일 탭 팝업)
                     RegionPanel(도킹 패널: 전국 TOP8 / 시·군·구 타일 / 단일 공고 카드 / 표)
                     SidoChips MapLegend FreshnessBadge EmptyRemainNotice useCountUp
data/korea-map.ts    직접 잡은 좌표의 한국 지도: 교차점(NODES)+경계선(ARCS, 인접 시·도가 공유)을 Catmull-Rom 곡선으로 그려 시·도 면을 조립. 광역시 둥근 박스(parents=얹힌 도), 제주 인셋
lib/ev/remainSummary.ts  접수·출고·잔여 시·도 합계·잔여 수준(레벨)·TOP N·matchRemainRows·parseRemainNote 등 순수 함수 + 레벨별 색/클래스(LEVEL_META)
lib/ev/localPriceStats.ts 시·도 내 지방비 통계·순위(1224식)·인근 비교 행·17개 시·도 최대액 순위 (순수)
lib/ev/regionCopy.ts     지역 페이지의 데이터 기반 비교 문단·체크리스트·FAQ 생성기 (순수, 수치는 데이터에서만, eunNeun 조사 헬퍼)
content/guides/      가이드 27편 (basic/apply/benefit/region-car/practical .ts 수기, region-deep.ts 는 도 8곳 시·군 비교 — 수치는 스냅샷에서 계산·해설은 수기). index.ts 가 합침
content/cars/        차종 20종의 수기 해설(소개·국비 산정 배경·확인할 점·비교 차종·FAQ). family 정규식으로 누리집 동일 계열 트림 표를 그림
lib/ev/localPrice.ts 지방비 스냅샷 정규화(순수, server-only 아님). 가이드 본문처럼 빌드 시 데이터가 필요한 곳은 getLocalPriceSnapshot() 사용
data/regions.ts      17개 시·도 + 시·군·구 목록, slug 헬퍼
data/cars.ts         차종별 2026 국비 (null = 확정치 미확인)
data/sido-intro.ts   시·도 소개 문단
data/snapshot/       local-price.ts(지방비 취합값, 수기) · local-price.json(수집값, 우선) · remain.json(접수·출고·잔여 수집값)
                     cars.json(누리집 모델별 국비 수집값) · notices.json(정책 공지 감시가 본 글 목록)
lib/ev/carsOverlay.ts  data/cars.ts 수기 국비 위에 cars.json 수집값을 덮는 규칙(evMatch 정규식, 매칭 행 국비가 모두 같을 때만 적용)
lib/ev/portal.ts     ev.or.kr URL 상수 (의존성 없음, 클라이언트 import 가능)
lib/ev/parse.ts      cheerio 파서 (다단 헤더·rowspan 처리, 헤더 키워드 기반)
lib/ev/getData.ts    서버 전용. 수집(unstable_cache 1h) → 실패 시 스냅샷. 지방비 데이터 로더
lib/seo.ts lib/site.ts  메타데이터·JSON-LD 헬퍼, 사이트 상수·메뉴
scripts/fetch-snapshot.ts        Playwright 수집 스크립트 (remain·local-price·cars.json)
scripts/snapshot-diff.ts         커밋 전 직전 값과 비교해 지방비·공고·국비 변경만 보고서로 (→ GitHub Issue "data-change")
scripts/watch-notices.ts         환경부 보도자료·누리집 공지에서 보조금 키워드 새 글 감지 (→ Issue "policy-notice")
scripts/gen-guide-figures.mjs    가이드 인포그래픽 SVG 생성기
.github/workflows/snapshot.yml   매시간(KST 06~23시) 수집 → 변경 감지 → JSON 커밋 → Vercel 자동 재배포 → 변경 시 Issue
.github/workflows/notices.yml    매일 KST 09:30 정책 공지 감시 → 새 글 있으면 Issue
```

## 애드센스 1차 심사 "가치가 별로 없는 콘텐츠" 대응 (2026-09-12)
- 진단: 차종 페이지 20개가 600~1,200자 얇은 페이지, 시·도 단일 공고 지역(서울·부산·대구·인천·광주·대전·울산·세종·제주)의 구·군 페이지 78개가 시·도 페이지와 완전 중복, 편집 글 16편뿐(자동 생성 페이지 95%).
- 조치: ① `content/cars/`로 차종 페이지에 수기 해설·트림별 국비 표·비교표·FAQ ② 단일 공고 시·도의 구·군 페이지는 `noindex,follow`(`pageMetadata({noindex})`, follow 유지) + 사이트맵 제외(`app/sitemap.ts`) — 페이지는 그대로 열리고 시·도 페이지로 안내 ③ 가이드 11편 추가 ④ 소개 페이지에 편집 원칙. 재심사 절차는 `DEPLOY.md` 6-1.
- **"단일 공고"(uniform)와 "동일 금액"(equal)을 구분한다.** `LocalPriceRow.single`은 수집 JSON의 "전체" 행에서 복제된 행에만 붙고, `sidoPriceStats().uniform`/`summarizeBySido().uniform`은 이 플래그 기준이다. 강원·충북·충남·전북처럼 시·군별 공고인데 금액만 같은 곳은 `equal`만 true 이며 잔여 물량이 시·군마다 다르므로 색인 유지·"단일 공고" 문구 금지(예전엔 이곳도 단일 공고로 잘못 표시했음).
- 승인 뒤에도 noindex 는 유지하는 편이 낫다(구글이 중복으로 보는 페이지). 되돌리려면 시·군·구 페이지 `generateMetadata`의 `noindex` 와 sitemap 필터만 지우면 된다.

## 데이터 흐름과 핵심 결정
- 지방비(시·군·구별 승용 최대액)는 `data/snapshot/local-price.ts`의 취합값이 기본이고, 수집 JSON에 행이 있으면 그것이 우선. 확인 안 된 곳은 `null` → 화면에 "공고 확인".
- 접수·출고·잔여 대수는 **임의 값 절대 금지**. 수집값이 있을 때만 표시하고 없으면 ev.or.kr 링크만 보여준다. 표는 `RemainTable`(클라이언트)이 `/api/remain?sido=`를 호출해 그리므로 정적 페이지 재빌드와 무관하게 갱신된다. **시·도·시·군·구 페이지는 빌드 시 `getRemainSnapshot()`을 `RemainTable initial`로 넘겨 첫 HTML에 숫자를 싣는다**(네이버 Yeti·다음 Daumoa는 JS 렌더링이 약함, 2026-09-08). 신선도 배지는 `FreshnessBadge`(마운트 후 판정)로 hydration 안전.
- **SEO 콘텐츠 규칙**(2026-09-08): 229개 시·군·구 페이지는 얇은 페이지 판정을 피하기 위해 `regionCopy.ts`가 데이터에서 만든 비교 문단(시·도 내 순위·최고/최저/평균 대비·전국 순위·합산액), 인근 시·군·구 비교표(단일 공고 시·도는 17개 시·도 최대액 표), 공고 상황 반영 체크리스트, FAQ 3~4개(`FaqList` + `faqJsonLd`, 같은 배열)를 싣는다. 시·도 페이지도 FAQ·잔여 카드·WebPage(dateModified=스냅샷 시각). JSON-LD: 루트 Organization(@id, logo=/logo.svg)+WebSite, 목록 페이지 ItemList, 지역·차종 WebPage, 가이드 Article(image·publisher.logo)+FAQ. sitemap lastmod는 빌드 시각이 아니라 스냅샷 시각·가이드 updated·`LEGAL_UPDATED_AT`. 홈 title은 "2026 전기차 보조금 조회 | …"(`pageMetadata`는 path "/"면 title 그대로). 알 수 없는 slug는 `generateMetadata`에서도 `notFound()`.
- **차종별 국비 자동 반영**(2026-09-08): `data/cars.ts`의 `CARS`는 수기 목록(`CARS_BASE`)에 `data/snapshot/cars.json`(누리집 서울 그리드의 일반승용 모델별 국비, 매시간 수집)을 `applyCollectedNational()`로 덮은 결과다. 각 차종의 `evMatch` 정규식이 "제조사+모델"(공백 제거·소문자)에 맞는 행이 1개 이상이고 그 국비가 모두 같을 때만 수집값을 쓰고(`nationalSource: "collected"`, `evModels`), 아니면 수기값 유지. 매칭 결과는 cars.json이 바뀐 회차의 Issue에 ✅/⚠️/❌로 첨부되니 그걸 보고 `evMatch`를 좁힌다. `/car`에는 수집 목록 전체 표가 붙는다.
- 각 표에 기준 시각·출처 배지("누리집 수집" / "스냅샷")를 표시한다. 기준 시각은 `formatFetchedAt()`이 `2026.09.07 10:05` 형식(숫자만 조합)으로 만든다 — 로케일 오전/오후 표기는 Node(`AM`)와 Chrome(`오전`)이 달라 hydration 오류가 났던 이력이 있으니 로케일 문구를 SSR 텍스트에 쓰지 않는다.
- **홈 히어로 = 잔여 현황 지도 보드**(2026-09-07). 배너 일러스트를 지도로 대체: `data/korea-map.ts`의 간략화 윤곽 지도(SVG; 두께 레이어+그림자+광택+세로 압축으로 입체감, 선택 시 블록이 떠오름)를 PC·모바일 공용으로 쓴다. 라벨은 PC=약칭+잔여 대수, 모바일=약칭만(CSS `md:` 토글, 둘 다 렌더해 hydration 안전). 모바일은 탭하면 지도 하단에 요약 팝업(잔여·공고·접수·출고·소진 지역 수, "시·군·구별 보기"로 패널 스크롤). **CSS 3D(rotateX/perspective)는 SVG 글자를 흐리게 만드니 쓰지 않는다.** 첫 페인트·SEO는 빌드 시 `getRemainSnapshot()`(동기 스냅샷, 라이브 시도 없음)으로 채우고, 마운트 후 `/api/remain`을 한 번 호출해 더 새로우면 교체한다. 지역 선택 → 아래 도킹 `RegionPanel`에서 시·군·구 타일(도) / 단일 공고 카드(특별·광역시·세종·제주) / `RemainTable embedded` 표로 드릴다운. 잔여 수준은 잔여/공고 기준 소진(≤0)·적음(<5%)·보통(5~15%)·여유(≥15%)·미수집 5단계이며 색은 마스크 재고 지도 관례(초록·노랑·주황·빨강). `RemainTable`은 `data`(재요청 생략)·`embedded`(표만) prop을 받는다.
- 시·군·구 페이지 slug는 **한글 원문**(`sigunguSlug`, 공백만 제거)을 `generateStaticParams`에 넘긴다. 미리 퍼센트 인코딩하면 Next/Vercel이 한 번 더 인코딩해 프리렌더 경로가 이중 인코딩되고 실제 요청(/region/busan/중구)이 404가 난다(2026-09-07 수정). 링크·canonical·sitemap은 `sigunguPath()`로만 만든다.
- 애드센스 게시자 ID `ca-pub-9408914409364609`는 `lib/site.ts`의 `ADSENSE_CLIENT_DEFAULT`에 박혀 있어 스크립트(`<head>` 직접 삽입)·메타태그·ads.txt가 항상 켜진다. `NEXT_PUBLIC_ADSENSE_CLIENT`로 덮어쓰거나 `off`로 끌 수 있음. 광고 자리(AdSlot)는 슬롯 ID 환경변수가 있을 때만 렌더링. `/ads.txt`는 `force-static`으로 빌드 시 고정(2026-09-11). 애드센스 "사이트" 화면의 ads.txt 상태는 구글이 며칠~몇 주 간격으로만 다시 크롤링해 갱신되므로, `https://ev.io.kr/ads.txt`가 브라우저에서 한 줄을 보여 주면 코드 쪽 문제는 아니다(게시자 ID 기본값은 2026-09-04 배포, 애드센스의 마지막 확인은 2026-09-03이었음).
- 네이버 서치어드바이저 소유확인 값(2026-09-08 발급)도 같은 방식으로 `lib/site.ts`의 `NAVER_SITE_VERIFICATION_DEFAULT`에 있어 `<meta name="naver-site-verification">`이 항상 나간다(`NEXT_PUBLIC_NAVER_SITE_VERIFICATION`으로 덮어쓰기/`off`). Bing 웹마스터 값(`msvalidate.01`, 2026-09-08 발급)도 `BING_SITE_VERIFICATION_DEFAULT`에 같은 방식. 가이드 RSS는 `/feed.xml`(`app/feed.xml/route.ts`), robots.txt는 Googlebot·Yeti·Daumoa·Bingbot 명시 허용. 구글 서치콘솔은 도메인 속성(가비아 DNS TXT) 방식으로 진행 중이라 메타태그 기본값이 없다.
- 이미지는 전부 직접 그린 SVG(저작권 이슈 없음). 외부 스톡 이미지 사용 안 함. 사용자가 Pixabay 사진을 `public/images/photos/`에 넣어주면 배치할 수 있음.

## 데이터 수집 구조 (2026-09-03 완성)
- **ev.or.kr는 일반 HTTP 요청에 봇 검사 페이지(pnp4web, 1MB JS)만 내려주고 AJAX 본문은 암호화**되어 있다. 따라서 Vercel 서버 fetch는 항상 실패하고(진단 라우트 `/api/ev-status`는 외부에서 호출해 서버가 누리집을 두드리게 만들 수 있어 2026-09-08 제거), 실제 수집은 GitHub Actions의 헤드리스 크롬(`scripts/fetch-snapshot.ts`)이 담당한다.
- ev.or.kr 데이터는 `<table>`이 아니라 **ag-Grid(div, 10행 페이지네이션)**로 그려진다. 현황 페이지 `#myGrid` 열: 지역(sido, "즐겨찾기 서울 마감 서울특별시"처럼 버튼·배지 텍스트 포함) | 차종 | 공고종류 | 접수기간 | 신청마감 | 공고 | 접수 | 선정 | 출고 | 선정잔여 | 출고잔여. 같은 지역이 공고종류(본공고/추경n차)별로 여러 행이며 대수는 누적 동일값 → `lib/ev/aggrid.ts`가 지역·차종당 1행으로 합친다.
- 차종·모델 페이지는 지자체별 아코디언 161개(`.accordion-item`, `.location__city`=시·도 약칭, `.location__district`=지역명) 안에 ag-Grid(차종/차급·제조사·모델·국비·지방비·소계·전환지원금). 일반 클릭은 타임아웃이 나서 JS click 사용. **"전기승용 일반승용" 행만** 집계한다(택시 행은 지방비가 훨씬 커서 제외).
- 워크플로 `.github/workflows/snapshot.yml`: 매시 20분(KST 06~23시) + 수동 실행(`probe=1`이면 구조·XHR 탐색만). 수집 성공 시 `data/snapshot/*.json` 커밋 → Vercel 재배포. 소요 약 9분. 결과는 GitHub → Actions → "Refresh ev.or.kr snapshot" 로그로 확인(`remain rows: 160`, `local-price rows: 160`, `car subsidy rows: 100+`이 정상).
- **변경 알림**(2026-09-08): 커밋 직전 `scripts/snapshot-diff.ts`가 `git show HEAD:` 값과 비교해 지방비 금액, 공고 물량·종류, 소진/재개, 신청마감 전환, 모델별 국비 변경만 추려 Issue(라벨 `data-change`)를 만든다. 접수·출고·잔여의 단순 증감은 보고하지 않는다. `scripts/watch-notices.ts`(`notices.yml`, 매일 09:30)는 환경부 보도자료 목록과 누리집 공지에서 보조금·지침·개편 키워드 새 글을 찾아 Issue(라벨 `policy-notice`)를 만든다. 소스별 첫 실행은 현재 글을 `notices.json`에 저장만 한다. 지침 개정 같은 큰 변경은 Issue를 보고 세션에서 가이드·`data/cars.ts`·인포그래픽을 사람이 확인해 갱신한다(완전 자동 갱신은 오정보 위험 때문에 하지 않기로 결정).
- 2026-09-03 실제 수집값: 서울·대구·인천·광주·대전·세종 194, 울산 221, 부산 224, 강원 200, 충북 400, 충남 414, 전북 434, 제주 276, 경기 120~380(연천), 전남 200~600(보성·완도), 경북 412(울릉 756), 경남 120~488(합천). 시·도 소개문·가이드 수치·인포그래픽은 이 값 기준으로 맞춰 두었다. `data/snapshot/local-price.ts`는 이 수집값을 옮긴 폴백이다.

## 다음 할 일 (우선순위 순)
1. 검색엔진 등록은 2026-09-08 완료(구글 DNS TXT, 네이버·Bing 메타태그, 다음 검색등록). 남은 일: GSC·서치어드바이저 색인 보고서 확인, `/feed.xml` RSS 제출 확인. 첫 `cars.json` 수집 뒤 Issue의 매칭 표를 보고 `data/cars.ts` `evMatch` 정규식 보정.
2. 애드센스 1차 심사는 2026-09-12 "가치가 별로 없는 콘텐츠"로 거절 → 같은 날 위 대응을 배포. 사용자가 애드센스 콘솔에서 "문제를 수정했음" 체크 후 검토 요청해야 한다(배포 후 하루쯤 뒤 권장). 승인 후 광고 단위 슬롯 ID를 `NEXT_PUBLIC_ADSENSE_SLOT_*` 환경변수에 입력. 재거절 시 후보 조치는 `DEPLOY.md` 6-1.
3. 수집 워크플로가 계속 성공하는지 주기적으로 확인(Actions 탭). ev.or.kr 화면 구조가 바뀌면 로그의 `grid headers`를 보고 `lib/ev/aggrid.ts`의 열 정규식을 맞춘다.
4. 가이드·지역 콘텐츠 보강, 2027년 지침 확정 시 수치 갱신(`data/cars.ts`, 가이드 본문, `scripts/gen-guide-figures.mjs` 후 재생성).

## 작업 규칙
- 배포 브랜치는 `main` 하나만 쓴다. 세션에 작업용 `claude/…` 브랜치가 지정돼 있으면 거기서 작업한 뒤 `main`에 병합하고 작업 브랜치는 지운다. PR은 요청 시에만.
- 변경 후 `npm run lint && npm run typecheck && npm run build` 통과 확인. 화면 확인은 Playwright(`/opt/pw-browsers/chromium` 같은 로컬 크롬)로 스크린샷. 로컬·샌드박스에서는 `EV_DISABLE_LIVE_FETCH=1`을 주면 `/api/remain`이 12초 라이브 시도 없이 스냅샷을 바로 돌려준다.
- 이 작업 환경(Claude 원격 세션)에서는 ev.or.kr, ev.io.kr, vercel.com, 가비아 등 외부 사이트 접속이 차단된다. 배포 결과 확인은 사용자 캡처/JSON 붙여넣기 또는 GitHub Actions 로그(MCP)로 한다.
- 한국어로 소통. 금액 단위는 만원. 연도 표기 2026 기준.
