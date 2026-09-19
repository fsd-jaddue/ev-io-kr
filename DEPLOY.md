# 배포 및 도메인 연결 가이드 (Vercel + 가비아 ev.io.kr)

## 1. Vercel 배포

1. https://vercel.com 로그인 → **Add New → Project** → GitHub 저장소 `fsd-jaddue/ev-io-kr` Import.
2. Framework Preset은 **Next.js** 자동 인식. Root Directory는 비워 둠. Build Command `next build`, Output 기본값.
3. **Environment Variables** (Production / Preview 모두):
   | 이름 | 값 | 비고 |
   |---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://ev.io.kr` | 도메인 연결 전엔 `https://<project>.vercel.app` |
   | `NEXT_PUBLIC_ADSENSE_CLIENT` | (비움) | 비우면 코드 기본값 `ca-pub-9408914409364609` 사용. 끄려면 `off` |
   | `NEXT_PUBLIC_ADSENSE_SLOT_*` | (비움) | 승인 후 광고 단위 ID |
4. **Deploy**. 빌드 로그에 `[ev] live fetch failed, using snapshot` 가 찍히면 빌드 환경에서 ev.or.kr 접근이 막힌 것이고, 런타임(ISR)에서 다시 시도하므로 정상.
5. 배포 후 `https://<project>.vercel.app/region/seoul` 을 열어 표 하단 배지가 **"누리집 수집"** 이면 실시간 수집 성공, **"스냅샷"** 이면 수집 실패(10분 뒤 재시도, 성공 시 1시간 캐시). 계속 스냅샷이면 GitHub Actions 수집 워크플로 로그(Actions → Refresh ev.or.kr snapshot)에서 원인을 확인한다. (Vercel 런타임 수집은 ev.or.kr 봇 검사 때문에 항상 실패하는 것이 확인돼 진단 라우트 `/api/ev-status` 는 2026-09-08 제거했다.)
   - `attempts[].status` 가 403 또는 접속 오류 → ev.or.kr 가 Vercel IP를 차단. 국내 서버·PC에서 `npm run fetch:snapshot` 으로 스냅샷을 주기적으로 갱신하는 방식으로 전환.
   - `status` 200 인데 `parsedRows` 0 → 표 구조가 다름. `tables[].headers` 문구를 보고 `lib/ev/parse.ts` 의 `classifyHeader` 키워드를 맞춘다.
   - 접수·출고·잔여 표는 브라우저에서 `/api/remain` 을 호출해 그리므로, 정적 페이지 재빌드 없이 서버 캐시(1시간)만 갱신되면 바로 반영된다.

> 리전은 `vercel.json` 에서 `icn1`(서울)로 고정했습니다. ev.or.kr 가 해외 IP를 차단하는 경우에 대비한 설정입니다.

### 1-1. 배포 브랜치는 `main`

GitHub 기본 브랜치와 Vercel Production Branch는 모두 **`main`** 이다. `main` 에 푸시하면 Production 배포, 다른 브랜치에 푸시하면 Preview 배포가 된다. 매시간 도는 수집 워크플로(`.github/workflows/snapshot.yml`)는 GitHub 기본 브랜치에서 실행되어 그 브랜치에 JSON을 커밋하므로, 기본 브랜치가 `main` 이어야 배포 사이트의 자료가 갱신된다.

예전 배포 브랜치 `claude/adsense-ev-subsidy-site-10f3l9` 를 `main` 으로 바꾸는 절차 (2026-09-07):

1. GitHub 저장소 → **Settings → General → Default branch** → 연필 아이콘 → `main` 선택 → **Update**. (또는 **Branches** 탭에서 `main` 옆 "Switch to default" 아이콘)
2. `main` 에 커밋을 하나 푸시해 Vercel 배포(Preview)를 먼저 만든다. Vercel 은 배포 이력이 없는 브랜치를 Production 브랜치로 지정하지 못한다("No deployments found for main" 오류).
3. Vercel 프로젝트 → **Settings → Environments → Production → Branch Tracking** 에 `main` 을 넣고 **Save**. (예전 UI 는 Settings → Git → Production Branch.) Save 뒤 **Deployments** 에서 `main` 배포가 Preview 로 남아 있으면 ⋯ 메뉴 → **Promote to Production** 또는 **Redeploy**.
4. `https://ev.io.kr` 이 정상이고 Vercel Production 배포의 브랜치가 `main` 으로 표시되면, GitHub **Branches** 에서 `claude/adsense-ev-subsidy-site-10f3l9` 를 삭제한다. (Vercel 전환 전에 지우면 Production 이 끊기므로 순서를 지킨다.)
5. 다음 정시 20분에 Actions → "Refresh ev.or.kr snapshot" 이 `main` 에서 실행돼 `chore(snapshot)` 커밋이 `main` 에 쌓이는지 확인한다.

