/* Controlo de Despesas Mensais
 * - Guarda no localStorage
 * - Adiciona / remove despesas
 * - Calcula total
 */

const STORAGE_KEY = "despesas_v1";

const form = document.getElementById("formDespesa");
const inputDescricao = document.getElementById("descricao");
const inputValor = document.getElementById("valor");
const mensagem = document.getElementById("mensagem");

const lista = document.getElementById("lista");
const totalEl = document.getElementById("total");
const contadorEl = document.getElementById("contador");
const emptyState = document.getElementById("emptyState");
const btnLimparTudo = document.getElementById("btnLimparTudo");

function gerarId() {
  // id simples e suficiente para este caso
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function euro(valorNumero) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(valorNumero);
}

function nowPt() {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function lerStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function escreverStorage(despesas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(despesas));
}

let despesas = lerStorage();

function setMensagem(texto, tipo = "") {
  mensagem.textContent = texto;
  mensagem.classList.remove("ok", "err");
  if (tipo) mensagem.classList.add(tipo);

  if (texto) {
    window.clearTimeout(setMensagem._t);
    setMensagem._t = window.setTimeout(() => {
      mensagem.textContent = "";
      mensagem.classList.remove("ok", "err");
    }, 2800);
  }
}

function parseEuroInput(str) {
  // Permite "12,50" ou "12.50" e remove espaços
  const s = String(str).trim().replace(/\s+/g, "");
  // trocar vírgula por ponto (pt-PT)
  const normalized = s.replace(",", ".");
  // bloquear coisas esquisitas (ex.: "12..3")
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

function atualizarResumo() {
  const total = despesas.reduce((acc, d) => acc + d.valor, 0);
  totalEl.textContent = euro(total);

  const n = despesas.length;
  contadorEl.textContent = n === 1 ? "1 item" : `${n} itens`;

  emptyState.style.display = n === 0 ? "block" : "none";
}

function criarLi(d) {
  const li = document.createElement("li");
  li.className = "item";
  li.dataset.id = d.id;

  const main = document.createElement("div");
  main.className = "item-main";

  const title = document.createElement("div");
  title.className = "item-title";

  const desc = document.createElement("strong");
  desc.textContent = d.descricao;

  const amount = document.createElement("span");
  amount.className = "amount";
  amount.textContent = euro(d.valor);

  title.appendChild(desc);
  title.appendChild(amount);

  const meta = document.createElement("div");
  meta.className = "item-meta";
  meta.textContent = `Criado em ${d.criadoEm}`;

  main.appendChild(title);
  main.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "actions";

  const btnApagar = document.createElement("button");
  btnApagar.type = "button";
  btnApagar.className = "btn btn-icon btn-danger";
  btnApagar.textContent = "Apagar";
  btnApagar.title = "Remover esta despesa";
  btnApagar.addEventListener("click", () => apagarDespesa(d.id));

  actions.appendChild(btnApagar);

  li.appendChild(main);
  li.appendChild(actions);

  return li;
}

function render() {
  lista.innerHTML = "";
  // mais recentes primeiro
  const ordenadas = [...despesas].sort((a, b) => (a.criadoTs < b.criadoTs ? 1 : -1));
  for (const d of ordenadas) {
    lista.appendChild(criarLi(d));
  }
  atualizarResumo();
}

function adicionarDespesa(descricao, valor) {
  const d = {
    id: gerarId(),
    descricao,
    valor,
    criadoEm: nowPt(),
    criadoTs: Date.now(),
  };
  despesas.push(d);
  escreverStorage(despesas);
  render();
}

function apagarDespesa(id) {
  const d = despesas.find((x) => x.id === id);
  if (!d) return;

  const ok = window.confirm(`Apagar a despesa "${d.descricao}"?`);
  if (!ok) return;

  despesas = despesas.filter((x) => x.id !== id);
  escreverStorage(despesas);
  render();
  setMensagem("Despesa removida.", "ok");
}

function limparTudo() {
  if (despesas.length === 0) {
    setMensagem("Não há despesas para limpar.", "err");
    return;
  }
  const ok = window.confirm("Tens a certeza que queres remover todas as despesas?");
  if (!ok) return;

  despesas = [];
  escreverStorage(despesas);
  render();
  setMensagem("Tudo limpo.", "ok");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const descricao = inputDescricao.value.trim();
  const valor = parseEuroInput(inputValor.value);

  if (!descricao) {
    setMensagem("A descrição é obrigatória.", "err");
    inputDescricao.focus();
    return;
  }

  if (valor === null) {
    setMensagem("Indica um valor válido (ex.: 12,50).", "err");
    inputValor.focus();
    return;
  }

  if (valor <= 0) {
    setMensagem("O valor deve ser maior do que zero.", "err");
    inputValor.focus();
    return;
  }

  adicionarDespesa(descricao, valor);

  form.reset();
  inputDescricao.focus();
  setMensagem("Despesa adicionada.", "ok");
});

btnLimparTudo.addEventListener("click", limparTudo);

// primeira renderização
render();
