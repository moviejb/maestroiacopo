const POSITIONS = ['K', 'h', 'da', 'u', ',', 'd', 'c', 'm'];
const POSITION_NAMES = {
  K: 'migliaia',
  h: 'centinaia',
  da: 'decine',
  u: 'unità',
  ',': 'virgola',
  d: 'decimi',
  c: 'centesimi',
  m: 'millesimi'
};
const POS_CLASS = {
  K: 'K',
  h: 'h',
  da: 'da',
  u: 'u',
  ',': 'comma',
  d: 'd',
  c: 'c',
  m: 'm'
};

const slotElements = [...document.querySelectorAll('.drop-slot')];
const tray = document.getElementById('tileTray');
const trayRow = document.getElementById('tileTrayRow');
const targetInput = document.getElementById('targetInput');
const feedbackBox = document.getElementById('feedbackBox');
const decompositionBox = document.getElementById('decompositionBox');
const decompositionText = document.getElementById('decompositionText');
const checkBtn = document.getElementById('checkBtn');
const resetBtn = document.getElementById('resetBtn');
const nextBtn = document.getElementById('nextBtn');
const easyBtn = document.getElementById('easyBtn');
const hardBtn = document.getElementById('hardBtn');
const applyNumberBtn = document.getElementById('applyNumberBtn');

/*ZOOM*/
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const zoomRange = document.getElementById('zoomRange');




let currentRound = null;
let draggedTile = null;
let difficulty = 'easy';
let pointerDrag = null;

function getTraySlotOfTile(tile){
  return tile?.parentElement?.closest('.tray-slot') || null;
}

function rand(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr){
  return arr[rand(0, arr.length - 1)];
}
function buildDigits(length, noLeadingZero = false, allowZeroes = true){
  let out = '';
  for (let i = 0; i < length; i++) {
    let digit;
    if (i === 0 && noLeadingZero) digit = rand(1, 9);
    else digit = allowZeroes ? rand(0, 9) : rand(1, 9);
    out += digit;
  }
  return out;
}

function generateNumberString(){
  const type = Math.random();
  if (type < 0.25) return String(rand(1, 9999));
  if (type < 0.55) {
    const intLen = rand(1, 4);
    const decLen = rand(1, 3);
    const intPart = buildDigits(intLen, true);
    const decPart = buildDigits(decLen, false, true);
    return `${intPart},${decPart}`;
  }
  if (type < 0.78) {
    const patterns = [
      `${rand(1, 9)},${rand(0, 9)}${rand(1, 9)}`,
      `${rand(1, 9)}${rand(0, 9)},${rand(1, 9)}`,
      `${rand(1, 9)}${rand(0, 9)}${rand(0, 9)},${rand(1, 9)}${rand(0, 9)}`,
      `${rand(1, 9)},0${rand(1, 9)}`,
      `${rand(1, 9)}${rand(0, 9)},0${rand(1, 9)}`
    ];
    return pick(patterns);
  }
  return pick(['5,07','12,4','208','430,5','6,08','74','901,03','1002','38,125','999,9','70,01','120,345']);
}

function mapStringToBoard(numberStr){
  const board = Object.fromEntries(POSITIONS.map(p => [p, '']));
  const charMeta = [];
  const [intPart, decPart = ''] = numberStr.split(',');
  const intCols = ['K', 'h', 'da', 'u'];
  const decCols = ['d', 'c', 'm'];

  const intDigits = intPart.split('');
  const startInt = intCols.length - intDigits.length;
  intDigits.forEach((ch, idx) => {
    const pos = intCols[startInt + idx];
    board[pos] = ch;
    charMeta.push({ char: ch, pos });
  });

  if (numberStr.includes(',')) {
    board[','] = ',';
    charMeta.push({ char: ',', pos: ',' });
  }

  decPart.split('').forEach((ch, idx) => {
    if (!decCols[idx]) return;
    const pos = decCols[idx];
    board[pos] = ch;
    charMeta.push({ char: ch, pos });
  });

  return { board, charMeta };
}

