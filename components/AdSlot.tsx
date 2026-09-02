import { SITE } from "@/lib/site";

/**
 * 애드센스 광고 자리.
 * NEXT_PUBLIC_ADSENSE_CLIENT 가 설정되기 전(심사 전)에는 아무것도 렌더링하지 않는다.
 * 승인 후 슬롯 ID(NEXT_PUBLIC_ADSENSE_SLOT_*)를 넣으면 해당 위치에 반응형 광고가 표시된다.
 */
export default function AdSlot({ slot, className = "" }: { slot?: string; className?: string }) {
  if (!SITE.adsenseClient || !slot) return null;
  return (
    <div className={`my-8 ${className}`} aria-label="광고">
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={SITE.adsenseClient}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <script dangerouslySetInnerHTML={{ __html: "(adsbygoogle=window.adsbygoogle||[]).push({});" }} />
    </div>
  );
}
