import { notFound, permanentRedirect } from "next/navigation";
import { SIDO_LIST, getSido, decodeSigungu, sigunguSlug, sigunguPath } from "@/data/regions";
export function generateStaticParams() {
  return SIDO_LIST.flatMap((s) => s.sigungu.map((g) => ({ sido: s.slug, sigungu: sigunguSlug(g) })));
}
// 중복 문서는 시·도 비교표의 해당 행으로 통합한다.
export default async function DistrictRedirect({ params }: { params: Promise<{ sido: string; sigungu: string }> }) {
  const { sido: slug, sigungu } = await params;
  const sido = getSido(slug);
  const name = decodeSigungu(sigungu);
  if (!sido || !sido.sigungu.includes(name)) notFound();
  permanentRedirect(sigunguPath(slug, name));
}
