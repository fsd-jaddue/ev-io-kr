/**
 * 가이드 본문용 인포그래픽 SVG 생성기 (원본 제작, 저작권 이슈 없음).
 * 실행: node scripts/gen-guide-figures.mjs  → public/images/guides/*.svg
 * 수치를 바꾸려면 아래 FIGURES 를 수정하고 다시 실행한다.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/images/guides");
mkdirSync(OUT, { recursive: true });

const W = 800;
const FONT = "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard','Noto Sans KR','Malgun Gothic',sans-serif";
const C = {
  ink: "#0f172a", muted: "#64748b", line: "#e2e8f0", bg: "#f8fafc", white: "#ffffff",
  g1: "#059669", g2: "#34d399", g3: "#a7f3d0", g4: "#ecfdf5",
  amber: "#f59e0b", amber2: "#fde68a", blue: "#2563eb", blue2: "#bfdbfe", rose: "#e11d48", rose2: "#fecdd3",
  violet: "#7c3aed", violet2: "#ddd6fe", sky: "#0284c7", sky2: "#bae6fd", slate: "#475569",
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function svg(inner, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" font-family="${FONT}">
<rect width="${W}" height="${h}" rx="16" fill="${C.bg}"/>
${inner}
</svg>\n`;
}
function text(x, y, s, { size = 14, weight = 400, fill = C.ink, anchor = "middle" } = {}) {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
}
function title(s) {
  return text(W / 2, 36, s, { size: 20, weight: 700 });
}
function note(s, h) {
  return text(W / 2, h - 16, s, { size: 12, fill: C.muted });
}

/** 세로 막대 차트 */
function barChart({ heading, items, unit = "만원", footnote, max, valueFmt }) {
  const h = 420;
  const top = 70, bottom = 330, left = 60, right = W - 40;
  const mx = max ?? Math.max(...items.map((i) => i.value)) * 1.15;
  const gap = (right - left) / items.length;
  const bw = Math.min(90, gap * 0.6);
  let s = title(heading);
  // 가로 눈금
  for (let i = 0; i <= 4; i++) {
    const y = bottom - ((bottom - top) * i) / 4;
    s += `<line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="${C.line}"/>`;
    s += text(left - 8, y + 4, Math.round((mx * i) / 4).toLocaleString(), { size: 11, fill: C.muted, anchor: "end" });
  }
  items.forEach((it, i) => {
    const x = left + gap * i + (gap - bw) / 2;
    const bh = ((bottom - top) * it.value) / mx;
    const y = bottom - bh;
    s += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="8" fill="${it.color ?? C.g1}"/>`;
    s += text(x + bw / 2, y - 8, (valueFmt ? valueFmt(it.value) : it.value.toLocaleString()) + (valueFmt ? "" : unit), { size: 13, weight: 700 });
    s += text(x + bw / 2, bottom + 20, it.label, { size: 13, weight: 600 });
    if (it.sub) s += text(x + bw / 2, bottom + 38, it.sub, { size: 11, fill: C.muted });
  });
  if (footnote) s += note(footnote, h);
  return svg(s, h);
}

/** 가로 막대 차트 (항목 많을 때) */
function hbarChart({ heading, items, unit = "만원", footnote }) {
  const rowH = 34;
  const h = 70 + items.length * rowH + 40;
  const left = 250, right = W - 90;
  const mx = Math.max(...items.map((i) => i.value)) * 1.05;
  let s = title(heading);
  items.forEach((it, i) => {
    const y = 60 + i * rowH;
    const bw = ((right - left) * it.value) / mx;
    s += text(left - 12, y + 20, it.label, { size: 13, weight: 600, anchor: "end" });
    s += `<rect x="${left}" y="${y + 6}" width="${bw}" height="${rowH - 12}" rx="6" fill="${it.color ?? C.g1}"/>`;
    s += text(left + bw + 8, y + 20, it.value.toLocaleString() + unit, { size: 12, weight: 700, anchor: "start" });
  });
  if (footnote) s += note(footnote, h);
  return svg(s, h);
}

/** 단계 흐름도 (최대 4개/행, 자동 줄바꿈) */
function flow({ heading, steps, footnote, perRow = 4 }) {
  const rows = Math.ceil(steps.length / perRow);
  const boxW = 160, boxH = 84, gapX = (W - 80 - boxW * perRow) / (perRow - 1), rowGap = 60;
  const h = 70 + rows * boxH + (rows - 1) * rowGap + 50;
  let s = title(heading);
  steps.forEach((st, i) => {
    const r = Math.floor(i / perRow), c = i % perRow;
    const x = 40 + c * (boxW + gapX), y = 66 + r * (boxH + rowGap);
    s += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="12" fill="${C.white}" stroke="${C.line}"/>`;
    s += `<circle cx="${x + 20}" cy="${y + 20}" r="12" fill="${st.color ?? C.g1}"/>`;
    s += text(x + 20, y + 24, String(i + 1), { size: 12, weight: 700, fill: C.white });
    s += text(x + boxW / 2 + 10, y + 26, st.label, { size: 14, weight: 700 });
    if (st.sub) {
      const lines = Array.isArray(st.sub) ? st.sub : [st.sub];
      lines.forEach((ln, k) => (s += text(x + boxW / 2, y + 50 + k * 16, ln, { size: 11, fill: C.muted })));
    }
    // 화살표
    if (i < steps.length - 1) {
      if (c < perRow - 1) {
        const ax = x + boxW, ay = y + boxH / 2;
        s += `<path d="M${ax + 4} ${ay} h${gapX - 12}" stroke="${C.g2}" stroke-width="3" stroke-linecap="round"/><path d="M${ax + gapX - 14} ${ay - 6} l8 6 -8 6" fill="none" stroke="${C.g2}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else {
        const ax = x + boxW / 2, ay = y + boxH;
        s += `<path d="M${ax} ${ay + 4} v${rowGap - 12}" stroke="${C.g2}" stroke-width="3" stroke-linecap="round"/><path d="M${ax - 6} ${ay + rowGap - 14} l6 8 6 -8" fill="none" stroke="${C.g2}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
        s += `<path d="M${ax} ${ay + rowGap - 4} H${40 + boxW / 2}" stroke="${C.g2}" stroke-width="3" stroke-linecap="round" opacity="0.35"/>`;
      }
    }
  });
  if (footnote) s += note(footnote, h);
  return svg(s, h);
}