function createRound(numberStr = generateNumberString()){
  const { board, charMeta } = mapStringToBoard(numberStr);
  return { numberStr, board, charMeta };
}

function sanitizeNumberInput(value){
  return String(value || '')
    .replace(/\./g, ',')
    .replace(/[^0-9,]/g, '')
    .replace(/,{2,}/g, ',')
    .replace(/,(?=.*[,])/g, '');
}

function isValidCustomNumber(value){
  return /^\d{1,4}(,\d{1,3})?$/.test(value);
}


function clearBoard(){
  slotElements.forEach(slot => {
    slot.classList.remove('correct', 'wrong', 'active');
    const tile = slot.querySelector('.tile');
    if (tile) {
      const origin = trayRow.querySelector(`.tray-slot[data-origin-id="${tile.dataset.id}"]`);
      if (origin) {
        origin.appendChild(tile);
        origin.classList.remove('filled');
      }
    }
  });
  updateTrayLayout();
}

function resetFeedback(){
  feedbackBox.textContent = 'Sistema tutte le tessere nella tabella e poi premi VERIFICA.';
  feedbackBox.className = 'feedback-box';
  decompositionBox.classList.add('hidden');
  decompositionText.textContent = '';
}

function applyTileStyle(tile, pos){
  tile.className = 'tile';
  if (difficulty === 'easy') tile.classList.add(`easy-pos-${POS_CLASS[pos]}`);
  else tile.classList.add('hard');
}

function makeTile(meta, index){
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tile';
  btn.textContent = meta.char;
  btn.draggable = true;
  btn.dataset.char = meta.char;
  btn.dataset.pos = meta.pos;
  btn.dataset.id = `tile-${index}-${meta.char}-${meta.pos}`;
  btn.setAttribute('aria-label', `Tessera ${meta.char}`);
  applyTileStyle(btn, meta.pos);

  btn.addEventListener('dragstart', () => {
    if (pointerDrag) return;
    draggedTile = btn;
    setTimeout(() => btn.style.opacity = '.55', 0);
  });
  btn.addEventListener('dragend', () => {
    if (pointerDrag) return;
    btn.style.opacity = '1';
    draggedTile = null;
  });
  btn.addEventListener('pointerdown', startPointerDrag);
  btn.addEventListener('dblclick', () => {
    moveTileToOrigin(btn);
  });
  return btn;
}


function updateTrayLayout(){
  const count = currentRound?.charMeta?.length || 1;
  trayRow.style.setProperty('--tile-count', String(count));
  const mobile = window.innerWidth <= 640;
  if (mobile) {
    const gap = 4;
    const horizontalPadding = 8;
    const trayWidth = Math.max(0, tray.clientWidth - horizontalPadding);
    const size = Math.min(46, Math.max(22, Math.floor((trayWidth - gap * (count - 1)) / count)));
    trayRow.style.setProperty('--tile-size', `${size}px`);
  } else if (window.innerWidth <= 860) {
    trayRow.style.setProperty('--tile-size', '64px');
  } else {
    trayRow.style.setProperty('--tile-size', '72px');
  }
}

function buildTray(){
  trayRow.innerHTML = '';
  currentRound.charMeta.forEach((meta, index) => {
    const slot = document.createElement('div');
    slot.className = 'tray-slot';
    slot.dataset.originId = `tile-${index}-${meta.char}-${meta.pos}`;
    const tile = makeTile(meta, index);
    slot.appendChild(tile);
trayRow.appendChild(slot);
  });
}

function updateTrayStates(){
  [...trayRow.querySelectorAll('.tray-slot')].forEach(slot => {
    const hasTile = !!slot.querySelector('.tile');
    slot.classList.toggle('filled', !hasTile);
  });
}

function firstEmptyTraySlot(){
  return [...trayRow.querySelectorAll('.tray-slot')].find(slot => !slot.querySelector('.tile')) || null;
}

function slotForHomeIndex(tile){
  return trayRow.querySelector(`.tray-slot[data-origin-id="${tile.dataset.id}"]`);
}

