import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "면책조항",
  description: `${SITE.name}에 표시된 보조금 금액·현황·계산 결과의 성격과 한계, 공식 확인 방법, 책임 범위를 안내합니다.`,
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <>
      <Breadcrumb items={[{ name: "면책조항", path: "/disclaimer" }]} />
      <article className="prose-ev max-w-3xl">
        <h1 className="text-3xl font-black text-slate-900">면책조항</h1>

        <h2>1. 정보의 성격</h2>
        <p>
          {SITE.name}에 게시된 전기차 보조금 금액, 지역별 지방비, 차종별 국비, 접수·출고·잔여 현황, 계산기 결과, 가이드 글은 환경부
          무공해차 통합누리집과 각 지자체 공고 등 <strong>공개 자료를 바탕으로 정리한 참고 정보</strong>입니다. 공식 공고문이 아니며 법적
          효력이 없습니다.
        </p>

        <h2>2. 금액이 달라질 수 있는 경우</h2>
        <ul>
          <li>지자체가 공고를 변경·정정하거나 추가경정예산으로 금액과 물량을 조정한 경우</li>
          <li>차종·트림별 국비가 재산정되거나 제작사가 차량 가격을 조정해 가격 구간이 바뀐 경우</li>
          <li>지방비 지급 방식(정액·비례)이 지자체마다 달라 계산기의 비례 가정과 다른 경우</li>
          <li>추가 인센티브(다자녀·청년·취약계층 등) 적용 여부와 중복 규칙이 지역별로 다른 경우</li>
          <li>공고 물량이 소진되어 실제 지급이 불가능한 경우</li>
          <li>사이트의 수집·갱신 시점과 공식 자료 게시 시점 사이에 시차가 있는 경우</li>
        </ul>

        <h2>3. 공식 확인 방법</h2>
        <p>
          보조금 신청 전에는 반드시 <a href="https://ev.or.kr" target="_blank" rel="noopener noreferrer">환경부 무공해차 통합누리집</a>의
          &lsquo;보조금 지급대상 차종&rsquo;, &lsquo;지자체별 차종·모델 보조금&rsquo;, &lsquo;지자체별 보조금 현황&rsquo; 메뉴와 관할 시·군·구
          공고문을 확인하시고, 궁금한 사항은 지자체 담당 부서 또는 차량 구매 대리점에 문의하시기 바랍니다.
        </p>

        <h2>4. 책임의 범위</h2>
        <p>
          운영자는 정보의 정확성과 최신성을 위해 노력하지만, 이용자가 사이트 정보를 바탕으로 내린 결정(차량 구매·계약·신청·처분 등)과 그
          결과에 대해 책임을 지지 않습니다. 사이트에 링크된 외부 사이트의 내용에 대해서도 책임지지 않습니다.
        </p>

        <h2>5. 광고</h2>
        <p>
          사이트에 게재되는 광고는 제3자 광고 서비스(Google AdSense 등)를 통해 자동으로 선택되며, 운영자가 광고 상품·서비스를 추천하거나
          보증하는 것이 아닙니다.
        </p>

        <h2>6. 오류 제보</h2>
        <p>
          잘못된 금액이나 링크를 발견하시면 <a href={`mailto:${SITE.email}`}>{SITE.email}</a>로 알려 주세요. 확인 후 정정하고 갱신일을
          표기합니다.
        </p>
      </article>
    </>
  );
}
