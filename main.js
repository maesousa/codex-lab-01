/* main.js — bootstrap simples e robusto
   - Não depende de funções “soltas” como normalizeAll()
   - Se App existir, chama App.init()
*/

(function () {
  function safe(fn) {
    try { fn(); } catch (e) { console.error(e); }
  }

  // Inicializar a app (ui.js expõe App no window nas versões recentes)
  safe(() => {
    if (window.App && typeof window.App.init === "function") {
      window.App.init();
    } else if (typeof window.initApp === "function") {
      window.initApp();
    } else {
      console.warn("App.init() não encontrado. Verifica ui.js / ordem dos scripts.");
    }
  });
})();