function moveTileToOrigin(tile){
  const home = slotForHomeIndex(tile);
  const empty = firstEmptyTraySlot();
  if (home && !home.querySelector('.tile')) home.appendChild(tile);
  else if (empty) empty.appendChild(tile);
  else if (home) home.appendChild(tile);
  updateTrayStates();
}

function getTrayNumberString(){
  return [...trayRow.querySelectorAll('.tray-slot')]
    .map(slot => slot.querySelector('.tile')?.dataset.char || '')
    .join('');
}

function refreshTrayTileColors(){
  const trayString = getTrayNumberString();
  if (!isValidCustomNumber(trayString)) return;
  const updated = createRound(trayString);
  const tiles = [...trayRow.querySelectorAll('.tray-slot .tile')];
  tiles.forEach((tile, index) => {
    const meta = updated.charMeta[index];
    if (!meta) return;
    tile.dataset.pos = meta.pos;
    applyTileStyle(tile, meta.pos);
    tile.textContent = meta.char;
    tile.dataset.char = meta.char;
  });
}

function syncRoundFromTray(){
  const trayNumber = getTrayNumberString();
  if (!isValidCustomNumber(trayNumber)) return;
  currentRound = createRound(trayNumber);
  refreshTrayTileColors();
  targetInput.value = trayNumber;
  nextBtn.disabled = true;
  resetFeedback();
  slotElements.forEach(slot => slot.classList.remove('correct', 'wrong', 'active'));
}

function swapTilesBetweenSlots(sourceTile, destinationSlot){
  const sourceSlot = sourceTile.parentElement?.closest('.tray-slot');
  if (!sourceSlot || sourceSlot === destinationSlot) return;
  const otherTile = destinationSlot.querySelector('.tile');
  if (otherTile) sourceSlot.appendChild(otherTile);
  destinationSlot.appendChild(sourceTile);
  updateTrayStates();
  syncRoundFromTray();
}

function loadRound(){
  currentRound = createRound();
  clearBoard();
targetInput.value = currentRound.numberStr;
  buildTray();
  nextBtn.disabled = true;
  resetFeedback();
}

function placeTileInSlot(tile, slot){
  const existing = slot.querySelector('.tile');
  if (existing) moveTileToOrigin(existing);

  const currentParent = tile.parentElement;
  if (currentParent && currentParent.classList.contains('tray-slot')) {
    currentParent.classList.remove('filled');
  }
  slot.appendChild(tile);
  updateTrayStates();
}

function getClientPoint(evt){
  if (evt.changedTouches && evt.changedTouches[0]) return evt.changedTouches[0];
  if (evt.touches && evt.touches[0]) return evt.touches[0];
  return evt;
}

function highlightDropTarget(x, y){
  document.querySelectorAll('.drop-slot.active, .tray-slot.active-drop').forEach(el => {
    el.classList.remove('active', 'active-drop');
  });
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const slot = el.closest('.drop-slot');
  if (slot) {
    slot.classList.add('active');
    return slot;
  }
  const traySlot = el.closest('.tray-slot');
  if (traySlot) {
    traySlot.classList.add('active-drop');
    return traySlot;
  }
  const trayBox = el.closest('#tileTray');
  if (trayBox) return trayBox;
  return null;
}

function cleanupPointerDrag(){
  document.querySelectorAll('.drop-slot.active, .tray-slot.active-drop').forEach(el => {
    el.classList.remove('active', 'active-drop');
  });
  if (pointerDrag?.ghost) pointerDrag.ghost.remove();
  if (pointerDrag?.tile) {
    pointerDrag.tile.classList.remove('pointer-hidden');
    pointerDrag.tile.style.opacity = '1';
  }
  if (pointerDrag?.originTraySlot) {
    pointerDrag.originTraySlot.classList.remove('drag-origin');
  }
  pointerDrag = null;
  draggedTile = null;
}

