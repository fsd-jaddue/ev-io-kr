import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-sm font-semibold text-emerald-700">404</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-slate-600">주소가 바뀌었거나 삭제된 페이지입니다. 아래 메뉴에서 원하는 정보를 찾아보세요.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">홈으로</Link>
        <Link href="/region" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">지역별 보조금</Link>
        <Link href="/calculator" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">보조금 계산기</Link>
      </div>
    </div>
  );
}
