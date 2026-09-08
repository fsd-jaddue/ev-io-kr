/**
 * 홈 히어로용 간략화 대한민국 지도(SVG, PC·모바일 공용).
 *
 * - 외부 지오데이터·라이브러리 없이 직접 잡은 좌표다. 행정경계 정밀도보다 "한눈에 어느 지역인지"를 우선한다.
 * - 구조: 경계 교차점(NODES) 사이의 경계선(ARCS, 중간점 포함)을 한 번만 정의하고, 시·도는 경계선 id 배열(뒤집기 가능)로 만든다.
 *   인접한 두 시·도가 같은 곡선을 공유하므로 틈·겹침 없이 맞물린다(TopoJSON 의 arc 개념).
 * - 각 경계선은 Catmull-Rom → 3차 베지어로 부드럽게 그린다(양 끝점 고정, 뒤집어도 같은 곡선).
 * - 좌표계: viewBox 0 0 400 465. 대략 x = 40 + (경도 − 126) × 94, y = 18 + (38.6 − 위도) × 88. 제주는 좌하단 인셋.
 * - 광역시(서울·인천·세종·대전·광주·대구·울산·부산)는 둥근 육각형으로 도 위에 덧그린다.
 */

export interface MapRegion {
  slug: string;
  d: string;
  /** 라벨 기준점 (viewBox 좌표) */
  label: [number, number];
  /** 광역시 등 작은 면: 약칭만 표시 */
  small?: boolean;
  /** 광역시가 얹혀 있는 도(선택 시 함께 떠오름). 경계에 걸친 세종·대전은 둘 다 */
  parents?: string[];
}

type Pt = readonly [number, number];

/* ───────────── 곡선 유틸 (Catmull-Rom → cubic Bézier) ───────────── */

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

/** 열린 점열을 베지어 세그먼트 문자열로 (M 없이 "C … " 만). 양 끝점 고정. */
function bezierOpen(pts: Pt[], t: number): string {
  if (pts.length < 2) return "";
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  let out = "";
  for (let i = 1; i < P.length - 2; i++) {
    const [x0, y0] = P[i - 1];
    const [x1, y1] = P[i];
    const [x2, y2] = P[i + 1];
    const [x3, y3] = P[i + 2];
    const c1x = x1 + ((x2 - x0) * t) / 6;
    const c1y = y1 + ((y2 - y0) * t) / 6;
    const c2x = x2 - ((x3 - x1) * t) / 6;
    const c2y = y2 - ((y3 - y1) * t) / 6;
    out += `C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(x2)} ${fmt(y2)} `;
  }
  return out;
}

/** 닫힌 점열(섬·광역시)을 매끈한 고리로 */
function bezierClosed(pts: Pt[], t: number): string {
  const n = pts.length;
  let out = `M${fmt(pts[0][0])} ${fmt(pts[0][1])} `;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[(i - 1 + n) % n];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    const [x3, y3] = pts[(i + 2) % n];
    const c1x = x1 + ((x2 - x0) * t) / 6;
    const c1y = y1 + ((y2 - y0) * t) / 6;
    const c2x = x2 - ((x3 - x1) * t) / 6;
    const c2y = y2 - ((y3 - y1) * t) / 6;
    out += `C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(x2)} ${fmt(y2)} `;
  }
  return out + "Z";
}

/* ───────────── 교차점(NODES) ───────────── */

