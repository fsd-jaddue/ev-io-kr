import Link from "next/link";
import { FOOTER_LINKS, SITE } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-600">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-base font-bold text-slate-900">{SITE.name}</p>
            <p className="mt-2 leading-relaxed">{SITE.tagline}. 전국 시·도, 시·군·구별 전기차 구매 보조금과 신청 정보를 정리합니다.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">바로가기</p>
            <ul className="mt-2 space-y-1">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-emerald-700 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900">자료 출처</p>
            <p className="mt-2 leading-relaxed">
              보조금 금액과 접수·출고 현황은 환경부{" "}
              <a
                href="https://ev.or.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline"
              >
                무공해차 통합누리집
              </a>
              과 각 지자체 공고를 바탕으로 정리한 참고 자료입니다. 실제 지급액은 공고와 예산 잔여에 따라 달라질 수 있습니다.
            </p>
            <p className="mt-2">
              문의: <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>
            </p>
          </div>
        </div>
        <p className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
          © {SITE.launchedYear}{year > SITE.launchedYear ? `–${year}` : ""} {SITE.operator}. All rights reserved. 본 사이트는 정부·지자체와 무관한 민간 정보 사이트입니다.
        </p>
      </div>
    </footer>
  );
}
