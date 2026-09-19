import { CARS_SNAPSHOT } from "@/data/cars";
import type { Car } from "./types";
import { matchCarRows } from "./carsOverlay";
import { getSido } from "@/data/regions";

export function verifiedSupport(car: Car, sidoSlug: string) {
  const match = matchCarRows(car, CARS_SNAPSHOT.rows);
  const sameRegion = getSido(sidoSlug)?.name === CARS_SNAPSHOT.region;
  const unique = (key: "local" | "conversionNational") => {
    const values = match.matched.map((r) => r[key]);
    return values.length && values.every((v) => v !== null && v === values[0]) ? values[0] : null;
  };
  return {
    local: sameRegion && match.reason === "applied" ? unique("local") : null,
    conversion: match.reason === "applied" ? unique("conversionNational") : null,
  };
}
