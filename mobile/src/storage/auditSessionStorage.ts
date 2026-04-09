import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "audit_sessions_v1";
const MAX_SESSIONS = 80;

export type AuditSessionRecord = {
  id: string;
  createdAt: number;
  updatedAt: number;
  scannedBarcodes: string[];
};

const BARCODE_8 = /^\d{8}$/;

function dedupeOrdered(barcodes: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const b of barcodes) {
    const t = b.trim();
    if (!BARCODE_8.test(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function isRecord(x: unknown): x is AuditSessionRecord {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.createdAt === "number" &&
    typeof o.updatedAt === "number" &&
    Array.isArray(o.scannedBarcodes) &&
    o.scannedBarcodes.every((b) => typeof b === "string")
  );
}

async function readAll(): Promise<AuditSessionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).map((s) => ({
      ...s,
      scannedBarcodes: dedupeOrdered(s.scannedBarcodes),
    }));
  } catch {
    return [];
  }
}

async function writeAll(sessions: AuditSessionRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export async function listAuditSessions(): Promise<AuditSessionRecord[]> {
  const all = await readAll();
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getAuditSession(
  id: string,
): Promise<AuditSessionRecord | null> {
  const all = await readAll();
  return all.find((s) => s.id === id) ?? null;
}

/**
 * Create or update a session. Pass `id` to overwrite an existing saved session.
 */
export async function saveAuditSession(input: {
  id?: string | null;
  scannedBarcodes: string[];
}): Promise<AuditSessionRecord> {
  const codes = dedupeOrdered(input.scannedBarcodes);
  const now = Date.now();
  const all = await readAll();
  const id =
    input.id && all.some((s) => s.id === input.id)
      ? input.id
      : `audit_${now}_${Math.random().toString(36).slice(2, 10)}`;

  const idx = all.findIndex((s) => s.id === id);
  const record: AuditSessionRecord = {
    id,
    createdAt: idx >= 0 ? all[idx]!.createdAt : now,
    updatedAt: now,
    scannedBarcodes: codes,
  };

  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.unshift(record);
    if (all.length > MAX_SESSIONS) {
      all.length = MAX_SESSIONS;
    }
  }
  await writeAll(all);
  return record;
}

export async function deleteAuditSession(id: string): Promise<void> {
  const all = await readAll();
  await writeAll(all.filter((s) => s.id !== id));
}
