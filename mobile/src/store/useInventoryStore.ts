import { create } from "zustand";
import { fetchInventorySummary, fetchMasterList } from "../api/inventoryClient";
import type { InventorySummaryDto, ProductDto } from "../types/inventory";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

interface InventoryState {
  items: ProductDto[];
  summary: InventorySummaryDto | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  /** Advanced audit filter: specific SKUs; empty = no SKU restriction. */
  selectedSkus: string[];

  loadDashboard: () => Promise<void>;
  refreshMasterList: () => Promise<void>;
  setSelectedSkus: (skus: string[]) => void;
  toggleSku: (sku: string) => void;
  setSkusForStyle: (skus: string[], selected: boolean) => void;
  clearSelectedSkus: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  summary: null,
  loading: true,
  error: null,
  lastFetchedAt: null,
  selectedSkus: [],

  setSelectedSkus: (skus) => set({ selectedSkus: [...new Set(skus)] }),

  toggleSku: (sku) =>
    set((s) => {
      const cur = new Set(s.selectedSkus);
      if (cur.has(sku)) cur.delete(sku);
      else cur.add(sku);
      return { selectedSkus: [...cur].sort((a, b) => a.localeCompare(b)) };
    }),

  setSkusForStyle: (skus, selected) =>
    set((state) => {
      const cur = new Set(state.selectedSkus);
      for (const x of skus) {
        if (selected) cur.add(x);
        else cur.delete(x);
      }
      return { selectedSkus: [...cur].sort((a, b) => a.localeCompare(b)) };
    }),

  clearSelectedSkus: () => set({ selectedSkus: [] }),

  loadDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const [summary, items] = await Promise.all([
        fetchInventorySummary(),
        fetchMasterList(),
      ]);
      set({
        summary,
        items,
        loading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (e) {
      set({ loading: false, error: errorMessage(e) });
    }
  },

  refreshMasterList: async () => {
    try {
      const items = await fetchMasterList();
      set({ items, error: null });
    } catch (e) {
      set({ error: errorMessage(e) });
    }
  },
}));
