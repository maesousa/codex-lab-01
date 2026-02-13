// main.js

// Chart.js em tema escuro (para não ficar “invisível”)
Chart.defaults.color = "rgba(255,255,255,0.80)";
Chart.defaults.borderColor = "rgba(255,255,255,0.14)";

// ELEMENTOS
const form = document.getElementById("form");
const typeEl = document.getElementById("type");
const dateEl = document.getElementById("date");
const categoryEl = document.getElementById("category");
const descriptionEl = document.getElementById("description");
const amountEl = document.getElementById("amount");
const messageEl = document.getElementById("message");

const monthEl = document.getElementById("month");
const typeFilterEl = document.getElementById("typeFilter");

const kpiExpensesEl = document.getElementById("kpiExpenses");
const kpiIncomeEl = document.getElementById("kpiIncome");
const kpiBalanceEl = document.getElementById("kpiBalance");

const topExpensesEl = document.getElementById("topExpenses");
const topIncomeEl = document.getElementById("topIncome");
const topExpensesItemsEl = document.getElementById("topExpensesItems");
const topIncomeItemsEl = document.getElementById("topIncomeItems");

const listEl = document.getElementById("list");
const counterEl = document.getElementById("counter");
const emptyStateEl = document.getElementById("emptyState");

const chartExpenseCategoriesEl = document.getElementById("chartExpenseCategories");
const chartTrendEl = document.getElementById("chartTrend");

const btnExportCsv = document.getElementById("btnExportCsv");
const btnBackupJson = document.getElementById("btnBackupJson");
const fileRestore = document.getElementById("fileRestore");
const btnLimparTudo = document.getElementById("btnLimparTudo");

// ESTADO
let items = migrateIfNeeded();

const state = {
  month: currentMonthIso(),
  typeFilter: "all",
};

let chartExpenseCategories = null;
let chartTrend = null;

function persist() {
  saveV2(items);
}

// EXPORT / BACKUP / RESTORE
function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  if (!items.length) return alert("Sem dados para exportar.");

  const header = "type,date,category,description,amount\n";
  const rows = items
    .map((x) => {
      const desc = String(x.description ?? "").replace(/"/g, '""');
      return `${x.type},${x.date},${x.category},"${desc}",${Number(x.amount) || 0}`;
    })
    .join("\n");

  downloadFile("financas.csv", header + rows, "text/csv;charset=utf-8");
}

function backupJson() {
  downloadFile("financas_backup.json", JSON.stringify(items, null, 2), "application/json");
}

function restoreJson(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error("Formato inválido");

      // sanity: tenta normalizar campos essenciais
      items = data
        .map((x) => ({
          id: String(x.id ?? makeId()),
          type: x.type === "income" ? "income" : "expense",
          date: String(x.date ?? todayIso()).slice(0, 10),
          category: String(x.category ?? "Outros"),
          description: String(x.description ?? ""),
          amount: Number(x.amount) || 0,
          createdAt: Number(x.createdAt) || Date.now(),
        }))
        .filter((x) => x.amount > 0);

      persist();
      renderAll();
      alert("Dados restaurados com sucesso.");
    } catch {
      alert("Ficheiro inválido.");
    } finally {
      fileRestore.value = "";
    }
  };
  reader.readAsText(file);
}

