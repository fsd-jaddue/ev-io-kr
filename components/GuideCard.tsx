import Link from "next/link";
import type { Guide } from "@/content/guides";
import { GuideArt } from "./illustrations";

export default function GuideCard({ guide, lines = 2 }: { guide: Guide; lines?: 2 | 3 }) {
  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-emerald-300 hover:shadow-sm">
      <Link href={`/guide/${guide.slug}`} className="block">
        <GuideArt category={guide.category} className="h-28 w-full" />
        <div className="p-4">
          <p className="text-xs font-medium text-emerald-700">{guide.category}</p>
          <p className="mt-1 text-base font-bold leading-snug text-slate-900">{guide.title}</p>
          <p className={`mt-2 text-sm leading-6 text-slate-600 ${lines === 3 ? "line-clamp-3" : "line-clamp-2"}`}>{guide.description}</p>
          <p className="mt-2 text-xs text-slate-400">{guide.updated} 업데이트</p>
        </div>
      </Link>
    </li>
  );
}
