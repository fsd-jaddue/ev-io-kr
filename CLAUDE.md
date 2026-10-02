# ev.io.kr 작업 안내 (2026-10-01 복구 기준)

## 프로젝트와 배포
- Next.js 15 App Router, TypeScript, Tailwind v4. GitHub `fsd-jaddue/ev-io-kr`, Vercel 프로젝트 `ev-io-kr`, 운영 주소 https://ev.io.kr.
- 배포 브랜치는 main. main 푸시가 운영 배포를 시작한다. 자료 수집 봇도 main에 커밋하므로 푸시 전에 fetch하고 원격 변경을 보존한다. PR은 요청 시 작성한다.
- 한국어로 소통, 금액은 만원. 문의 `eviokr@icloud.com`.
- 작업 폴더 안의 별도 `ev-io-kr/` 복제본은 작업 대상이 아니다. 검색·타입검사·lint에서 제외하며 임의 삭제하거나 함께 커밋하지 않는다.

## 콘텐츠와 색인 구조 (2026-10-01)
- **구조 변경 이력**: 9/12 보강(사이트맵 225) → 9/20 축소(56, 시·군·구 229페이지를 시·도로 308 이동, 가이드 12편) → 서치콘솔 클릭이 9/26부터 0 → 10/1 2차 거절 → **9/20 이전 구조로 복구**(사이트맵 225). 근거와 수치는 `ADSENSE_REVIEW_2026-10-01.md`. 다시 페이지를 대량 삭제·통합하지 않는다. 클릭의 대부분이 시·군 단위 검색어였다.
- 시·군·구 229페이지는 `app/region/[sido]/[sigungu]/page.tsx`가 개별 문서로 렌더한다. 시·도 단일 공고 지역(서울·부산·대구·인천·광주·대전·울산·세종·제주)의 구·군 78페이지는 시·도 페이지와 중복이라 `noindex,follow` + 사이트맵 제외(열리기는 한다). 도 지역 151페이지는 잔여 물량이 서로 달라 색인. `sigunguPath()`는 페이지 경로, `LocalPriceTable` 행에는 `id="district-…"` 앵커가 남아 9/20식 링크도 깨지지 않는다.
- 지역 페이지 본문은 `lib/ev/regionCopy.ts`(비교 문단·체크리스트·FAQ, 수치는 데이터에서만)와 `data/sido-intro.ts`. 차종 해설은 `content/cars/index.ts`(소개·산정 배경·확인할 점·비교·FAQ, "추정" 안내문 포함). 가이드는 `content/guides/{basic,apply,benefit,region-car,practical}.ts`(수기) + `region-deep.ts`(도 8곳 시·군 비교, 수치는 스냅샷 계산) + `timely.ts`(하반기 추경·소진 현황은 remain.json 계산, 대리점 질문 10가지는 수기) 28편 + `weekly.ts`(주간 자동 작성분). 매주 화요일 10:00 KST Routine이 `content/guides/BACKLOG.md`의 다음 주제 1편을 `weekly.ts`에 쓰고 검증 후 main에 올린다. 주제·규칙은 BACKLOG.md에서 사람이 관리한다. `reviewed.ts`는 9/20 재작성본 보관용이며 사용하지 않는다. 2027 전망 글은 `app/guide/ev-subsidy-outlook-2027/page.tsx` 철회 안내(noindex)만 남긴다.
- 차종 20종 중 국비 미확인 3종(캐스퍼·레이·무쏘)은 noindex·사이트맵 제외. 인포그래픽은 `scripts/gen-guide-figures.mjs` → `public/images/guides/*.svg`(2026-10-01 재생성, 2년 의무운행·구 비례식 수치 제거).
- 소개 페이지는 9/20 판(자동화·AI 활용 고지)을 유지한다. 수기 작성·전문가 검수 주장을 쓰지 않는다. 페이지 수·글자 수를 승인 조건으로 단정하지 않는다.

