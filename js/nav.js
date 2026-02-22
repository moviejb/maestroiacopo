// js/nav.js
// Mantiene la tua logica su index.html con show("home")
// + aggiunge: goDidattici(), goGruppo(), goAdmin()
// + conserva: goMemory(), goProtected(screen)

function currentPage() {
  return (location.pathname.split("/").pop() || "index.html").toLowerCase();
}

// =========================
// NAV PRINCIPALE
// =========================
function goHome() {
  // Se siamo nell'index e c'è la tua funzione show(), resta nella pagina e cambia schermata
  const page = currentPage();
  if (page === "index.html" && typeof show === "function") {
    show("home");
    if (typeof syncPlayerNameInputs === "function") syncPlayerNameInputs();
    if (typeof readPlayerNames === "function") readPlayerNames();
  } else {
    window.location.href = "index.html";
  }
}

function goDidattici() {
  // Pagina elenco giochi didattici
  window.location.href = "giochi_didattici.html";
}

function goGruppo() {
  // Pagina elenco giochi di gruppo
  window.location.href = "giochi_gruppo.html";
}

function goMemory() {
  window.location.href = "memory.html";
}

// =========================
// ACCESSO / ADMIN
// =========================
function goAdmin() {
  const url = "admin.html";
  const passwordCorretta = "180184"; // 🔒 CAMBIA QUI

  // Se già autenticato in questa sessione → entra subito
  if (sessionStorage.getItem("ADMIN_OK") === "1") {
    window.location.href = url;
    return;
  }

  const inserita = prompt("🔒 Inserisci la password per accedere all'area ADMIN:");

  if (inserita === null) return;

  if (inserita !== passwordCorretta) {
    alert("❌ Password errata!");
    return;
  }

  // Salva solo per questa sessione (si resetta chiudendo il browser)
  sessionStorage.setItem("ADMIN_OK", "1");

  window.location.href = url;
}



// =========================
// ENTRATE "PROTETTE" GIÀ ESISTENTI
// =========================
function goProtected(screen) {
  // players: se c'è la select #players la uso, altrimenti 1
  const sel = document.getElementById("players");
  const players = sel ? sel.value : "1";

  const url = `game_combo.html?screen=${encodeURIComponent(screen)}&players=${encodeURIComponent(players)}`;

  // 🔒 Se esistono i tuoi controlli di accesso, li uso. Altrimenti apro e basta.
  if (typeof isAccessOk === "function" && typeof showAccessModal === "function") {
    if (!isAccessOk()) return showAccessModal(() => { window.location.href = url; });
  }

  window.location.href = url;
}

// =========================
// Evidenzia voce attiva menu (compatibile con menu nuovo)
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const page = currentPage();

  // Se stai usando il nuovo menu.js che espone window.__menuRefreshActive, lo aggiorno
  if (typeof window.__menuRefreshActive === "function") {
    window.__menuRefreshActive();
    return;
  }

  // Fallback: se hai ancora i vecchi id (non fa danni se non esistono)
  if (page === "index.html") document.getElementById("btnHome")?.classList.add("active");
  if (page === "memory.html") document.getElementById("btnMemory")?.classList.add("active");
  if (page === "game_combo.html") document.getElementById("btnArchivio")?.classList.add("active");
});