function finishPointerDrag(clientX, clientY){
  if (!pointerDrag) return;
  const tile = pointerDrag.tile;
  const dropTarget = highlightDropTarget(clientX, clientY);

  if (dropTarget?.classList?.contains('drop-slot')) {
    placeTileInSlot(tile, dropTarget);
  } else if (dropTarget?.classList?.contains('tray-slot')) {
    const sourceTraySlot = tile.parentElement?.closest('.tray-slot');
    if (sourceTraySlot) swapTilesBetweenSlots(tile, dropTarget);
    else {
      const displaced = dropTarget.querySelector('.tile');
      dropTarget.appendChild(tile);
      if (displaced) moveTileToOrigin(displaced);
      updateTrayStates();
    }
  } else if (dropTarget?.id === 'tileTray') {
    moveTileToOrigin(tile);
  }
  cleanupPointerDrag();
}

function onPointerMove(evt){
  if (!pointerDrag) return;
  const p = getClientPoint(evt);
  pointerDrag.ghost.style.left = `${p.clientX}px`;
  pointerDrag.ghost.style.top = `${p.clientY}px`;
  highlightDropTarget(p.clientX, p.clientY);
  evt.preventDefault();
}

function onPointerUp(evt){
  if (!pointerDrag) return;
  const p = getClientPoint(evt);
  finishPointerDrag(p.clientX, p.clientY);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);
}

function startPointerDrag(evt){
  if (evt.pointerType === 'mouse' && evt.button !== 0) return;
  const tile = evt.currentTarget;
  const rect = tile.getBoundingClientRect();
  const ghost = tile.cloneNode(true);
  ghost.classList.add('drag-ghost');
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  document.body.appendChild(ghost);

  const p = getClientPoint(evt);
  ghost.style.left = `${p.clientX}px`;
  ghost.style.top = `${p.clientY}px`;

  const originTraySlot = getTraySlotOfTile(tile);
  if (originTraySlot) originTraySlot.classList.add('drag-origin');

  tile.classList.add('pointer-hidden');
  draggedTile = tile;
  pointerDrag = { tile, ghost, originTraySlot };

  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  window.addEventListener('pointercancel', onPointerUp, { passive: false });
  evt.preventDefault();
}

slotElements.forEach(slot => {
  slot.addEventListener('dragover', e => {
    e.preventDefault();
    slot.classList.add('active');
  });
  slot.addEventListener('dragleave', () => slot.classList.remove('active'));
  slot.addEventListener('drop', e => {
    e.preventDefault();
    slot.classList.remove('active');
    if (!draggedTile) return;
    placeTileInSlot(draggedTile, slot);
  });
});

trayRow.addEventListener('dragover', e => {
  const traySlot = e.target.closest('.tray-slot');
  if (!traySlot) return;
  e.preventDefault();
});

tray.addEventListener('dragover', e => e.preventDefault());

trayRow.addEventListener('drop', e => {
  const traySlot = e.target.closest('.tray-slot');
  if (!traySlot || !draggedTile) return;
  e.preventDefault();
  const sourceTraySlot = draggedTile.parentElement?.closest('.tray-slot');
  if (sourceTraySlot) swapTilesBetweenSlots(draggedTile, traySlot);
  else {
    const displaced = traySlot.querySelector('.tile');
    traySlot.appendChild(draggedTile);
    if (displaced) moveTileToOrigin(displaced);
    updateTrayStates();
  }
  draggedTile = null;
});

tray.addEventListener('drop', e => {
  e.preventDefault();
  if (draggedTile) {
    moveTileToOrigin(draggedTile);
    draggedTile = null;
  }
});


function restartAnimation(el, className){
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function animateFeedback(){
  restartAnimation(feedbackBox, 'fx-pop');
}

function animateSlots(type){
  const cls = type === 'correct' ? 'fx-correct' : 'fx-wrong';
  slotElements.forEach(slot => {
    if (slot.classList.contains(type)) restartAnimation(slot, cls);
  });
}

let audioCtx = null;
function playToneSequence(tones){
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const start = audioCtx.currentTime + 0.01;
    tones.forEach((tone, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = tone.type || 'sine';
      osc.frequency.setValueAtTime(tone.freq, start + tone.at);
      gain.gain.setValueAtTime(0.0001, start + tone.at);
      gain.gain.exponentialRampToValueAtTime(tone.volume || 0.06, start + tone.at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.at + tone.duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start + tone.at);
      osc.stop(start + tone.at + tone.duration + 0.03);
    });
  } catch (err) {
    // Audio opzionale: se il browser lo blocca, il gioco continua normalmente.
  }
}