## 2. 가비아에서 ev.io.kr 구입

1. https://www.gabia.com → 도메인 검색창에 `ev.io.kr` 입력 → 등록 가능 여부 확인 후 구매(`.io.kr` 는 2단계 국가 도메인으로 1년 단위 등록).
2. 구매 시 **네임서버는 가비아 기본** 그대로 두고, DNS 레코드만 Vercel로 연결하는 방식이 가장 간단합니다.

## 3. Vercel에 도메인 추가

1. Vercel 프로젝트 → **Settings → Domains** → `ev.io.kr` 추가 → 이어서 `www.ev.io.kr` 추가.
2. `www.ev.io.kr` 은 **Redirect to ev.io.kr** (308) 로 설정.
3. Vercel이 안내하는 레코드 값을 확인 (기본값은 아래와 같음).

## 4. 가비아 DNS 설정

가비아 **My가비아 → 도메인 관리 → DNS 관리(DNS 설정)** 에서 레코드 추가:

| 타입 | 호스트 | 값 | TTL |
|---|---|---|---|
| A | `@` | `76.76.21.21` | 600 |
| CNAME | `www` | `cname.vercel-dns.com.` | 600 |

- 가비아는 CNAME 값 끝에 `.` 을 요구할 수 있습니다. 저장이 안 되면 `.` 을 붙이거나 빼서 재시도.
- 기존에 `@` 에 걸린 A 레코드/파킹 레코드가 있으면 삭제.
- 전파는 보통 10분~1시간, 최대 48시간. Vercel Domains 화면에서 **Valid Configuration** 이 뜨면 SSL 인증서가 자동 발급됩니다.
- 확인: `nslookup ev.io.kr` 결과가 `76.76.21.21` 이면 완료.

## 5. 배포 후 점검 체크리스트

- [ ] `https://ev.io.kr/` 접속, https 자물쇠 확인
- [ ] `https://www.ev.io.kr` → `https://ev.io.kr` 리다이렉트
- [ ] `https://ev.io.kr/sitemap.xml`, `/robots.txt` 응답
- [ ] `/region/seoul` 표 하단 배지가 "누리집 수집" 인지 (스냅샷이면 파서 점검)
- [ ] Google Search Console 등록 → 소유 확인(도메인 속성: 가비아 DNS TXT `@` 에 `google-site-verification=…` 추가, 인증 후에도 삭제 금지. URL 접두어+HTML 태그 방식이면 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 에 content 값) → sitemap 제출
- [ ] 다음(카카오) 검색등록: https://register.search.daum.net → 신규 등록 → 사이트 → URL·사이트명·소개·이메일 입력(태그 없음, 수동 심사 수일~2주). "블로그" 항목에 `https://ev.io.kr/feed.xml` 도 등록 가능
- [ ] Bing 웹마스터: HTML Meta Tag 방식. 값은 `lib/site.ts` 의 `BING_SITE_VERIFICATION_DEFAULT` (2026-09-08 인증 완료). Sitemaps 에 `https://ev.io.kr/sitemap.xml` 제출
- [ ] 네이버 서치어드바이저: 요청 → 사이트맵 제출(`/sitemap.xml`), RSS 제출(`/feed.xml`), 웹 페이지 수집(홈·시·도 17·가이드·차종·시·도 순, 일 50건), 검증 → 사이트 간단 체크·robots.txt 검증
- [ ] 네이버 서치어드바이저 등록 → HTML 태그 방식. 발급받은 content 값은 `lib/site.ts` 의 `NAVER_SITE_VERIFICATION_DEFAULT` 에 들어 있어 `main` 배포만 되면 모든 페이지 `<head>` 에 `<meta name="naver-site-verification">` 이 실린다. 배포 후 서치어드바이저에서 "소유확인" 클릭. (값을 바꾸려면 `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`)

### 파서 점검 방법
국내 PC에서 저장소를 클론한 뒤:
```bash
npm install
npm run fetch:snapshot
```
`remain rows: N` 이 0보다 크면 파서가 동작하는 것이고 `data/snapshot/*.json` 이 갱신됩니다. 0이면 `data/snapshot/*.debug.html` 이 저장되므로 그 HTML의 `<table>` 헤더 문구를 보고 `lib/ev/parse.ts` 의 `classifyHeader` 키워드를 맞추면 됩니다. 갱신된 JSON을 커밋·푸시하면 Vercel이 자동 재배포합니다.

## 6. 애드센스 검토 요청과 사후 확인

2026-09-20 독립 검토에서 기존의 글자 수·가이드 편수 중심 개선만으로는 부족하다고 판단했다. 지급액 계산 오류, 제도 요건 오기, 중복 문서, 근거 없는 전망을 수정했다. 자세한 근거는 [검토 기록](./ADSENSE_REVIEW_2026-09-20.md)에 남긴다.

