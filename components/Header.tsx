import Link from "next/link";
import { NAV, SITE } from "@/lib/site";
import MobileNav from "./MobileNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-slate-900" aria-label={`${SITE.name} 홈`}>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-base font-black text-white">
            EV
          </span>
          <span className="text-xl tracking-tight md:text-2xl">{SITE.name}</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="주요 메뉴">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
