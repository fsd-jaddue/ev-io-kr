/**
 * 사이트 전용 원본 SVG 일러스트. 외부 이미지 없이 직접 그린 벡터라 저작권 문제가 없고,
 * 인라인 SVG라 추가 요청 없이 렌더링된다. 모두 장식용(aria-hidden)이다.
 */

type SvgProps = { className?: string };

/** 홈 히어로: 전기차 + 충전기 + 보조금(동전). 어두운 초록 배경 위에 배치 */
export function HeroIllustration({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 520 320" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hero-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d1fae5" />
        </linearGradient>
        <linearGradient id="hero-coin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* 배경 원 */}
      <circle cx="300" cy="150" r="130" fill="#ffffff" opacity="0.06" />
      <circle cx="300" cy="150" r="95" fill="#ffffff" opacity="0.06" />
      {/* 지면 */}
      <rect x="40" y="248" width="440" height="6" rx="3" fill="#ffffff" opacity="0.25" />
      {/* 충전기 */}
      <rect x="86" y="120" width="44" height="128" rx="8" fill="#ecfdf5" />
      <rect x="94" y="130" width="28" height="34" rx="4" fill="#065f46" />
      <path d="M108 136 l-6 12 h7 l-5 12" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="108" cy="178" r="4" fill="#34d399" />
      <circle cx="108" cy="192" r="4" fill="#a7f3d0" />
      {/* 케이블 */}
      <path d="M130 200 C 170 200, 165 232, 215 226" stroke="#a7f3d0" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="211" y="219" width="14" height="14" rx="3" fill="#a7f3d0" />
      {/* 차체 */}
      <path
        d="M218 246 C 200 246 196 232 200 222 L 214 194 C 220 182 230 176 244 174 L 330 168 C 350 166 368 174 384 188 L 410 210 C 432 214 446 222 448 236 L 448 246 Z"
        fill="url(#hero-body)"
      />
      {/* 창문 */}
      <path d="M232 196 L 244 184 C 250 180 256 178 264 178 L 306 176 L 306 200 L 232 200 Z" fill="#065f46" opacity="0.85" />
      <path d="M318 176 L 350 175 C 362 178 372 186 382 196 L 382 200 L 318 200 Z" fill="#065f46" opacity="0.85" />
      {/* 도어 라인 */}
      <path d="M312 178 L 312 240" stroke="#a7f3d0" strokeWidth="2" opacity="0.6" />
      {/* 헤드라이트 / 테일 */}
      <rect x="426" y="222" width="18" height="8" rx="4" fill="#fef3c7" />
      <rect x="202" y="228" width="12" height="7" rx="3" fill="#fca5a5" />
      {/* 바퀴 */}
      <circle cx="258" cy="246" r="22" fill="#064e3b" />
      <circle cx="258" cy="246" r="11" fill="#ecfdf5" />
      <circle cx="258" cy="246" r="4" fill="#064e3b" />
      <circle cx="396" cy="246" r="22" fill="#064e3b" />
      <circle cx="396" cy="246" r="11" fill="#ecfdf5" />
      <circle cx="396" cy="246" r="4" fill="#064e3b" />
      {/* 동전 */}
      <g transform="translate(408 92)">
        <ellipse cx="34" cy="60" rx="34" ry="11" fill="#b45309" opacity="0.5" />
        <rect x="0" y="34" width="68" height="22" rx="11" fill="url(#hero-coin)" />
        <ellipse cx="34" cy="34" rx="34" ry="11" fill="#fde68a" />
        <rect x="0" y="14" width="68" height="22" rx="11" fill="url(#hero-coin)" />
        <ellipse cx="34" cy="14" rx="34" ry="11" fill="#fef3c7" />
        <text x="34" y="19" textAnchor="middle" fontSize="13" fontWeight="700" fill="#92400e">₩</text>
      </g>
      {/* 반짝임 */}
      <g fill="#a7f3d0">
        <path d="M150 70 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
        <path d="M360 52 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" />
        <path d="M470 180 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
      </g>
    </svg>
  );
}

