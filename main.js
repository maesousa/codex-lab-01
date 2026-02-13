// main.js
// Liga tudo: estado, eventos, render e persistência

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

const listEl = document.getElementById("list");
const counterEl = document.getElementById("counter");
const emptyStateEl = document.getElementById("emptyState");
const btnLimparTudo = document.getElementById("btnLimparTudo");

const chartExpenseCategoriesEl = document.getElementById("chartExpenseCategories");
const chartTrendEl = document.getElementById("chartTrend");
const topExpensesItemsEl = document.getElementById("topExpensesItems");
const topIncomeItemsEl = document.getElementById("topIncomeItems");

let chartExpenseCategories = null;
let chartTrend = null;

let items = migrateIfNeeded();

const state = {
  month: currentMonthIso(),
  typeFilter: "all",
};

function persist() {
  saveV2(items);
}

function updateDashboard() {
  const filtered = applyFilters(items, state);

  // Lista
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

  // KPIs (sempre do mês selecionado, independentemente do filtro de tipo)
  const totals = totalsForMonth(items, state.month);
  kpiExpensesEl.textContent = formatEuro(totals.expenses);
  kpiIncomeEl.textContent = formatEuro(totals.income);
  kpiBalanceEl.textContent = formatEuro(totals.balance);

  // Top categorias (mês selecionado)
  renderTopList(topExpensesEl, topCategories(items, state.month, "expense", 3));
  renderTopList(topIncomeEl, topCategories(items, state.month, "income", 3));

    // Top items (mês selecionado)
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
        { label: "Despesas", data: expensesSeries },
        { label: "Receitas", data: incomeSeries },
        { label: "Saldo", data: balanceSeries },
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

function initDefaults() {
  // Form defaults
  dateEl.value = todayIso();
  typeEl.value = "expense";
  fillCategorySelect(categoryEl, "expense");

  // Filters defaults
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

  // reset parcial
  descriptionEl.value = "";
  amountEl.value = "";
  descriptionEl.focus();

  // se adicionaste algo fora do mês selecionado, mantém filtros (não forçamos month)
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

// init
initDefaults();
renderAll();
