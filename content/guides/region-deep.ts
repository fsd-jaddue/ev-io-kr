/**
 * 도 지역 8곳의 시·군별 지방비 비교 분석 가이드.
 * 수치(금액·순위·평균·공고·잔여)는 빌드 시 저장소 스냅샷(local-price.json·remain.json)에서 계산하고,
 * 분포가 왜 그런지에 대한 해설·신청 팁은 수기로 쓴다. 금액 분포가 크게 바뀌면 해설(COMMENTARY)도 사람이 갱신한다.
 */
import type { Guide } from "./index";
import type { RemainRow } from "@/lib/ev/types";
import { getLocalPriceSnapshot } from "@/lib/ev/localPrice";
import { sidoMaxRanking, sidoPriceStats } from "@/lib/ev/localPriceStats";
import { matchRemainRows } from "@/lib/ev/remainSummary";
import { estimateTotal } from "@/lib/ev/summary";
import { formatFetchedAt } from "@/lib/ev/format";
import { CARS, NATIONAL_MAX, carName } from "@/data/cars";
import { SIDO_LIST, getSidoByShort, sigunguPath } from "@/data/regions";
import remainSnapshot from "@/data/snapshot/remain.json";

const n = (v: number | null | undefined) => (v === null || v === undefined ? "-" : v.toLocaleString("ko-KR"));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface Commentary {
  slug: string;
  published: string;
  updated: string;
  /** 제목에 쓸 짧은 특징 */
  hook: string;
  /** 분포 해설 문단 (HTML 허용) */
  why: string[];
  /** 신청 팁 (li) */
  tips: string[];
  /** 추가 FAQ */
  faq?: { q: string; a: string }[];
}

