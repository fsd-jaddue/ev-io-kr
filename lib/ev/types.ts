/** 시·도 단위 정의 */
export interface Sido {
  slug: string;
  name: string; // 정식 명칭 (예: 서울특별시)
  short: string; // 약칭 (예: 서울)
  evCode: string; // 무공해차 통합누리집 지역코드(시·도 대표, 참고용)
  /** 시·군·구 목록 (자치구·군 포함) */
  sigungu: string[];
}

/** 시·군·구별 승용 전기차 지방비(최대, 만원) */
export interface LocalPriceRow {
  sido: string; // sido slug
  sigungu: string; // 시·군·구 명 (시·도 전역 단일 공고면 "전체")
  /** 승용 전기차 지방비 최대 (만원). null이면 공고 확인 필요 */
  amount: number | null;
  /** 추가 인센티브·특이사항 */
  note?: string;
}

/** 지자체별 접수·출고·잔여 현황 (무공해차 통합누리집 "지자체별 보조금 현황" 표 1행) */
export interface RemainRow {
  sido: string; // 시·도 약칭 (예: 서울)
  region: string; // 지역명 (예: 서울특별시, 수원시)
  vehicleType: string; // 차종 (승용, 화물, 승합 등)
  /** 공고대수 */
  announced: number | null;
  /** 접수대수 */
  applied: number | null;
  /** 출고대수 */
  released: number | null;
  /** 출고 잔여대수 */
  remaining: number | null;
  note?: string;
}

export type DataSource = "live" | "snapshot";

export interface RemainData {
  source: DataSource;
  fetchedAt: string; // ISO
  rows: RemainRow[];
}

export interface LocalPriceData {
  source: DataSource;
  basis: string; // 기준 설명
  updatedAt: string; // ISO date
  rows: LocalPriceRow[];
}

/** 차종별 국비 보조금 */
export interface Car {
  slug: string;
  brand: string;
  model: string;
  trim: string;
  /** 승용 구분: 중대형 / 소형·경형 */
  segment: "중대형" | "소형·경형";
  /** 2026년 국비 보조금 (만원). null이면 공고 확인 */
  national: number | null;
  /** 판매가 구간 안내 (만원 단위 텍스트) */
  priceBand: "5,300만원 미만" | "5,300만~8,500만원" | "8,500만원 이상";
  /** 1회 충전 주행거리(km) 참고 */
  range?: number;
  note?: string;
}
