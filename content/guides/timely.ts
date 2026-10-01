/**
 * 시의성 가이드. 1편은 저장소 스냅샷(remain.json)에서 빌드 시 숫자를 계산하고 해설은 수기로 쓴다.
 * 수집 시각을 '지금 접수 가능'으로 표현하지 않는다(수집 시각 기준 표시값). 2편은 전부 수기.
 */
import type { Guide } from "./index";
import type { RemainRow } from "@/lib/ev/types";
import { parseRemainNote, passengerRows, sidoSlugOfRow } from "@/lib/ev/remainSummary";
import { formatFetchedAt } from "@/lib/ev/format";
import { SIDO_LIST, getSido, sigunguPath } from "@/data/regions";
import { EV_PORTAL } from "@/lib/ev/portal";
import remainSnapshot from "@/data/snapshot/remain.json";

const n = (v: number | null | undefined) => (v === null || v === undefined ? "-" : v.toLocaleString("ko-KR"));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const notices = { title: "무공해차 통합누리집 · 지자체별 공고·지급현황", url: EV_PORTAL.remain };
const guideline = { title: "기후에너지환경부 · 2026년 전기자동차 보급사업 업무처리지침 (2026-06-23 개정)", url: "https://mcee.go.kr/home/web/public_info/read.do?menuId=10123&publicInfoId=1144" };

function regionLink(r: RemainRow): string {
  const slug = sidoSlugOfRow(r);
  const sido = slug ? getSido(slug) : undefined;
  if (!sido) return esc(r.region);
  const district = sido.sigungu.find((g) => r.region.includes(g.replace(/(시|군|구)$/, ""))) ?? null;
  const href = r.region === sido.name || !district ? `/region/${sido.slug}` : sigunguPath(sido.slug, district);
  return `<a href="${href}">${esc(r.region)}</a>`;
}

