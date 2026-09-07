# CLAUDE.md — 전기차보조금 조회 (ev.io.kr)

이 파일은 새 작업 세션이 프로젝트 맥락을 바로 이어받기 위한 안내서다. 작업 전 반드시 읽고, 큰 결정이 바뀌면 이 파일도 갱신한다.

## 프로젝트 한 줄 요약
구글 애드센스 승인을 목표로 만든 정보 사이트. 전국 17개 시·도 / 229개 시·군·구별 전기차 구매 보조금(국비·지방비), 차종별 국비, 보조금 계산기, 가이드 16편, 정책 페이지를 제공한다. 사이트명은 **"전기차보조금 조회"** ('실시간'이라는 표현은 쓰지 않기로 결정). 운영자 표기도 사이트명, 문의 이메일 `eviokr@icloud.com`.

## 기술 스택 / 실행
- Next.js 15 App Router + TypeScript + Tailwind v4, Node 22. DB 없음.
- `npm run dev` (localhost:3000) · `npm run lint` · `npm run typecheck` · `npm run build && npm start`
- `npm run fetch:snapshot` — Playwright 헤드리스 크롬으로 ev.or.kr 표를 수집해 `data/snapshot/*.json` 갱신 (로컬에선 `npx playwright install chromium` 필요, 또는 `PW_CHROMIUM_PATH=경로`)
- 이미지 인포그래픽 재생성: `node scripts/gen-guide-figures.mjs` → `public/images/guides/*.svg`

## 배포 상태 (2026-09-07 기준)
- GitHub: `fsd-jaddue/ev-io-kr`, 기본·배포 브랜치는 **`main`** (Vercel Production 브랜치). `main`에 푸시하면 Vercel이 자동 배포하고, 수집 워크플로도 `main`에서 돌며 `main`에 커밋한다.
  - 2026-09-07 브랜치 정리: 예전 배포 브랜치 `claude/adsense-ev-subsidy-site-10f3l9`를 `main`으로 바꿨다. GitHub 기본 브랜치·Vercel Production Branch를 `main`으로 전환한 뒤 옛 브랜치는 삭제한다(절차는 `DEPLOY.md` 1-1 참고).
- Vercel 프로젝트 `ev-io-kr`, 리전 `icn1`(vercel.json). 환경변수는 `NEXT_PUBLIC_SITE_URL=https://ev.io.kr` 만 설정됨. 애드센스 관련 변수는 아직 비어 있음(승인 전).
- 도메인: 가비아에서 `ev.io.kr` 구입 완료, DNS A `@`→76.76.21.21, CNAME `www`→cname.vercel-dns.com 설정 완료. www→ev.io.kr 308 리다이렉트 설정. Vercel이 "DNS Change Recommended"(새 IP 권장)를 표시하지만 동작에는 문제 없음.
- 절차 문서: `DEPLOY.md` (Vercel·가비아·애드센스·자료 갱신 루틴).

## 디렉터리
```
app/                 라우트. /, /region, /region/[sido], /region/[sido]/[sigungu](한글 slug), /car, /car/[slug],
                     /calculator, /guide, /guide/[slug], /about /privacy /terms /disclaimer /contact,
                     sitemap.ts robots.ts ads.txt/route.ts, api/remain, api/ev-status
components/          Header Footer MobileNav AdSlot Breadcrumb JsonLd SidoGrid LocalPriceTable RemainTable(client)
                     SourceNote Calculator(client) GuideCard illustrations.tsx(원본 SVG)
components/remain/   홈 히어로 잔여 현황 보드(전부 client). RemainHero(상태 소유·fetch) KoreaMap(데스크톱 SVG 지도)
                     TileMap(모바일 타일) RegionPanel(도킹 패널: 전국 TOP8 / 시·군·구 타일 / 단일 공고 카드 / 표)
                     SidoChips MapLegend FreshnessBadge EmptyRemainNotice useCountUp
data/korea-map.ts    직접 잡은 좌표의 한국 지도: 교차점(NODES)+경계선(ARCS, 인접 시·도가 공유)을 Catmull-Rom 곡선으로 그려 시·도 면을 조립. 광역시 둥근 박스, 제주 인셋, 모바일 타일 배치
lib/ev/remainSummary.ts  접수·출고·잔여 시·도 합계·잔여 수준(레벨)·TOP N 등 순수 함수 + 레벨별 색/클래스(LEVEL_META)
content/guides/      가이드 16편 (basic/apply/benefit/region-car .ts, HTML 본문 + faq). index.ts 가 합침
data/regions.ts      17개 시·도 + 시·군·구 목록, slug 헬퍼
data/cars.ts         차종별 2026 국비 (null = 확정치 미확인)
data/sido-intro.ts   시·도 소개 문단
data/snapshot/       local-price.ts(지방비 취합값, 수기) · local-price.json(수집값, 우선) · remain.json(접수·출고·잔여 수집값)
lib/ev/portal.ts     ev.or.kr URL 상수 (의존성 없음, 클라이언트 import 가능)
lib/ev/parse.ts      cheerio 파서 (다단 헤더·rowspan 처리, 헤더 키워드 기반)
lib/ev/getData.ts    서버 전용. 수집(unstable_cache 1h) → 실패 시 스냅샷. 지방비 데이터 로더
lib/seo.ts lib/site.ts  메타데이터·JSON-LD 헬퍼, 사이트 상수·메뉴
scripts/fetch-snapshot.ts        Playwright 수집 스크립트
scripts/gen-guide-figures.mjs    가이드 인포그래픽 SVG 생성기
.github/workflows/snapshot.yml   매시간(KST 06~23시) 수집 → JSON 커밋 → Vercel 자동 재배포
```

