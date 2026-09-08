import type { Faq } from "@/lib/ev/regionCopy";

/** 자주 묻는 질문 목록. 같은 배열을 faqJsonLd() 에도 넘겨 본문과 구조화 데이터를 일치시킨다 */
export default function FaqList({ items, title = "자주 묻는 질문", className = "mt-10" }: { items: Faq[]; title?: string; className?: string }) {
  if (items.length === 0) return null;
  return (
    <section className={className}>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <dl className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
        {items.map((f) => (
          <div key={f.q} className="px-4 py-4">
            <dt className="font-semibold text-slate-900">{f.q}</dt>
            <dd className="mt-1 text-sm leading-6 text-slate-600">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