function buildRemainGuide(): Guide {
  const snap = remainSnapshot as { fetchedAt: string; rows: RemainRow[] };
  const rows = passengerRows(snap.rows);
  const at = formatFetchedAt(snap.fetchedAt);
  const soldOut = rows.filter((r) => r.remaining !== null && r.remaining <= 0);
  const closed = rows.filter((r) => parseRemainNote(r.note).status?.includes("마감"));
  const notClosed = rows.filter((r) => !parseRemainNote(r.note).status?.includes("마감"));
  const withExtra = rows.filter((r) => /추경/.test(parseRemainNote(r.note).rounds ?? ""));
  const extra3 = rows.filter((r) => /추경3차/.test(parseRemainNote(r.note).rounds ?? ""));
  const openWithRemain = notClosed.filter((r) => r.remaining !== null && r.remaining > 0).sort((a, b) => (b.remaining ?? 0) - (a.remaining ?? 0));
  const closedWithRemain = closed.filter((r) => r.remaining !== null && r.remaining > 0);
  const announced = rows.reduce((a, r) => a + (r.announced ?? 0), 0);
  const released = rows.reduce((a, r) => a + (r.released ?? 0), 0);
  const remaining = rows.reduce((a, r) => a + (r.remaining ?? 0), 0);
  const bySido = SIDO_LIST.map((s) => {
    const mine = rows.filter((r) => sidoSlugOfRow(r) === s.slug);
    return { s, total: mine.length, sold: mine.filter((r) => r.remaining !== null && r.remaining <= 0).length, open: mine.filter((r) => !parseRemainNote(r.note).status?.includes("마감")).length, remaining: mine.reduce((a, r) => a + (r.remaining ?? 0), 0) };
  }).filter((x) => x.total > 0);

  const topTable = openWithRemain.slice(0, 15).map((r) => {
    const p = parseRemainNote(r.note);
    return `<tr><td>${regionLink(r)}</td><td>${n(r.announced)}대</td><td>${n(r.remaining)}대</td><td>${esc(p.rounds ?? "-")}</td><td>${esc(p.deadline ?? p.period ?? "-")}</td></tr>`;
  }).join("\n");
  const sidoTable = bySido.map((x) => `<tr><td><a href="/region/${x.s.slug}">${esc(x.s.name)}</a></td><td>${x.total}</td><td>${x.open}</td><td>${x.sold}</td><td>${n(x.remaining)}대</td></tr>`).join("\n");

  const body = `
<p>${at} 무공해차 통합누리집 수집값 기준으로, 승용 전기차 보조금 공고 ${rows.length}건 가운데 <strong>출고잔여가 0인 곳이 ${soldOut.length}건</strong>, 누리집에 '신청마감'으로 표시된 곳이 ${closed.length}건입니다. 반대로 신청마감 표시가 없는 공고는 ${notClosed.length}건이고, 그중 잔여가 남은 곳은 ${openWithRemain.length}건입니다. 전국 공고 ${n(announced)}대 중 출고 ${n(released)}대, 출고잔여 ${n(remaining)}대입니다.</p>
<p>이 글의 숫자는 수집 시각의 누리집 표시값이며 지금 접수가 가능하다는 뜻은 아닙니다. 지자체가 접수를 닫은 뒤에도 잔여 숫자가 남아 있는 경우가 있고, 반대로 추경 공고가 막 올라와 아직 수집 전일 수도 있습니다. 최신값은 각 지역 페이지의 접수·출고·잔여 표(매시간 갱신)와 <a href="${EV_PORTAL.remain}" target="_blank" rel="noopener noreferrer">누리집 원표</a>에서 확인하세요.</p>

<h2>하반기 구조: 본공고는 끝났고 추경이 돌고 있다</h2>
<p>2026년 공고 ${rows.length}건 중 ${withExtra.length}건이 이미 추경(추가경정) 공고를 한 번 이상 냈고, 추경 3차까지 간 곳도 ${extra3.length}건입니다. 상반기 본공고 물량이 소진된 뒤 지자체가 예산을 더 확보하거나 출고 취소분을 모아 다시 공고하는 흐름입니다. 하반기 신청자는 사실상 이 추경 물량을 두고 경쟁하게 됩니다.</p>
<p>추경 공고는 본공고와 달리 예고 없이 올라오고 물량이 작아 며칠 만에 마감되는 일이 많습니다. 누리집 표에서 '본공고·추경1차·추경2차'처럼 누적 표시가 붙은 지역은 그만큼 자주 물량을 다시 열었다는 뜻이므로, 거주지가 이런 지역이라면 다음 추경 가능성도 높다고 볼 수 있습니다.</p>

<h2>신청마감 표시가 없고 잔여가 남은 공고 (수집 시각 기준 상위 ${Math.min(15, openWithRemain.length)}곳)</h2>
<div class="table-wrap"><table class="nowrap">
<thead><tr><th>지역</th><th>공고</th><th>출고잔여</th><th>공고 차수</th><th>누리집 마감 표시</th></tr></thead>
<tbody>
${topTable}
</tbody>
</table></div>
<p>'누리집 마감 표시'는 공고문에 적힌 접수 기한입니다. 기한 전이라도 물량이 소진되면 접수가 끝나고, 기한이 지나도 추경으로 다시 열릴 수 있습니다. 표에 없는 지역은 해당 지역 페이지에서 같은 항목을 볼 수 있습니다.</p>

<h2>시·도별 소진·접수 현황</h2>
<div class="table-wrap"><table class="nowrap">
<thead><tr><th>시·도</th><th>공고 수</th><th>마감 표시 없음</th><th>잔여 0</th><th>출고잔여 합계</th></tr></thead>
<tbody>
${sidoTable}
</tbody>
</table></div>
<p>특별·광역시와 세종·제주는 공고가 1건(시·도 단일)이라 소진되면 그 지역 전체가 멈춥니다. 도 지역은 시·군별로 공고가 달라 옆 시·군이 소진돼도 내 시·군은 남아 있을 수 있지만, 지방비는 주소지 기준이라 다른 시·군 공고로 신청할 수는 없습니다.</p>

<h2>잔여가 남았는데 '신청마감'인 곳이 ${closedWithRemain.length}건인 이유</h2>
<p>이 사이트와 누리집의 '잔여'는 <strong>출고잔여</strong>(공고 대수 − 출고 대수)입니다. 접수와 선정이 끝나 신규 접수는 닫혔지만 선정자들이 아직 차를 받지 못한 상태면 출고잔여가 남아 보입니다. 이런 지역은 선정자가 출고 기한(통상 2개월)을 넘겨 자격을 잃을 때 그 물량이 대기자나 추경으로 다시 풀립니다. 잔여 숫자만 보고 계약하면 안 되고, 반드시 '신청마감' 표시와 공고문의 접수 기간을 함께 봐야 하는 이유입니다. 자세한 읽는 법은 <a href="/guide/how-to-check-remaining-quota">잔여대수 확인하는 법</a>에 있습니다.</p>

<h2>연말까지 남은 기회 세 가지</h2>
<ol>
<li><strong>추경 공고</strong> — 지자체 홈페이지 고시·공고와 누리집 표의 공고 차수 변화를 확인하세요. 이 사이트는 공고 물량·종류가 바뀌면 매시간 수집에 반영합니다.</li>
<li><strong>출고 취소분</strong> — 11~12월에는 출고 기한을 넘긴 선정 취소분이 몰립니다. 대리점에 대기 접수를 걸어 두면 취소분이 나올 때 순서대로 배정하는 지자체가 많습니다.</li>
<li><strong>우선순위 물량</strong> — 다자녀·생애최초·취약계층 물량은 일반 물량보다 늦게 소진되는 경우가 있습니다. 해당된다면 그 물량의 잔여를 따로 확인하세요(<a href="/guide/priority-vs-general-vs-corporate">물량 구분 설명</a>).</li>
</ol>

<h2>지금 계약 전에 확인할 순서</h2>
<ul>
<li>거주 시·군·구 페이지에서 잔여·신청마감·공고 차수를 보고, 누리집 원표에서 같은 값을 다시 확인</li>
<li>대리점에 "지금 접수하면 선정 가능한가, 대기 순번은 몇 번째인가"를 확인하고 답을 문자로 받아 두기</li>
<li>출고 예정일이 선정 후 출고 기한 안에 들어오는지 확인. 연말 출고 지연은 선정 취소로 이어집니다</li>
<li>전환지원 국비 대상(3년 이상 보유 내연기관차 처분)이면 처분 시점을 공고 기준으로 잡기</li>
</ul>
<p>내 지역의 최신 숫자는 <a href="/region">지역별 보조금</a>에서, 신청 절차는 <a href="/guide/how-to-apply-ev-subsidy-2026">신청 방법 7단계</a>에서 확인하세요. 이 글의 표는 저장소 스냅샷 기준이라 지역 페이지보다 갱신이 느릴 수 있습니다.</p>
`;
  return {
    slug: "ev-subsidy-h2-2026-remaining-status",
    title: `2026 하반기 전기차 보조금 추경·소진 현황: 공고 ${rows.length}건 중 잔여 0이 ${soldOut.length}건, 아직 열린 곳은 어디인가`,
    description: `${at} 누리집 수집값 기준 승용 전기차 보조금 ${rows.length}건의 소진·신청마감·추경 차수를 정리하고, 잔여가 남은 지역 상위 목록, 시·도별 현황, 연말까지 남은 기회와 계약 전 확인 순서를 안내합니다.`,
    category: "신청",
    published: "2026-10-01",
    updated: "2026-10-01",
    keywords: ["전기차 보조금 소진", "전기차 보조금 추경", "전기차 보조금 잔여 지역", "2026 하반기 전기차 보조금"],
    body,
    sources: [notices, guideline],
    faq: [
      { q: "잔여가 남아 있으면 지금 신청할 수 있나요?", a: `아닙니다. 표의 잔여는 출고잔여라서 접수가 닫힌 뒤에도 남아 보일 수 있습니다. 누리집의 '신청마감' 표시와 공고문의 접수 기간을 함께 확인하고, 대리점에 선정 가능 여부를 물어보세요. 이 글의 숫자는 ${at} 수집값입니다.` },
      { q: "거주지 공고가 소진됐으면 어떻게 하나요?", a: "추경 공고나 출고 취소분을 기다리는 것 외에 방법이 없습니다. 다른 시·군 공고로는 신청할 수 없습니다. 대리점에 대기 접수를 걸어 두고 지자체 고시·공고를 확인하세요." },
      { q: "추경 공고는 언제 나오나요?", a: "정해진 시기는 없습니다. 지자체 예산 확보와 취소분 누적에 따라 수시로 나오며, 물량이 작아 빨리 마감됩니다. 이 사이트의 지역 페이지는 공고 차수 변화를 매시간 반영합니다." },
    ],
  };
}

