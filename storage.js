// storage.js
const STORAGE_V2_KEY = "finances_v2";
const STORAGE_V1_KEY = "despesas_v1";

function safeJsonParse(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function loadV2() {
  const raw = localStorage.getItem(STORAGE_V2_KEY);
  if (!raw) return null;
  const data = safeJsonParse(raw, null);
  if (!data || typeof data !== "object") return null;
  if (!Array.isArray(data.items)) return null;
  return data;
}

function saveV2(items) {
  const payload = {
    version: 2,
    updatedAt: Date.now(),
    items,
  };
  localStorage.setItem(STORAGE_V2_KEY, JSON.stringify(payload));
}

function loadV1Expenses() {
  const raw = localStorage.getItem(STORAGE_V1_KEY);
  if (!raw) return [];
  const arr = safeJsonParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

function guessDateFromTs(ts) {
  if (!Number.isFinite(ts)) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function migrateIfNeeded() {
  const existing = loadV2();
  if (existing) return existing.items;

  const v1 = loadV1Expenses();
  const migrated = v1
    .map((d) => {
      const createdTs = Number(d.criadoTs) || Date.now();
      return {
        id: String(d.id ?? `${createdTs}_${Math.random().toString(16).slice(2)}`),
        type: "expense",
        date: guessDateFromTs(createdTs) || new Date().toISOString().slice(0, 10),
        category: "Outros",
        description: String(d.descricao ?? "Despesa"),
        amount: Number(d.valor) || 0,
        createdAt: createdTs,
      };
    })
    .filter((x) => Number.isFinite(x.amount) && x.amount > 0);

  saveV2(migrated);
  return migrated;
}