const COMMENTARY: Record<string, Commentary> = {
  gyeonggi: {
    slug: "gyeonggi-ev-subsidy-by-city-2026",
    published: "2026-09-12",
    updated: "2026-09-12",
    hook: "연천 380만원부터 부천·하남 120만원까지, 같은 도 안에서 3배 차이",
    why: [
      "경기도는 17개 시·도 가운데 시·군별 지방비 편차가 가장 큰 곳입니다. 인구가 많은 시(부천·남양주·하남·광주)가 최저 120만원인 반면, 접경·농촌 지역인 연천군은 380만원, 양평군·여주시도 260만원대로 높습니다. 지방비는 시·군이 자체 예산으로 정하는데, 인구가 많은 도시는 같은 예산으로 더 많은 대수를 지원해야 하므로 1대당 금액을 낮게 잡고, 인구가 적은 군은 대수 대신 금액을 올려 보급률을 끌어올리는 전략을 씁니다.",
      "수도권 남부의 수원(270만원)·광명(280만원)처럼 대도시인데도 금액이 높은 곳은 시 자체 친환경차 보급 목표가 높거나 도비 매칭 외에 시비를 더 얹은 경우입니다. 반대로 화성·용인처럼 신도시가 많은 곳은 물량을 크게 잡는 대신 금액을 낮췄습니다. 그래서 경기도에서는 '어느 시·군에 주소를 두고 있는가'가 국비 차이보다 합산액에 더 큰 영향을 주기도 합니다.",
      "경기도 시·군은 각자 공고를 내기 때문에 접수 시작일·마감·추경 시기도 제각각입니다. 금액이 높은 군 지역은 물량이 수십~수백 대로 적어 본공고가 며칠 만에 마감되는 일이 많고, 금액이 낮은 대도시는 물량이 수천 대라 하반기까지 접수를 받는 경우가 많습니다.",
    ],
    tips: [
      "이사 예정이라면 전입 시점을 따져 보세요. 공고일 기준 30일 이상 주민등록 요건이 있어, 금액이 높은 시·군으로 옮겨도 바로 그 지역 공고로 신청할 수는 없습니다.",
      "연천·양평·여주처럼 금액이 높은 곳은 물량이 적어 조기 소진됩니다. 공고 직후 대리점을 통해 바로 접수하고, 소진됐다면 추경 공고 여부를 시·군 홈페이지 고시·공고에서 확인하세요.",
      "부천·남양주·하남·광주(120만원)에 사는 분은 지방비보다 국비가 높은 차종(아이오닉 6·EV6·EV3 등)을 고르는 것이 합산액을 키우는 확실한 방법입니다. 지방비 자체가 낮아 차종에 따른 지방비 감소폭도 작습니다.",
      "경기도는 시·군마다 다자녀·청년·취약계층 추가 인센티브 유무가 다릅니다. 표의 금액은 일반 승용 최대액이므로, 해당된다면 시·군 공고의 추가 지원 항목을 따로 확인하세요.",
    ],
    faq: [
      {
        q: "경기도에서 지방비가 가장 높은 곳과 낮은 곳의 실제 합산 차이는 얼마나 되나요?",
        a: "국비 100% 차종 기준으로 지방비 차이가 그대로 합산 차이가 됩니다. 국비가 낮은 차종은 양쪽 지방비가 같은 비율로 줄어 차이도 줄어듭니다. 아래 표의 '국비 합산 최대'와 차종별 예시 표에서 확인할 수 있습니다.",
      },
    ],
  },
  gangwon: {
    slug: "gangwon-ev-subsidy-by-city-2026",
    published: "2026-09-12",
    updated: "2026-09-12",
    hook: "18개 시·군 금액은 같은데 잔여 물량은 왜 다른가",
    why: [
      "강원특별자치도는 18개 시·군이 2026년 승용 지방비를 모두 같은 금액으로 공고했습니다. 도가 시·군에 배정하는 도비 매칭 기준을 통일하고 시·군이 그 기준을 그대로 따른 결과입니다. 그래서 강원도 안에서는 '어디에 사느냐'가 금액을 바꾸지 않고, 대신 <strong>어느 시·군 공고에 물량이 남아 있느냐</strong>가 실제로 받을 수 있는지를 가릅니다.",
      "금액이 같아도 공고는 시·군별로 따로 나기 때문에 공고 대수·접수 기간·마감 시점이 모두 다릅니다. 원주·춘천·강릉처럼 인구가 많은 시는 물량이 수백~수천 대이고, 인구가 적은 군은 100대 안팎에 그칩니다. 물량이 적은 군은 본공고가 일찍 마감되고 추경 물량도 작아서, 같은 금액이라도 실제 신청 난도가 지역마다 다릅니다.",
      "강원도는 겨울철 기온이 낮아 전기차 주행거리 감소가 큰 지역입니다. 보조금과 별개로 히트펌프 옵션·배터리 용량을 넉넉히 잡는 것이 만족도를 좌우한다는 점도 함께 고려할 만합니다.",
    ],
    tips: [
      "금액 비교는 의미가 없으니 잔여 대수와 마감 상태를 보세요. 이 사이트의 시·군 페이지는 누리집 접수·출고·잔여 수집값을 매시간 갱신합니다.",
      "거주 시·군의 물량이 소진됐다면 추경 공고를 기다리는 것 외에 방법이 없습니다. 다른 시·군 공고로는 신청할 수 없습니다(주소지 기준).",
      "국비가 높은 차종을 고르면 지방비도 최대치로 받습니다. 지방비가 200만원대인 강원에서는 국비 차이가 합산액을 좌우합니다.",
    ],
  },
  chungbuk: {
    slug: "chungbuk-ev-subsidy-by-city-2026",
    published: "2026-09-12",
    updated: "2026-09-12",
    hook: "11개 시·군 동일 금액, 도 단위로는 상위권 지방비",
    why: [
      "충청북도는 11개 시·군이 같은 승용 지방비를 공고합니다. 충북은 수년째 도비 매칭 비율을 높게 유지해 도 단위 지방비가 전국 상위권에 들고, 시·군이 별도 가감 없이 도 기준을 그대로 적용하는 구조입니다. 청주처럼 인구가 많은 시도 군 지역과 같은 금액을 받는 점이 경기도와 다릅니다.",
      "금액이 같으니 차이는 물량에서 납니다. 청주시는 도 전체 물량의 절반 안팎을 차지하고 접수 기간이 길지만, 군 지역은 물량이 100대 미만인 곳도 있어 본공고 직후 마감되곤 합니다. 잔여가 0인 시·군은 추경 공고가 나야 다시 신청할 수 있습니다.",
      "충북은 지방비가 400만원대라 국비 비율에 따른 지방비 감소가 절대액으로 큽니다. 국비가 절반인 차종(5,300만원 초과 차량·LFP 배터리 수입차 등)은 지방비도 200만원 안팎이 깎이므로 차종 선택이 경기 남부보다 더 중요합니다.",
    ],
    tips: [
      "청주시는 구(상당·서원·흥덕·청원) 구분 없이 청주시 공고 하나로 운영됩니다. 구별 페이지의 금액·잔여는 모두 청주시 기준입니다.",
      "군 지역 거주자는 본공고 접수 시작일을 시·군 홈페이지 고시·공고에서 미리 확인하고 대리점과 계약 서류를 준비해 두세요.",
      "지방비가 높아 국비 100% 차종과 50% 차종의 합산 차이가 400만원을 넘습니다. 차량 기본가격 5,300만원 기준선을 넘는 트림인지 계약 전에 확인하세요.",
    ],
  },
  chungnam: {
    slug: "chungnam-ev-subsidy-by-city-2026",
    published: "2026-09-12",
    updated: "2026-09-12",
    hook: "15개 시·군 동일 금액, 천안·아산 물량과 군 지역 물량의 차이",
    why: [
      "충청남도는 15개 시·군이 같은 승용 지방비를 공고합니다. 충남은 도비 매칭을 통일하고 시·군 가감을 두지 않아 천안·아산 같은 대도시와 청양·서천 같은 군이 같은 금액을 받습니다. 도 단위 금액은 전국 상위권입니다.",
      "차이는 물량과 접수 시기에서 납니다. 천안·아산·당진처럼 인구 유입이 많은 시는 물량이 크고 추경도 자주 편성되지만, 인구가 적은 군은 물량이 작아 본공고 직후 마감되는 일이 흔합니다. 같은 금액이라도 '지금 신청 가능한가'는 시·군마다 다르니 잔여 대수를 먼저 확인해야 합니다.",
      "충남은 세종·대전과 생활권이 겹쳐 주소지를 어디에 두느냐에 따라 지방비가 크게 달라지는 지역입니다. 세종·대전은 시 단일 공고로 지방비가 200만원 미만이라, 충남 시·군에 주소를 둔 경우 합산액이 200만원 이상 높습니다.",
    ],
    tips: [
      "세종·대전 직장인이 충남(공주·계룡·논산 등)에 주소를 두고 있다면 충남 공고가 적용돼 지방비가 훨씬 높습니다. 주소지 기준이므로 직장 위치는 무관합니다.",
      "군 지역은 물량이 적으니 공고 일정을 미리 확인하고 접수 첫날 신청하세요.",
      "국비가 높은 차종을 고르면 400만원대 지방비를 온전히 받습니다. 국비 50% 차종은 지방비도 절반이 되므로 차종별 예시 표를 참고하세요.",
    ],
  },
  jeonbuk: {
    slug: "jeonbuk-ev-subsidy-by-city-2026",
    published: "2026-09-12",
    updated: "2026-09-12",
    hook: "14개 시·군 동일 금액, 도 단위 지방비 전국 최상위권",
    why: [
      "전북특별자치도는 14개 시·군이 같은 승용 지방비를 공고하며, 그 금액이 도 단위로는 전국 최상위권입니다. 전북은 전기차 보급률을 끌어올리기 위해 도비 매칭을 높게 잡았고 시·군이 이를 그대로 따릅니다. 전주·군산·익산 같은 시와 진안·장수 같은 군이 같은 금액을 받습니다.",
      "물량은 전주시가 가장 크고 군 지역은 수십~100대 안팎입니다. 군 지역은 본공고 직후 마감되기 쉬워, 금액이 높은 만큼 경쟁도 빠릅니다. 잔여가 0이면 추경을 기다려야 하며, 다른 시·군 공고로 옮겨 신청할 수는 없습니다.",
      "지방비가 400만원을 넘기 때문에 국비 비율의 영향이 큽니다. 국비 100% 차종은 국비·지방비 합산 1,000만원에 가깝지만, 국비가 절반인 차종은 지방비도 절반이라 합산 500만원대로 떨어집니다.",
    ],
    tips: [
      "군 지역 거주자는 공고 첫날 접수가 사실상 필수입니다. 대리점과 미리 계약 조건을 맞춰 두세요.",
      "차종 선택이 합산액을 크게 바꿉니다. 국비가 높은 국산 전용 플랫폼 차종과 국비가 낮은 수입차·LFP 차종의 합산 차이가 600만원을 넘을 수 있습니다.",
      "전북은 다자녀·취약계층 추가 인센티브를 두는 시·군이 있으니 공고의 추가 지원 항목을 확인하세요.",
    ],
  },
  jeonnam: {
    slug: "jeonnam-ev-subsidy-by-city-2026",
    published: "2026-09-12",
    updated: "2026-09-12",
    hook: "보성·완도 600만원, 광양 200만원: 군은 높고 시는 낮은 이유",
    why: [
      "전라남도는 시·군별 편차가 경기도 다음으로 큰 지역입니다. 보성·완도군이 600만원으로 전국 최상위권이고 해남·진도·담양·장흥·강진도 500만원대인 반면, 목포·여수·순천·나주 등 시 지역은 280만원, 광양시는 200만원입니다. 군 지역은 인구가 적어 대수를 많이 잡을 필요가 없고, 고령 인구가 많아 보급률을 올리려면 금액을 크게 올려야 하기 때문에 1대당 지방비가 높습니다.",
      "도서 지역(완도·진도·신안 등)은 연료 운송비가 비싸 전기차 전환 효과가 크다는 이유로 도와 군이 지방비를 더 얹습니다. 반대로 여수·광양처럼 산업단지가 있어 세수가 넉넉한 시가 오히려 금액이 낮은 것은, 물량을 크게 잡아 대수로 보급률을 채우는 방식을 택했기 때문입니다.",
      "금액이 높은 군은 물량이 수십 대 수준이라 본공고 직후 마감되는 경우가 대부분입니다. 반면 시 지역은 물량이 커서 하반기까지 접수를 받기도 합니다. 전남에서는 '높은 금액'과 '신청 가능성'이 반비례하는 셈입니다.",
    ],
    tips: [
      "군 지역 거주자는 공고 일정을 군 홈페이지에서 미리 확인하고 접수 첫날 신청하세요. 물량이 적어 하루 이틀 만에 마감됩니다.",
      "국비가 높은 차종을 고르면 600만원대 지방비를 온전히 받아 합산 1,100만원을 넘길 수 있습니다. 국비 50% 차종은 지방비도 300만원으로 줄어듭니다.",
      "시 지역(목포·여수·순천·나주·광양)은 지방비가 낮은 대신 물량이 넉넉하니, 급하지 않다면 차종 출고 시기에 맞춰 신청해도 됩니다.",
    ],
    faq: [
      {
        q: "전남 군 지역으로 주소를 옮기면 바로 높은 지방비를 받을 수 있나요?",
        a: "공고일 기준 30일 이상 주민등록 요건이 있어 전입 직후에는 신청할 수 없는 경우가 많고, 군에 따라 거주 기간 요건이 더 길기도 합니다. 또 물량이 적어 전입 시점에 이미 마감됐을 수 있습니다. 보조금만 보고 주소를 옮기는 것은 권하지 않습니다.",
      },
    ],
  },
  gyeongbuk: {
    slug: "gyeongbuk-ev-subsidy-by-city-2026",
    published: "2026-09-12",
    updated: "2026-09-12",
    hook: "울릉군 756만원 전국 1위, 나머지 21개 시·군은 동일 금액",
    why: [
      "경상북도는 22개 시·군 중 21곳이 같은 승용 지방비를 공고하고, 울릉군만 전국 최고 금액을 줍니다. 울릉은 섬이라 연료 운송비가 높고 주행 거리가 짧아 전기차 전환 효과가 크며, 군 인구가 1만 명 안팎이라 물량을 늘리는 대신 금액을 크게 올리는 방식을 택했습니다. 다만 울릉군 물량은 수십 대 수준이고 차량 반입·정비 여건도 다르므로 실제 수혜자는 많지 않습니다.",
      "나머지 시·군은 도비 매칭 기준을 그대로 따라 포항·구미 같은 대도시와 영양·청송 같은 군이 같은 금액을 받습니다. 경북 도 단위 금액은 전국 상위권이라 국비 100% 차종은 합산 1,000만원에 가깝습니다.",
      "금액이 같은 21개 시·군에서는 물량이 차이를 만듭니다. 포항·구미·경산은 물량이 크고 추경이 잦지만, 군 지역은 본공고 물량이 작아 일찍 마감됩니다. 잔여 대수 확인이 금액 비교보다 중요합니다.",
    ],
    tips: [
      "울릉군 거주자는 물량이 매우 적으니 공고 일정을 군청에 직접 확인하세요. 육지 출고 차량의 해상 운송·등록 절차도 미리 알아봐야 합니다.",
      "울릉 외 지역은 금액이 같으니 거주 시·군의 잔여 대수와 마감 상태를 보고 신청 시기를 잡으세요.",
      "지방비가 400만원대라 국비 비율의 영향이 큽니다. 5,300만원 기준선을 넘는 트림이나 LFP 배터리 차종은 지방비가 200만원 이상 줄어듭니다.",
    ],
  },
  gyeongnam: {
    slug: "gyeongnam-ev-subsidy-by-city-2026",
    published: "2026-09-12",
    updated: "2026-09-12",
    hook: "합천 488만원, 창원·김해·양산 120만원: 인구와 반비례하는 지방비",
    why: [
      "경상남도는 시·군별 편차가 큰 지역입니다. 합천군이 488만원, 통영시 380만원, 창녕군 280만원, 거창군 247만원으로 높은 반면 창원·진주·김해·양산 등 인구가 많은 시와 대부분의 군은 120만원으로 전국 최저 수준입니다. 도비 매칭이 낮은 편이라 시·군이 자체 예산을 얼마나 얹느냐에 따라 금액이 갈리는 구조입니다.",
      "합천·창녕·거창처럼 금액이 높은 군은 인구 감소 대응과 농촌 전기차 보급을 위해 군비를 크게 얹었고, 통영은 도서 지역 운송 부담을 감안했습니다. 반면 창원·김해·양산은 물량을 크게 잡는 대신 금액을 낮췄고, 남해·하동·산청처럼 군인데도 120만원인 곳은 군 재정 여력이 작아 도 기준 이상을 얹지 못한 경우입니다.",
      "경남에서 지방비 120만원 지역에 산다면 서울(194만원)보다도 지방비가 낮습니다. 이런 지역에서는 국비가 높은 차종을 고르는 것과 전환지원금(100만원)·취득세 감면(최대 140만원)을 챙기는 것이 지방비보다 합산액에 더 큰 영향을 줍니다.",
    ],
    tips: [
      "합천·통영·창녕·거창 거주자는 물량이 적으니 공고 첫날 접수하세요.",
      "120만원 지역 거주자는 국비 차이가 합산액을 좌우합니다. 국비 상위 차종과 하위 차종의 차이가 지방비 전체보다 큽니다.",
      "창원시는 5개 구(의창·성산·마산합포·마산회원·진해) 구분 없이 창원시 공고 하나로 운영됩니다.",
    ],
  },
};

