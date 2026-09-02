import Link from "next/link";
import JsonLd from "./JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export default function Breadcrumb({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: "홈", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      <nav aria-label="현재 위치" className="mb-4 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((it, i) => (
            <li key={it.path} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>›</span>}
              {i === all.length - 1 ? (
                <span className="text-slate-800">{it.name}</span>
              ) : (
                <Link href={it.path} className="hover:text-emerald-700 hover:underline">
                  {it.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