## 금액 계산의 핵심 규칙 (2026-10-01)
- **지방비 비례식의 분모는 `LOCAL_REF_NATIONAL`(수집 목록 최고 국비, 현재 648 = PV5 WAV)이다.** 지역 '지방비 최대'는 이 모델 행의 값이므로 차종 지방비 = 최대액 × 국비 ÷ 648 (`estimateLocal`). 서울 수집 125행 전부가 ±1만원 안에서 일치하며 `tests/subsidy.test.ts`가 고정한다. **580(국비 상한)으로 나누지 않는다**(서울 20만원 과대). 화면·본문에서는 항상 "비례 추정, 서울은 수집값 일치, 다른 지역은 공식 표 재확인"을 붙인다.
- '합산 예상'은 `headlineTotal()` = 국비 최고 대표 차종(`TOP_CAR`, 아이오닉 6 570)의 국비 + 그 차종의 추정 지방비. "지방비 최대 + 580"을 쓰지 않는다.
- 전환지원 국비는 `passengerConversion(국비)` = `round(100 × min(국비/500, 1))`. 수집 전환 열이 있으면 그 값(`verifiedSupport`). 자격: 본인 명의 최초등록·보유 3년 이상 내연기관차(하이브리드 제외) 처분, 가족 거래 제한(2026-06-23 개정 지침). "+100만원 일괄"로 쓰지 않는다.
- 의무운행 8년·국내 매매 승계·수출/말소 회수요율표·재지원 제한 2년을 구분한다. "2년", "잔여개월/24"를 쓰지 않는다.
- 거주 요건은 "공고가 정한 기간(대개 30일 이상, 지자체별 상이)". 취득세 과세표준을 `차값-보조금`으로 단정하지 않는다.
- 수집 모델 국비가 미확인·충돌이면 null(`carsOverlay.ts`). `single`은 시·도 전체 공고에서 복제된 행에만, 금액만 같은 시·군별 공고는 `equal`.

## 데이터 수집
- `scripts/fetch-snapshot.ts`가 ev.or.kr 브라우저 화면의 ag-Grid를 수집한다. 보통 HTTP 요청은 봇 검사로 실패하므로 Vercel에서는 저장 스냅샷을 사용한다.
- `.github/workflows/snapshot.yml`: KST 06~23시 매시20분 수집. `remain.json`, `local-price.json`, `cars.json`을 갱신한다. `snapshot-diff.ts`가 의미 있는 변경만 GitHub Issue로 알린다. 매일 정책 공지 감시도 별도 워크플로로 실행한다.
- 공고·접수·출고·잔여는 임의 생성 금지. 최초 HTML은 `getRemainSnapshot()`으로 렌더하고 `/api/remain`으로 갱신한다. 수집 시각을 행정기관 처리 시각이나 현재 접수 가능성으로 표현하지 않는다.
- `single`은 시·도 전체 공고에서 복제된 행에만 적용한다. 시·군별 공고인데 금액만 같으면 단일 공고라고 쓰지 않는다.
- 지방비 수집 실패 시 수기 스냅샷의 실제 기준일을 표시한다. 모델/표 데이터의 갱신과 가이드 해설 검토는 별개다.
- 한글 구·군의 정적 params는 인코딩하지 않는다. 링크를 만들 때만 encodeURIComponent를 적용한다.
- 렌더 시각은 숫자 조합으로 형식화한다. Node/브라우저 로케일 차이로 hydration 오류를 만들지 않는다.

## 검증
```sh
npm ci
npm run lint
npm run test
EV_DISABLE_LIVE_FETCH=1 npm run build
npm run typecheck
EV_DISABLE_LIVE_FETCH=1 npm start -- --port 3100
npm run audit:site
```
- audit:site는 전체 사이트맵·canonical·JSON-LD·내부 링크·앵커·CSS/JS·시·군·구 229페이지(단일 공고 시·도는 noindex)·미확인 차종/철회 글 noindex·404·ads.txt를 검증한다. 운영 검증은 `AUDIT_ORIGIN=https://ev.io.kr npm run audit:site`.
- 화면은 현재 환경의 허용된 브라우저 도구로 확인한다. 계산기 자격 체크·지역 변경·빈값/음수, 모바일 표 가로 스크롤을 검증한다.
- 광고 연결용 게시자 ID/메타태그/스크립트/ads.txt는 `lib/site.ts`의 기본값을 사용한다. `NEXT_PUBLIC_ADSENSE_CLIENT=off`로 비활성화 가능. 광고 슬롯은 개별 슬롯 환경변수가 있을 때만 출력된다. noindex 페이지가 정책 심사에서 제외된다고 가정하지 않는다.
- 승인 보장이나 근거 없는 대기 기간을 약속하지 않는다. 2차 거절(10/1)은 "지속 운영·사용자 관심" 기준이므로, 서치콘솔 클릭이 회복되고 새 글이 쌓인 뒤 사용자가 결정해 검토 요청한다. 실제 심사 결과는 AdSense에서 확인한다.
- 작업 브랜치는 `main`에 병합 후 지운다(원격 삭제가 이 환경에서 막히면 사용자에게 알린다).

상세 근거는 `ADSENSE_REVIEW_2026-10-01.md`(복구 사유·정정 표), `ADSENSE_REVIEW_2026-09-20.md`(정정 근거 원문), 운영 절차는 `DEPLOY.md` 참고.
