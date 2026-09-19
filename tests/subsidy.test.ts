import assert from "node:assert/strict";
import test from "node:test";
import { passengerConversion, sumSubsidy } from "../lib/ev/subsidy";
import { CARS, CARS_SNAPSHOT } from "../data/cars";
import { verifiedSupport } from "../lib/ev/verifiedSupport";
import { matchCarRows, applyCollectedNational } from "../lib/ev/carsOverlay";
import { GUIDES, GUIDE_REDIRECTS } from "../content/guides";
import { SIDO_LIST, sigunguPath } from "../data/regions";

test("승용 전환지원 국비의 임계값·반올림·음수 거부",()=>{
  for(const [national, expected] of [[570,100],[500,100],[420,84],[210,42],[168,34],[0,0]]) assert.equal(passengerConversion(national),expected);
  for(const bad of [-1,NaN,Infinity])assert.throws(()=>passengerConversion(bad));
});
test("공식 수집값을 통한 서울 모델3 합계 회귀 검증",()=>{
  const car=CARS.find(c=>c.slug==="model3-premium-long-range")!;
  const v=verifiedSupport(car,"seoul"); assert.equal(car.national,420);assert.equal(v.local,126);assert.equal(v.conversion,84);
  assert.equal(sumSubsidy(car.national!,v.local!),546);assert.equal(sumSubsidy(car.national!,v.local!,v.conversion!),630);
  assert.equal(verifiedSupport(car,"busan").local,null);
});
test("모델 불일치·충돌·일부 누락은 과거 수기값으로 대체하지 않음",()=>{
  const car=CARS.find(c=>c.slug==="model3-premium-long-range")!;
  assert.equal(applyCollectedNational([car],{rows:[]})[0].national,null);
  const row=matchCarRows(car,CARS_SNAPSHOT.rows).matched[0];
  assert.equal(matchCarRows(car,[row,{...row,national:null}]).reason,"ambiguous");
  assert.equal(applyCollectedNational([car],{rows:[row,{...row,national:210}]} )[0].national,null);
});
test("공식 수집 전환 열과 계산식 일치",()=>{
  for(const r of CARS_SNAPSHOT.rows)if(r.national!==null&&r.conversionNational!==null)assert.equal(passengerConversion(r.national),r.conversionNational,r.model);
});
test("구·군 링크는 통합 표로, 폐기 가이드는 본문 목록에서 제외",()=>{
  for(const s of SIDO_LIST)for(const g of s.sigungu)assert.ok(sigunguPath(s.slug,g).startsWith(`/region/${s.slug}#district-`));
  for(const slug of Object.keys(GUIDE_REDIRECTS))assert.ok(!GUIDES.some(g=>g.slug===slug));
  assert.equal(new Set(GUIDES.map(g=>g.slug)).size,GUIDES.length);
  assert.ok(GUIDES.every(g=>g.sources?.length));
});
