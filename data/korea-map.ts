/**
 * 홈 히어로용 간략화(로우폴리) 대한민국 지도 · 모바일 타일 배치.
 *
 * - 외부 지오데이터·라이브러리 없이 직접 그린 좌표다. 행정경계 정밀도보다 "한눈에 어느 지역인지" 인지성을 우선한다.
 * - 꼭짓점을 한 번만 정의하고(V) 각 시·도 폴리곤을 꼭짓점 id 배열로 만들어 인접 면의 경계가 정확히 맞물리게 한다.
 * - 좌표계: viewBox 0 0 400 465. 대략 x = 40 + (경도 − 126) × 94, y = 18 + (38.6 − 위도) × 88. 제주는 좌하단 인셋.
 * - 광역시(서울·인천·세종·대전·광주·대구·울산·부산)는 작은 육각 박스로 도 위에 덧그린다(구멍 없이 렌더 순서로 처리).
 */

export interface MapRegion {
  slug: string;
  d: string;
  /** 라벨 기준점 (viewBox 좌표) */
  label: [number, number];
  /** 광역시 등 작은 면: 약칭만 표시 */
  small?: boolean;
}

export interface TileCell {
  slug: string;
  row: number;
  col: number;
}

type Pt = readonly [number, number];

const V = {
  // ── 북쪽 경계(휴전선) 서→동
  ganghwaN: [88, 84],
  gimpoN: [104, 78],
  pajuN: [118, 66],
  yeoncheonN: [140, 46],
  yeoncheonE: [162, 50], // 경기·강원·북측 삼각점
  cheorwonN: [178, 44],
  hwacheonN: [212, 36],
  yangguN: [238, 26],
  goseongN: [266, 18],
  // ── 동해안 북→남
  sokcho: [284, 52],
  yangyang: [298, 74],
  gangneung: [314, 93],
  donghae: [330, 112],
  samcheok: [341, 126],
  samcheokS: [352, 152], // 강원·경북 해안 경계
  uljin: [360, 162],
  yeongdeok: [361, 210],
  pohang: [366, 232],
  homigot: [378, 242],
  gampo: [369, 268],
  gyeongjuCoast: [362, 276], // 경북·경남(울산) 해안 경계
  ulsanCoastS: [356, 300],
  busanE: [346, 318],
  busanS: [322, 334],
  gadeok: [305, 336],
  // ── 남해안 동→서
  geojeS: [286, 360],
  tongyeong: [262, 350],
  sacheon: [238, 346],
  namhae: [218, 360],
  yeosu: [200, 374],
  goheung: [166, 386],
  jangheung: [128, 388],
  haenam: [88, 398],
  // ── 서해안 남→북
  mokpo: [72, 356],
  muan: [66, 330],
  yeonggwang: [76, 306],
  gochangS: [84, 292], // 전북·전남 해안 경계
  byeonsan: [84, 276],
  gunsan: [92, 252],
  gunsanN: [94, 242], // 충남·전북 해안 경계
  boryeong: [84, 218],
  taean: [58, 186],
  seosan: [90, 168],
  asanBay: [122, 160], // 경기·충남 해안 경계
  hwaseong: [104, 142],
  incheonS: [100, 126],
  incheonN: [98, 104],
  // ── 경기·강원 경계 북→남
  pocheon: [176, 66],
  gapyeong: [190, 80],
  hongcheon: [204, 112],
  triYeoju: [214, 138], // 경기·강원·충북
  // ── 경기 남쪽 경계 동→서
  eumseong: [174, 154], // 경기·충북·충남
  cheonanN: [153, 163],
  pyeongtaek: [134, 163],
  // ── 강원·충북 경계
  chungju: [232, 142],
  triGwCbGb: [276, 156], // 강원·충북·경북
  taebaek: [320, 150],
  // ── 충북·경북 경계 북→남
  danyangS: [274, 170],
  mungyeong: [242, 182],
  sangju: [228, 204],
  gimcheon: [228, 234],
  muju: [212, 246], // 충북·전북·경북
  // ── 충북·충남 경계 북→남
  jincheon: [167, 172],
  cheongjuW: [172, 190],
  daejeonNE: [180, 206],
  okcheon: [182, 222],
  yeongdongW: [192, 240], // 충북·충남·전북
  // ── 충남·전북 경계
  geumsanS: [180, 250],
  nonsan: [142, 244],
  // ── 전북·경북·경남 경계
  geochang: [216, 256], // 전북·경북·경남
  jangsu: [204, 282],
  namwon: [192, 306],
  gurye: [186, 312], // 전북·전남·경남
  // ── 전북·전남 경계 동→서
  sunchang: [146, 308],
  jeongeup: [116, 300],
  // ── 전남·경남 경계 북→남
  hadong: [200, 320],
  gwangyang: [206, 342],
  // ── 경북·경남 경계 서→동
  goryeong: [248, 276],
  cheongdo: [292, 286],
  gyeongjuS: [338, 282],
} as const satisfies Record<string, Pt>;

type VId = keyof typeof V;

const ring = (ids: VId[]): string => "M" + ids.map((id) => V[id].join(" ")).join(" L") + " Z";
const poly = (pts: Pt[]): string => "M" + pts.map((p) => p.join(" ")).join(" L") + " Z";

/** 광역시 육각 박스: 중심·너비·높이 */
const hex = (cx: number, cy: number, w: number, h: number): string => {
  const hw = w / 2;
  const hh = h / 2;
  const k = Math.min(6, hw / 3);
  return poly([
    [cx - hw + k, cy - hh],
    [cx + hw - k, cy - hh],
    [cx + hw, cy],
    [cx + hw - k, cy + hh],
    [cx - hw + k, cy + hh],
    [cx - hw, cy],
  ]);
};