/** 쌓기 구조도 (아래→위) */
function stack({ heading, layers, total, footnote }) {
  const h = 420;
  const bw = 360, bh = 64, x = 60;
  let s = title(heading);
  layers.forEach((ly, i) => {
    const y = 330 - (i + 1) * (bh + 10);
    s += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${ly.color}"/>`;
    s += text(x + bw / 2, y + 28, ly.label, { size: 16, weight: 700, fill: ly.text ?? C.white });
    if (ly.sub) s += text(x + bw / 2, y + 48, ly.sub, { size: 12, fill: ly.text ?? C.white });
    if (i < layers.length - 1) s += text(x + bw / 2, y - 2 - 3, "+", { size: 18, weight: 700, fill: C.muted });
  });
  // 오른쪽 설명
  s += `<rect x="470" y="${330 - layers.length * (bh + 10) + 10}" width="290" height="${layers.length * (bh + 10) - 10}" rx="12" fill="${C.white}" stroke="${C.line}"/>`;
  const ty = 330 - layers.length * (bh + 10) + 40;
  s += text(615, ty, "= 실제 차값에서 빠지는 금액", { size: 14, weight: 700 });
  (total ?? []).forEach((ln, k) => (s += text(615, ty + 28 + k * 22, ln, { size: 13, fill: C.slate })));
  if (footnote) s += note(footnote, h);
  return svg(s, h);
}

/** 구간 막대 (가격 상한 등) */
function segments({ heading, segs, axis, footnote }) {
  const h = 300;
  const left = 60, right = W - 60, y = 120, bh = 56;
  const totalW = segs.reduce((a, b) => a + b.w, 0);
  let x = left;
  let s = title(heading);
  segs.forEach((sg) => {
    const w = ((right - left) * sg.w) / totalW;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${bh}" fill="${sg.color}"/>`;
    s += text(x + w / 2, y + 24, sg.label, { size: 15, weight: 700, fill: sg.text ?? C.white });
    if (sg.sub) s += text(x + w / 2, y + 44, sg.sub, { size: 12, fill: sg.text ?? C.white });
    x += w;
  });
  s += `<rect x="${left}" y="${y}" width="${right - left}" height="${bh}" rx="10" fill="none" stroke="${C.white}" stroke-width="4"/>`;
  (axis ?? []).forEach((a) => {
    const ax = left + ((right - left) * a.pos) / totalW;
    s += `<line x1="${ax}" x2="${ax}" y1="${y + bh + 6}" y2="${y + bh + 22}" stroke="${C.slate}" stroke-width="2"/>`;
    s += text(ax, y + bh + 40, a.label, { size: 13, weight: 700 });
    if (a.sub) s += text(ax, y + bh + 58, a.sub, { size: 11, fill: C.muted });
  });
  if (footnote) s += note(footnote, h);
  return svg(s, h);
}

