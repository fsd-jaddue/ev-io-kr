import type { Car } from "@/lib/ev/types";
import { CARS_SNAPSHOT } from "@/data/cars";
import { normalizeModel } from "@/lib/ev/carsOverlay";
import { verifiedSupport } from "@/lib/ev/verifiedSupport";

const DETAILS: Record<string, { family:string; tips:string[]; rivals:string[] }> = {
  "ioniq6-long-range": {family:"아이오닉6",tips:["더 뉴 아이오닉 6와 아이오닉 6 N을 구분하세요. N은 같은 계열 표에 있어도 별도 성능 모델입니다.","2WD·AWD와 N라인, 18·20인치 표기를 계약서와 대조하세요. 표에서 금액이 같아도 해당 사양을 생략해도 된다는 뜻은 아닙니다."],rivals:["ev6-long-range","model3-premium-long-range"]},
  "ioniq5-long-range": {family:"아이오닉5",tips:["롱레인지 2WD 19인치 기준입니다. AWD·20인치·N 모델의 금액을 대신 사용하지 마세요.","재고 차량은 모델 연도와 공식 목록의 단종 표시를 대리점에 확인하세요."],rivals:["ev6-long-range","ev5"]},
  "kona-electric-long-range": {family:"코나일렉트릭",tips:["롱레인지 17인치와 다른 배터리·휠 사양을 구분하세요.","같은 코나 명칭의 내연기관·하이브리드 견적과 전기차 견적을 혼동하지 마세요."],rivals:["ev3-long-range","niro-ev"]},
  "ev6-long-range": {family:"ev6",tips:["더 뉴 EV6와 EV6 GT, 2WD와 4WD 항목을 구분하세요.","19인치 대표 트림을 20인치 견적에 그대로 적용하지 마세요."],rivals:["ioniq5-long-range","ioniq6-long-range"]},
  "ev3-long-range": {family:"ev3",tips:["롱레인지와 스탠다드, 휠 규격이 다른 행을 따로 비교하세요.","대표값에 여러 휠 사양이 묶여 있으면 아래 모델 목록에서 계약 사양이 실제 포함됐는지 확인하세요."],rivals:["kona-electric-long-range","ev4"]},
  "ev4": {family:"ev4",tips:["EV4 스탠다드와 롱레인지의 지급 행을 구분하세요.","세단 모델끼리 비교할 때에는 동일 연도와 계약 가격 조건을 기준으로 비교하세요."],rivals:["ioniq6-long-range","model3-premium-long-range"]},
  "ev5": {family:"ev5",tips:["롱레인지 2WD 대표값이므로 다른 구동방식·연식의 계약은 별도 행을 확인하세요.","출고 일정이 보조금 선정 기한 안에 들어오는지 계약 전에 확인하세요."],rivals:["ioniq5-long-range","ev3-long-range"]},
  "ev9": {family:"ev9",tips:["EV9의 좌석 구성·구동방식·휠 규격이 명시된 모델 행을 찾아야 합니다.","높은 차량 가격만 보고 보조금을 다시 절반으로 계산하지 마세요. 공식 국비는 적용 조건이 반영된 최종 표기액입니다."],rivals:["ioniq9","polestar4"]},
  "ioniq9": {family:"아이오닉9",tips:["항속형·성능형과 2WD·AWD를 구분하세요.","가격 조건과 좌석·휠 사양이 다른 견적은 국비도 각각 확인해야 합니다."],rivals:["ev9","polestar4"]},
  "casper-electric": {family:"캐스퍼",tips:["현재 수집 범위에서 대표 트림을 확인하지 못했습니다. 이것은 보조금 미지원 판정이 아닙니다.","공식 목록에서 경형·소형 분류와 정확한 전기차 모델명을 확인하세요."],rivals:["ray-ev","ev3-long-range"]},
  "ray-ev": {family:"레이ev|rayev",tips:["4인승 승용과 밴의 차량 분류를 확인하세요. 같은 레이 EV 이름이라도 보조금 기준이 다를 수 있습니다.","현재 목록 미확인은 미지원이나 0원을 뜻하지 않습니다."],rivals:["casper-electric","kona-electric-long-range"]},
  "niro-ev": {family:"니로|niro",tips:["니로 하이브리드와 니로 EV를 구분하세요.","수집 행에 단종 표기가 있으면 판매 재고의 연식과 현행 지원 대상 여부를 확인하세요."],rivals:["kona-electric-long-range","ev3-long-range"]},
  "model3-premium-long-range": {family:"model3",tips:["Premium Long Range RWD와 동일 명칭 뒤에 ‘5999만원’이 붙은 행은 지원액이 다릅니다. 계약 가격 조건까지 일치해야 합니다.","RWD·Performance와 연식 표기를 생략하지 마세요."],rivals:["ioniq6-long-range","ev4"]},
  "model3-standard": {family:"model3",tips:["공식 표의 Model 3 RWD 항목과 단종·연식 표기를 확인하세요.","전환지원 국비는 일괄 100만원이 아닙니다. 아래 표의 전환지원 열을 확인하세요."],rivals:["ev4","byd-atto3"]},
  "modely-premium-long-range": {family:"modely",tips:["Model Y Premium Long Range와 Premium RWD, Y L AWD를 구분하세요.","계약 화면의 가격 조건과 공식 지급 모델명이 일치하는지 확인하고, 최종 국비에 가격계수를 다시 적용하지 마세요."],rivals:["ioniq5-long-range","ev5"]},
  "polestar4": {family:"polestar4",tips:["Rear Motor·Single Motor와 Dual Motor 항목을 구분하세요.","해당 연식과 실제 계약 트림이 수집된 모델명과 일치하는지 확인하세요."],rivals:["ev9","modely-premium-long-range"]},
  "byd-atto3": {family:"atto3|아토3",tips:["ATTO 3와 다른 BYD 모델을 구분하세요.","단종·재고 표시가 있다면 출고할 차량이 해당 지급대상에 포함되는지 확인하세요."],rivals:["volvo-ex30","ev3-long-range"]},
  "volvo-ex30": {family:"ex30",tips:["Single Motor와 Twin Motor·Cross Country 행을 구분하세요.","ER 등 판매 트림명이 공식 지급 모델명과 어떻게 대응되는지 계약 담당자에게 확인하세요."],rivals:["byd-atto3","ev3-long-range"]},
  "torres-evx": {family:"토레스evx",tips:["2026년형 18인치 대표값입니다. 다른 연식·휠 규격은 별도 지급 행을 확인하세요.","토레스 내연기관·하이브리드와 EVX 전기차를 혼동하지 마세요."],rivals:["ev5","ioniq5-long-range"]},
  "musso-ev": {family:"무쏘ev|mussoev",tips:["무쏘 EV는 화물 분류를 확인해야 하는 픽업입니다. 이 사이트의 승용 지방비와 전환지원 산식을 적용하지 마세요.","화물차 공고의 국비·지방비·추가 지원과 운행·매매 조건을 별도로 확인하세요."],rivals:["torres-evx"]},
};
export function getCarContent(car:Car, of:(slug:string)=>Car|undefined) {
  const detail=DETAILS[car.slug]; if(!detail)return undefined;
  const rows=CARS_SNAPSHOT.rows.filter(r=>new RegExp(detail.family,"i").test(normalizeModel(r.maker,r.model)));
  const known=rows.map(r=>r.national).filter((v):v is number=>v!==null);
  const support=verifiedSupport(car,"seoul");
  return {
    family:detail.family,
    intro:[`${car.model}의 대표 트림과 같은 계열의 공식 모델 행을 함께 비교합니다. ${known.length ? `수집 목록에서 확인한 ${known.length}개 행의 국비는 ${Math.min(...known)}~${Math.max(...known)}만원입니다.`:"현재 수집 범위에서는 모델별 금액을 확인하지 못했습니다."} 같은 계열이라도 연식·구동방식·가격 조건에 따라 다른 행이므로, 대표 금액을 모든 트림에 적용하지 마세요.`],
    points:["최종 지급액만으로 배터리·정비망 등 개별 계수가 얼마 적용됐는지는 알 수 없습니다. 원인이 공개되지 않은 경우 특정 성능 때문이라고 단정하지 않습니다.","모델별 최종 국비에 가격계수를 다시 곱하지 않습니다. 지방비도 동일 지역·동일 모델의 실제 표기액을 확인합니다."],
    tips:detail.tips,
    rivals:detail.rivals.filter(s=>of(s)).map(slug=>({slug,why:"정확한 트림별 국비와 거주지 지방비를 따로 비교하세요."})),
    faq:[
      {q:`${car.model}의 지방비는 지역 최고액과 같나요?`,a:`아닙니다. 최고액에는 다른 사양이 포함될 수 있습니다.${support.local!==null?` 대표 트림의 서울 수집 지방비는 ${support.local}만원입니다.`:" 이 대표 트림의 지방비는 공식 표에서 별도로 확인해야 합니다."} 다른 지역에는 서울 금액을 적용할 수 없습니다.`},
      {q:"전환지원 국비가 자동으로 추가되나요?",a:`최초등록·보유 3년 이상 내연기관차 처분 등 자격을 충족한 개인인지 확인해야 합니다. 하이브리드는 제외됩니다.${support.conversion!==null?` 해당 대표 트림의 수집 전환지원 국비는 ${support.conversion}만원입니다.`:" 금액도 해당 차량 분류와 공식 표에서 확인해야 합니다."} 전환지원 지방비는 별도입니다.`}
    ]
  };
}
