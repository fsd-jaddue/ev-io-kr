import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "개인정보처리방침",
  description: `${SITE.name} 개인정보처리방침. 수집하는 정보, 쿠키와 광고(구글 애드센스), 분석 도구, 보관 기간, 이용자 권리, 문의처를 안내합니다.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <Breadcrumb items={[{ name: "개인정보처리방침", path: "/privacy" }]} />
      <article className="prose-ev max-w-3xl">
        <h1 className="text-3xl font-black text-slate-900">개인정보처리방침</h1>
        <p>
          {SITE.operator}(이하 &ldquo;운영자&rdquo;)는 {SITE.name}(이하 &ldquo;사이트&rdquo;)를 운영하면서 「개인정보 보호법」 등 관련 법령을
          준수하며, 이용자의 개인정보를 보호하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>
        <p><strong>시행일:</strong> 2026년 9월 1일</p>

        <h2>1. 수집하는 개인정보와 수집 방법</h2>
        <p>사이트는 회원가입 없이 이용할 수 있으며, 이용자가 직접 입력하는 개인정보를 요구하지 않습니다. 다만 다음 정보가 자동으로 생성·수집될 수 있습니다.</p>
        <ul>
          <li><strong>서비스 이용 기록</strong> — 접속 IP 주소, 브라우저 종류와 버전, 운영체제, 방문 일시, 방문 페이지, 참조 URL(리퍼러)</li>
          <li><strong>쿠키</strong> — 광고 및 분석 서비스가 브라우저에 저장하는 식별자</li>
          <li><strong>이메일 문의 시</strong> — 이용자가 보낸 이메일 주소와 문의 내용</li>
        </ul>

        <h2>2. 개인정보의 이용 목적</h2>
        <ul>
          <li>사이트 운영, 오류 분석 및 서비스 개선</li>
          <li>방문 통계 분석(페이지별 방문 수, 이용 흐름 등 비식별 통계)</li>
          <li>맞춤형 광고 제공 및 광고 성과 측정(구글 애드센스)</li>
          <li>문의 응대</li>
        </ul>

        <h2>3. 쿠키와 광고</h2>
        <p>
          사이트는 광고 게재를 위해 <strong>Google AdSense</strong>를 사용할 수 있습니다. Google을 포함한 제3자 광고 제공업체는 쿠키를
          사용하여 이용자의 이 사이트 및 다른 웹사이트 방문 기록을 바탕으로 광고를 게재합니다. Google의 광고 쿠키(DoubleClick 쿠키
          등) 사용으로 Google과 파트너는 이용자의 관심사에 따른 광고를 제공할 수 있습니다.
        </p>
        <ul>
          <li>이용자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google 광고 설정</a>에서 맞춤 광고를 해제할 수 있습니다.</li>
          <li><a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>에서 제3자 공급업체의 맞춤 광고 쿠키를 거부할 수 있습니다.</li>
          <li>Google의 데이터 처리 방식은 <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google 파트너 사이트 정책</a>에서 확인할 수 있습니다.</li>
        </ul>
        <p>이용자는 브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.</p>

        <h2>4. 분석 도구</h2>
        <p>
          사이트는 방문 통계를 위해 Google Analytics 또는 Vercel Analytics 등 분석 도구를 사용할 수 있습니다. 이 도구들은 쿠키 또는
          비식별 식별자를 통해 방문 정보를 수집하며, 수집된 정보는 개인을 식별하지 않는 통계 형태로만 활용합니다.
        </p>

        <h2>5. 개인정보의 제3자 제공 및 처리 위탁</h2>
        <p>
          운영자는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 다만 광고·분석 서비스 제공자(Google LLC 등)와 호스팅
          제공자(Vercel Inc.)가 서비스 제공 과정에서 위에 명시한 정보를 자체 개인정보처리방침에 따라 처리할 수 있으며, 이 과정에서 국외로
          이전될 수 있습니다.
        </p>

        <h2>6. 보관 기간과 파기</h2>
        <ul>
          <li>서비스 이용 기록: 수집일로부터 최대 12개월 보관 후 파기(또는 분석 도구의 기본 보관 기간)</li>
          <li>이메일 문의: 응대 완료 후 6개월 이내 파기</li>
          <li>법령에 따라 보관이 필요한 경우 해당 기간 동안 보관</li>
        </ul>

        <h2>7. 이용자의 권리</h2>
        <p>
          이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있으며, 요청은 아래 문의처로 보내 주시면 지체 없이
          처리합니다. 만 14세 미만 아동의 개인정보는 수집하지 않습니다.
        </p>

        <h2>8. 개인정보 보호책임자 및 문의</h2>
        <table>
          <tbody>
            <tr><th>책임자</th><td>{SITE.operator} 운영자</td></tr>
            <tr><th>이메일</th><td><a href={`mailto:${SITE.email}`}>{SITE.email}</a></td></tr>
          </tbody>
        </table>
        <p>
          개인정보 침해에 대한 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118), 개인정보분쟁조정위원회(kopico.go.kr,
          1833-6972)에서도 받을 수 있습니다.
        </p>

        <h2>9. 방침의 변경</h2>
        <p>이 방침이 변경되는 경우 시행일 7일 전부터 사이트에 공지하며, 변경된 방침은 공지한 시행일부터 적용됩니다.</p>
      </article>
    </>
  );
}
