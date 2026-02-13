// ui.js
function setMessage(el, text, type = "") {
  el.textContent = text;
  el.classList.remove("ok", "err");
  if (type) el.classList.add(type);

  if (text) {
    window.clearTimeout(setMessage._t);
    setMessage._t = window.setTimeout(() => {
      el.textContent = "";
      el.classList.remove("ok", "err");
    }, 2600);
  }
}

function fillCategorySelect(selectEl, type) {
  selectEl.innerHTML = "";
  for (const c of CATEGORIES[type]) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    selectEl.appendChild(opt);
  }
}

function renderTopList(olEl, items) {
  olEl.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "—";
    olEl.appendChild(li);
    return;
  }
  for (const x of items) {
    const li = document.createElement("li");
    li.textContent = x.category;
    const span = document.createElement("span");
    span.className = "muted";
    span.textContent = `(${formatEuro(x.total)})`;
    li.appendChild(span);
    olEl.appendChild(li);
  }
}

function renderTopItems(olEl, items) {
  olEl.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "—";
    olEl.appendChild(li);
    return;
  }
  for (const x of items) {
    const li = document.createElement("li");
    li.textContent = x.description;
    const span = document.createElement("span");
    span.className = "muted";
    span.textContent = `(${formatEuro(Number(x.amount) || 0)} • ${x.category})`;
    li.appendChild(span);
    olEl.appendChild(li);
  }
}

function renderList(ulEl, items, onDelete) {
  ulEl.innerHTML = "";

  for (const x of items) {
    const li = document.createElement("li");
    li.className = "item";

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("div");
    title.className = "item-title";

    const desc = document.createElement("strong");
    desc.textContent = x.description;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = x.type === "expense" ? "Despesa" : "Receita";

    const amount = document.createElement("span");
    amount.className = "amount";
    amount.textContent = formatEuro(Number(x.amount) || 0);

    title.appendChild(desc);
    title.appendChild(badge);
    title.appendChild(amount);

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = `${x.date} • ${x.category}`;

    main.appendChild(title);
    main.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "actions";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-icon btn-danger";
    btn.textContent = "Apagar";
    btn.addEventListener("click", () => onDelete(x));

    actions.appendChild(btn);

    li.appendChild(main);
    li.appendChild(actions);

    ulEl.appendChild(li);
  }
}
