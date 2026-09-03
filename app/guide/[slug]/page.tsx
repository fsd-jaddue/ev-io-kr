import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";
import { articleJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { GUIDES, getGuide } from "@/content/guides";
import { SITE } from "@/lib/site";
import { GuideArt } from "@/components/illustrations";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return pageMetadata({
    title: g.title,
    description: g.description,
    path: `/guide/${slug}`,
    type: "article",
    publishedTime: g.published,
    modifiedTime: g.updated,
    keywords: g.keywords,
  });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const related = GUIDES.filter((x) => x.slug !== slug && x.category === g.category).slice(0, 3);
  const more = GUIDES.filter((x) => x.slug !== slug && !related.includes(x)).slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({ title: g.title, description: g.description, path: `/guide/${slug}`, published: g.published, modified: g.updated }),
          ...(g.faq?.length ? [faqJsonLd(g.faq)] : []),
        ]}
      />
      <Breadcrumb items={[{ name: "가이드", path: "/guide" }, { name: g.category, path: "/guide" }, { name: g.title, path: `/guide/${slug}` }]} />
      <article className="max-w-3xl">
        <GuideArt category={g.category} className="mb-6 h-40 w-full rounded-2xl md:h-52" />
        <p className="text-sm font-medium text-emerald-700">{g.category}</p>
        <h1 className="mt-1 text-3xl font-black leading-tight text-slate-900">{g.title}</h1>
        <p className="mt-3 text-sm text-slate-500">
          {SITE.operator} · 게시 {g.published} · 업데이트 {g.updated}
        </p>
        <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">{g.description}</p>

        <div className="prose-ev mt-2" dangerouslySetInnerHTML={{ __html: g.body }} />

        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE} />

        {g.faq && g.faq.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-slate-900">자주 묻는 질문</h2>
            <dl className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200">
              {g.faq.map((f) => (
                <div key={f.q} className="px-4 py-4">
                  <dt className="font-semibold text-slate-900">{f.q}</dt>
                  <dd className="mt-1 text-sm leading-6 text-slate-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <p className="mt-10 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
          이 글은 환경부 무공해차 통합누리집과 지자체 공고 등 공개 자료를 바탕으로 작성한 참고 정보이며, 법적 효력이 있는 안내가
          아닙니다. 실제 보조금 지급 여부와 금액은 관할 지자체 공고와 심사 결과에 따릅니다. 오류 제보는 {SITE.email} 로 보내 주세요.
        </p>
      </article>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">관련 가이드</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {[...related, ...more].map((x) => (
            <li key={x.slug} className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-emerald-700">{x.category}</p>
              <Link href={`/guide/${x.slug}`} className="mt-1 block font-semibold text-slate-900 hover:text-emerald-700 hover:underline">
                {x.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
