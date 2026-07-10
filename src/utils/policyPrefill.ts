const PREFILL_STORAGE_KEY = "enterprise_policy_prefill_results";

export interface StoredPrefillMaterial {
  name: string;
  file_ids: number[];
}

export interface StoredPolicyPrefill {
  policy_id: number;
  materials: StoredPrefillMaterial[];
  saved_at: string;
}

function readStore(): Record<string, StoredPolicyPrefill> {
  try {
    const raw = window.localStorage.getItem(PREFILL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeFileIds(value: unknown): number[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export function normalizePrefillMaterials(data: unknown): StoredPrefillMaterial[] {
  const source = (() => {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.materials)) return record.materials;
    if (Array.isArray(record.application_materials)) return record.application_materials;
    if (Array.isArray(record.list)) return record.list;
    if (Array.isArray(record.data)) return record.data;
    return [];
  })();

  return source
    .map((item) => {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        name: String(record.name || record.Name || "").trim(),
        file_ids: normalizeFileIds(record.file_ids || record.fileIds || record.FileIDs || record.file_id || record.fileId),
      };
    })
    .filter((item) => item.name);
}

export function savePolicyPrefill(policyId: number, data: unknown) {
  const materials = normalizePrefillMaterials(data);
  if (materials.length === 0) return;
  try {
    const store = readStore();
    store[String(policyId)] = {
      policy_id: policyId,
      materials,
      saved_at: new Date().toISOString(),
    };
    window.localStorage.setItem(PREFILL_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage is a convenience cache; failing to write should not block prefill display.
  }
}

export function loadPolicyPrefill(policyId: number): StoredPolicyPrefill | null {
  const item = readStore()[String(policyId)];
  return item || null;
}

function normalizeMaterialName(value: string): string {
  return value
    .trim()
    .replace(/[（(].*?[）)]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function findPrefillMaterial(prefill: StoredPolicyPrefill, materialName: string): StoredPrefillMaterial | undefined {
  const normalizedName = normalizeMaterialName(materialName);
  return prefill.materials.find((item) => normalizeMaterialName(item.name) === normalizedName);
}