const N = {
  nw: [82, 90], // 강화 북단(휴전선 서쪽 끝)
  ne: [266, 20], // 고성 통일전망대(휴전선 동쪽 끝)
  j1: [148, 44], // 경기·강원·휴전선
  j2: [214, 137], // 경기·강원·충북 (여주·원주·충주)
  j3: [275, 154], // 강원·충북·경북 (영월·단양·영주)
  j4: [358, 140], // 강원·경북 해안 (삼척·울진)
  j5: [214, 245], // 충북·전북·경북 (영동·무주·김천)
  j6: [366, 276], // 경북·경남 해안 (경주·울산)
  j7: [214, 257], // 전북·경북·경남 (무주·거창)
  j8: [190, 308], // 전북·전남·경남 (남원·구례·하동)
  j9: [211, 346], // 전남·경남 해안 (광양·하동)
  j10: [167, 159], // 경기·충북·충남 (안성·음성·천안)
  j11: [200, 244], // 충북·충남·전북 (영동·금산·무주)
  j12: [120, 161], // 경기·충남 해안 (아산만)
  j13: [96, 245], // 충남·전북 해안 (서천·군산)
  j14: [82, 298], // 전북·전남 해안 (고창·영광)
} as const satisfies Record<string, Pt>;

type NId = keyof typeof N;

/* ───────────── 경계선(ARCS) ───────────── */

interface Arc {
  from: NId;
  to: NId;
  via: Pt[];
  /** 곡률 (0 = 직선, 1 = 표준 Catmull-Rom) */
  t?: number;
}

const A = {
  // 휴전선
  dmzGG: {
    from: "j1",
    to: "nw",
    via: [
      [139, 49],
      [120, 73],
      [96, 93],
    ],
  },
  dmzGW: {
    from: "ne",
    to: "j1",
    via: [
      [247, 31],
      [228, 40],
      [200, 44],
      [162, 43],
    ],
  },
  // 경기 서해안 (강화 → 인천 → 아산만)
  coastGG: {
    from: "nw",
    to: "j12",
    via: [
      [73, 97],
      [86, 104],
      [96, 108],
      [98, 124],
      [110, 132],
      [104, 146],
      [112, 156],
    ],
  },
  // 경기·강원
  bGG_GW: {
    from: "j1",
    to: "j2",
    via: [
      [167, 62],
      [186, 84],
      [190, 102],
      [204, 115],
      [209, 124],
    ],
  },
  // 강원 동해안
  coastGW: {
    from: "ne",
    to: "j4",
    via: [
      [284, 53],
      [289, 62],
      [317, 88],
      [331, 115],
      [355, 124],
    ],
  },
  // 강원·충북 / 강원·경북
  bGW_CB: {
    from: "j2",
    to: "j3",
    via: [
      [223, 146],
      [247, 146],
    ],
  },
  bGW_GB: {
    from: "j3",
    to: "j4",
    via: [
      [313, 154],
      [340, 150],
    ],
  },
  // 경기 남쪽
  bGG_CB: {
    from: "j2",
    to: "j10",
    via: [
      [200, 146],
      [181, 154],
    ],
  },
  bGG_CN: {
    from: "j10",
    to: "j12",
    via: [
      [148, 161],
      [129, 163],
    ],
  },
  // 충북 서쪽(충남) / 동쪽(경북) / 남단
  bCB_CN: {
    from: "j10",
    to: "j11",
    via: [
      [172, 172],
      [167, 190],
      [176, 207],
      [181, 220],
      [190, 238],
    ],
  },
  bCB_GB: {
    from: "j3",
    to: "j5",
    via: [
      [275, 168],
      [247, 181],
      [228, 203],
      [228, 229],
    ],
  },
  bCB_JB: { from: "j5", to: "j11", via: [[208, 250]] },
  // 충남 서해안 (아산만 → 태안 → 서천)
  coastCN: {
    from: "j12",
    to: "j13",
    via: [
      [101, 161],
      [78, 157],
      [68, 168],
      [62, 188],
      [68, 207],
      [87, 216],
      [90, 230],
    ],
  },
  bCN_JB: {
    from: "j11",
    to: "j13",
    via: [
      [186, 249],
      [143, 242],
      [129, 242],
    ],
  },
  // 전북·경북 (무주·김천) / 경북·경남
  bJB_GB: { from: "j5", to: "j7", via: [[220, 251]] },
  bGB_GN: {
    from: "j7",
    to: "j6",
    via: [
      [228, 260],
      [247, 269],
      [266, 278],
      [294, 286],
      [341, 278],
    ],
  },
  // 경북 동해안 (울진 → 포항 → 감포)
  coastGB: {
    from: "j4",
    to: "j6",
    via: [
      [364, 160],
      [360, 203],
      [360, 238],
      [376, 241],
      [369, 264],
    ],
  },
  // 전북·경남 / 전남·경남
  bJB_GN: {
    from: "j7",
    to: "j8",
    via: [
      [200, 282],
      [195, 295],
    ],
  },
  bJN_GN: {
    from: "j8",
    to: "j9",
    via: [
      [200, 317],
      [207, 335],
    ],
  },
  // 경남 남해안 (울산 → 부산 → 거제 → 통영 → 남해)
  coastGN: {
    from: "j6",
    to: "j9",
    via: [
      [360, 291],
      [341, 308],
      [336, 322],
      [317, 330],
      [294, 326],
      [294, 344],
      [284, 357],
      [266, 352],
      [256, 339],
      [233, 344],
      [219, 359],
    ],
  },
  // 전북·전남
  bJB_JN: {
    from: "j8",
    to: "j14",
    via: [
      [167, 304],
      [143, 300],
      [125, 295],
    ],
  },
  // 전북 서해안
  coastJB: {
    from: "j13",
    to: "j14",
    via: [
      [92, 249],
      [87, 278],
      [82, 291],
    ],
  },
  // 전남 서·남해안 (영광 → 목포 → 해남 → 고흥 → 여수 → 광양)
  coastJN: {
    from: "j14",
    to: "j9",
    via: [
      [73, 308],
      [68, 326],
      [73, 352],
      [68, 370],
      [89, 396],
      [110, 383],
      [125, 388],
      [143, 379],
      [162, 388],
      [181, 352],
      [204, 370],
      [204, 346],
    ],
  },
} as const satisfies Record<string, Arc>;

