// === ELEMENTOS ===
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

const chartExpenseCategoriesEl = document.getElementById("chartExpenseCategories");
const chartTrendEl = document.getElementById("chartTrend");

const topExpensesItemsEl = document.getElementById("topExpensesItems");
const topIncomeItemsEl = document.getElementById("topIncomeItems");

const btnExportCsv = document.getElementById("btnExportCsv");
const btnBackupJson = document.getElementById("btnBackupJson");
const fileRestore = document.getElementById("fileRestore");
const btnLimparTudo = document.getElementById("btnLimparTudo");

let items = migrateIfNeeded();
let chartExpenseCategories = null;
let chartTrend = null;

const state = {
  month: currentMonthIso(),
  typeFilter: "all",
};

function persist() { saveV2(items); }

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
  const header = "type,date,category,description,amount\n";
  const rows = items.map(x =>
    `${x.type},${x.date},${x.category},"${x.description}",${x.amount}`
  ).join("\n");
  downloadFile("financas.csv", header + rows, "text/csv");
}

function backupJson() {
  downloadFile("financas_backup.json", JSON.stringify(items, null, 2), "application/json");
}

function restoreJson(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      items = data;
      persist();
      renderAll();
      alert("Restauro concluído.");
    } catch {
      alert("Ficheiro inválido.");
    }
  };
  reader.readAsText(file);
}

function updateDashboard() {

  const totals = totalsForMonth(items, state.month);
  kpiExpensesEl.textContent = formatEuro(totals.expenses);
  kpiIncomeEl.textContent = formatEuro(totals.income);
  kpiBalanceEl.textContent = formatEuro(totals.balance);

  const cat = totalsByCategory(items, state.month, "expense");
  if (chartExpenseCategories) chartExpenseCategories.destroy();
  chartExpenseCategories = new Chart(chartExpenseCategoriesEl, {
    type: "bar",
    data: {
      labels: cat.map(x=>x.category),
      datasets: [{ data: cat.map(x=>x.total) }]
    }
  });

  const months = lastNMonths(state.month,6);
  if (chartTrend) chartTrend.destroy();
  chartTrend = new Chart(chartTrendEl, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        { label:"Despesas", data: months.map(m=>totalsForMonth(items,m).expenses) },
        { label:"Receitas", data: months.map(m=>totalsForMonth(items,m).income) },
        { label:"Saldo", data: months.map(m=>totalsForMonth(items,m).balance) }
      ]
    }
  });
}

function renderAll(){ updateDashboard(); }

btnExportCsv.addEventListener("click", exportCsv);
btnBackupJson.addEventListener("click", backupJson);
fileRestore.addEventListener("change", e=>{
  if(e.target.files.length) restoreJson(e.target.files[0]);
});
btnLimparTudo.addEventListener("click", ()=>{
  items=[]; persist(); renderAll();
});

form.addEventListener("submit", e=>{
  e.preventDefault();
  const amount = parseEuroInput(amountEl.value);
  if(!amount) return alert("Valor inválido");
  items.push({
    id: Date.now().toString(),
    type: typeEl.value,
    date: dateEl.value,
    category: categoryEl.value,
    description: descriptionEl.value,
    amount,
    createdAt: Date.now()
  });
  persist();
  renderAll();
});

renderAll();
