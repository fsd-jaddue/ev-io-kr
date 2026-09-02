import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "사이트 소개",
  description: `${SITE.name}는 전국 시·도, 시·군·구별 전기차 구매 보조금과 신청 정보를 정리하는 민간 정보 사이트입니다. 운영 목적, 자료 출처, 갱신 방식, 운영자 정보를 안내합니다.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <Breadcrumb items={[{ name: "사이트 소개", path: "/about" }]} />
      <article className="prose-ev max-w-3xl">
        <h1 className="text-3xl font-black text-slate-900">사이트 소개</h1>
        <p>
          <strong>{SITE.name}</strong>(ev.io.kr)는 전기차를 사려는 분이 거주 지역과 차종에 따라 받을 수 있는 구매 보조금을 빠르게
          확인할 수 있도록 만든 정보 사이트입니다. 환경부 국비, 시·군·구별 지방비, 전환지원금과 추가 인센티브, 세제 혜택을 한곳에
          정리하고, 신청 절차와 주의사항을 가이드로 제공합니다.
        </p>

        <h2>왜 만들었나</h2>
        <p>
          전기차 보조금은 국비와 지방비가 따로 정해지고, 지방비는 시·군·구마다 다르며, 차종별 국비 비율에 따라 다시 달라집니다.
          공식 사이트에서 이 정보를 모두 확인하려면 여러 메뉴를 오가며 표를 대조해야 합니다. 이 사이트는 그 과정을 줄여 &ldquo;내
          지역에서 이 차를 사면 얼마를 받는가&rdquo;에 바로 답하는 것을 목표로 합니다.
        </p>

        <h2>제공하는 정보</h2>
        <ul>
          <li><Link href="/region">지역별 보조금</Link> — 17개 시·도와 시·군·구별 승용 전기차 지방비, 국비 합산 최대액, 접수·출고·잔여 현황</li>
          <li><Link href="/car">차종별 국비</Link> — 환경부가 확정한 2026년 차종·트림별 국고보조금과 가격 구간</li>
          <li><Link href="/calculator">보조금 계산기</Link> — 지역과 차종을 선택해 국비·지방비·전환지원금 합산 예상액 계산</li>
          <li><Link href="/guide">가이드</Link> — 제도 구조, 신청 절차, 세제 혜택, 지역·차종별 분석</li>
        </ul>

        <h2>자료 출처와 갱신</h2>
        <p>
          모든 금액과 현황은 <a href="https://ev.or.kr" target="_blank" rel="noopener noreferrer">환경부 무공해차 통합누리집</a>의
          공개 자료, 환경부 전기자동차 보급사업 보조금 업무처리지침, 각 지자체의 전기자동차 보급사업 공고문을 바탕으로 정리합니다.
          접수·출고·잔여 현황은 누리집 공개 표를 주기적으로 수집해 표시하며, 각 표에 수집 시각과 출처를 함께 표기합니다. 지방비
          금액은 공고 변경, 추경, 물량 소진에 따라 달라질 수 있어 정기적으로 대조해 갱신합니다.
        </p>

        <h2>이 사이트가 아닌 것</h2>
        <ul>
          <li>정부·지자체·환경부와 관계없는 <strong>민간 운영 사이트</strong>입니다.</li>
          <li>보조금을 신청·접수·지급하지 않습니다. 신청은 제작·수입사를 통해 무공해차 통합누리집에서 이루어집니다.</li>
          <li>표시된 금액은 참고 정보이며 법적 효력이 없습니다. 실제 지급액은 지자체 심사 결과에 따릅니다.</li>
        </ul>

        <h2>운영자 정보</h2>
        <table>
          <tbody>
            <tr><th>사이트명</th><td>{SITE.name}</td></tr>
            <tr><th>운영자</th><td>{SITE.operator}</td></tr>
            <tr><th>문의</th><td><a href={`mailto:${SITE.email}`}>{SITE.email}</a></td></tr>
            <tr><th>주소(도메인)</th><td>{SITE.url}</td></tr>
          </tbody>
        </table>

        <h2>오류 제보와 제안</h2>
        <p>
          금액이 공고와 다르거나 링크가 잘못된 경우, 추가되었으면 하는 지역·차종·주제가 있으면{" "}
          <Link href="/contact">문의하기</Link>를 통해 알려 주세요. 확인 후 반영하고 갱신일을 표기합니다.
        </p>
      </article>
    </>
  );
}