## 데이터 흐름과 핵심 결정
- 지방비(시·군·구별 승용 최대액)는 `data/snapshot/local-price.ts`의 취합값이 기본이고, 수집 JSON에 행이 있으면 그것이 우선. 확인 안 된 곳은 `null` → 화면에 "공고 확인".
- 접수·출고·잔여 대수는 **임의 값 절대 금지**. 수집값이 있을 때만 표시하고 없으면 ev.or.kr 링크만 보여준다. 표는 `RemainTable`(클라이언트)이 `/api/remain?sido=`를 호출해 그리므로 정적 페이지 재빌드와 무관하게 갱신된다.
- 각 표에 기준 시각·출처 배지("누리집 수집" / "스냅샷")를 표시한다. 기준 시각은 `formatFetchedAt()`이 `2026.09.07 10:05` 형식(숫자만 조합)으로 만든다 — 로케일 오전/오후 표기는 Node(`AM`)와 Chrome(`오전`)이 달라 hydration 오류가 났던 이력이 있으니 로케일 문구를 SSR 텍스트에 쓰지 않는다.
- **홈 히어로 = 잔여 현황 지도 보드**(2026-09-07). 배너 일러스트를 지도로 대체: PC는 `data/korea-map.ts`의 간략화 윤곽 지도(SVG; 두께 레이어+그림자+광택+rotateX 기울기로 입체감, 선택 시 블록이 떠오름), 모바일은 4열 타일 카토그램. 둘 다 렌더하고 CSS(`hidden md:block` / `md:hidden`)로 토글해 hydration 불일치를 피한다. 첫 페인트·SEO는 빌드 시 `getRemainSnapshot()`(동기 스냅샷, 라이브 시도 없음)으로 채우고, 마운트 후 `/api/remain`을 한 번 호출해 더 새로우면 교체한다. 지역 선택 → 아래 도킹 `RegionPanel`에서 시·군·구 타일(도) / 단일 공고 카드(특별·광역시·세종·제주) / `RemainTable embedded` 표로 드릴다운. 잔여 수준은 잔여/공고 기준 소진(≤0)·적음(<5%)·보통(5~15%)·여유(≥15%)·미수집 5단계이며 색은 마스크 재고 지도 관례(초록·노랑·주황·빨강). `RemainTable`은 `data`(재요청 생략)·`embedded`(표만) prop을 받는다.
- 시·군·구 페이지 slug는 **한글 원문**(`sigunguSlug`, 공백만 제거)을 `generateStaticParams`에 넘긴다. 미리 퍼센트 인코딩하면 Next/Vercel이 한 번 더 인코딩해 프리렌더 경로가 이중 인코딩되고 실제 요청(/region/busan/중구)이 404가 난다(2026-09-07 수정). 링크·canonical·sitemap은 `sigunguPath()`로만 만든다.
- 애드센스 게시자 ID `ca-pub-9408914409364609`는 `lib/site.ts`의 `ADSENSE_CLIENT_DEFAULT`에 박혀 있어 스크립트(`<head>` 직접 삽입)·메타태그·ads.txt가 항상 켜진다. `NEXT_PUBLIC_ADSENSE_CLIENT`로 덮어쓰거나 `off`로 끌 수 있음. 광고 자리(AdSlot)는 슬롯 ID 환경변수가 있을 때만 렌더링.
- 이미지는 전부 직접 그린 SVG(저작권 이슈 없음). 외부 스톡 이미지 사용 안 함. 사용자가 Pixabay 사진을 `public/images/photos/`에 넣어주면 배치할 수 있음.

