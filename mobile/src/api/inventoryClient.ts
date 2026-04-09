import { getApiBaseUrl } from "../config/api";
import type {
  ApiErrorBody,
  ApiSuccess,
  InventorySummaryDto,
  ProductDto,
  TransferResultDto,
} from "../types/inventory";

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Invalid JSON from server");
  }
}

function getErrorMessage(json: unknown, fallback: string): string {
  if (
    json &&
    typeof json === "object" &&
    "error" in json &&
    json.error &&
    typeof json.error === "object" &&
    "message" in json.error &&
    typeof (json as ApiErrorBody).error.message === "string"
  ) {
    return (json as ApiErrorBody).error.message;
  }
  return fallback;
}

function networkFailureMessage(err: unknown): string {
  if (err instanceof TypeError) {
    return "Network error — check that the API server is running and EXPO_PUBLIC_API_BASE_URL is correct.";
  }
  if (err instanceof Error && err.message.includes("Network request failed")) {
    return "Network request failed. Verify Wi‑Fi and server address.";
  }
  return "Network error — could not reach the server.";
}

function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, v);
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    throw new Error(networkFailureMessage(err));
  }
  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      getErrorMessage(json, `Request failed (${res.status})`),
    );
  }
  return json as T;
}

export async function fetchInventorySummary(): Promise<InventorySummaryDto> {
  const body = await requestJson<ApiSuccess<InventorySummaryDto>>(
    "/inventory/summary",
  );
  return body.data;
}

export type MasterListQuery = {
  binLocation?: string;
  styleCode?: string;
  sku?: string;
  itemName?: string;
};

export async function fetchMasterList(
  query?: MasterListQuery,
): Promise<ProductDto[]> {
  const q = buildQuery({
    binLocation: query?.binLocation,
    styleCode: query?.styleCode,
    sku: query?.sku,
    itemName: query?.itemName,
  });
  const body = await requestJson<ApiSuccess<{ items: ProductDto[] }>>(
    `/inventory/master-list${q}`,
  );
  return body.data.items;
}

export async function putInventoryTransfer(input: {
  barcodes: string[];
  newBinLocation: string;
}): Promise<TransferResultDto> {
  const body = await requestJson<ApiSuccess<TransferResultDto>>(
    "/inventory/transfer",
    {
      method: "PUT",
      body: JSON.stringify({
        barcodes: input.barcodes,
        newBinLocation: input.newBinLocation,
      }),
    },
  );
  return body.data;
}