/** 작은 아이콘 세트 (24x24 기준) */
export function IconCalc({ className = "h-6 w-6" }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <rect x="8" y="6" width="8" height="4" rx="1" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2.4" />
    </svg>
  );
}
export function IconPercent({ className = "h-6 w-6" }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M19 5L5 19" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  );
}
export function IconGift({ className = "h-6 w-6" }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="5" rx="1" />
      <path d="M5 13v7a1 1 0 001 1h12a1 1 0 001-1v-7M12 8v13" />
      <path d="M12 8c-2-3-5-4-6-2s2 3 6 2zM12 8c2-3 5-4 6-2s-2 3-6 2z" />
    </svg>
  );
}
export function IconPin({ className = "h-6 w-6" }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-6-5.5-6-11a6 6 0 0112 0c0 5.5-6 11-6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}
export function IconCar({ className = "h-6 w-6" }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15l1.5-5A2 2 0 017.4 8.5h9.2a2 2 0 011.9 1.5L20 15" />
      <rect x="3" y="15" width="18" height="4" rx="1.5" />
      <circle cx="7.5" cy="19" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="19" r="1.5" fill="currentColor" />
      <path d="M12.5 10l-1.5 3h2l-1.5 3" />
    </svg>
  );
}

/** 가이드 카테고리별 썸네일 아트 (카드·본문 배너 공용). 4:3 비율 */
export type GuideCategory = "기본" | "신청" | "혜택" | "지역" | "차종" | "전망";

const CATEGORY_TONES: Record<GuideCategory, { from: string; to: string }> = {
  기본: { from: "#d1fae5", to: "#a7f3d0" },
  신청: { from: "#dbeafe", to: "#bfdbfe" },
  혜택: { from: "#fef3c7", to: "#fde68a" },
  지역: { from: "#ede9fe", to: "#ddd6fe" },
  차종: { from: "#e0f2fe", to: "#bae6fd" },
  전망: { from: "#fce7f3", to: "#fbcfe8" },
};