## 데이터 수집 구조 (2026-09-03 완성)
- **ev.or.kr는 일반 HTTP 요청에 봇 검사 페이지(pnp4web, 1MB JS)만 내려주고 AJAX 본문은 암호화**되어 있다. 따라서 Vercel 서버 fetch는 항상 실패하고(`/api/ev-status`로 확인 가능), 실제 수집은 GitHub Actions의 헤드리스 크롬(`scripts/fetch-snapshot.ts`)이 담당한다.
- ev.or.kr 데이터는 `<table>`이 아니라 **ag-Grid(div, 10행 페이지네이션)**로 그려진다. 현황 페이지 `#myGrid` 열: 지역(sido, "즐겨찾기 서울 마감 서울특별시"처럼 버튼·배지 텍스트 포함) | 차종 | 공고종류 | 접수기간 | 신청마감 | 공고 | 접수 | 선정 | 출고 | 선정잔여 | 출고잔여. 같은 지역이 공고종류(본공고/추경n차)별로 여러 행이며 대수는 누적 동일값 → `lib/ev/aggrid.ts`가 지역·차종당 1행으로 합친다.
- 차종·모델 페이지는 지자체별 아코디언 161개(`.accordion-item`, `.location__city`=시·도 약칭, `.location__district`=지역명) 안에 ag-Grid(차종/차급·제조사·모델·국비·지방비·소계·전환지원금). 일반 클릭은 타임아웃이 나서 JS click 사용. **"전기승용 일반승용" 행만** 집계한다(택시 행은 지방비가 훨씬 커서 제외).
- 워크플로 `.github/workflows/snapshot.yml`: 매시 20분(KST 06~23시) + 수동 실행(`probe=1`이면 구조·XHR 탐색만). 수집 성공 시 `data/snapshot/*.json` 커밋 → Vercel 재배포. 소요 약 9분. 결과는 GitHub → Actions → "Refresh ev.or.kr snapshot" 로그로 확인(`remain rows: 160`, `local-price rows: 160`이 정상).
- 2026-09-03 실제 수집값: 서울·대구·인천·광주·대전·세종 194, 울산 221, 부산 224, 강원 200, 충북 400, 충남 414, 전북 434, 제주 276, 경기 120~380(연천), 전남 200~600(보성·완도), 경북 412(울릉 756), 경남 120~488(합천). 시·도 소개문·가이드 수치·인포그래픽은 이 값 기준으로 맞춰 두었다. `data/snapshot/local-price.ts`는 이 수집값을 옮긴 폴백이다.

## 다음 할 일 (우선순위 순)
1. Google Search Console·네이버 서치어드바이저 등록 (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`), sitemap 제출.
2. 애드센스 사이트 연결 완료(2026-09-03, 게시자 ID 코드 내장). 애드센스 콘솔에서 "코드 확인" → 심사 요청 → 승인 후 광고 단위 슬롯 ID를 `NEXT_PUBLIC_ADSENSE_SLOT_*` 환경변수에 입력.
3. 수집 워크플로가 계속 성공하는지 주기적으로 확인(Actions 탭). ev.or.kr 화면 구조가 바뀌면 로그의 `grid headers`를 보고 `lib/ev/aggrid.ts`의 열 정규식을 맞춘다.
4. 가이드·지역 콘텐츠 보강, 2027년 지침 확정 시 수치 갱신(`data/cars.ts`, 가이드 본문, `scripts/gen-guide-figures.mjs` 후 재생성).

## 작업 규칙
- 배포 브랜치는 `main` 하나만 쓴다. 세션에 작업용 `claude/…` 브랜치가 지정돼 있으면 거기서 작업한 뒤 `main`에 병합하고 작업 브랜치는 지운다. PR은 요청 시에만.
- 변경 후 `npm run lint && npm run typecheck && npm run build` 통과 확인. 화면 확인은 Playwright(`/opt/pw-browsers/chromium` 같은 로컬 크롬)로 스크린샷. 로컬·샌드박스에서는 `EV_DISABLE_LIVE_FETCH=1`을 주면 `/api/remain`이 12초 라이브 시도 없이 스냅샷을 바로 돌려준다.
- 이 작업 환경(Claude 원격 세션)에서는 ev.or.kr, ev.io.kr, vercel.com, 가비아 등 외부 사이트 접속이 차단된다. 배포 결과 확인은 사용자 캡처/JSON 붙여넣기 또는 GitHub Actions 로그(MCP)로 한다.
- 한국어로 소통. 금액 단위는 만원. 연도 표기 2026 기준.
