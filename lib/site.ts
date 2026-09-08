export const ADSENSE_CLIENT_DEFAULT = "ca-pub-9408914409364609";
/** 네이버 서치어드바이저 소유확인 값 (<meta name="naver-site-verification">). 공개 값이라 코드에 둔다 (2026-09-08 발급) */
export const NAVER_SITE_VERIFICATION_DEFAULT = "2a20be80aeb22e2dbd62581cf07d46ca3cbc1d09";
/** Bing 웹마스터 도구 소유확인 값 (<meta name="msvalidate.01">). 공개 값이라 코드에 둔다 (2026-09-08 발급) */
export const BING_SITE_VERIFICATION_DEFAULT = "D57CFC07162E92464C0C00774529B9F3";

/** 환경변수가 있으면 우선, off/0/false 면 끔, 비어 있으면 코드 기본값 */
function resolveWithDefault(env: string | undefined, fallback: string): string {
  const v = (env ?? "").trim();
  if (v === "off" || v === "0" || v === "false") return "";
  return v || fallback;
}

export const SITE = {
  name: "전기차보조금 조회",
  tagline: "지자체별 전기차 보조금 현황 한눈에",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ev.io.kr").replace(/\/$/, ""),
  description:
    "2026년 전국 17개 시·도, 시·군·구별 전기차 구매 보조금(국비·지방비)과 접수·출고·잔여 현황, 차종별 국고보조금, 신청 절차와 세제 혜택을 정리한 정보 사이트입니다.",
  email: "eviokr@icloud.com",
  operator: "전기차보조금 조회",
  // 애드센스 게시자 ID. 공개 값이므로 코드에 기본값을 두고, 환경변수로 덮어쓸 수 있게 한다.
  // 비우려면 NEXT_PUBLIC_ADSENSE_CLIENT=off 로 설정.
  adsenseClient: resolveWithDefault(process.env.NEXT_PUBLIC_ADSENSE_CLIENT, ADSENSE_CLIENT_DEFAULT),
  // 네이버 소유확인도 같은 방식. 다른 값으로 바꾸려면 NEXT_PUBLIC_NAVER_SITE_VERIFICATION, 끄려면 off.
  naverVerification: resolveWithDefault(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION, NAVER_SITE_VERIFICATION_DEFAULT),
  bingVerification: resolveWithDefault(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION, BING_SITE_VERIFICATION_DEFAULT),
  // 구글은 DNS TXT(도메인 속성) 방식으로 확인 중이라 메타태그 기본값 없음. URL 접두어 방식이면 이 변수에 content 값을 넣는다.
  googleVerification: (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "").trim(),
  launchedYear: 2026,
} as const;

export const NAV = [
  { href: "/", label: "홈" },
  { href: "/region", label: "지역별 보조금" },
  { href: "/car", label: "차종별 국비" },
  { href: "/calculator", label: "보조금 계산기" },
  { href: "/guide", label: "가이드" },
  { href: "/about", label: "사이트 소개" },
] as const;

export const FOOTER_LINKS = [
  { href: "/about", label: "사이트 소개" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/disclaimer", label: "면책조항" },
  { href: "/contact", label: "문의하기" },
] as const;