const EXAMPLE_CARS = ["ioniq6-long-range", "ev3-long-range", "ev9", "model3-standard"];

function remainFor(sidoShort: string, sigungu: string, sidoName: string): RemainRow | null {
  const rows = (remainSnapshot as { rows: RemainRow[] }).rows.filter((r) => getSidoByShort(r.sido)?.short === sidoShort);
  return matchRemainRows(rows, sigungu, sidoName)[0] ?? null;
}

function buildRegionGuide(sidoSlug: string): Guide | null {
  const sido = SIDO_LIST.find((s) => s.slug === sidoSlug);
  const cm = COMMENTARY[sidoSlug];
  if (!sido || !cm) return null;
  const local = getLocalPriceSnapshot();
  const stats = sidoPriceStats(local.rows, sidoSlug);
  const ranking = sidoMaxRanking(local.rows);
  const myRank = ranking.find((r) => r.slug === sidoSlug)?.rank ?? null;
  const fetchedAt = (remainSnapshot as { fetchedAt: string }).fetchedAt;
  const equal = stats.equal;
  const rows = stats.sorted
    .map((r) => ({ ...r, remain: remainFor(sido.short, r.sigungu, sido.name) }))
    // 금액이 모두 같은 도는 공고 대수 순으로 보여 준다(금액 순위가 의미 없음)
    .sort((a, b) => (equal ? (b.remain?.announced ?? -1) - (a.remain?.announced ?? -1) : 0));
  const withRemain = rows.filter((r) => r.remain);
  const totalAnnounced = withRemain.reduce((a, r) => a + (r.remain?.announced ?? 0), 0);
  const totalRemaining = withRemain.reduce((a, r) => a + (r.remain?.remaining ?? 0), 0);
  const soldOut = withRemain.filter((r) => r.remain && r.remain.remaining !== null && r.remain.remaining <= 0);
  const topAnnounced = [...withRemain].sort((a, b) => (b.remain?.announced ?? 0) - (a.remain?.announced ?? 0)).slice(0, 3);
  const topRemaining = [...withRemain].sort((a, b) => (b.remain?.remaining ?? 0) - (a.remain?.remaining ?? 0)).slice(0, 3);
  const cars = EXAMPLE_CARS.map((s) => CARS.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => !!c && c.national !== null);
  const max = stats.max ?? 0;
  const min = stats.min ?? 0;
  const maxName = stats.maxNames[0] ?? "";
  const minName = stats.minNames[0] ?? "";

  const summaryPara = equal
    ? `${sido.name} ${stats.count}개 시·군은 2026년 승용 전기차 지방비를 모두 <strong>${n(max)}만원</strong>으로 공고했습니다. 국비 최대 ${NATIONAL_MAX.large}만원을 더하면 ${n(max + NATIONAL_MAX.large)}만원, 전환지원금까지 더하면 ${n(max + NATIONAL_MAX.large + NATIONAL_MAX.conversion)}만원입니다. 17개 시·도 최대 지방비 순위는 ${myRank ?? "-"}위입니다. 금액은 같지만 공고는 시·군별로 따로 내므로 공고 대수·접수 기간·잔여 대수는 지역마다 다릅니다.`
    : `${sido.name} ${stats.count}개 시·군의 2026년 승용 전기차 지방비는 <strong>${n(min)}~${n(max)}만원</strong>으로, 가장 높은 ${stats.maxNames.join("·")}(${n(max)}만원)과 가장 낮은 ${stats.minNames.slice(0, 4).join("·")}${stats.minNames.length > 4 ? ` 등 ${stats.minNames.length}곳` : ""}(${n(min)}만원)의 차이가 ${n(max - min)}만원입니다. 도 평균은 ${n(stats.avg)}만원이고, 최대액 기준 17개 시·도 순위는 ${myRank ?? "-"}위입니다. 국비 최대 ${NATIONAL_MAX.large}만원을 더하면 ${maxName}에서는 ${n(max + NATIONAL_MAX.large)}만원, ${minName}에서는 ${n(min + NATIONAL_MAX.large)}만원까지 받을 수 있습니다.`;

  const remainPara =
    withRemain.length > 0
      ? `<p>${formatFetchedAt(fetchedAt)} 기준 누리집 수집값으로 ${sido.short} ${withRemain.length}개 시·군의 승용 공고 대수 합계는 ${n(totalAnnounced)}대, 잔여 합계는 ${n(totalRemaining)}대입니다.${soldOut.length ? ` 잔여가 0인(소진) 시·군은 ${soldOut.map((r) => r.sigungu).join("·")} ${soldOut.length}곳입니다.` : ""} 공고 물량이 가장 많은 곳은 ${topAnnounced.map((r) => `${r.sigungu} ${n(r.remain?.announced)}대`).join(", ")}이고, 지금 잔여가 가장 많은 곳은 ${topRemaining.map((r) => `${r.sigungu} ${n(r.remain?.remaining)}대`).join(", ")}입니다. 잔여 대수는 매시간 갱신되므로 최신값은 각 시·군 페이지에서 확인하세요.</p>`
      : "";

  const tableRows = rows
    .map((r, i) => {
      const rank = r.amount === null ? "-" : rows.filter((x) => (x.amount ?? -1) > (r.amount ?? -1)).length + 1;
      const total = r.amount === null ? "-" : `${n(r.amount + NATIONAL_MAX.large)}만원`;
      const rm = r.remain;
      const remainCell = rm ? (rm.remaining !== null && rm.remaining <= 0 ? "소진" : `${n(rm.remaining)}대`) : "-";
      return `<tr><td>${equal ? i + 1 : rank}</td><td><a href="${sigunguPath(sidoSlug, r.sigungu)}">${esc(r.sigungu)}</a></td><td>${r.amount === null ? "공고 확인" : `${n(r.amount)}만원`}</td><td>${total}</td><td>${rm ? `${n(rm.announced)}대` : "-"}</td><td>${remainCell}</td></tr>`;
    })
    .join("\n");

  const exampleTable =
    cars.length > 0
      ? `<table>
<thead><tr><th>차종</th><th>국비</th><th>${esc(maxName)} 합산</th>${equal ? "" : `<th>${esc(minName)} 합산</th>`}</tr></thead>
<tbody>
${cars
  .map((c) => {
    const hi = estimateTotal({ national: c.national!, localMax: max });
    const lo = estimateTotal({ national: c.national!, localMax: min });
    return `<tr><td><a href="/car/${c.slug}">${esc(carName(c))}</a></td><td>${n(c.national)}만원</td><td>${n(hi.total)}만원 (지방비 ${n(hi.local)}만원)</td>${equal ? "" : `<td>${n(lo.total)}만원 (지방비 ${n(lo.local)}만원)</td>`}</tr>`;
  })
  .join("\n")}
</tbody>
</table>`
      : "";

  const body = `
<p>${summaryPara}</p>
<p>이 글은 무공해차 통합누리집 '지자체별 차종·모델 보조금'에서 ${local.updatedAt} 수집한 일반승용 지방비 최대액과, 같은 누리집의 접수·출고·잔여 현황 수집값을 바탕으로 ${sido.short} 시·군을 한 표로 비교하고 분포의 배경과 신청 요령을 정리한 것입니다. 금액은 국비를 100% 받는 차종 기준 최대액이며, 실제 지방비는 차종별 국비 비율에 비례해 줄어듭니다.</p>

<h2>${esc(sido.short)} ${stats.count}개 시·군 승용 지방비${equal ? "·공고 물량 (공고 대수 순)" : " 순위"}</h2>
<table>
<thead><tr><th>${equal ? "번호" : "순위"}</th><th>시·군</th><th>승용 지방비</th><th>국비 합산 최대</th><th>공고 대수</th><th>잔여</th></tr></thead>
<tbody>
${tableRows}
</tbody>
</table>
<p>공고·잔여 대수는 ${formatFetchedAt(fetchedAt)} 누리집 수집값(승용, 본공고·추경 누적)입니다. 시·군 이름을 누르면 차종별 예상 지원액과 체크리스트가 있는 지역 페이지로 이동합니다.</p>
${remainPara}

<h2>왜 이런 분포가 됐나</h2>
${cm.why.map((p) => `<p>${p}</p>`).join("\n")}

<h2>차종에 따라 합산액이 어떻게 달라지나</h2>
<p>지방비는 국비 산정액이 상한(${NATIONAL_MAX.large}만원) 대비 몇 %인지에 비례해 지급됩니다. ${equal ? `${sido.short} 지방비 ${n(max)}만원을 기준으로` : `${sido.short}에서 지방비가 가장 높은 ${maxName}(${n(max)}만원)과 가장 낮은 ${minName}(${n(min)}만원)을 기준으로`} 국비가 다른 네 차종의 합산액(전환지원금 제외)을 계산하면 다음과 같습니다.</p>
${exampleTable}
<p>국비가 상한에 가까운 차종은 지방비를 거의 그대로 받지만, 5,300만원 초과 차량이나 LFP 배터리 수입차처럼 국비가 절반 이하인 차종은 지방비도 같은 비율로 줄어듭니다. ${sido.short}처럼 ${max >= 400 ? "지방비가 높은" : "지방비 편차가 있는"} 지역에서는 차종 선택이 합산액을 수백만원 바꿉니다. 거주 시·군과 차종을 골라 계산하려면 <a href="/calculator">보조금 계산기</a>를 이용하세요.</p>

<h2>${esc(sido.short)}에서 신청할 때 확인할 것</h2>
<ul>
${cm.tips.map((t) => `<li>${t}</li>`).join("\n")}
<li>공고일 기준 해당 시·군에 30일 이상 주민등록이 돼 있어야 하며, 최근 2년 내 보조금 수령 이력이 있으면 제한될 수 있습니다.</li>
<li>대상자 선정 후 2개월 안에 출고·등록해야 하므로 계약 전 대리점에 출고 예정일을 확인하세요.</li>
</ul>
<p>공고 원문은 각 시·군 홈페이지 고시·공고와 <a href="https://ev.or.kr" target="_blank" rel="noopener noreferrer">무공해차 통합누리집</a>에서, 신청 절차는 <a href="/guide/how-to-apply-ev-subsidy-2026">신청 방법 7단계</a>에서 확인할 수 있습니다. ${sido.short} 전체 현황은 <a href="/region/${sidoSlug}">${esc(sido.name)} 보조금 페이지</a>에 있습니다.</p>
`;

  const faq = [
    {
      q: `${sido.short}에서 2026년 전기차 지방비가 가장 높은 곳은 어디인가요?`,
      a: equal
        ? `${sido.short} ${stats.count}개 시·군은 모두 ${n(max)}만원으로 같습니다. 대신 공고 대수와 잔여 물량이 시·군마다 다르므로 거주 시·군의 잔여 대수를 확인해야 합니다.`
        : `${stats.maxNames.join("·")}이(가) ${n(max)}만원으로 가장 높습니다. 국비 최대 ${NATIONAL_MAX.large}만원을 더하면 ${n(max + NATIONAL_MAX.large)}만원, 전환지원금까지 ${n(max + NATIONAL_MAX.large + NATIONAL_MAX.conversion)}만원입니다. 가장 낮은 곳은 ${stats.minNames.slice(0, 3).join("·")}(${n(min)}만원)입니다.`,
    },
    {
      q: `${sido.short} 다른 시·군 공고로 신청할 수 있나요?`,
      a: `없습니다. 지방비는 차량 등록 주소지(주민등록상 거주지) 시·군 공고가 적용되며, 공고일 기준 30일 이상 거주 요건이 있는 곳이 대부분입니다. 거주 시·군 물량이 소진됐다면 추경 공고를 기다려야 합니다.`,
    },
    ...(cm.faq ?? []),
  ];

  return {
    slug: cm.slug,
    title: `${sido.name} 시·군별 전기차 보조금 비교 2026: ${cm.hook}`,
    description: equal
      ? `2026년 ${sido.name} ${stats.count}개 시·군의 승용 전기차 지방비(${n(max)}만원 동일)와 시·군별 공고·잔여 물량을 한 표로 비교하고, 금액이 같은데 신청 난도가 다른 이유와 차종별 합산액, 신청 요령을 정리했습니다.`
      : `2026년 ${sido.name} ${stats.count}개 시·군의 승용 전기차 지방비를 순위표로 비교(${stats.maxNames[0]} ${n(max)}만원 ~ ${stats.minNames[0]} ${n(min)}만원)하고, 편차가 생긴 배경, 차종별 합산액 예시, 시·군별 공고·잔여 물량과 신청 요령을 정리했습니다.`,
    category: "지역",
    published: cm.published,
    updated: cm.updated,
    keywords: [`${sido.short} 전기차 보조금`, `${sido.short} 시군별 전기차 보조금`, `2026 ${sido.short} 전기차 지방비`, ...stats.maxNames.slice(0, 2).map((m) => `${m} 전기차 보조금`)],
    body,
    faq,
  };
}

export const GUIDES_REGION_DEEP: Guide[] = Object.keys(COMMENTARY)
  .map(buildRegionGuide)
  .filter((g): g is Guide => g !== null);
