// /pairs/pairs_engine.js
// FIX: listener attaccati UNA SOLA VOLTA (reset/mescola non rompono il drop)

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getParams() {
    const p = new URLSearchParams(location.search);
    const obj = {};
    for (const [k, v] of p.entries()) obj[k.toLowerCase()] = v;
    return obj;
  }

  function norm(s) {
    return (s ?? "").toString().trim().toLowerCase();
  }

  function matchesMeta(pair, params) {
    const m = pair.meta || {};
    if (params.mode && norm(pair.mode) !== norm(params.mode)) return false;

    if (params.area && norm(m.area) !== norm(params.area)) return false;
    if (params.classe && norm(m.classe) !== norm(params.classe)) return false;
    if (params.disciplina && norm(m.disciplina) !== norm(params.disciplina)) return false;
    if (params.livello && norm(m.livello) !== norm(params.livello)) return false;
    if (params.argomento && norm(m.argomento) !== norm(params.argomento)) return false;

    if (params.preset && norm(m.preset) !== norm(params.preset)) return false;
    return true;
  }

  function createPieceContent(item) {
    const wrap = document.createElement("div");
    wrap.className = "pieceContent";

    if (item.type === "img") {
      const img = document.createElement("img");
      img.alt = "";
      img.src = item.src;
      img.draggable = false;
      wrap.appendChild(img);
    } else {
      const t = document.createElement("div");
      t.className = "pieceText";
      t.textContent = item.text || "";
      wrap.appendChild(t);
    }
    return wrap;
  }

  // =========================
  // Stato globale (non si duplica a ogni render)
  // =========================
  const STATE = {
    ctx: null,    // contesto corrente del gioco (DOM + pairs)
    drag: null,   // drag in corso
    bound: false,
    z: 10
  };

  function highlightDrops(on) {
    if (!STATE.ctx) return;
    $$(".drop", STATE.ctx.rightCol).forEach(d => {
      d.classList.toggle("highlight", on && d.dataset.filled !== "1");
    });
  }

 function getCurrentZoom(){
  const board = document.querySelector(".wrap");
  if(!board) return 1;
  const z = parseFloat(getComputedStyle(board).zoom);
  return isNaN(z) ? 1 : z;
}

