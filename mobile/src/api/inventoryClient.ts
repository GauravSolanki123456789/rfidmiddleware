import { getApiBaseUrl } from "../config/api";
import type {
  ApiErrorBody,
  ApiSuccess,
  AuditResultDto,
  InventorySummaryDto,
  ProductDto,
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

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
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

export async function fetchMasterList(): Promise<ProductDto[]> {
  const body = await requestJson<ApiSuccess<{ items: ProductDto[] }>>(
    "/inventory/master-list",
  );
  return body.data.items;
}

export async function postInventoryAudit(input: {
  locationId: string;
  scannedEpcs: string[];
}): Promise<AuditResultDto> {
  const body = await requestJson<ApiSuccess<AuditResultDto>>(
    "/inventory/audit",
    {
      method: "POST",
      body: JSON.stringify({
        locationId: input.locationId,
        scannedEpcs: input.scannedEpcs,
      }),
    },
  );
  return body.data;
}
