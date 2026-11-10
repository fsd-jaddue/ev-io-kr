import assert from "node:assert/strict";
import test from "node:test";
import { FRESH_WINDOW_MS, isFreshFetch } from "../lib/ev/format";

test("누리집 수집 배지: live 는 항상, 스냅샷은 12시간 이내만", () => {
  const now = Date.parse("2026-11-10T12:00:00Z");
  const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
  assert.equal(FRESH_WINDOW_MS, 12 * 3600_000);
  assert.equal(isFreshFetch("live", ago(48), now), true);
  assert.equal(isFreshFetch("snapshot", ago(7), now), true);
  assert.equal(isFreshFetch("snapshot", ago(11.9), now), true);
  assert.equal(isFreshFetch("snapshot", ago(12), now), false);
  assert.equal(isFreshFetch("snapshot", "not-a-date", now), false);
});
