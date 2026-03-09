(function(){
  const $ = (sel) => document.querySelector(sel);

  const state = {
    items: [],
    index: 0,
    score: 0,
    zoom: 100,
    solved: false,
    shiftCount: 0,
    maxShift: 6,
    dragSlot: null,
    hasMovedComma: false,
    dragActive: false
  };

  const els = {
    fractionNum: $('#fractionNum'),
    fractionDen: $('#fractionDen'),
    denValue: $('#denValue'),
    currentIndex: $('#currentIndex'),
    totalCount: $('#totalCount'),
    scoreValue: $('#scoreValue'),
    bridgeSteps: $('#bridgeSteps'),
    numberBoard: $('#numberBoard'),
    btnLeft: $('#btnLeft'),
    btnRight: $('#btnRight'),
    btnVerify: $('#btnVerify'),
    btnNext: $('#btnNext'),
    btnPlay: $('#btnPlay'),
    btnHome: $('#btnHome'),
    resultOverlay: $('#resultOverlay'),
    popupTitle: $('#popupTitle'),
    popupText: $('#popupText'),
    popupEmoji: $('#popupEmoji'),
    popupContinue: $('#popupContinue'),
    gameScaler: $('#gameScaler'),
    zoomLabel: $('#zoomLabel'),
    zoomIn: $('#zoomIn'),
    zoomOut: $('#zoomOut'),
    hintText: $('#hintText'),
    fractionBox: $('#fractionBox')
  };

  function shuffle(arr){
    const a = [...arr];
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function countZeros(den){
    return String(den).replace(/[^0]/g,'').length;
  }

  function expectedDecimalString(num, den){
    return String(num / den).replace('.', ',');
  }

  function getRawDigits(){
    return String(state.items[state.index].num);
  }

  function simplifyDecimalParts(integerPart, fractionalPart){
    const trimmedFractional = fractionalPart.replace(/0+$/,'');
    if(!trimmedFractional){
      return {
        digits: integerPart.split(''),
        commaSlot: integerPart.length,
        answer: integerPart
      };
    }

    return {
      digits: (integerPart + trimmedFractional).split(''),
      commaSlot: integerPart.length,
      answer: `${integerPart},${trimmedFractional}`
    };
  }

  function getRenderModel(shiftCount = state.shiftCount){
    const raw = getRawDigits();
    const len = raw.length;

    if(shiftCount <= 0){
      return {
        digits: raw.split(''),
        commaSlot: raw.length,
        answer: raw,
        visibleShift: 0
      };
    }

    if(shiftCount < len){
      const integerPart = raw.slice(0, len - shiftCount);
      const fractionalPart = raw.slice(len - shiftCount);
      const simplified = simplifyDecimalParts(integerPart, fractionalPart);
      return {
        ...simplified,
        visibleShift: shiftCount
      };
    }

    const extraZeros = shiftCount - len;
    const integerPart = '0';
    const fractionalPart = `${'0'.repeat(extraZeros)}${raw}`;
    const simplified = simplifyDecimalParts(integerPart, fractionalPart);
    return {
      ...simplified,
      visibleShift: shiftCount
    };
  }

  function renderBridge(){
    const zeros = countZeros(state.items[state.index].den);
    els.bridgeSteps.innerHTML = '';
    for(let i=0;i<zeros;i++){
      const step = document.createElement('div');
      step.className = 'stepTile' + (i < state.shiftCount ? ' done' : '');
      step.textContent = '0';
      els.bridgeSteps.appendChild(step);
    }
  }

  function createDigitTile(value, extraClass=''){
    const tile = document.createElement('div');
    tile.className = `tile ${extraClass}`.trim();
    tile.textContent = value;
    return tile;
  }

  function createSlot(index){
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot';
    slot.dataset.slot = String(index);
    slot.setAttribute('aria-label', `Posizione ${index + 1} per la virgola`);
    slot.addEventListener('click', () => {
      if(state.solved) return;
      setShiftFromSlot(index);
    });
    return slot;
  }

  function createCommaTile(){
    const comma = document.createElement('div');
    comma.className = 'commaTile';
    comma.id = 'commaTile';
    comma.textContent = ',';
    comma.setAttribute('role', 'button');
    comma.setAttribute('aria-label', 'Virgola trascinabile');
    comma.addEventListener('pointerdown', onCommaPointerDown);
    return comma;
  }

  function renderBoard(){
    const model = getRenderModel();
    els.numberBoard.innerHTML = '';

    for(let slotIndex = 0; slotIndex <= model.digits.length; slotIndex++){
      const slot = createSlot(slotIndex);
      if(slotIndex === model.commaSlot){
        slot.classList.add('hasComma');
        slot.appendChild(createCommaTile());
      } else if(state.hasMovedComma && !state.dragActive){
        slot.classList.add('guideOff');
      }
      els.numberBoard.appendChild(slot);

      if(slotIndex < model.digits.length){
        const isSoftZero = model.answer.startsWith('0,') && slotIndex === 0 && model.digits[slotIndex] === '0';
        els.numberBoard.appendChild(createDigitTile(model.digits[slotIndex], isSoftZero ? 'zeroLead' : ''));
      }
    }

    updateArrowState();
  }

  function updateArrowState(){
    els.btnRight.disabled = state.solved || state.shiftCount <= 0;
    els.btnLeft.disabled = state.solved || state.shiftCount >= state.maxShift;
  }

  function getCurrentAnswer(){
    return getRenderModel().answer;
  }

  function renderExercise(){
    const item = state.items[state.index];
    const zeros = countZeros(item.den);
    state.shiftCount = 0;
    state.maxShift = Math.max(zeros + 3, String(item.num).length + 3);
    state.solved = false;
    state.hasMovedComma = false;
    state.dragActive = false;

    els.fractionNum.textContent = item.num;
    els.fractionDen.textContent = item.den;
    els.denValue.textContent = item.den;
    els.currentIndex.textContent = state.index + 1;
    els.totalCount.textContent = state.items.length;
    els.scoreValue.textContent = state.score;
    els.hintText.textContent = 'La virgola parte da destra. Puoi trascinarla ovunque oppure usare le frecce per spostarla.';
    els.btnNext.disabled = true;
    els.btnVerify.disabled = true;

    renderBridge();
    renderBoard();
  }

  function beep(type='ok'){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = type === 'ok' ? 660 : 240;
      gain.gain.value = 0.001;
      osc1.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'ok' ? 0.22 : 0.28));
      if(type === 'ok'){
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 880;
        osc2.connect(gain);
        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.22);
        osc2.stop(now + 0.26);
      }else{
        osc1.start(now);
        osc1.stop(now + 0.28);
      }
    }catch(err){}
  }

  function showPopup(ok, text){
    els.popupEmoji.textContent = ok ? '🎉' : '🙂';
    els.popupTitle.textContent = ok ? 'OTTIMO!' : 'ERRATO';
    els.popupText.textContent = text;
    els.popupContinue.textContent = ok ? 'CONTINUA' : 'CHIUDI';
    els.resultOverlay.classList.remove('hidden');
    els.resultOverlay.setAttribute('aria-hidden', 'false');
  }

  function hidePopup(){
    els.resultOverlay.classList.add('hidden');
    els.resultOverlay.setAttribute('aria-hidden', 'true');
  }

  function verify(){
    if(state.solved || els.btnVerify.disabled) return;
    const item = state.items[state.index];
    const expected = expectedDecimalString(item.num, item.den);
    const answer = getCurrentAnswer();

    if(answer === expected){
      state.solved = true;
      state.score += 1;
      els.scoreValue.textContent = state.score;
      els.btnNext.disabled = false;
      els.btnVerify.disabled = true;
      els.fractionBox.classList.remove('shake');
      els.fractionBox.classList.add('pulseOk');
      setTimeout(()=>els.fractionBox.classList.remove('pulseOk'), 520);
      renderBoard();
      beep('ok');
      showPopup(true, `${item.num}/${item.den} = ${expected}`);
    } else {
      els.fractionBox.classList.remove('pulseOk');
      void els.fractionBox.offsetWidth;
      els.fractionBox.classList.add('shake');
      setTimeout(()=>els.fractionBox.classList.remove('shake'), 360);
      beep('no');
      showPopup(false, `Hai scritto ${answer}. La risposta giusta è ${expected}.`);
    }
  }

  function nextExercise(){
    hidePopup();
    if(state.index < state.items.length - 1){
      state.index += 1;
      renderExercise();
    } else {
      els.popupEmoji.textContent = '🏁';
      els.popupTitle.textContent = 'PARTITA FINITA!';
      els.popupText.textContent = `Hai totalizzato ${state.score} punti su ${state.items.length}. Premi CONTINUA per ricominciare.`;
      els.popupContinue.textContent = 'RICOMINCIA';
      els.resultOverlay.classList.remove('hidden');
      els.resultOverlay.setAttribute('aria-hidden', 'false');
      state.index = 0;
      state.score = 0;
      renderExercise();
    }
  }

  function moveLeft(){
    if(state.solved) return;
    state.shiftCount = Math.min(state.maxShift, state.shiftCount + 1);
    state.hasMovedComma = true;
    els.btnVerify.disabled = false;
    els.btnNext.disabled = true;
    renderBridge();
    renderBoard();
  }

  function moveRight(){
    if(state.solved) return;
    state.shiftCount = Math.max(0, state.shiftCount - 1);
    state.hasMovedComma = true;
    els.btnVerify.disabled = false;
    els.btnNext.disabled = true;
    renderBridge();
    renderBoard();
  }

  function setShiftFromSlot(slotIndex){
    const model = getRenderModel();
    const visibleDigits = model.digits.length;
    state.shiftCount = Math.max(0, Math.min(state.maxShift, visibleDigits - slotIndex));
    state.hasMovedComma = true;
    state.dragActive = false;
    els.btnVerify.disabled = false;
    els.btnNext.disabled = true;
    renderBridge();
    renderBoard();
  }

  function clearDropTargets(){
    els.numberBoard.querySelectorAll('.slot.activeTarget').forEach(el => el.classList.remove('activeTarget'));
  }

  function findSlotAtPoint(x, y){
    const el = document.elementFromPoint(x, y);
    return el && el.classList && el.classList.contains('slot') ? el : el?.closest?.('.slot') || null;
  }

  function onCommaPointerDown(ev){
    if(state.solved) return;
    state.dragActive = true;
    els.numberBoard.classList.add('dragging-guides');
    const liveComma = document.getElementById('commaTile');
    if(!liveComma) return;
    const freshRect = liveComma.getBoundingClientRect();
    const freshOffsetX = ev.clientX - freshRect.left;
    const freshOffsetY = ev.clientY - freshRect.top;
    const comma = liveComma;
    comma.setPointerCapture(ev.pointerId);
    comma.classList.add('dragging');
    comma.style.position = 'fixed';
    comma.style.left = `${freshRect.left}px`;
    comma.style.top = `${freshRect.top}px`;
    comma.style.width = `${freshRect.width}px`;
    comma.style.height = `${freshRect.height}px`;
    comma.style.margin = '0';
    comma.style.zIndex = '999';
    comma.style.pointerEvents = 'none';

    function onMove(e){
      comma.style.left = `${e.clientX - freshOffsetX}px`;
      comma.style.top = `${e.clientY - freshOffsetY}px`;
      clearDropTargets();
      const slot = findSlotAtPoint(e.clientX, e.clientY);
      if(slot){
        slot.classList.add('activeTarget');
        state.dragSlot = Number(slot.dataset.slot);
      } else {
        state.dragSlot = null;
      }
    }

    function onUp(e){
      comma.releasePointerCapture(e.pointerId);
      comma.removeEventListener('pointermove', onMove);
      comma.removeEventListener('pointerup', onUp);
      comma.removeEventListener('pointercancel', onUp);
      clearDropTargets();
      const slot = findSlotAtPoint(e.clientX, e.clientY);
      const targetSlot = slot ? Number(slot.dataset.slot) : state.dragSlot;
      state.dragSlot = null;
      state.dragActive = false;
      els.numberBoard.classList.remove('dragging-guides');
      if(Number.isInteger(targetSlot)) setShiftFromSlot(targetSlot);
      else renderBoard();
    }

    comma.addEventListener('pointermove', onMove);
    comma.addEventListener('pointerup', onUp);
    comma.addEventListener('pointercancel', onUp);
  }

  function setZoom(value){
    state.zoom = Math.max(60, Math.min(140, value));
    document.documentElement.style.setProperty('--game-scale', (state.zoom/100).toFixed(2));
    els.zoomLabel.textContent = `${state.zoom}%`;
  }

  function startGame(){
    state.items = shuffle(FRAZIONI_DECIMALI);
    state.index = 0;
    state.score = 0;
    hidePopup();
    renderExercise();
  }

  els.btnLeft.addEventListener('click', moveLeft);
  els.btnRight.addEventListener('click', moveRight);
  els.btnVerify.addEventListener('click', verify);
  els.btnNext.addEventListener('click', nextExercise);
  els.popupContinue.addEventListener('click', () => {
    if(els.popupTitle.textContent === 'PARTITA FINITA!'){
      hidePopup();
      return;
    }
    hidePopup();
  });
  els.btnPlay.addEventListener('click', startGame);
  els.zoomIn.addEventListener('click', () => setZoom(state.zoom + 10));
  els.zoomOut.addEventListener('click', () => setZoom(state.zoom - 10));
  els.btnHome.addEventListener('click', () => { window.location.href = 'giochi_didattici.html'; });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft'){
      e.preventDefault();
      moveLeft();
    }
    if(e.key === 'ArrowRight'){
      e.preventDefault();
      moveRight();
    }
    if(e.key === 'Enter'){
      e.preventDefault();
      verify();
    }
  });

  setZoom(100);
  startGame();
})();