type AId = keyof typeof A;

const T_COAST = 0.9;
const T_BORDER = 0.7;

/** 경계선 점열 (필요하면 뒤집기) */
function arcPoints(id: AId, reverse: boolean): Pt[] {
  const a = A[id] as Arc;
  const pts: Pt[] = [N[a.from], ...a.via, N[a.to]];
  return reverse ? [...pts].reverse() : pts;
}

/** 시·도 고리: 경계선 id 배열 ("-" 접두 = 뒤집기) */
function ring(ids: string[]): string {
  let d = "";
  ids.forEach((raw, i) => {
    const reverse = raw.startsWith("-");
    const id = (reverse ? raw.slice(1) : raw) as AId;
    const pts = arcPoints(id, reverse);
    const t = id.startsWith("coast") ? T_COAST : T_BORDER;
    if (i === 0) d += `M${fmt(pts[0][0])} ${fmt(pts[0][1])} `;
    d += bezierOpen(pts, t);
  });
  return d + "Z";
}

/** 둥근 육각형 (광역시) */
function blob(cx: number, cy: number, w: number, h: number): string {
  const hw = w / 2;
  const hh = h / 2;
  const k = Math.min(6, hw / 3);
  return bezierClosed(
    [
      [cx - hw + k, cy - hh],
      [cx + hw - k, cy - hh],
      [cx + hw, cy],
      [cx + hw - k, cy + hh],
      [cx - hw + k, cy + hh],
      [cx - hw, cy],
    ],
    0.9,
  );
}

