// Message-passing contract between the content script and the background
// service worker. Kept in `shared/` because both sides import it — this is
// the thing Phase 3's "Sequence Diagram" deliverable will document.

export interface ScoreRequestMessage {
  type: "SCORE_PRODUCT";
  payload: {
    name: string;
    price: string | null;
    packSize: string | null;
    sourceUrl: string;
  };
}

import type { Product } from "./nutriscore/types";

export type ScoreResponseMessage =
  | { status: "scored"; product: Product }
  | { status: "unscored" }
  | { status: "error"; message: string };
