export const SITE = {
  name: "전기차보조금 조회",
  tagline: "지자체별 전기차 보조금 현황 한눈에",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ev.io.kr").replace(/\/$/, ""),
  description:
    "2026년 전국 17개 시·도, 시·군·구별 전기차 구매 보조금(국비·지방비)과 접수·출고·잔여 현황, 차종별 국고보조금, 신청 절차와 세제 혜택을 정리한 정보 사이트입니다.",
  email: "eviokr@icloud.com",
  operator: "전기차보조금 조회",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
  naverVerification: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ?? "",
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
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