1. lint·회귀검사·타입검사·프로덕션 빌드와 모바일 검증을 완료한다.
2. main을 푸시하고 Vercel 성공 상태 및 운영 도메인의 새 내용을 확인한다.
3. 운영 사이트에서 sitemap·ads.txt·이전 주소 이동·noindex·내부 링크를 검증한다. 사이트맵은 현재 56개다. Search Console에 이미 제출한 같은 sitemap.xml 주소는 새 내용으로 제공된다. 실제 색인 반영 여부는 별도 확인한다.
4. 사용자에게 검토 요청까지 명시적으로 위임받은 경우 AdSense → 사이트 → ev.io.kr에서 ‘문제를 수정했음을 확인합니다’를 체크하고 ‘검토 요청’을 누른다. 화면의 대기/검토 상태를 확인하고 제출 시각을 기록한다.
5. 승인 여부는 Google이 결정한다. 고정된 최소 글 수·글자 수·사이트 연식·하루 대기 규칙을 승인 조건으로 단정하지 않는다. 재거절 시 새 메시지와 실제 데이터 정확성·사용성을 다시 살핀다.

게시자 ID는 lib/site.ts의 ca-pub-9408914409364609다. /ads.txt는 google.com, pub-9408914409364609, DIRECT, f08c47fec0942fa0을 반환해야 한다. 대시보드 상태와 공개 파일 상태를 분리해 확인하고, ‘찾을 수 없음’이면 현재 HTTP 응답·내용·크롤러 접근과 마지막 확인 시각을 살핀다. 상태 갱신 시점을 보장하지 않는다.

noindex는 검색 색인 제어일 뿐 AdSense 정책 면제가 아니다. 중복 페이지는 308로 실제 통합하고, 철회 글에는 원문을 남기지 않는다. 승인 후 광고를 활성화할 때도 미확인·철회·기능성 빈 화면에는 광고가 뜨지 않는지 실제 배치를 확인한다.

공식 기준: [AdSense 고품질 사이트 안내](https://support.google.com/adsense/answer/10015918?hl=ko), [Google 게시자 정책](https://support.google.com/publisherpolicies/answer/11112688?hl=ko).

## 7. 방문 통계

- **Vercel Web Analytics**(코드 내장, 쿠키 없음): Vercel 대시보드 → 프로젝트 `ev-io-kr` → **Analytics** 탭 → **Enable**. 켠 뒤 배포된 사이트를 한 번 열면 몇 분 안에 페이지별 방문·유입 경로·국가·기기가 보인다. 현재 플랜의 사용량 한도는 Vercel 대시보드에서 확인한다.
- **Google Analytics 4**(선택, 애드센스 승인 뒤): https://analytics.google.com 에서 속성 생성 → 웹 스트림 `ev.io.kr` → 측정 ID(`G-…`) 복사 → Vercel 프로젝트 Settings → Environment Variables 에 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 로 저장(Production) → Redeploy. 값이 없으면 GA 스크립트는 페이지에 들어가지 않는다. 애드센스 콘솔에서 GA 계정을 연결하면 광고 수익과 방문 데이터를 함께 볼 수 있다.
- 검색어별 유입은 구글 서치콘솔·네이버 서치어드바이저 "검색 성과/유입 검색어" 보고서에서 별도 설정 없이 확인.

## 8. 자료 갱신 루틴

- **자동**: 매시간 수집 워크플로가 접수·출고·잔여, 시·군·구 지방비, 누리집 모델별 국비(`cars.json`)를 갱신·배포한다. 지방비 금액, 공고 물량·종류, 소진/재개, 국비가 바뀌면 GitHub Issue(`data-change`)가 열린다. 매일 09:30 정책 공지 감시가 환경부 보도자료·누리집 공지의 보조금 관련 새 글을 Issue(`policy-notice`)로 올린다. Issue 알림은 GitHub 계정 이메일로 온다(Settings → Notifications 에서 확인).
- **사람이 하는 일**: Issue 를 보고 가이드 본문·시·도 소개문·차종 설명이 새 수치와 어긋나면 세션에서 갱신. `data-change` Issue 에 ⚠️/❌ 매칭 항목이 있으면 `data/cars.ts` 의 `evMatch` 를 보정.
- 매년 1~2월: 환경부 지침 확정 후 `NATIONAL_MAX`(`data/cars.ts`), 가격 구간, 가이드 본문의 연도·금액, 관련 해설 갱신.
- 공고 변경 제보가 오면 수집값이 우선이므로 다음 수집을 기다리거나, 수집 실패 시 `local-price.ts` 를 수정 후 `LOCAL_PRICE_UPDATED_AT` 갱신.