const PROVINCES: MapRegion[] = [
  {
    slug: "gyeonggi",
    d: ring([
      "ganghwaN", "gimpoN", "pajuN", "yeoncheonN", "yeoncheonE", "pocheon", "gapyeong", "hongcheon", "triYeoju",
      "eumseong", "cheonanN", "pyeongtaek", "asanBay", "hwaseong", "incheonS", "incheonN",
    ]),
    label: [181, 128],
  },
  {
    slug: "gangwon",
    d: ring([
      "yeoncheonE", "cheorwonN", "hwacheonN", "yangguN", "goseongN", "sokcho", "yangyang", "gangneung", "donghae",
      "samcheok", "samcheokS", "taebaek", "triGwCbGb", "chungju", "triYeoju", "hongcheon", "gapyeong", "pocheon",
    ]),
    label: [262, 92],
  },
  {
    slug: "chungbuk",
    d: ring([
      "triYeoju", "chungju", "triGwCbGb", "danyangS", "mungyeong", "sangju", "gimcheon", "muju", "yeongdongW",
      "okcheon", "daejeonNE", "cheongjuW", "jincheon", "eumseong",
    ]),
    label: [212, 184],
  },
  {
    slug: "chungnam",
    d: ring([
      "eumseong", "jincheon", "cheongjuW", "daejeonNE", "okcheon", "yeongdongW", "geumsanS", "nonsan", "gunsanN",
      "boryeong", "taean", "seosan", "asanBay", "pyeongtaek", "cheonanN",
    ]),
    label: [104, 206],
  },
  {
    slug: "jeonbuk",
    d: ring([
      "gunsanN", "nonsan", "geumsanS", "yeongdongW", "muju", "geochang", "jangsu", "namwon", "gurye", "sunchang",
      "jeongeup", "gochangS", "byeonsan", "gunsan",
    ]),
    label: [146, 274],
  },
  {
    slug: "jeonnam",
    d:
      ring([
        "gochangS", "jeongeup", "sunchang", "gurye", "hadong", "gwangyang", "yeosu", "goheung", "jangheung", "haenam",
        "mokpo", "muan", "yeonggwang",
      ]) +
      // 진도 (장식)
      " M62 382 L74 378 L78 388 L66 394 Z",
    label: [140, 356],
  },
  {
    slug: "gyeongbuk",
    d:
      ring([
        "triGwCbGb", "taebaek", "samcheokS", "uljin", "yeongdeok", "pohang", "homigot", "gampo", "gyeongjuCoast",
        "gyeongjuS", "cheongdo", "goryeong", "geochang", "muju", "gimcheon", "sangju", "mungyeong", "danyangS",
      ]) +
      // 울릉도
      " M384 147 L392 147 L395 152 L392 157 L384 157 L381 152 Z",
    label: [312, 212],
  },
  {
    slug: "gyeongnam",
    d: ring([
      "geochang", "goryeong", "cheongdo", "gyeongjuS", "gyeongjuCoast", "ulsanCoastS", "busanE", "busanS", "gadeok",
      "geojeS", "tongyeong", "sacheon", "namhae", "gwangyang", "hadong", "gurye", "namwon", "jangsu",
    ]),
    label: [262, 318],
  },
  {
    slug: "jeju",
    d: poly([
      [62, 432], [80, 418], [110, 414], [132, 424], [136, 438], [118, 452], [88, 454], [66, 446],
    ]),
    label: [99, 437],
  },
];

const METRO: MapRegion[] = [
  { slug: "seoul", d: hex(132, 110, 42, 24), label: [132, 110], small: true },
  { slug: "incheon", d: hex(94, 115, 32, 24), label: [94, 115], small: true },
  { slug: "sejong", d: hex(161, 195, 30, 24), label: [161, 195], small: true },
  { slug: "daejeon", d: hex(171, 221, 34, 24), label: [171, 221], small: true },
  { slug: "gwangju", d: hex(117, 323, 38, 22), label: [117, 323], small: true },
  { slug: "daegu", d: hex(279, 262, 40, 26), label: [279, 262], small: true },
  { slug: "ulsan", d: hex(340, 288, 40, 27), label: [340, 288], small: true },
  { slug: "busan", d: hex(322, 319, 42, 26), label: [322, 319], small: true },
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

/** 모바일 타일 카토그램(4열 × 5행). 대략의 지리 관계만 맞춘다. */
export const TILE_LAYOUT = {
  cols: 4,
  rows: 5,
  cells: [
    { slug: "incheon", row: 1, col: 1 },
    { slug: "seoul", row: 1, col: 2 },
    { slug: "gyeonggi", row: 1, col: 3 },
    { slug: "gangwon", row: 1, col: 4 },
    { slug: "chungnam", row: 2, col: 1 },
    { slug: "sejong", row: 2, col: 2 },
    { slug: "chungbuk", row: 2, col: 3 },
    { slug: "gyeongbuk", row: 2, col: 4 },
    { slug: "jeonbuk", row: 3, col: 1 },
    { slug: "daejeon", row: 3, col: 2 },
    { slug: "daegu", row: 3, col: 3 },
    { slug: "ulsan", row: 3, col: 4 },
    { slug: "gwangju", row: 4, col: 1 },
    { slug: "jeonnam", row: 4, col: 2 },
    { slug: "gyeongnam", row: 4, col: 3 },
    { slug: "busan", row: 4, col: 4 },
    { slug: "jeju", row: 5, col: 1 },
  ] as TileCell[],
} as const;