const PROVINCES: MapRegion[] = [
  {
    slug: "gyeonggi",
    d: ring(["dmzGG", "coastGG", "-bGG_CN", "-bGG_CB", "-bGG_GW"]),
    label: [181, 128],
  },
  {
    slug: "gangwon",
    d: ring(["dmzGW", "bGG_GW", "bGW_CB", "bGW_GB", "-coastGW"]),
    label: [262, 92],
  },
  {
    slug: "chungbuk",
    d: ring(["bGG_CB", "bCB_CN", "-bCB_JB", "-bCB_GB", "-bGW_CB"]),
    label: [212, 184],
  },
  {
    slug: "chungnam",
    d: ring(["bGG_CN", "coastCN", "-bCN_JB", "-bCB_CN"]),
    label: [104, 206],
  },
  {
    slug: "jeonbuk",
    d: ring(["bCN_JB", "coastJB", "-bJB_JN", "-bJB_GN", "-bJB_GB", "bCB_JB"]),
    label: [146, 274],
  },
  {
    slug: "jeonnam",
    d:
      ring(["bJB_JN", "coastJN", "-bJN_GN"]) +
      // 진도·완도 (장식)
      bezierClosed(
        [
          [60, 382],
          [72, 378],
          [78, 386],
          [70, 394],
          [58, 390],
        ],
        0.9,
      ) +
      bezierClosed(
        [
          [104, 402],
          [118, 400],
          [122, 407],
          [110, 411],
          [100, 408],
        ],
        0.9,
      ),
    label: [140, 356],
  },
  {
    slug: "gyeongbuk",
    d:
      ring(["bGW_GB", "coastGB", "-bGB_GN", "-bJB_GB", "-bCB_GB"]) +
      // 울릉도
      bezierClosed(
        [
          [384, 148],
          [392, 147],
          [396, 152],
          [392, 158],
          [384, 158],
          [381, 152],
        ],
        0.9,
      ),
    label: [312, 212],
  },
  {
    slug: "gyeongnam",
    d: ring(["bGB_GN", "coastGN", "-bJN_GN", "-bJB_GN"]),
    label: [262, 318],
  },
  {
    slug: "jeju",
    d: bezierClosed(
      [
        [62, 432],
        [80, 418],
        [110, 414],
        [132, 424],
        [136, 438],
        [118, 452],
        [88, 454],
        [66, 446],
      ],
      0.9,
    ),
    label: [99, 437],
  },
];

const METRO: MapRegion[] = [
  {
    slug: "seoul",
    d: blob(132, 110, 42, 24),
    label: [132, 110],
    small: true,
    parents: ["gyeonggi"],
  },
  {
    slug: "incheon",
    d: blob(94, 115, 32, 24),
    label: [94, 115],
    small: true,
    parents: ["gyeonggi"],
  },
  {
    slug: "sejong",
    d: blob(161, 195, 30, 24),
    label: [161, 195],
    small: true,
    parents: ["chungnam", "chungbuk"],
  },
  {
    slug: "daejeon",
    d: blob(171, 221, 34, 24),
    label: [171, 221],
    small: true,
    parents: ["chungnam", "chungbuk"],
  },
  {
    slug: "gwangju",
    d: blob(117, 323, 38, 22),
    label: [117, 323],
    small: true,
    parents: ["jeonnam"],
  },
  {
    slug: "daegu",
    d: blob(279, 262, 40, 26),
    label: [279, 262],
    small: true,
    parents: ["gyeongbuk"],
  },
  {
    slug: "ulsan",
    d: blob(340, 288, 40, 27),
    label: [340, 288],
    small: true,
    parents: ["gyeongnam"],
  },
  {
    slug: "busan",
    d: blob(322, 319, 42, 26),
    label: [322, 319],
    small: true,
    parents: ["gyeongnam"],
  },
];

export const KOREA_MAP = {
  viewBox: "0 0 400 465",
  width: 400,
  height: 465,
  /** 도 → 광역시 순서(광역시가 위에 그려진다) */
  regions: [...PROVINCES, ...METRO] as MapRegion[],
  /** 제주 인셋 안내 상자 */
  jejuInset: { x: 48, y: 406, width: 104, height: 56 },
} as const;