function playSuccessSound(){
  playToneSequence([
    { freq: 523.25, at: 0.00, duration: 0.16, volume: 0.05, type: 'sine' },
    { freq: 659.25, at: 0.10, duration: 0.16, volume: 0.05, type: 'sine' },
    { freq: 783.99, at: 0.22, duration: 0.24, volume: 0.06, type: 'triangle' }
  ]);
}

function playErrorSound(){
  playToneSequence([
    { freq: 329.63, at: 0.00, duration: 0.12, volume: 0.045, type: 'sine' },
    { freq: 246.94, at: 0.10, duration: 0.18, volume: 0.05, type: 'triangle' }
  ]);
}

function evaluateBoard(){
  let allCorrect = true;
  let somethingMissing = false;
  slotElements.forEach(slot => {
    slot.classList.remove('correct', 'wrong');
    const pos = slot.dataset.pos;
    const tile = slot.querySelector('.tile');
    const expected = currentRound.board[pos] || '';
    const actual = tile ? tile.dataset.char : '';

    if (expected === '' && actual === '') return;
    if (actual === '') {
      somethingMissing = true;
      allCorrect = false;
      slot.classList.add('wrong');
      return;
    }
    if (actual === expected) {
      slot.classList.add('correct');
    } else {
      allCorrect = false;
      slot.classList.add('wrong');
    }
  });

  if (allCorrect) {
    feedbackBox.textContent = 'OTTIMO! Tutte le cifre sono al posto giusto.';
    feedbackBox.className = 'feedback-box good';
    animateSlots('correct');
    animateFeedback();
    playSuccessSound();
    nextBtn.disabled = false;
    showDecomposition();
  } else if (somethingMissing) {
    feedbackBox.textContent = 'Attenzione: manca ancora qualche tessera da sistemare.';
    feedbackBox.className = 'feedback-box bad';
    animateSlots('wrong');
    animateFeedback();
    playErrorSound();
    decompositionBox.classList.add('hidden');
  } else {
    feedbackBox.textContent = 'Controlla bene: alcune tessere non sono nella colonna corretta.';
    feedbackBox.className = 'feedback-box bad';
    animateSlots('wrong');
    animateFeedback();
    playErrorSound();
    decompositionBox.classList.add('hidden');
  }
}

function formatValueForPosition(pos, digit){
  if (['K', 'h', 'da', 'u'].includes(pos)) {
    const valueMap = { K: 1000, h: 100, da: 10, u: 1 };
    if (digit === '0') return '0';
    return String(Number(digit) * valueMap[pos]);
  }
  const decIndex = { d: 1, c: 2, m: 3 }[pos];
  return `0,${'0'.repeat(decIndex - 1)}${digit}`;
}

function buildDecompositionItems(){
  const order = ['K', 'h', 'da', 'u', 'd', 'c', 'm'];
  return order
    .map(pos => ({ pos, digit: currentRound.board[pos] }))
    .filter(item => item.digit !== '')
    .map(item => ({
      ...item,
      value: formatValueForPosition(item.pos, item.digit),
      label: POSITION_NAMES[item.pos]
    }));
}

