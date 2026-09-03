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
5. 배포 후 `https://<project>.vercel.app/region/seoul` 을 열어 표 하단 배지가 **"누리집 수집"** 이면 실시간 수집 성공, **"스냅샷"** 이면 수집 실패(10분 뒤 재시도, 성공 시 1시간 캐시). 계속 스냅샷이면 `https://<도메인>/api/ev-status` 를 열어 원인을 확인한다.
   - `attempts[].status` 가 403 또는 접속 오류 → ev.or.kr 가 Vercel IP를 차단. 국내 서버·PC에서 `npm run fetch:snapshot` 으로 스냅샷을 주기적으로 갱신하는 방식으로 전환.
   - `status` 200 인데 `parsedRows` 0 → 표 구조가 다름. `tables[].headers` 문구를 보고 `lib/ev/parse.ts` 의 `classifyHeader` 키워드를 맞춘다.
   - 접수·출고·잔여 표는 브라우저에서 `/api/remain` 을 호출해 그리므로, 정적 페이지 재빌드 없이 서버 캐시(1시간)만 갱신되면 바로 반영된다.

> 리전은 `vercel.json` 에서 `icn1`(서울)로 고정했습니다. ev.or.kr 가 해외 IP를 차단하는 경우에 대비한 설정입니다.

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
- [ ] Google Search Console 등록 → 소유 확인(HTML 태그 방식이면 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 에 content 값) → sitemap 제출
- [ ] 네이버 서치어드바이저 등록 → `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`

### 파서 점검 방법
국내 PC에서 저장소를 클론한 뒤:
```bash
npm install
npm run fetch:snapshot
```
`remain rows: N` 이 0보다 크면 파서가 동작하는 것이고 `data/snapshot/*.json` 이 갱신됩니다. 0이면 `data/snapshot/*.debug.html` 이 저장되므로 그 HTML의 `<table>` 헤더 문구를 보고 `lib/ev/parse.ts` 의 `classifyHeader` 키워드를 맞추면 됩니다. 갱신된 JSON을 커밋·푸시하면 Vercel이 자동 재배포합니다.

## 6. 애드센스 승인 신청

1. 사이트가 도메인으로 접속되고 콘텐츠(가이드 16편, 지역·차종 페이지, 정책 페이지)가 모두 보이는 상태에서 신청.
2. https://adsense.google.com → 사이트 추가 → `ev.io.kr`.
3. 게시자 ID `ca-pub-9408914409364609` 는 `lib/site.ts` 에 기본값으로 들어 있어 별도 환경변수 없이 배포만 하면 연결됩니다. (다른 계정으로 바꾸려면 `NEXT_PUBLIC_ADSENSE_CLIENT` 로 덮어쓰기)
   - 모든 페이지 `<head>` 에 `adsbygoogle.js?client=ca-pub-…` 스크립트와 `<meta name="google-adsense-account">` 태그가 들어갑니다.
   - `https://ev.io.kr/ads.txt` 가 `google.com, pub-9408914409364609, DIRECT, f08c47fec0942fa0` 을 반환합니다.
   - 배포 후 애드센스 화면 **사이트 → ev.io.kr → 코드 확인/ads.txt 확인** 을 눌러 "사이트 연결됨" 이 뜨면 심사 요청.
4. 승인 후 광고 단위를 만들고 슬롯 ID를 `NEXT_PUBLIC_ADSENSE_SLOT_HOME` 등에 넣어 Redeploy 하면 각 페이지의 광고 자리가 활성화됩니다.
5. 심사 기간(보통 2주~1개월) 동안은 콘텐츠를 계속 추가하고, 지역 페이지의 "공고 확인" 값을 실제 공고 금액으로 채워 두는 것이 유리합니다.

## 7. 자료 갱신 루틴

- 매년 1~2월: 환경부 지침 확정 후 `data/cars.ts` 국비, `data/snapshot/local-price.ts` 지방비, 가이드 본문의 연도·금액 갱신.
- 수시: `npm run fetch:snapshot` 으로 접수·출고·잔여 현황 스냅샷 갱신 (Vercel 런타임 수집이 정상이면 생략 가능).
- 공고 변경 제보가 오면 해당 시·군·구 값을 `local-price.ts` 에서 수정 후 `LOCAL_PRICE_UPDATED_AT` 갱신.
