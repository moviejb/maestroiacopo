(() => {
  const IMAGE_BASE = "img/italiano/classe3/";
  const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif", "avif", "svg"];
  const ZOOM_KEY = "ponte_delle_lettere_zoom";
  const ZOOM_MIN = 0.6;
  const ZOOM_MAX = 1.4;
  const ZOOM_STEP = 0.1;

  const els = {
    startBtn: document.getElementById("startBtn"),
    shuffleBtn: document.getElementById("shuffleBtn"),
    resetBtn: document.getElementById("resetBtn"),
    checkBtn: document.getElementById("checkBtn"),
    nextBtn: document.getElementById("nextBtn"),
    difficultySel: document.getElementById("difficultySel"),
    roundCountSel: document.getElementById("roundCountSel"),
    bridgeRow: document.getElementById("bridgeRow"),
    wordImage: document.getElementById("wordImage"),
    imgFallback: document.getElementById("imgFallback"),
    levelBadge: document.getElementById("levelBadge"),
    scoreBadge: document.getElementById("scoreBadge"),
    statusText: document.getElementById("statusText"),
    feedbackText: document.getElementById("feedbackText"),
    shadowWord: document.getElementById("shadowWord"),
    roundNow: document.getElementById("roundNow"),
    roundTotal: document.getElementById("roundTotal"),
    progressFill: document.getElementById("progressFill"),
    gameShell: document.getElementById("gameShell"),
    zoomOutBtn: document.getElementById("zoomOutBtn"),
    zoomInBtn: document.getElementById("zoomInBtn"),
    zoomPct: document.getElementById("zoomPct")
  };

  const source = Array.isArray(window.ITALIANO_CL3) ? window.ITALIANO_CL3 : [];
  let pool = [];
  let rounds = [];
  let currentIndex = -1;
  let score = 0;
  let currentItem = null;
  let currentOrder = [];
  let initialOrder = [];
  let solved = false;
  let selectedIndex = null;
  let dragIndex = null;
  let currentZoom = 1;
  let resizeTimer = null;

  function clampZoom(value) {
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Number(value) || 1));
  }

  function applyZoom(value) {
    currentZoom = clampZoom(value);
    if (els.gameShell) {
      const supportsZoom = typeof CSS !== "undefined" && CSS.supports && CSS.supports("zoom", "1");
      if (supportsZoom) {
        els.gameShell.style.zoom = String(currentZoom);
        els.gameShell.style.transform = "none";
      } else {
        els.gameShell.style.zoom = "1";
        els.gameShell.style.transform = `scale(${currentZoom})`;
        els.gameShell.style.transformOrigin = "top center";
      }
    }
    if (els.zoomPct) {
      els.zoomPct.textContent = `${Math.round(currentZoom * 100)}%`;
    }
    try {
      localStorage.setItem(ZOOM_KEY, String(currentZoom));
    } catch (_) {}
  }

  function changeZoom(delta) {
    const next = Math.round((currentZoom + delta) * 10) / 10;
    applyZoom(next);
  }

  function loadSavedZoom() {
    let saved = 1;
    try {
      saved = Number(localStorage.getItem(ZOOM_KEY)) || 1;
    } catch (_) {}
    applyZoom(saved);
  }



  function applyAdaptiveBridgeSizing() {
    if (!els.bridgeRow) return;
    const len = Math.max(1, currentOrder.length || (currentItem ? normalizeWord(currentItem.word).length : 0) || 1);
    const vw = window.innerWidth || document.documentElement.clientWidth || 1024;
    const root = document.documentElement;

    let tileW;
    let tileH;
    let font;
    let gap;

    if (vw <= 390) {
      tileW = Math.max(44, Math.min(48, Math.floor((vw - 34) / Math.min(len, 6))));
      tileH = Math.round(tileW * 1.15);
      font = Math.max(18, Math.round(tileW * 0.50));
      gap = 4;
    } else if (vw <= 560) {
      tileW = Math.max(48, Math.min(56, Math.floor((vw - 40) / Math.min(len, 6))));
      tileH = Math.round(tileW * 1.16);
      font = Math.max(20, Math.round(tileW * 0.52));
      gap = 4;
    } else if (vw <= 760) {
      tileW = Math.max(58, Math.min(66, Math.floor((vw - 60) / Math.min(len, 7))));
      tileH = Math.round(tileW * 1.14);
      font = Math.max(24, Math.round(tileW * 0.5));
      gap = 6;
    } else if (vw <= 1179) {
      tileW = len >= 9 ? 68 : len >= 7 ? 74 : 78;
      tileH = Math.round(tileW * 1.12);
      font = Math.max(27, Math.round(tileW * 0.48));
      gap = len >= 9 ? 6 : 8;
    } else {
      tileW = len >= 9 ? 76 : len >= 7 ? 82 : 88;
      tileH = Math.round(tileW * 1.10);
      font = Math.max(30, Math.round(tileW * 0.46));
      gap = len >= 9 ? 6 : 8;
    }

    root.style.setProperty('--bridge-tile-w', `${tileW}px`);
    root.style.setProperty('--bridge-tile-h', `${tileH}px`);
    root.style.setProperty('--bridge-font', `${font}px`);
    root.style.setProperty('--bridge-gap', `${gap}px`);
  }

  function normalizeWord(word) {
    return String(word || "")
      .toUpperCase()
      .trim()
      .replace(/\s+/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function setStatus(text) {
    els.statusText.textContent = text;
    els.feedbackText.textContent = text;
  }

  function shuffleArray(arr) {
    const clone = [...arr];
    for (let i = clone.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }

  function filterPool() {
    const mode = els.difficultySel.value;
    return source.filter(item => {
      const len = normalizeWord(item.word).length;
      if (mode === "short") return len >= 4 && len <= 5;
      if (mode === "medium") return len >= 6 && len <= 7;
      if (mode === "long") return len >= 8;
      return len >= 3;
    });
  }

  function buildRounds() {
    pool = filterPool();
    const desired = Math.min(Number(els.roundCountSel.value) || 10, pool.length);
    rounds = shuffleArray(pool).slice(0, desired);
    currentIndex = -1;
    score = 0;
    currentItem = null;
    currentOrder = [];
    initialOrder = [];
    solved = false;
    selectedIndex = null;
    dragIndex = null;

    els.scoreBadge.textContent = String(score);
    els.roundTotal.textContent = String(rounds.length);
    els.roundNow.textContent = "0";
    els.progressFill.style.width = "0%";
    els.levelBadge.textContent = "1";
    els.nextBtn.disabled = true;

    if (!rounds.length) {
      setStatus("Nessuna parola disponibile con questo filtro.");
      els.bridgeRow.innerHTML = "";
      return false;
    }
    setStatus("Premi Verifica quando la parola è pronta.");
    return true;
  }

  async function resolveImage(id) {
    for (const ext of IMAGE_EXTS) {
      const path = `${IMAGE_BASE}${id}.${ext}`;
      const ok = await new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = path + `?v=${Date.now()}`;
      });
      if (ok) return path;
    }
    return null;
  }

  function ensureShuffled(chars) {
    if (chars.length <= 1) return chars;
    let mixed = shuffleArray(chars);
    let guard = 0;
    while (mixed.join("") === chars.join("") && guard < 10) {
      mixed = shuffleArray(chars);
      guard++;
    }
    return mixed;
  }

  function updateRoundUi() {
    const currentHuman = Math.max(0, currentIndex + 1);
    els.roundNow.textContent = String(currentHuman);
    els.levelBadge.textContent = String(currentHuman || 1);
    const total = rounds.length || 1;
    const pct = Math.max(0, Math.min(100, ((currentHuman - (solved ? 0 : 1)) / total) * 100));
    els.progressFill.style.width = `${pct}%`;
  }

  async function loadRound(index) {
    currentIndex = index;
    currentItem = rounds[currentIndex];
    applyAdaptiveBridgeSizing();
    solved = false;
    selectedIndex = null;
    dragIndex = null;
    els.nextBtn.disabled = true;

    const normalized = normalizeWord(currentItem.word);
    const chars = [...normalized];
    currentOrder = ensureShuffled(chars);
    initialOrder = [...currentOrder];

    renderBridge();
    applyAdaptiveBridgeSizing();
    els.shadowWord.textContent = "• ".repeat(chars.length).trim();
    updateRoundUi();
    setStatus("Riordina le lettere per costruire il ponte giusto.");

    const imgPath = await resolveImage(currentItem.id);
    if (currentItem !== rounds[currentIndex]) return;
    if (imgPath) {
      els.wordImage.src = imgPath;
      els.wordImage.classList.remove("hidden");
      els.imgFallback.classList.add("hidden");
    } else {
      els.wordImage.removeAttribute("src");
      els.wordImage.classList.add("hidden");
      els.imgFallback.classList.remove("hidden");
    }
  }

  function createTile(letter, index) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.textContent = letter;
    tile.draggable = true;
    tile.dataset.index = String(index);
    tile.setAttribute("aria-label", `Lettera ${letter}`);

    tile.addEventListener("click", () => handleTileClick(index));

    tile.addEventListener("dragstart", e => {
      dragIndex = index;
      tile.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    });

    tile.addEventListener("dragend", () => {
      tile.classList.remove("dragging");
      dragIndex = null;
    });

    tile.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    tile.addEventListener("drop", e => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData("text/plain"));
      const to = index;
      if (Number.isInteger(from) && from !== to) {
        moveTile(from, to);
      }
    });

    return tile;
  }

  function renderBridge() {
    els.bridgeRow.innerHTML = "";
    currentOrder.forEach((letter, index) => {
      const tile = createTile(letter, index);
      if (selectedIndex === index) tile.classList.add("selected");
      if (solved) tile.classList.add("correct");
      els.bridgeRow.appendChild(tile);
    });
  }

  function reflowSelection(oldIndex, newIndex) {
    if (selectedIndex == null) return;
    if (selectedIndex === oldIndex) {
      selectedIndex = newIndex;
      return;
    }
    if (selectedIndex === newIndex) {
      selectedIndex = oldIndex;
    }
  }

  function moveTile(from, to) {
    if (solved) return;
    const next = [...currentOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    currentOrder = next;
    if (selectedIndex != null) {
      selectedIndex = null;
    }
    renderBridge();
    applyAdaptiveBridgeSizing();
  }

  function swapTiles(a, b) {
    if (solved || a === b) return;
    [currentOrder[a], currentOrder[b]] = [currentOrder[b], currentOrder[a]];
    selectedIndex = null;
    renderBridge();
    applyAdaptiveBridgeSizing();
  }

  function handleTileClick(index) {
    if (solved) return;
    if (selectedIndex == null) {
      selectedIndex = index;
      renderBridge();
      return;
    }
    if (selectedIndex === index) {
      selectedIndex = null;
      renderBridge();
      return;
    }
    swapTiles(selectedIndex, index);
  }

  function markAll(className) {
    els.bridgeRow.querySelectorAll(".tile").forEach(tile => {
      tile.classList.remove("shake", "pop");
      void tile.offsetWidth;
      tile.classList.add(className);
    });
  }

  function verifyRound() {
    if (!currentItem) return;
    const guess = currentOrder.join("");
    const answer = normalizeWord(currentItem.word);
    if (guess === answer) {
      solved = true;
      score += 1;
      els.scoreBadge.textContent = String(score);
      els.shadowWord.textContent = answer.split("").join(" ");
      els.nextBtn.disabled = false;
      markAll("correct");
      markAll("pop");
      els.gameShell.classList.remove("successPulse");
      void els.gameShell.offsetWidth;
      els.gameShell.classList.add("successPulse");
      const done = currentIndex + 1;
      els.progressFill.style.width = `${Math.round((done / rounds.length) * 100)}%`;
      setStatus("Bravo! Ponte completato correttamente.");
      return;
    }
    markAll("shake");
    setStatus("Non ancora. Prova a spostare meglio i riquadri.");
  }

  function resetCurrent() {
    if (!currentItem) return;
    solved = false;
    selectedIndex = null;
    currentOrder = [...initialOrder];
    renderBridge();
    applyAdaptiveBridgeSizing();
    els.shadowWord.textContent = "• ".repeat(currentOrder.length).trim();
    els.nextBtn.disabled = true;
    setStatus("Ponte riportato alla posizione iniziale.");
  }

  function shuffleCurrent() {
    if (!currentItem || solved) return;
    currentOrder = ensureShuffled([...currentOrder]);
    selectedIndex = null;
    renderBridge();
    applyAdaptiveBridgeSizing();
    setStatus("Lettere mescolate di nuovo.");
  }

  function nextRound() {
    if (currentIndex + 1 >= rounds.length) {
      setStatus(`Partita completata! Hai risolto ${score} parole su ${rounds.length}.`);
      els.nextBtn.disabled = true;
      return;
    }
    loadRound(currentIndex + 1);
  }

  function startGame() {
    if (!buildRounds()) return;
    loadRound(0);
  }

  els.startBtn.addEventListener("click", startGame);
  els.shuffleBtn.addEventListener("click", shuffleCurrent);
  els.resetBtn.addEventListener("click", resetCurrent);
  els.checkBtn.addEventListener("click", verifyRound);
  els.nextBtn.addEventListener("click", nextRound);
  if (els.zoomOutBtn) els.zoomOutBtn.addEventListener("click", () => changeZoom(-ZOOM_STEP));
  if (els.zoomInBtn) els.zoomInBtn.addEventListener("click", () => changeZoom(ZOOM_STEP));

  loadSavedZoom();
  applyAdaptiveBridgeSizing();

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyAdaptiveBridgeSizing();
    }, 60);
  });

  if (!source.length) {
    setStatus("Archivio parole non trovato. Controlla il file js delle parole.");
  } else {
    buildRounds();
  }
})();