// RENDER
function updateDashboard() {
  // Lista filtrada (mês + tipo)
  const filtered = applyFilters(items, state);

  renderList(listEl, filtered, (x) => {
    const ok = window.confirm(`Apagar "${x.description}"?`);
    if (!ok) return;
    items = items.filter((it) => it.id !== x.id);
    persist();
    renderAll();
    setMessage(messageEl, "Registo removido.", "ok");
  });

  const n = filtered.length;
  counterEl.textContent = n === 1 ? "1 item" : `${n} itens`;
  emptyStateEl.style.display = n === 0 ? "block" : "none";

  // KPIs do mês selecionado (independente do filtro tipo)
  const totals = totalsForMonth(items, state.month);
  kpiExpensesEl.textContent = formatEuro(totals.expenses);
  kpiIncomeEl.textContent = formatEuro(totals.income);
  kpiBalanceEl.textContent = formatEuro(totals.balance);

  // Top categorias (mês)
  renderTopList(topExpensesEl, topCategories(items, state.month, "expense", 3));
  renderTopList(topIncomeEl, topCategories(items, state.month, "income", 3));

  // Top items (mês)
  renderTopItems(topExpensesItemsEl, topItems(items, state.month, "expense", 5));
  renderTopItems(topIncomeItemsEl, topItems(items, state.month, "income", 5));

  // Gráfico: despesas por categoria (mês)
  const cat = totalsByCategory(items, state.month, "expense");
  const labels = cat.map((x) => x.category);
  const values = cat.map((x) => x.total);

  if (chartExpenseCategories) chartExpenseCategories.destroy();
  chartExpenseCategories = new Chart(chartExpenseCategoriesEl, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "€", data: values }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });

  // Gráfico: tendência últimos 6 meses
  const months = lastNMonths(state.month, 6);
  const expensesSeries = months.map((m) => totalsForMonth(items, m).expenses);
  const incomeSeries = months.map((m) => totalsForMonth(items, m).income);
  const balanceSeries = months.map((m) => totalsForMonth(items, m).balance);

  if (chartTrend) chartTrend.destroy();
  chartTrend = new Chart(chartTrendEl, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        { label: "Despesas", data: expensesSeries, tension: 0.25 },
        { label: "Receitas", data: incomeSeries, tension: 0.25 },
        { label: "Saldo", data: balanceSeries, tension: 0.25 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
    },
  });
}

function renderAll() {
  updateDashboard();
}

// INIT
function initDefaults() {
  dateEl.value = todayIso();
  typeEl.value = "expense";
  fillCategorySelect(categoryEl, "expense");

  monthEl.value = state.month;
  typeFilterEl.value = state.typeFilter;
}

typeEl.addEventListener("change", () => {
  fillCategorySelect(categoryEl, typeEl.value);
});

monthEl.addEventListener("change", () => {
  state.month = monthEl.value || currentMonthIso();
  renderAll();
});

typeFilterEl.addEventListener("change", () => {
  state.typeFilter = typeFilterEl.value || "all";
  renderAll();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const type = typeEl.value; // expense|income
  const date = dateEl.value;
  const category = categoryEl.value;
  const description = descriptionEl.value.trim();
  const amount = parseEuroInput(amountEl.value);

  if (!date) return setMessage(messageEl, "A data é obrigatória.", "err");
  if (!category) return setMessage(messageEl, "A categoria é obrigatória.", "err");
  if (!description) return setMessage(messageEl, "A descrição é obrigatória.", "err");
  if (amount === null) return setMessage(messageEl, "Indica um valor válido (ex.: 12,50).", "err");
  if (amount <= 0) return setMessage(messageEl, "O valor deve ser maior do que zero.", "err");

  items.push({
    id: makeId(),
    type,
    date,
    category,
    description,
    amount,
    createdAt: Date.now(),
  });

  persist();

  descriptionEl.value = "";
  amountEl.value = "";
  descriptionEl.focus();

  renderAll();
  setMessage(messageEl, "Registo adicionado.", "ok");
});

btnLimparTudo.addEventListener("click", () => {
  if (!items.length) return setMessage(messageEl, "Não há registos para limpar.", "err");
  const ok = window.confirm("Tens a certeza que queres remover todos os registos?");
  if (!ok) return;
  items = [];
  persist();
  renderAll();
  setMessage(messageEl, "Tudo limpo.", "ok");
});

btnExportCsv.addEventListener("click", exportCsv);
btnBackupJson.addEventListener("click", backupJson);
fileRestore.addEventListener("change", (e) => {
  if (e.target.files && e.target.files.length) restoreJson(e.target.files[0]);
});

initDefaults();
renderAll();
