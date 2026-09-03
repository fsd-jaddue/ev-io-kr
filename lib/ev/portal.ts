/** 무공해차 통합누리집(ev.or.kr) 공개 페이지 주소. 클라이언트에서도 import 가능하도록 의존성 없음 */
const REMAIN_URL = "https://ev.or.kr/nportal/buySupprt/initSubsidyPaymentCheckAction.do";

export const EV_PORTAL = {
  /** 수집 대상. 테스트용으로 EV_REMAIN_URL 환경변수로 바꿔칠 수 있다(서버 전용) */
  remain: process.env.EV_REMAIN_URL || REMAIN_URL,
  localPrice: "https://ev.or.kr/nportal/buySupprt/initPsLocalCarPirceAction.do",
  localPricePopup: (localCd: string) =>
    `https://ev.or.kr/nportal/buySupprt/psPopupLocalCarPirce.do?localCd=${localCd}`,
  targetVehicle: "https://ev.or.kr/nportal/buySupprt/initSubsidyTargetVehicleAction.do",
  inquiries: "https://ev.or.kr/nportal/buySupprt/initPsLocalInquiriesAction.do",
} as const;