/** 카드 그리드 (아이콘 없이 값 강조) */
function cards({ heading, items, footnote, cols }) {
  const n = items.length, col = cols ?? Math.min(4, n), rows = Math.ceil(n / col);
  const cw = (W - 80 - (col - 1) * 16) / col, ch = 120;
  const h = 70 + rows * ch + (rows - 1) * 16 + 44;
  let s = title(heading);
  items.forEach((it, i) => {
    const r = Math.floor(i / col), c = i % col;
    const x = 40 + c * (cw + 16), y = 62 + r * (ch + 16);
    s += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="14" fill="${C.white}" stroke="${C.line}"/>`;
    s += `<rect x="${x}" y="${y}" width="${cw}" height="6" rx="3" fill="${it.color ?? C.g1}"/>`;
    s += text(x + cw / 2, y + 36, it.label, { size: 13, weight: 600, fill: C.slate });
    s += text(x + cw / 2, y + 70, it.value, { size: 24, weight: 800, fill: it.color ?? C.g1 });
    if (it.sub) s += text(x + cw / 2, y + 96, it.sub, { size: 11, fill: C.muted });
  });
  if (footnote) s += note(footnote, h);
  return svg(s, h);
}

/** 타임라인 */
function timeline({ heading, points, footnote }) {
  const h = 260;
  const left = 80, right = W - 80, y = 130;
  let s = title(heading);
  s += `<line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="${C.g3}" stroke-width="8" stroke-linecap="round"/>`;
  points.forEach((p, i) => {
    const x = left + ((right - left) * i) / (points.length - 1);
    s += `<circle cx="${x}" cy="${y}" r="14" fill="${p.color ?? C.g1}" stroke="${C.white}" stroke-width="4"/>`;
    s += text(x, y - 30, p.label, { size: 14, weight: 700 });
    if (p.sub) s += text(x, y + 40, p.sub, { size: 12, fill: C.muted });
    if (p.sub2) s += text(x, y + 58, p.sub2, { size: 12, fill: C.muted });
    if (i < points.length - 1 && p.span) {
      const nx = left + ((right - left) * (i + 1)) / (points.length - 1);
      s += text((x + nx) / 2, y - 8, p.span, { size: 12, weight: 700, fill: C.g1 });
    }
  });
  if (footnote) s += note(footnote, h);
  return svg(s, h);
}

/** 산정식 흐름 (박스 + 연산자) */
function formula({ heading, parts, result, footnote }) {
  const h = 320;
  let s = title(heading);
  const bw = 108, bh = 74, gap = 18, y = 90;
  const totalW = parts.length * bw + (parts.length - 1) * gap;
  let x = (W - totalW) / 2;
  parts.forEach((p, i) => {
    s += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${p.color ?? C.white}" stroke="${C.line}"/>`;
    s += text(x + bw / 2, y + 30, p.label, { size: 13, weight: 700, fill: p.text ?? C.ink });
    if (p.sub) s += text(x + bw / 2, y + 50, p.sub, { size: 11, fill: p.text ?? C.muted });
    if (i < parts.length - 1) s += text(x + bw + gap / 2, y + bh / 2 + 8, p.op ?? "×", { size: 22, weight: 700, fill: C.slate });
    x += bw + gap;
  });
  s += `<path d="M${W / 2} ${y + bh + 14} v34" stroke="${C.g2}" stroke-width="3"/><path d="M${W / 2 - 7} ${y + bh + 40} l7 9 7 -9" fill="none" stroke="${C.g2}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<rect x="${W / 2 - 230}" y="${y + bh + 60}" width="460" height="60" rx="14" fill="${C.g1}"/>`;
  s += text(W / 2, y + bh + 86, result.label, { size: 15, weight: 700, fill: C.white });
  if (result.sub) s += text(W / 2, y + bh + 106, result.sub, { size: 12, fill: C.g3 });
  if (footnote) s += note(footnote, h);
  return svg(s, h);
}

