import assert from "node:assert/strict";
import test from "node:test";
import { passengerConversion, sumSubsidy } from "../lib/ev/subsidy";
import { CARS, CARS_SNAPSHOT } from "../data/cars";
import { verifiedSupport } from "../lib/ev/verifiedSupport";
import { matchCarRows, applyCollectedNational } from "../lib/ev/carsOverlay";
import { LOCAL_REF_NATIONAL, estimateLocal, estimateTotal, headlineTotal, summarizeBySido } from "../lib/ev/summary";
import { getLocalPriceSnapshot } from "../lib/ev/localPrice";
import { GUIDES } from "../content/guides";
import { SIDO_LIST, sigunguPath } from "../data/regions";

test("승용 전환지원 국비의 임계값·반올림·음수 거부", () => {
  for (const [national, expected] of [[570, 100], [500, 100], [420, 84], [210, 42], [168, 34], [0, 0]]) assert.equal(passengerConversion(national), expected);
  for (const bad of [-1, NaN, Infinity]) assert.throws(() => passengerConversion(bad));
});
test("공식 수집값을 통한 서울 모델3 합계 회귀 검증", () => {
  const car = CARS.find((c) => c.slug === "model3-premium-long-range")!;
  const v = verifiedSupport(car, "seoul");
  assert.equal(car.national, 420); assert.equal(v.local, 126); assert.equal(v.conversion, 84);
  assert.equal(sumSubsidy(car.national!, v.local!), 546); assert.equal(sumSubsidy(car.national!, v.local!, v.conversion!), 630);
  assert.equal(verifiedSupport(car, "busan").local, null);
});
test("모델 불일치·충돌·일부 누락은 과거 수기값으로 대체하지 않음", () => {
  const car = CARS.find((c) => c.slug === "model3-premium-long-range")!;
  assert.equal(applyCollectedNational([car], { rows: [] })[0].national, null);
  const row = matchCarRows(car, CARS_SNAPSHOT.rows).matched[0];
  assert.equal(matchCarRows(car, [row, { ...row, national: null }]).reason, "ambiguous");
  assert.equal(applyCollectedNational([car], { rows: [row, { ...row, national: 210 }] })[0].national, null);
});
test("공식 수집 전환 열과 계산식 일치", () => {
  for (const r of CARS_SNAPSHOT.rows) if (r.national !== null && r.conversionNational !== null) assert.equal(passengerConversion(r.national), r.conversionNational, r.model);
});
test("지방비 비례 추정식이 서울 수집 전 행과 ±1만원 안에서 일치 (분모 = 수집 최고 국비)", () => {
  const seoulMax = getLocalPriceSnapshot().rows.find((r) => r.sido === "seoul")!.amount!;
  const rows = CARS_SNAPSHOT.rows.filter((r) => r.national !== null && r.local !== null);
  assert.ok(rows.length > 50);
  assert.equal(LOCAL_REF_NATIONAL, Math.max(...rows.map((r) => r.national!)));
  for (const r of rows) assert.ok(Math.abs(estimateLocal(seoulMax, r.national!) - r.local!) <= 1, `${r.model}: est ${estimateLocal(seoulMax, r.national!)} vs ${r.local}`);
  // 예전 분모(국비 상한 580)로는 서울 아이오닉 6가 191만원으로 과대 추정됐다
  const ioniq6 = CARS.find((c) => c.slug === "ioniq6-long-range")!;
  assert.equal(estimateTotal({ national: ioniq6.national!, localMax: seoulMax }).total, 741);
  assert.equal(estimateTotal({ national: ioniq6.national!, localMax: seoulMax, conversion: true }).total, 841);
  assert.equal(headlineTotal(seoulMax), 741);
  assert.equal(headlineTotal(null), null);
});
test("시·군·구 링크는 개별 페이지 경로, 단일 공고 시·도만 uniform, 가이드 slug 중복 없음", () => {
  for (const s of SIDO_LIST) for (const g of s.sigungu) assert.ok(sigunguPath(s.slug, g).startsWith(`/region/${s.slug}/`));
  const single = summarizeBySido(getLocalPriceSnapshot().rows).filter((s) => s.uniform).map((s) => s.slug).sort();
  assert.deepEqual(single, ["busan", "daegu", "daejeon", "gwangju", "incheon", "jeju", "sejong", "seoul", "ulsan"]);
  assert.equal(new Set(GUIDES.map((g) => g.slug)).size, GUIDES.length);
  assert.ok(!GUIDES.some((g) => g.slug === "ev-subsidy-outlook-2027"));
});
