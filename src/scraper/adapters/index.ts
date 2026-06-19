import type { RetailerAdapter } from "../types";
import { jumiaAdapter } from "./jumia";

const ADAPTERS: RetailerAdapter[] = [jumiaAdapter];

export function getAdapterForHostname(hostname: string): RetailerAdapter | null {
  return ADAPTERS.find((a) => a.hostname === hostname) ?? null;
}

export { jumiaAdapter };