function moveAt(x, y) {
  const d = STATE.drag;
  if (!d) return;

  const zoom = getCurrentZoom();

  d.el.style.left = `${(x / zoom) - d.offsetX}px`;
  d.el.style.top  = `${(y / zoom) - d.offsetY}px`;
}


  function getDropUnderPointer(x, y) {
    const d = STATE.drag;
    if (!d) return null;

    // nascondo temporaneamente il pezzo per sapere cosa c'è sotto
    d.el.style.pointerEvents = "none";
    const under = document.elementFromPoint(x, y);
    d.el.style.pointerEvents = "";

    const drop = under?.closest?.(".drop");
    if (!drop) return null;
    if (drop.dataset.filled === "1") return null;
    return drop;
  }

  function animateBack(el, backToRect) {
    el.classList.add("animBack");
    el.style.left = `${backToRect.left}px`;
    el.style.top = `${backToRect.top}px`;
    setTimeout(() => el.classList.remove("animBack"), 220);
  }

  function resetPieceToLeft(el) {
    const d = STATE.drag;
    if (!d || !STATE.ctx) return;

    const originParent = d.originParent;
    const originNext = d.originNext;

    if (originNext && originNext.parentElement === originParent) {
      originParent.insertBefore(el, originNext);
    } else {
      originParent.appendChild(el);
    }

    const finalRect = el.getBoundingClientRect();
    void el.offsetWidth; // reflow
    animateBack(el, finalRect);

    setTimeout(() => {
      el.classList.remove("dragging");
      el.style.position = "";
      el.style.left = "";
      el.style.top = "";
      el.style.width = "";
      el.style.zIndex = "";
      document.body.classList.remove("dragMode");
      highlightDrops(false);
    }, 220);
  }

  function lockIntoDrop(el, drop) {
    drop.dataset.filled = "1";
    drop.classList.add("filled");
    drop.innerHTML = "";

    el.classList.remove("dragging");
    el.dataset.placed = "1";
    el.style.position = "";
    el.style.left = "";
    el.style.top = "";
    el.style.width = "";
    el.style.zIndex = "";
    drop.appendChild(el);

    document.body.classList.remove("dragMode");
    highlightDrops(false);
  }

  function setStatus() {
    const c = STATE.ctx;
    if (!c) return;
    c.status.textContent = `Coppie: ${c.solved} / ${c.total}`;
  }

  function renderGame(pairs, opts = {}) {
  const shuffleRight = !!opts.shuffleRight;

    const leftCol = $("#leftCol");
    const rightCol = $("#rightCol");
    const status = $("#status");
    const btnReset = $("#btnReset");
    const btnShuffle = $("#btnShuffle");

    const sfxAttach = $("#sfxAttach");
    const sfxWin = $("#sfxWin");


    const ctx = {
  leftCol, rightCol, status, btnReset, btnShuffle,
  sfxAttach, sfxWin,
  pairs,
  solved: 0,
  total: pairs.length
};

    STATE.ctx = ctx;

    leftCol.innerHTML = "";
    rightCol.innerHTML = "";

    // RIGHT rows
    // RIGHT rows (se MESCOLA: rimescolo anche qui)
let rightRows = pairs.map(p => ({ id: p.id, right: p.right }));
if (shuffleRight) rightRows = shuffle(rightRows);

rightRows.forEach((row, index) => {

  const r = document.createElement("div");
  r.className = "row";
  r.classList.add(["pairA","pairB","pairC"][index % 3]);


      const drop = document.createElement("div");
      drop.className = "drop";
      drop.dataset.accept = row.id;
      drop.dataset.filled = "0";
      drop.innerHTML = `<div class="dropHint">Trascina qui</div>`;

      const fixed = document.createElement("div");
      fixed.className = "fixed";

       const colorClass = ["pairA","pairB","pairC"][index % 3];
drop.classList.add(colorClass);
fixed.classList.add(colorClass);
      fixed.appendChild(createPieceContent(row.right));

     


      r.appendChild(drop);
      r.appendChild(fixed);
      rightCol.appendChild(r);
    });

    // LEFT pieces shuffled
    const leftPieces = shuffle(pairs.map(p => ({ id: p.id, left: p.left })));
    leftPieces.forEach(p => {
      const piece = document.createElement("div");
      piece.className = "piece";
      piece.dataset.id = p.id;
      piece.dataset.placed = "0";
      piece.appendChild(createPieceContent(p.left));
      leftCol.appendChild(piece);
    });

    setStatus();

    // bottoni (non duplicano listener: assegnazione diretta)
   btnReset.onclick = () => renderGame(pairs, { shuffleRight: false });
btnShuffle.onclick = () => renderGame(pairs, { shuffleRight: true });

  }

  // =========================
  // Listener globali UNA VOLTA
  // =========================
  function bindOnce() {
    if (STATE.bound) return;
    STATE.bound = true;

    // pointerdown SOLO sul contenitore (delegation)
    document.addEventListener("pointerdown", (e) => {
      const c = STATE.ctx;
      if (!c) return;

      // accetto solo se clicco su un pezzo dentro la colonna sinistra
      if (!c.leftCol.contains(e.target)) return;

      const el = e.target.closest(".piece");
      if (!el) return;
      if (el.dataset.placed === "1") return;

      e.preventDefault();

const rect = el.getBoundingClientRect();
const zoom = getCurrentZoom();
const pointerX = e.clientX;
const pointerY = e.clientY;

STATE.drag = {
  el,
  originParent: el.parentElement,
  originNext: el.nextElementSibling,
  offsetX: (pointerX - rect.left) / zoom,
  offsetY: (pointerY - rect.top) / zoom,
};



      el.setPointerCapture?.(e.pointerId);
      el.classList.add("dragging");
      el.style.position = "fixed";
      el.style.left = `${rect.left / zoom}px`;
      el.style.top  = `${rect.top  / zoom}px`;

      el.style.width = `${rect.width}px`;
      el.style.zIndex = String(++STATE.z);

      document.body.classList.add("dragMode");
      highlightDrops(true);
      moveAt(pointerX, pointerY);
    }, { passive: false });

    // SCROOL SCHERMO
function autoScrollDuringDrag(y){
  const scrollMargin = 80;   // distanza dal bordo
  const scrollSpeed = 18;    // velocità scroll

  const viewportHeight = window.innerHeight;

  if(y > viewportHeight - scrollMargin){
    window.scrollBy(0, scrollSpeed);
  }

  if(y < scrollMargin){
    window.scrollBy(0, -scrollSpeed);
  }
}


    window.addEventListener("pointermove", (e) => {
      if (!STATE.drag || !STATE.ctx) return;
      e.preventDefault();
     moveAt(e.clientX, e.clientY);
autoScrollDuringDrag(e.clientY);


      // hover drop
      $$(".drop", STATE.ctx.rightCol).forEach(d => d.classList.remove("over"));
      const drop = getDropUnderPointer(e.clientX, e.clientY);
      if (drop) drop.classList.add("over");
    }, { passive: false });

    window.addEventListener("pointerup", (e) => {
      if (!STATE.drag || !STATE.ctx) return;
      e.preventDefault();

      $$(".drop", STATE.ctx.rightCol).forEach(d => d.classList.remove("over"));

      const el = STATE.drag.el;

let drop = getDropUnderPointer(e.clientX, e.clientY);

// ✅ Se non ho trovato un drop, controllo se sono sopra .fixed
if (!drop) {
  // IMPORTANTISSIMO: nascondo il pezzo trascinato come fa getDropUnderPointer
  el.style.pointerEvents = "none";
  const under = document.elementFromPoint(e.clientX, e.clientY);
  el.style.pointerEvents = "";

  const fixed = under?.closest?.(".fixed");
  if (fixed) {
    const row = fixed.closest(".row");
    const candidateDrop = row?.querySelector(".drop");

    if (candidateDrop && candidateDrop.dataset.filled !== "1") {
      drop = candidateDrop;
    }
  }
}





      if (!drop) {
        resetPieceToLeft(el);
        STATE.drag = null;
        return;
      }

      const ok = (drop.dataset.accept === el.dataset.id);

      if (!ok) {
        drop.classList.add("wrong");
        setTimeout(() => drop.classList.remove("wrong"), 260);
        resetPieceToLeft(el);
        STATE.drag = null;
        return;
      }

      // corretto
     lockIntoDrop(el, drop);

// ✅ audio attach
if (STATE.ctx.sfxAttach) {
  try { STATE.ctx.sfxAttach.currentTime = 0; STATE.ctx.sfxAttach.play(); } catch(e){}
}

STATE.ctx.solved++;
setStatus();


    if (STATE.ctx.solved === STATE.ctx.total) {
  STATE.ctx.status.textContent = `✅ Completato! (${STATE.ctx.solved}/${STATE.ctx.total})`;
  document.body.classList.add("done");

// ✅ WOW: accendo le coppie 2 alla volta (drop + fixed) dalla prima all'ultima
try {
  const rows = Array.from(STATE.ctx.rightCol.querySelectorAll(".row"));
  const stepMs = 350;     // distanza tra una coppia e la successiva
  const holdMs = 520;     // durata glow prima di diventare "verde finale"

  function ensureCheck(el){
    if(!el) return null;
    let mk = el.querySelector(".checkMark");
    if(!mk){
      mk = document.createElement("div");
      mk.className = "checkMark";
      mk.textContent = "✓";
      el.appendChild(mk);
    }
    return mk;
  }

  rows.forEach((row, i) => {
    const drop = row.querySelector(".drop");
    const fixed = row.querySelector(".fixed");

    setTimeout(() => {
      // glow
      drop?.classList.add("wowOn");
      fixed?.classList.add("wowOn");

      // preparo overlay ✓ (nascosto)
      const mk1 = ensureCheck(drop);
      const mk2 = ensureCheck(fixed);

      setTimeout(() => {
        // tolgo glow
        drop?.classList.remove("wowOn");
        fixed?.classList.remove("wowOn");

        // stato verde permanente
        drop?.classList.add("successFinal");
        fixed?.classList.add("successFinal");

        // mostro ✓
        mk1?.classList.add("show");
        mk2?.classList.add("show");
      }, holdMs);

    }, i * stepMs);
  });
} catch(e) {}



  // ✅ audio win
  if (STATE.ctx.sfxWin) {
    try { STATE.ctx.sfxWin.currentTime = 0; STATE.ctx.sfxWin.play(); } catch(e){}
  }

  // piccolo “pulse” sui drop completati
  $$(".drop.filled", STATE.ctx.rightCol).forEach(d => {
    d.classList.add("pulse");
    setTimeout(() => d.classList.remove("pulse"), 450);
  });

} else {
  document.body.classList.remove("done");
}


      STATE.drag = null;
    }, { passive: false });
  }

  function boot() {
    bindOnce();

    if (!window.PAIRS || !Array.isArray(window.PAIRS)) {
      $("#status").textContent = "Errore: PAIRS non trovato (pairs.js).";
      return;
    }

    const params = getParams();
    const filtered = window.PAIRS.filter(p => matchesMeta(p, params));
    if (!filtered.length) {
      $("#status").textContent = "Nessuna coppia trovata con questi filtri.";
      return;
    }

    const limit = parseInt(params.numero || params.n || "", 10);
const list = Number.isFinite(limit) && limit > 0 ? filtered.slice(0, limit) : filtered.slice(0, 6);


    renderGame(list);
  }

  window.MatchPairs = { boot };
})();
