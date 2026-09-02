import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { pageMetadata } from "@/lib/seo";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = pageMetadata({
  title: "전기차 보조금 가이드",
  description:
    "전기차 보조금 신청 절차, 국고보조금 산정 기준, 전환지원금, 세제 혜택, 지역별 차이, 차종별 순위, 잔여대수 확인법까지 2026년 기준으로 정리한 가이드 모음.",
  path: "/guide",
});

const CATEGORIES = ["기본", "신청", "혜택", "지역", "차종", "전망"] as const;

export default function GuideIndexPage() {
  return (
    <>
      <Breadcrumb items={[{ name: "가이드", path: "/guide" }]} />
      <h1 className="text-3xl font-black text-slate-900">전기차 보조금 가이드</h1>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        처음 전기차를 사는 분이 보조금을 빠짐없이 받을 수 있도록 제도 구조, 신청 절차, 세제 혜택, 지역·차종별 차이를 2026년 기준으로
        정리했습니다. 각 글은 환경부 업무처리지침과 지자체 공고를 바탕으로 작성했으며 변경 사항이 생기면 업데이트합니다.
      </p>

      {CATEGORIES.map((cat) => {
        const list = GUIDES.filter((g) => g.category === cat);
        if (list.length === 0) return null;
        return (
          <section key={cat} className="mt-10">
            <h2 className="text-xl font-bold text-slate-900">{cat}</h2>
            <ul className="mt-3 grid gap-4 md:grid-cols-2">
              {list.map((g) => (
                <li key={g.slug} className="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300">
                  <Link href={`/guide/${g.slug}`} className="block text-base font-bold text-slate-900 hover:underline">
                    {g.title}
                  </Link>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{g.description}</p>
                  <p className="mt-2 text-xs text-slate-400">{g.updated} 업데이트</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
