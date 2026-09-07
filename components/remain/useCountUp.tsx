"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 숫자를 이전 값에서 목표값까지 rAF 로 세어 올린다.
 * 첫 렌더는 목표값 그대로 두어 SSR 마크업과 일치시키고, fromZero 면 마운트 직후 0 → 목표값으로 올린다.
 * prefers-reduced-motion 이면 즉시 목표값을 반영한다.
 */
export function useCountUp(target: number | null, opts: { duration?: number; fromZero?: boolean } = {}): number | null {
  const { duration = 500, fromZero = false } = opts;
  const [value, setValue] = useState<number | null>(target);
  const prev = useRef<number | null>(fromZero ? 0 : target);

  useEffect(() => {
    const from = prev.current ?? 0;
    prev.current = target;
    const settle = () => {
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    };
    if (target === null || from === target) return settle();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return settle();

    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export function CountUp({ value, fromZero, className }: { value: number | null; fromZero?: boolean; className?: string }) {
  const v = useCountUp(value, { fromZero });
  return <span className={className}>{v === null ? "-" : v.toLocaleString("ko-KR")}</span>;
}
