// domain.js
// Regras de negócio: parsing, filtros, agregações e formatação

const CATEGORIES = {
  expense: ["Alimentação", "Transportes", "Casa", "Lazer", "Saúde", "Outros"],
  income: ["Salário", "Extra", "Reembolsos", "Outros"],
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthIso() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function parseEuroInput(str) {
  const s = String(str).trim().replace(/\s+/g, "");
  const normalized = s.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatEuro(n) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n);
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function monthOf(dateIso) {
  return String(dateIso).slice(0, 7);
}

function applyFilters(items, { month, typeFilter }) {
  let out = items.filter((x) => monthOf(x.date) === month);
  if (typeFilter !== "all") out = out.filter((x) => x.type === typeFilter);
  // mais recentes primeiro (data + createdAt)
  out.sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : (a.date < b.date ? 1 : -1)));
  return out;
}

function totalsForMonth(items, month) {
  const inMonth = items.filter((x) => monthOf(x.date) === month);
  const expenses = inMonth.filter((x) => x.type === "expense").reduce((a, x) => a + x.amount, 0);
  const income = inMonth.filter((x) => x.type === "income").reduce((a, x) => a + x.amount, 0);
  return { expenses, income, balance: income - expenses };
}

function topCategories(items, month, type, topN = 3) {
  const map = new Map();
  for (const x of items) {
    if (x.type !== type) continue;
    if (monthOf(x.date) !== month) continue;
    map.set(x.category, (map.get(x.category) || 0) + x.amount);
  }
  const arr = [...map.entries()].map(([category, total]) => ({ category, total }));
  arr.sort((a, b) => b.total - a.total);
  return arr.slice(0, topN);
}
