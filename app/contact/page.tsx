import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "문의하기",
  description: `${SITE.name} 운영자에게 오류 제보, 자료 갱신 요청, 제휴·광고 문의를 보내는 방법을 안내합니다.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <Breadcrumb items={[{ name: "문의하기", path: "/contact" }]} />
      <article className="prose-ev max-w-3xl">
        <h1 className="text-3xl font-black text-slate-900">문의하기</h1>
        <p>
          {SITE.name}는 이메일로 문의를 받습니다. 아래 주소로 보내 주시면 영업일 기준 2~3일 안에 답변드립니다.
        </p>
        <p className="text-xl">
          <a href={`mailto:${SITE.email}?subject=${encodeURIComponent(`[${SITE.name}] 문의`)}`}>{SITE.email}</a>
        </p>

        <h2>이런 문의를 받습니다</h2>
        <ul>
          <li><strong>오류 제보</strong> — 지방비 금액, 국비, 링크, 지역 정보가 공고와 다른 경우. 해당 페이지 주소와 공고 출처를 함께 알려 주시면 빠르게 반영합니다.</li>
          <li><strong>자료 갱신 요청</strong> — 새 공고, 추경, 추가 인센티브가 나왔는데 반영되지 않은 경우</li>
          <li><strong>콘텐츠 제안</strong> — 추가되었으면 하는 지역·차종·주제</li>
          <li><strong>제휴·광고</strong> — 콘텐츠 제휴 및 광고 게재 문의</li>
          <li><strong>개인정보</strong> — 개인정보 열람·삭제 요청 (<Link href="/privacy">개인정보처리방침</Link> 참고)</li>
        </ul>

        <h2>보조금 신청 자체에 대한 문의는</h2>
        <p>
          이 사이트는 보조금을 접수·심사·지급하지 않습니다. 신청 자격, 접수 상태, 지급 시기 등은 관할 시·군·구 담당 부서나 차량 구매
          대리점에 문의하셔야 정확한 답을 들을 수 있습니다. 지자체 담당 부서 연락처는{" "}
          <a href="https://ev.or.kr/nportal/buySupprt/initPsLocalInquiriesAction.do" target="_blank" rel="noopener noreferrer">
            무공해차 통합누리집 지자체 문의처
          </a>
          에서 확인할 수 있습니다.
        </p>

        <h2>답변이 늦어질 수 있는 경우</h2>
        <p>공고 시즌(1~3월)에는 갱신 작업과 문의가 몰려 답변이 늦어질 수 있습니다. 급한 사안은 제목에 [긴급]을 붙여 주세요.</p>
      </article>
    </>
  );
}