const FIGURES = {
  // 1. 총정리
  "subsidy-stack": stack({
    heading: "전기차 보조금은 세 층으로 쌓입니다",
    layers: [
      { label: "국비 (환경부)", sub: "중·대형 승용 최대 580만원 · 소형 530만원", color: C.g1 },
      { label: "지방비 (시·군·구)", sub: "서울 194만원 ~ 경북 울릉군 756만원", color: C.g2, text: C.ink },
      { label: "전환지원금 · 추가 인센티브", sub: "내연기관차 처분 +100만원, 다자녀·청년 등", color: C.amber2, text: C.ink },
    ],
    total: ["예) 서울 + 아이오닉 6 롱레인지", "570 + 191 + 100 = 약 861만원", "예) 경북 울릉군 동일 차종", "570 + 743 + 100 = 약 1,413만원"],
    footnote: "지방비는 차종 국비 비율에 비례 지급 · 2026년 기준",
  }),
  "price-cap": segments({
    heading: "차량 기본가격에 따른 보조금 지급 비율",
    segs: [
      { label: "100% 지급", sub: "5,300만원 미만", color: C.g1, w: 53 },
      { label: "50% 지급", sub: "5,300만 ~ 8,500만원", color: C.amber, w: 32 },
      { label: "미지급", sub: "8,500만원 이상", color: C.slate, w: 15 },
    ],
    axis: [
      { pos: 0, label: "0원" },
      { pos: 53, label: "5,300만원", sub: "기준선 1" },
      { pos: 85, label: "8,500만원", sub: "기준선 2" },
    ],
    footnote: "옵션 제외 트림 기본가격 기준 · 국비와 지방비 모두에 적용",
  }),
  // 2. 산정 기준
  "calc-formula": formula({
    heading: "2026 승용 전기차 국고보조금 산정식",
    parts: [
      { label: "성능보조금", sub: "주행거리·전비", color: C.g4 },
      { label: "배터리효율", sub: "에너지밀도 등급", color: C.white },
      { label: "배터리환경성", sub: "재활용 가치", color: C.white },
      { label: "사후관리", sub: "직영 정비망", color: C.white, op: "+" },
      { label: "배터리안전", sub: "정액 가산", color: C.g4, op: "×" },
      { label: "가격계수", sub: "1.0 / 0.5 / 0", color: C.amber2 },
    ],
    result: { label: "국비 (중·대형 상한 580만원) + 혁신기술·전환지원금", sub: "계수는 1.0에 가까울수록 유리" },
    footnote: "환경부 2026년 전기자동차 보급사업 보조금 업무처리지침 구조를 단순화한 도식",
  }),
  "national-examples": hbarChart({
    heading: "2026 차종별 국비 예시 (승용 대표 트림)",
    items: [
      { label: "현대 아이오닉 6 롱레인지", value: 570 },
      { label: "기아 EV6 롱레인지", value: 570 },
      { label: "현대 아이오닉 5 롱레인지", value: 567 },
      { label: "기아 EV3 롱레인지", value: 555 },
      { label: "현대 코나 일렉트릭 롱레인지", value: 514 },
      { label: "테슬라 모델 3 프리미엄 LR", value: 420, color: C.sky },
      { label: "테슬라 모델 Y 프리미엄 LR (계수 0.5)", value: 210, color: C.sky },
      { label: "테슬라 모델 3 스탠다드 (LFP)", value: 168, color: C.sky },
    ],
    footnote: "환경부 확정 공고 및 언론 보도 기준 · 단위 만원",
  }),
  // 3. 전환지원금
  "conversion-flow": flow({
    heading: "전환지원금 100만원 받는 흐름",
    steps: [
      { label: "내연기관차 보유", sub: ["본인 명의", "1년 이상 보유"] },
      { label: "처분", sub: ["폐차(말소) 또는", "타인 양도(이전등록)"] },
      { label: "전기차 구매·신청", sub: ["동일인 명의", "보조금 대상 차종"] },
      { label: "+100만원", sub: ["지급 신청 시", "처분 증빙 첨부"], color: C.amber },
    ],
    footnote: "처분 시점은 지자체 공고의 인정 기간(예: 신청 전 6개월 ~ 출고 후 2개월) 안에 있어야 함",
  }),
  // 16. 2027 전망
  "budget-2027": cards({
    heading: "2027년 정부 예산안: 전기차 보급 예산과 지원 물량",
    items: [
      { label: "보급 예산", value: "2조 1,403억", sub: "2026년 1조 6,114억 → +32.8%", color: C.g1 },
      { label: "지원 물량 (전체)", value: "43만 대", sub: "2026년 30만 대 → +43%", color: C.rose },
      { label: "승용 지원 물량", value: "36.8만 대", sub: "1조 1,044억원", color: C.blue },
      { label: "영업용 전환지원금", value: "신설", sub: "택시 등 18.7만 대 · 1,868억원", color: C.amber },
    ],
    footnote: "2026-09-01 발표 정부안 · 국회 확정 전",
  }),
  // 4. 신청 절차
  "apply-steps": flow({
    heading: "전기차 보조금 신청 7단계",
    steps: [
      { label: "공고 확인", sub: ["지자체 공고문", "물량·기간·우선순위"] },
      { label: "차종·국비 확인", sub: ["지급대상 차종", "트림 기본가격"] },
      { label: "구매계약", sub: ["대리점 계약", "서류 제출"] },
      { label: "신청서 접수", sub: ["대리점이 누리집에", "구매지원 신청"] },
      { label: "대상자 선정", sub: ["지자체 심사", "1~2주"] },
      { label: "출고·등록", sub: ["선정 후 2개월 이내", "10일 내 서류 제출"] },
      { label: "보조금 지급", sub: ["지자체 → 제작사", "잔금만 결제"], color: C.amber },
    ],
    footnote: "기한을 넘기면 선정이 취소되고 물량은 대기자에게 넘어감",
  }),
  // 5. 잔여대수
  "remain-numbers": cards({
    heading: "지자체별 보조금 현황 표의 네 가지 숫자",
    items: [
      { label: "공고대수", value: "1,000", sub: "올해 지원하기로 공고한 총 대수", color: C.slate },
      { label: "접수대수", value: "1,120", sub: "신청서가 접수된 대수 (초과 = 대기)", color: C.blue },
      { label: "출고대수", value: "860", sub: "출고·등록 완료, 지급 확정", color: C.g1 },
      { label: "출고잔여대수", value: "140", sub: "= 공고대수 − 출고대수", color: C.amber },
    ],
    footnote: "예시 수치 · 접수가 공고를 넘었으면 잔여가 보여도 사실상 대기 순번",
  }),
  // 8. 물량 구분
  "quota-split": hbarChart({
    heading: "지자체 공고 물량은 이렇게 나뉩니다 (예시 1,500대)",
    unit: "대",
    items: [
      { label: "일반 (가장 빨리 소진)", value: 1000, color: C.g1 },
      { label: "우선순위 (다자녀·취약계층·청년)", value: 200, color: C.violet },
      { label: "법인·기관 (사업장 기준)", value: 150, color: C.sky },
      { label: "택시 (별도 국비 상한)", value: 150, color: C.amber },
    ],
    footnote: "우선순위 물량이 남으면 일반으로 전환되는 것이 보통 · 해당 요건이 있으면 반드시 우선순위로 접수",
  }),
  // 9. 기한·의무운행
  "deadline-timeline": timeline({
    heading: "보조금 지급 전후 지켜야 할 기한",
    points: [
      { label: "대상자 선정", sub: "지자체 통보", span: "2개월 이내" },
      { label: "출고·등록", sub: "기한 초과 시", sub2: "선정 취소", span: "10일 이내" },
      { label: "서류 제출", sub: "지급 신청", span: "24개월" },
      { label: "의무운행 종료", sub: "이후 자유 처분", color: C.amber },
    ],
    footnote: "의무운행기간 내 매각·타 시도 이전·폐차 시 잔여 개월 ÷ 24 비율로 환수",
  }),
  "refund-scale": barChart({
    heading: "의무운행기간 내 처분 시 환수 비율 (보조금 900만원 기준)",
    items: [
      { label: "6개월 운행", value: 675, sub: "75% 환수", color: C.rose },
      { label: "12개월 운행", value: 450, sub: "50% 환수", color: C.amber },
      { label: "18개월 운행", value: 225, sub: "25% 환수", color: C.g2 },
      { label: "24개월 이상", value: 0, sub: "환수 없음", color: C.g1 },
    ],
    max: 800,
    footnote: "환수액 = 보조금 × 잔여 개월 ÷ 24 · 국비·지방비 모두 적용",
  }),
  // 15. FAQ
  "faq-topics": cards({
    heading: "질문이 가장 많은 6가지 주제",
    cols: 3,
    items: [
      { label: "거주 요건", value: "30일+", sub: "공고일 기준 주민등록", color: C.g1 },
      { label: "재지원 제한", value: "2년", sub: "지자체별 상이", color: C.blue },
      { label: "가격 기준", value: "5,300만", sub: "트림 기본가격, 옵션 제외", color: C.amber },
      { label: "출고 기한", value: "2개월", sub: "선정 통보일부터", color: C.violet },
      { label: "의무운행", value: "2년", sub: "등록일부터", color: C.sky },
      { label: "취득세 감면", value: "140만", sub: "등록 시 자동 적용", color: C.rose },
    ],
  }),
  // 6. 세제
  "tax-benefits": cards({
    heading: "보조금과 별도로 받는 2026년 전기차 세제 혜택",
    items: [
      { label: "취득세 감면", value: "최대 140만원", sub: "등록 시 자동 적용", color: C.g1 },
      { label: "개별소비세 감면", value: "최대 300만원", sub: "+ 교육세 90만원, 가격 반영", color: C.amber },
      { label: "자동차세", value: "연 13만원", sub: "배기량 무관 정액", color: C.blue },
      { label: "공채 매입", value: "면제·감면", sub: "지자체별 20~50만원 효과", color: C.violet },
    ],
    footnote: "취득세·개소세 감면은 일몰 조항이 있어 매년 연장 여부 확인",
  }),
  // 7. 추가 인센티브
  "incentive-stack": hbarChart({
    heading: "국비 가산 항목 (전국 공통, 2026)",
    items: [
      { label: "다자녀 4명 이상", value: 300, color: C.violet },
      { label: "다자녀 3명", value: 200, color: C.violet },
      { label: "청년 생애최초 (국비 570 기준 20%)", value: 114, color: C.blue },
      { label: "다자녀 2명", value: 100, color: C.violet },
      { label: "전환지원금", value: 100, color: C.amber },
      { label: "취약계층 (국비 570 기준 10%)", value: 57, color: C.sky },
    ],
    footnote: "국비 가산끼리는 모두 중복 가능 · 지자체 자체 인센티브는 별도",
  }),
  // 13. 충전·유지비
  "fuel-cost": barChart({
    heading: "월 1,500km 주행 시 연료비 비교",
    items: [
      { label: "완속 위주", value: 6.8, sub: "kWh당 약 250원", color: C.g1 },
      { label: "급속 위주", value: 10.9, sub: "kWh당 약 400원", color: C.g2 },
      { label: "휘발유차", value: 20.6, sub: "12km/L · 1,650원/L", color: C.slate },
    ],
    unit: "만원",
    max: 24,
    footnote: "전비 5.5km/kWh 기준 · 단위 만원/월",
  }),
  "tco-5y": barChart({
    heading: "5년 총비용 비교 (서울 · 완속 충전 기준)",
    items: [
      { label: "전기차", value: 4993, sub: "실구매 3,770 + 유지 1,223", color: C.g1 },
      { label: "휘발유차", value: 6281, sub: "실구매 4,070 + 유지 2,211", color: C.slate },
    ],
    max: 7000,
    footnote: "차값 4,800만원급 전기차 vs 3,800만원급 휘발유차 · 잔존가치 제외 · 단위 만원",
  }),
  // 14. 중고·법인·리스
  "buyer-types": cards({
    heading: "구매 유형별 보조금 적용",
    items: [
      { label: "신차 개인", value: "국비+지방비", sub: "가산·전환지원금 포함", color: C.g1 },
      { label: "중고차 개인", value: "보조금 없음", sub: "취득세·자동차세 혜택만", color: C.slate },
      { label: "법인·사업자", value: "법인 물량", sub: "사업장 소재지, 대수 상한", color: C.blue },
      { label: "리스·렌트", value: "리스사 수령", sub: "월 납입금에 반영", color: C.amber },
    ],
  }),
  // 10. 지역 비교
  "region-compare": hbarChart({
    heading: "같은 차(아이오닉 6 롱레인지, 국비 570)도 지역마다 다릅니다",
    items: [
      { label: "경북 울릉군", value: 1313, color: C.g1 },
      { label: "전남 완도군", value: 1160, color: C.g1 },
      { label: "충남 천안시", value: 977, color: C.g2 },
      { label: "경기 성남시", value: 856, color: C.g2 },
      { label: "경기 파주시", value: 767, color: C.g3 },
      { label: "서울 강남구", value: 761, color: C.g3 },
    ],
    footnote: "국비 570 + 지방비(최대액 × 98.3%) · 전환지원금 미적용 · 단위 만원",
  }),
  "sido-range": hbarChart({
    heading: "2026 시·도별 일반승용 지방비 최대액",
    items: [
      { label: "경북 (울릉군)", value: 756, color: C.g1 },
      { label: "전남 (보성·완도)", value: 600, color: C.g1 },
      { label: "경남 (합천)", value: 488, color: C.g2 },
      { label: "전북", value: 434, color: C.g2 },
      { label: "충남", value: 414, color: C.g2 },
      { label: "충북", value: 400, color: C.g2 },
      { label: "경기 (연천)", value: 380, color: C.g3 },
      { label: "제주", value: 276, color: C.g3 },
      { label: "부산", value: 224, color: C.g3 },
      { label: "울산", value: 221, color: C.g3 },
      { label: "강원", value: 200, color: C.g3 },
      { label: "서울·대구·인천·광주·대전·세종", value: 194, color: C.g3 },
    ],
    footnote: "시·도 내 가장 높은 시·군·구 기준 · 2026-09 무공해차 통합누리집 수집값",
  }),
  // 11. 테슬라
  "tesla-factors": flow({
    heading: "테슬라 국비가 낮아지는 세 가지 요인",
    perRow: 3,
    steps: [
      { label: "가격계수 0.5", sub: ["모델 Y 프리미엄 LR", "기본가 5,300만원 초과"], color: C.amber },
      { label: "LFP 배터리 계수", sub: ["효율·환경성 이중 감점", "스탠다드 트림"], color: C.sky },
      { label: "사후관리계수", sub: ["직영 정비망 부족", "전 트림 공통"], color: C.slate },
    ],
    footnote: "세 요인이 곱으로 작용하고, 지방비도 국비 비율에 비례해 함께 줄어듦",
  }),
  "tesla-compare": barChart({
    heading: "지역별 합산 보조금: 아이오닉 6 LR vs 모델 Y 프리미엄 LR",
    items: [
      { label: "서울", value: 761, sub: "아이오닉 6", color: C.g1 },
      { label: "서울", value: 280, sub: "모델 Y", color: C.sky },
      { label: "경기 파주", value: 767, sub: "아이오닉 6", color: C.g1 },
      { label: "경기 파주", value: 282, sub: "모델 Y", color: C.sky },
      { label: "경북 울릉", value: 1313, sub: "아이오닉 6", color: C.g1 },
      { label: "경북 울릉", value: 484, sub: "모델 Y", color: C.sky },
    ],
    max: 1500,
    footnote: "국비 570 vs 210 · 지방비 비례 계산 · 단위 만원",
  }),
  // 12. TOP10
  "top-ranking": hbarChart({
    heading: "2026 승용 전기차 국비 순위",
    items: [
      { label: "현대 아이오닉 6 롱레인지", value: 570 },
      { label: "기아 EV6 롱레인지 2WD", value: 570 },
      { label: "현대 아이오닉 5 롱레인지", value: 567 },
      { label: "기아 EV3 롱레인지", value: 555 },
      { label: "현대 코나 일렉트릭 LR", value: 514 },
      { label: "테슬라 모델 3 프리미엄 LR", value: 420, color: C.sky },
      { label: "테슬라 모델 Y 프리미엄 LR", value: 210, color: C.sky },
      { label: "테슬라 모델 3 스탠다드", value: 168, color: C.sky },
    ],
    footnote: "환경부 확정 국비 · 전환지원금 +100만원 별도 · 단위 만원",
  }),
};

let n = 0;
for (const [name, body] of Object.entries(FIGURES)) {
  writeFileSync(resolve(OUT, `${name}.svg`), body, "utf8");
  n++;
}
console.log(`wrote ${n} figures to ${OUT}`);