export function GuideArt({ category, className = "" }: { category: GuideCategory; className?: string }) {
  const tone = CATEGORY_TONES[category];
  const id = `ga-${category}`;
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone.from} />
          <stop offset="1" stopColor={tone.to} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${id})`} />
      <circle cx="270" cy="40" r="70" fill="#ffffff" opacity="0.35" />
      <circle cx="40" cy="180" r="50" fill="#ffffff" opacity="0.25" />
      <g transform="translate(160 100)">{ART[category]}</g>
    </svg>
  );
}

const ART: Record<GuideCategory, React.ReactNode> = {
  기본: (
    <g>
      {/* 열린 책 */}
      <path d="M-70 -30 C -45 -40 -20 -38 0 -26 L 0 40 C -20 30 -45 28 -70 36 Z" fill="#065f46" />
      <path d="M70 -30 C 45 -40 20 -38 0 -26 L 0 40 C 20 30 45 28 70 36 Z" fill="#047857" />
      <path d="M-56 -18 h40 M-56 -6 h40 M-56 6 h30 M16 -18 h40 M16 -6 h40 M16 6 h30" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" />
      <path d="M-14 -62 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="#f59e0b" />
    </g>
  ),
  신청: (
    <g>
      {/* 서류 + 체크 */}
      <rect x="-50" y="-66" width="100" height="130" rx="10" fill="#ffffff" />
      <rect x="-50" y="-66" width="100" height="130" rx="10" fill="#1d4ed8" opacity="0.08" />
      <rect x="-34" y="-48" width="52" height="8" rx="4" fill="#93c5fd" />
      <rect x="-34" y="-30" width="68" height="6" rx="3" fill="#bfdbfe" />
      <rect x="-34" y="-16" width="60" height="6" rx="3" fill="#bfdbfe" />
      <rect x="-34" y="-2" width="66" height="6" rx="3" fill="#bfdbfe" />
      <circle cx="30" cy="40" r="26" fill="#1d4ed8" />
      <path d="M18 40 l8 8 16 -18" stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  혜택: (
    <g>
      {/* 동전 더미 + 퍼센트 */}
      <ellipse cx="-30" cy="46" rx="40" ry="12" fill="#b45309" opacity="0.35" />
      <rect x="-70" y="14" width="80" height="26" rx="13" fill="#f59e0b" />
      <ellipse cx="-30" cy="14" rx="40" ry="12" fill="#fde68a" />
      <rect x="-70" y="-14" width="80" height="26" rx="13" fill="#f59e0b" />
      <ellipse cx="-30" cy="-14" rx="40" ry="12" fill="#fef3c7" />
      <text x="-30" y="-9" textAnchor="middle" fontSize="16" fontWeight="700" fill="#92400e">₩</text>
      <circle cx="46" cy="-22" r="34" fill="#ffffff" />
      <path d="M32 -8 l28 -28" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
      <circle cx="35" cy="-32" r="6" fill="none" stroke="#b45309" strokeWidth="4" />
      <circle cx="57" cy="-12" r="6" fill="none" stroke="#b45309" strokeWidth="4" />
    </g>
  ),
  지역: (
    <g>
      {/* 지도 + 핀 */}
      <path d="M-90 30 L -50 10 L -10 30 L 30 10 L 70 30 L 90 20 L 90 60 L 50 80 L 10 60 L -30 80 L -70 60 L -90 70 Z" fill="#ffffff" opacity="0.9" />
      <path d="M-50 10 L -30 80 M 30 10 L 10 60 M -10 30 L -70 60" stroke="#c4b5fd" strokeWidth="2" />
      <path d="M0 20 C -24 20 -36 0 -36 -18 a36 36 0 0 1 72 0 C 36 0 24 20 0 20 Z" fill="#6d28d9" />
      <circle cx="0" cy="-18" r="14" fill="#ffffff" />
      <ellipse cx="0" cy="44" rx="18" ry="6" fill="#6d28d9" opacity="0.3" />
    </g>
  ),
  차종: (
    <g>
      {/* 전기차 정면 */}
      <path d="M-84 30 L -70 -14 C -66 -26 -56 -32 -44 -32 L 44 -32 C 56 -32 66 -26 70 -14 L 84 30 Z" fill="#0369a1" />
      <path d="M-56 -22 L 56 -22 L 66 8 L -66 8 Z" fill="#bae6fd" />
      <rect x="-96" y="26" width="192" height="30" rx="12" fill="#075985" />
      <rect x="-80" y="34" width="26" height="12" rx="6" fill="#fef3c7" />
      <rect x="54" y="34" width="26" height="12" rx="6" fill="#fef3c7" />
      <rect x="-40" y="46" width="80" height="14" rx="7" fill="#0369a1" />
      <rect x="-90" y="52" width="26" height="18" rx="6" fill="#0c4a6e" />
      <rect x="64" y="52" width="26" height="18" rx="6" fill="#0c4a6e" />
      <path d="M4 -66 l-10 22 h12 l-10 22" stroke="#22c55e" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  전망: (
    <g>
      {/* 상승 막대 + 화살표 */}
      <rect x="-90" y="20" width="30" height="50" rx="6" fill="#be185d" opacity="0.55" />
      <rect x="-45" y="-4" width="30" height="74" rx="6" fill="#be185d" opacity="0.7" />
      <rect x="0" y="-28" width="30" height="98" rx="6" fill="#be185d" opacity="0.85" />
      <rect x="45" y="-56" width="30" height="126" rx="6" fill="#be185d" />
      <path d="M-80 0 L -30 -24 L 15 -44 L 70 -78" stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M52 -84 L 76 -82 L 72 -60" stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
};

/** 지역 페이지 헤더 장식: 도시 실루엣 + 핀 */
export function RegionArt({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden="true" focusable="false">
      <circle cx="150" cy="70" r="62" fill="#d1fae5" />
      <rect x="20" y="96" width="30" height="50" rx="3" fill="#a7f3d0" />
      <rect x="56" y="76" width="34" height="70" rx="3" fill="#6ee7b7" />
      <rect x="96" y="106" width="26" height="40" rx="3" fill="#a7f3d0" />
      <rect x="128" y="86" width="40" height="60" rx="3" fill="#34d399" />
      <rect x="174" y="100" width="30" height="46" rx="3" fill="#6ee7b7" />
      <g fill="#ecfdf5">
        <rect x="62" y="84" width="6" height="8" /><rect x="74" y="84" width="6" height="8" /><rect x="62" y="98" width="6" height="8" /><rect x="74" y="98" width="6" height="8" />
        <rect x="136" y="94" width="6" height="8" /><rect x="150" y="94" width="6" height="8" /><rect x="136" y="108" width="6" height="8" /><rect x="150" y="108" width="6" height="8" />
      </g>
      <rect x="10" y="146" width="220" height="4" rx="2" fill="#a7f3d0" />
      <path d="M120 78 C 104 78 96 62 96 48 a24 24 0 0 1 48 0 C 144 62 136 78 120 78 Z" fill="#059669" />
      <circle cx="120" cy="48" r="9" fill="#ffffff" />
    </svg>
  );
}

/** 차종 페이지 헤더 장식: 전기차 측면 */
export function CarArt({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden="true" focusable="false">
      <circle cx="120" cy="80" r="66" fill="#e0f2fe" />
      <rect x="16" y="126" width="208" height="4" rx="2" fill="#bae6fd" />
      <path d="M40 124 C 30 124 28 114 30 108 L 42 88 C 46 80 54 76 64 74 L 128 70 C 142 69 156 74 168 84 L 184 98 C 200 100 210 106 212 116 L 212 124 Z" fill="#0284c7" />
      <path d="M56 96 L 66 84 C 70 80 76 78 82 78 L 116 76 L 116 98 L 56 98 Z" fill="#e0f2fe" />
      <path d="M126 76 L 148 76 C 158 78 166 84 172 92 L 172 98 L 126 98 Z" fill="#e0f2fe" />
      <circle cx="72" cy="124" r="16" fill="#0c4a6e" /><circle cx="72" cy="124" r="7" fill="#e0f2fe" />
      <circle cx="176" cy="124" r="16" fill="#0c4a6e" /><circle cx="176" cy="124" r="7" fill="#e0f2fe" />
      <rect x="198" y="106" width="12" height="6" rx="3" fill="#fef3c7" />
      <path d="M124 44 l-8 16 h10 l-8 16" stroke="#22c55e" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 계산기 페이지 장식 */
export function CalcArt({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden="true" focusable="false">
      <circle cx="120" cy="80" r="66" fill="#d1fae5" />
      <rect x="76" y="24" width="88" height="116" rx="12" fill="#065f46" />
      <rect x="88" y="36" width="64" height="26" rx="6" fill="#a7f3d0" />
      <text x="146" y="55" textAnchor="end" fontSize="15" fontWeight="700" fill="#065f46">1,873</text>
      <g fill="#ecfdf5">
        <rect x="88" y="72" width="16" height="14" rx="4" /><rect x="112" y="72" width="16" height="14" rx="4" /><rect x="136" y="72" width="16" height="14" rx="4" />
        <rect x="88" y="94" width="16" height="14" rx="4" /><rect x="112" y="94" width="16" height="14" rx="4" /><rect x="136" y="94" width="16" height="14" rx="4" />
        <rect x="88" y="116" width="40" height="14" rx="4" />
      </g>
      <rect x="136" y="116" width="16" height="14" rx="4" fill="#f59e0b" />
      <g transform="translate(176 96)">
        <rect x="0" y="14" width="44" height="16" rx="8" fill="#f59e0b" />
        <ellipse cx="22" cy="14" rx="22" ry="8" fill="#fde68a" />
        <rect x="0" y="-4" width="44" height="16" rx="8" fill="#f59e0b" />
        <ellipse cx="22" cy="-4" rx="22" ry="8" fill="#fef3c7" />
      </g>
    </svg>
  );
}