function escapeHtml(value){
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showDecomposition(){
  const items = buildDecompositionItems();
  const summary = items.length
    ? items.map(item => `<span class="decomp-number-chip ${POS_CLASS[item.pos]}">${escapeHtml(item.value)}</span>`).join('<span class="decomp-plus">+</span>')
    : '<span class="decomp-number-chip u">0</span>';

  const legend = items.length
  ? (() => {
      const chips = items.map(item => `
        <span class="decomp-chip ${POS_CLASS[item.pos]}">${escapeHtml(item.digit)} = ${escapeHtml(item.label)}</span>
      `);

      const unitIndex = items.findIndex(item => item.pos === 'u');
      const commaChip = `<span class="decomp-chip comma">,</span>`;

      if (unitIndex !== -1 && items.some(item => ['d', 'c', 'm'].includes(item.pos))) {
        chips.splice(unitIndex + 1, 0, commaChip);
      }

      return chips.join('');
    })()
  : '<span class="decomp-chip u">0 = unità</span>';

  decompositionText.innerHTML = `
    <div class="decomp-line">
      <span class="decomp-number-chip">${escapeHtml(currentRound.numberStr)}</span>
      <span class="decomp-equals">=</span>
      ${summary}
    </div>
    <div class="decomp-legend-title">OGNI CIFRA AL SUO POSTO</div>
    <div class="decomp-legend">${legend}</div>
  `;

  decompositionBox.classList.remove('hidden');
}
function setDifficulty(mode){
  difficulty = mode;
  easyBtn.classList.toggle('active', mode === 'easy');
  hardBtn.classList.toggle('active', mode === 'hard');
  document.querySelectorAll('.tile').forEach(tile => {
    applyTileStyle(tile, tile.dataset.pos);
  });
}

checkBtn.addEventListener('click', evaluateBoard);
resetBtn.addEventListener('click', () => {
  clearBoard();
  resetFeedback();
  nextBtn.disabled = true;
});
nextBtn.addEventListener('click', loadRound);
easyBtn.addEventListener('click', () => setDifficulty('easy'));
hardBtn.addEventListener('click', () => setDifficulty('hard'));

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement !== targetInput) evaluateBoard();
});

function applyCustomNumber(){
  const clean = sanitizeNumberInput(targetInput.value);
  targetInput.value = clean;
  if (!isValidCustomNumber(clean)) {
    feedbackBox.textContent = 'Scrivi un numero valido: fino a 4 cifre prima della virgola e fino a 3 dopo.';
    feedbackBox.className = 'feedback-box bad';
    return;
  }
  currentRound = createRound(clean);
  clearBoard();
  buildTray();
  nextBtn.disabled = true;
  resetFeedback();
}

applyNumberBtn.addEventListener('click', applyCustomNumber);
targetInput.addEventListener('input', () => {
  const clean = sanitizeNumberInput(targetInput.value);
  if (clean !== targetInput.value) targetInput.value = clean;
});
targetInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    applyCustomNumber();
  }
});
targetInput.addEventListener('blur', () => {
  const clean = sanitizeNumberInput(targetInput.value);
  if (isValidCustomNumber(clean)) {
    targetInput.value = clean;
    currentRound = createRound(clean);
    clearBoard();
    buildTray();
    nextBtn.disabled = true;
    resetFeedback();
  }
});

const ZOOM_MIN = 60;
const ZOOM_MAX = 140;
const ZOOM_STEP = 10;
const ZOOM_KEY = 'valore_posizionale_zoom';

function clampZoom(value){
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value));
}

function applyZoom(percent){
  const safePercent = Math.max(60, Math.min(140, percent));
  const scale = safePercent / 100;

  if (gameZoomWrap) {
    gameZoomWrap.style.transform = `scale(${scale})`;
    gameZoomWrap.style.transformOrigin = 'top center';
  }

  if (zoomRange) zoomRange.value = String(safePercent);
  if (zoomResetBtn) zoomResetBtn.textContent = `${safePercent}%`;

  try {
    localStorage.setItem('valore_posizionale_zoom', String(safePercent));
  } catch (err) {}
}

function changeZoom(delta){
  const current = Number(zoomRange?.value || 100);
  applyZoom(current + delta);
}

function initZoom(){
  let saved = 100;
  try {
    saved = Number(localStorage.getItem(ZOOM_KEY) || 100);
  } catch (err) {}
  applyZoom(saved);

  zoomOutBtn?.addEventListener('click', () => changeZoom(-ZOOM_STEP));
  zoomInBtn?.addEventListener('click', () => changeZoom(ZOOM_STEP));
  zoomResetBtn?.addEventListener('click', () => applyZoom(100));
  zoomRange?.addEventListener('input', e => applyZoom(Number(e.target.value)));
}

initZoom();
loadRound();
setDifficulty('easy');

window.addEventListener('resize', updateTrayLayout);
