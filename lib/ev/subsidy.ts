/** 승용 전환지원 국비. 추가 인센티브를 제외한 일반 국비 기준, 만원 미만 반올림. */
export function passengerConversion(national: number): number {
  if (!Number.isFinite(national) || national < 0) throw new RangeError("국비는 0 이상의 유한한 수여야 합니다.");
  return Math.round(100 * Math.min(national / 500, 1));
}

/** 지역 최대액으로 차종 지방비를 역산하지 않는다. 확인한 동일 트림 금액만 합산한다. */
export function sumSubsidy(national: number, local: number, conversion = 0) {
  if ([national, local, conversion].some((v) => !Number.isFinite(v) || v < 0)) {
    throw new RangeError("보조금은 0 이상의 유한한 수여야 합니다.");
  }
  return Math.round((national + local + conversion) * 100) / 100;
}