const DEALER_QUESTIONS: Guide = {
  slug: "questions-to-ask-dealer-before-ev-contract",
  title: "전기차 계약 전 대리점에 확인할 질문 10가지: 보조금 때문에 계약을 취소하지 않으려면",
  description:
    "보조금 접수 순번, 선정 가능성, 출고 예정일과 출고 기한, 트림 기본가격과 5,300만원 기준선, 전환지원 처분 시점, 보조금 미선정 시 계약 처리까지 계약서에 서명하기 전에 대리점에 물어보고 답을 남겨 둘 질문을 정리했습니다.",
  category: "신청",
  published: "2026-10-01",
  updated: "2026-10-01",
  keywords: ["전기차 계약 전 확인", "전기차 보조금 대리점 질문", "전기차 계약 주의사항", "전기차 보조금 미선정 계약 취소"],
  sources: [notices, guideline],
  body: `
<p>전기차 보조금은 구매자가 아니라 대리점이 신청합니다. 그래서 보조금을 받느냐 못 받느냐의 상당 부분이 계약 전에 대리점과 무엇을 확인했는지에 달려 있습니다. 아래 열 가지는 지자체 공고와 누리집 절차에서 실제로 문제가 생기는 지점을 질문 형태로 바꾼 것입니다. 답은 가능하면 문자나 메일로 받아 두세요. 분쟁이 생겼을 때 기준이 됩니다.</p>

<h2>1. 지금 접수하면 우리 지자체 보조금 선정이 가능한가요?</h2>
<p>가장 먼저 물어야 할 질문입니다. 대리점은 누리집에서 지자체별 잔여와 접수 상태를 실시간으로 봅니다. "가능하다"는 답이면 근거(잔여 대수, 접수 상태)를 함께 물어보고, 이 사이트의 <a href="/region">지역 페이지</a>와 누리집 원표로 교차 확인하세요. 소진된 지자체인데 "일단 계약하고 기다리자"는 제안이면 대기 접수인지 추경 대기인지를 분명히 하세요.</p>

<h2>2. 접수 순번이 몇 번째이고, 선정 방식이 출고 선착순인가요 접수 순인가요?</h2>
<p>지자체마다 선정 방식이 다릅니다. 접수 순이면 순번이 곧 선정 순서이고, 출고 선착순이면 접수 순번보다 실제 출고가 빠른 사람이 먼저 선정됩니다. 출고 선착순 지자체에서 출고 대기가 긴 트림을 고르면 순번이 앞서도 밀릴 수 있습니다. 물량 구분(일반·우선순위·법인)도 함께 확인하세요.</p>

<h2>3. 출고 예정일이 언제이고, 선정 후 출고 기한 안에 들어오나요?</h2>
<p>대상자로 선정되면 통상 2개월 안에 출고·등록을 마쳐야 하고, 넘기면 선정이 취소됩니다. 인기 차종과 특정 색상·옵션은 출고가 몇 달씩 밀립니다. "출고 예정일"과 "선정 통보 예상 시점"을 같이 물어서 둘 사이 간격이 기한 안에 들어오는지 확인하세요. 연말에는 등록 업무 마감까지 겹쳐 더 빠듯합니다.</p>

<h2>4. 이 트림의 기본가격이 5,300만원 미만인가요? 누리집 등록 모델명은 무엇인가요?</h2>
<p>보조금 구간은 옵션을 뺀 트림 기본가격 기준입니다. 5,300만원을 넘으면 국비가 절반이 되고 지방비도 비례해 줄어듭니다. 견적서의 트림명이 누리집 '보조금 지급대상 차종'의 등록 모델명과 일치하는지, 연식·구동방식·휠 크기가 같은 행인지 확인하세요. 같은 이름이라도 연식이나 가격 조건이 다르면 국비가 다릅니다. <a href="/car">차종별 국비</a> 페이지의 트림별 표와 대조할 수 있습니다.</p>

<h2>5. 보조금 선정이 안 되면 계약은 어떻게 되나요?</h2>
<p>계약서에 "보조금 미선정 시 위약금 없이 해지"가 명시돼 있는지 확인하세요. 없으면 특약으로 넣어 달라고 요청하는 것이 보통입니다. 보조금 없이도 구매할 의사가 없다면 이 조항 없이 계약하지 않는 것이 안전합니다. 계약금 반환 조건과 기한도 같이 적어 두세요.</p>

<h2>6. 계약자·신청자·등록 명의가 모두 같은지 확인했나요?</h2>
<p>세 명의가 다르면 접수가 반려되거나 지급이 보류됩니다. 가족이 대신 계약하거나 공동명의를 생각한다면 지자체가 허용하는지와 추가 서류를 대리점이 확인해 줘야 합니다. 공동명의는 허용하지 않는 지자체도 있습니다.</p>

<h2>7. 거주 요건과 서류 발급 시점은 언제 기준인가요?</h2>
<p>거주 요건은 공고일 기준으로 공고가 정한 기간(대개 30일 이상, 지자체별 상이)입니다. 등본은 보통 발급일 1개월 이내를 요구하므로 접수 직전에 발급하는 것이 맞습니다. 대리점에 "서류를 언제까지 주면 되는지"를 물어 그 날짜에 맞춰 준비하세요. 목록은 <a href="/guide/ev-subsidy-documents-checklist">서류 체크리스트</a>에 있습니다.</p>

<h2>8. 전환지원 국비를 받으려면 기존 차를 언제 처분해야 하나요?</h2>
<p>본인 명의로 최초등록 후 3년 이상 지났고 3년 이상 보유한 내연기관차(하이브리드 제외)를 폐차하거나 이전해야 하며, 처분 시점 기준은 지자체 공고마다 다릅니다. 출고 전 처분을 요구하는 곳과 출고 후 일정 기간을 주는 곳이 있으니 대리점을 통해 해당 지자체 기준을 확인한 뒤 폐차장이나 중고차 업체에 차를 넘기세요. 금액은 차종 국비에 따라 차등(국비 500만원 미만 차종은 비례)입니다. 조건은 <a href="/guide/conversion-incentive-100">전환지원금 조건</a>에 정리돼 있습니다.</p>

<h2>9. 견적서의 보조금 항목이 국비·지방비·전환 국비로 나뉘어 있나요?</h2>
<p>"보조금 합계"만 적힌 견적서는 어느 항목이 얼마인지 알 수 없어 나중에 금액이 달라져도 따질 수 없습니다. 국비(누리집 등록 금액), 지방비(해당 지자체 공고 금액), 전환지원 국비, 지자체 추가 인센티브를 각각 적어 달라고 하세요. 지방비는 지역 최고액이 아니라 내 차 국비 비율에 맞는 금액이어야 합니다. 이 사이트의 <a href="/calculator">계산기</a>로 추정값을 만들어 비교하면 큰 차이를 바로 잡아낼 수 있습니다.</p>

<h2>10. 보조금 지급 신청 서류는 누가 언제 내나요?</h2>
<p>출고·등록 후 10일 안에 등록증 사본 등 지급 신청 서류를 내야 합니다. 대리점이 대행하지만 등록증은 구매자가 받는 경우가 많습니다. 누가 어떤 서류를 언제까지 챙기는지 역할을 미리 정하세요. 이 단계를 놓치면 보조금 지급이 지연되거나 취소될 수 있습니다.</p>

<h2>질문 전에 알아 두면 좋은 것</h2>
<ul>
<li>대리점 답변은 그 시점의 누리집 표시값에 근거합니다. 하루 뒤 소진될 수 있으니 "오늘 기준"이라는 단서를 붙여 기록하세요.</li>
<li>대리점이 모르는 지자체 세부 기준(거주 기간, 우선순위 요건, 처분 시점)은 지자체 담당 부서에 직접 물어볼 수 있습니다. 연락처는 <a href="${EV_PORTAL.inquiries}" target="_blank" rel="noopener noreferrer">누리집 지자체 문의처</a>에 있습니다.</li>
<li>자주 생기는 실수와 그 결과는 <a href="/guide/ev-subsidy-common-mistakes">실수 10가지</a>에서 미리 볼 수 있습니다.</li>
</ul>
`,
  faq: [
    { q: "대리점이 보조금을 보장한다고 하면 믿어도 되나요?", a: "보조금 선정은 지자체가 하므로 대리점이 보장할 수 없습니다. 접수 순번과 잔여 상태를 근거로 한 전망일 뿐이니, 미선정 시 해지 조항을 계약서에 넣어 두세요." },
    { q: "계약을 먼저 해야 접수가 되나요?", a: "네. 대리점은 계약 정보를 바탕으로 누리집에 접수합니다. 그래서 계약서의 미선정 해지 조항과 출고 예정일 확인이 중요합니다." },
    { q: "견적서 보조금이 이 사이트 계산기와 다르면 어느 쪽이 맞나요?", a: "견적서가 지자체 공고와 누리집 모델별 금액을 기준으로 했다면 견적서가 맞습니다. 이 사이트의 지방비는 비례 추정값이므로, 차이가 크면 대리점에 항목별 근거를 물어보세요." },
  ],
};

export const GUIDES_TIMELY: Guide[] = [buildRemainGuide(), DEALER_QUESTIONS];
