/** Shared tuning for large inventory lists (10k+ rows) — memory-safe defaults. */
export const LARGE_LIST_PROPS = {
  initialNumToRender: 15,
  maxToRenderPerBatch: 20,
  windowSize: 5,
} as const;
