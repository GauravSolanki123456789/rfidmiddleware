import { create } from "zustand";
import {
  fetchInventorySummary,
  fetchMasterList,
  postInventoryAudit,
} from "../api/inventoryClient";
import type { AuditResultDto, InventorySummaryDto, ProductDto } from "../types/inventory";

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

  auditResult: AuditResultDto | null;
  auditLoading: boolean;
  auditError: string | null;

  loadDashboard: () => Promise<void>;
  refreshMasterList: () => Promise<void>;
  runAudit: (input: { locationId: string; scannedEpcs: string[] }) => Promise<void>;
  clearAudit: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  summary: null,
  /** True until the first dashboard load finishes (avoids empty metric flash). */
  loading: true,
  error: null,
  lastFetchedAt: null,

  auditResult: null,
  auditLoading: false,
  auditError: null,

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

  runAudit: async ({ locationId, scannedEpcs }) => {
    set({ auditLoading: true, auditError: null });
    try {
      const auditResult = await postInventoryAudit({ locationId, scannedEpcs });
      set({ auditResult, auditLoading: false });
      try {
        const [summary, items] = await Promise.all([
          fetchInventorySummary(),
          fetchMasterList(),
        ]);
        set({
          summary,
          items,
          lastFetchedAt: Date.now(),
          error: null,
        });
      } catch (e) {
        set({ error: errorMessage(e) });
      }
    } catch (e) {
      set({ auditLoading: false, auditError: errorMessage(e) });
    }
  },

  clearAudit: () => set({ auditResult: null, auditError: null }),
}));
