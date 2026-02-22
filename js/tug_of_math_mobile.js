(function(){
  const $ = (id)=>document.getElementById(id);

  // Settings UI (stessi id del desktop per riuso preferenze)
  const modeSel  = $("modeSel");
  const diffSel  = $("diffSel");
  const stepSel  = $("stepSel");
  const timerOn  = $("timerOn");
  const timerSec = $("timerSec");
  const btnReset = $("btnReset");

  const bgOn  = $("bgOn");
  const bgVol = $("bgVol");

  const btnStart = $("btnStart");
  const setupBanner = $("setupBanner");

  // Mobile UI
  const btnSettings = $("btnSettings");
  const settingsPanel = $("settingsPanel");
  const mTop = $("mTop");

  const dotL = $("dotL");
  const dotR = $("dotR");
  const turnLabel = $("turnLabel");

  const opOne = $("opOne");
  const inOne = $("inOne");
  const padOne = $("padOne");
const statusOne = $("statusOne");
  const timerOne = $("timerOne");

  const scoreL = $("scoreL");
  const scoreR = $("scoreR");
  const marker = $("marker");
  const pitch = $("pitch");
  const announce = $("announce");

  const energyLFill = $("energyLFill");
  const energyRFill = $("energyRFill");
  const energyLPct  = $("energyLPct");
  const energyRPct  = $("energyRPct");

  const winFX = $("winFX");
  const winFXTitle = $("winFXTitle");
  const winFXSub = $("winFXSub");
  const btnReplay = $("btnReplay");
  const btnHome = $("btnHome");

  

  const btnSummary = $("btnSummary");
  const sumModal = $("sumModal");
  const sumBody = $("sumBody");
  const btnSumClose = $("btnSumClose");
const ballShadow = $("ballShadow");
  const goalL = document.querySelector(".goalL");
  const goalR = document.querySelector(".goalR");

  // Zoom (stessi id del desktop)
  const zoomSel = $("zoomSel");
  const btnZoomIn = $("btnZoomIn");
  const btnZoomOut = $("btnZoomOut");
  const Z = [0.7,0.8,0.9,1.0,1.1,1.2];
  const LS_ZOOM = "tug_zoom";

  const LS_BG_ON  = "tug_bg_on";
  const LS_BG_VOL = "tug_bg_vol";

  const SOUNDS = {
    correct: "audio/correct.mp3",
    wrong: "audio/taglio.mp3",
    timeout: "audio/timeout.mp3",
    win: "audio/super_mario_vittoria.mp3",
    bg: "audio/bg.mp3"
  };

  const sfx = {
    correct: new Audio(SOUNDS.correct),
    wrong: new Audio(SOUNDS.wrong),
    timeout: new Audio(SOUNDS.timeout),
    win: new Audio(SOUNDS.win),
  };

  const bg = new Audio(SOUNDS.bg);
  bg.loop = true;

  function playSfx(key){
    const a = sfx[key];
    if(!a) return;
    try{
      a.pause(); a.currentTime = 0;
      a.play().catch(()=>{});
    }catch(e){}
  }

  function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }
  function rint(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function setBgVolume01(v01){ bg.volume = Math.max(0, Math.min(1, v01)); }
  function startBg(){ try{ bg.play().catch(()=>{}); }catch(e){} }
  function stopBg(){ try{ bg.pause(); }catch(e){} }

  // ===== ZOOM =====
  function applyZoom(z){
    z = Number(z);
    if(!Number.isFinite(z)) z = 1.0;
    z = Math.max(0.7, Math.min(1.2, z));
    document.documentElement.style.setProperty("--zoom", String(z));
    try{ localStorage.setItem(LS_ZOOM, String(z)); }catch(e){}
  }
  function getZoomIndex(){
    const cur = Number(getComputedStyle(document.documentElement).getPropertyValue("--zoom")) || 1.0;
    const i = Z.findIndex(v => Math.abs(v - cur) < 0.001);
    return i >= 0 ? i : 3;
  }

  // ===== STATE =====
  const state = {
    gameStarted: false,
    dirtySettings: false,

    mode: "mix",
    diff: "easy",
    step: 10,

    pos: 0,
    pointsL: 0,
    pointsR: 0,

    turn: "L",      // 🔥 A TURNI: L / R
    cur: null,

    lock: false,
    roundCooldown: false,

    tOn: false,
    tSec: 8,
    tLeft: 0,
    tInt: null,
    history: []
  };

  // ===== TURN UI =====
  function updateTurnUI(){
    const isL = state.turn === "L";
    dotL?.classList.toggle("active", isL);
    dotR?.classList.toggle("active", !isL);
    if(turnLabel){
      turnLabel.innerHTML = isL ? 'Tocca ai <b>BLU</b>' : 'Tocca ai <b>ROSSI</b>';
    }
  }

  function setStatus(msg, cls){
    statusOne.textContent = msg || "";
    statusOne.classList.remove("good","bad");
    if(cls) statusOne.classList.add(cls);
  }


  // ===== RIEPILOGO (storico operazioni) =====
  function opTypeFromQ(q){
    if(!q) return "?";
    if(q.includes("+")) return "+";
    if(q.includes(" - ")) return "-";
    if(q.includes("×")) return "×";
    if(q.includes("÷")) return "÷";
    return "?";
  }
  function sideName(side){ return side==="L" ? "BLU" : "ROSSO"; }

  function lastUnresolved(){
    for(let i=state.history.length-1;i>=0;i--){
      const h = state.history[i];
      if(!h.resolved) return h;
    }
    return null;
  }

    function buildSummaryHTML(){
    const rows = state.history.slice().filter(r=>r.resolved);

    // SOLO ERRATE (no timeout) come richiesto
    const wrong = rows.filter(r=>!r.correct && !r.timeout);
    const wrongL = wrong.filter(r=>r.side==="L");
    const wrongR = wrong.filter(r=>r.side==="R");

    const header = `
      <div class="sumKpi">
        <div class="sumKpiTitle">Operazioni errate (risultato corretto + errore)</div>
        <div class="sumKpiVal">BLU: ${wrongL.length} • ROSSO: ${wrongR.length}</div>
      </div>
    `;

    function renderSection(side, arr){
      const isL = side==="L";
      const title = isL ? "BLU" : "ROSSO";
      const dotCls = isL ? "blue" : "red";

      const items = arr.slice(-120).map(r=>{
        const err = (typeof r.input === "number") ? Math.abs(r.input - r.a) : null;
        const op = `[ ${r.q} = ${r.a} ]`;
        const errTxt = (err==null) ? "[ TIMEOUT ]" : `[ ERROR ${err} ]`;

        // Mobile: operazione sopra, errore sotto
        return `
          <div class="sumOpRow">
            <div class="sumOpText"><code>${op}</code></div>
            <div class="sumErrBadge">${errTxt}</div>
          </div>
        `;
      }).join("");

      return `
        <div class="sumCol">
          <div class="sumColHead">
            <div class="sumSide"><span class="sumSideDot ${dotCls}"></span>${title}</div>
            <div class="sumColCount">${arr.length} errori</div>
          </div>
          <div class="sumColList">
            ${items || '<div class="sumOpRow"><div class="sumOpText"><small>Nessuna operazione errata 🎉</small></div></div>'}
          </div>
        </div>
      `;
    }

    // Mobile: prima BLU poi ROSSO, scroll unico (gestito da CSS su .sumBody)
    return `
      ${header}
      <div class="sumCols sumColsStack">
        ${renderSection("L", wrongL)}
        ${renderSection("R", wrongR)}
      </div>
    `;
  }

  function openSummary(){
    if(!sumModal || !sumBody) return;
    sumBody.innerHTML = buildSummaryHTML();
    sumModal.classList.add("show");
    sumModal.setAttribute("aria-hidden","false");
  }
  function closeSummary(){
    if(!sumModal) return;
    sumModal.classList.remove("show");
    sumModal.setAttribute("aria-hidden","true");
  }

  // ===== WIN FX =====
  function showWinFX(side){
    closeSummary();
    if(side === "L"){
      winFXTitle.textContent = "🏁 VITTORIA BLU!";
      winFXSub.textContent = "Grande! Hai conquistato la bandierina.";
    }else{
      winFXTitle.textContent = "🏁 VITTORIA ROSSA!";
      winFXSub.textContent = "Grande! Hai conquistato la bandierina.";
    }

    // coriandoli
    const conf = winFX.querySelector(".confetti");
    if(conf){
      conf.innerHTML = "";
      for(let i=0;i<22;i++){
        const sp = document.createElement("span");
        sp.style.left = Math.round(Math.random()*100) + "%";
        sp.style.transform = `rotate(${Math.random()*360}deg)`;
        sp.style.animationDelay = (Math.random()*0.25).toFixed(2) + "s";
        sp.style.animationDuration = (1.2 + Math.random()*0.8).toFixed(2) + "s";
        conf.appendChild(sp);
      }
    }

    winFX.classList.add("show");
    winFX.setAttribute("aria-hidden","false");
  }

  function replayGame(){
    winFX.classList.remove("show");
    winFX.setAttribute("aria-hidden","true");

    state.lock = false;
    state.roundCooldown = false;

    state.pos = 0;
    state.pointsL = 0;
    state.pointsR = 0;
    state.turn = "L";
    state.history = [];
    closeSummary();
    updateTurnUI();

    updateScore();
    updateEnergy();

    marker.style.transform = `translate(-50%, -50%) rotate(0deg)`;
    if(ballShadow){
      ballShadow.style.transform = `translate(-50%, calc(-50% + 26px))`;
    }
    goalL?.classList.remove("danger");
    goalR?.classList.remove("danger");

    announce.textContent = "";
    newRound();
  }

  // ===== SCORE / ENERGY =====
  function updateEnergy(){
    const pctL = clamp(Math.round(((100 - state.pos) / 200) * 100), 0, 100);
    const pctR = 100 - pctL;
    energyLFill.style.width = pctL + "%";
    energyRFill.style.width = pctR + "%";
    energyLPct.textContent = pctL + "%";
    energyRPct.textContent = pctR + "%";
  }

  function updateScore(){
    scoreL.textContent = String(state.pointsL);
    scoreR.textContent = String(state.pointsR);
  }

  // ===== GENERATOR =====
  const DIFF = {
    easy: { addMax:50, subMax:50, mulA:[2,10], mulB:[0,10], divB:[2,10], divQ:[1,10], divMax:100 },
    med:  { addMax:200, subMax:200, mulA:[2,12], mulB:[0,12], divB:[2,12], divQ:[1,12], divMax:144 },
    hard: { addMax:1000, subMax:1000, mulA:[2,15], mulB:[0,15], divB:[2,15], divQ:[1,12], divMax:180 }
  };

  function genOne(mode){
    const d = DIFF[state.diff] || DIFF.easy;
    const m = (mode === "mix") ? pick(["add","sub","mul","div"]) : mode;

    function easyNum(){
      if(Math.random() < 0.5){
        return rint(0,9);
      }else{
        const mult5 = [10,15,20,25,30,35,40,45,50];
        return pick(mult5);
      }
    }

    if(state.diff === "easy"){
      if(m === "add"){ const a=easyNum(), b=easyNum(); return { q: `${a} + ${b}`, a: a+b }; }
      if(m === "sub"){ let a=easyNum(), b=easyNum(); if(b>a) [a,b]=[b,a]; return { q: `${a} - ${b}`, a: a-b }; }
      if(m === "mul"){ const a=rint(2,10), b=rint(0,5); return { q: `${a} × ${b}`, a: a*b }; }
      if(m === "div"){ const divisor=rint(2,10), q=rint(1,5); return { q: `${divisor*q} ÷ ${divisor}`, a: q }; }
    }

    if(m === "add"){ let a=rint(0,d.addMax), b=rint(0,d.addMax); if(a===0 && b===0) a=1; return { q: `${a} + ${b}`, a: a+b }; }
    if(m === "sub"){ let a=rint(0,d.subMax), b=rint(0,d.subMax); if(b>a) [a,b]=[b,a]; return { q: `${a} - ${b}`, a: a-b }; }
    if(m === "mul"){ const a=rint(d.mulA[0], d.mulA[1]); const b=rint(d.mulB[0], d.mulB[1]); return { q: `${a} × ${b}`, a: a*b }; }
    if(m === "div"){
      for(let i=0;i<40;i++){
        const divisor=rint(d.divB[0], d.divB[1]);
        const q=rint(d.divQ[0], d.divQ[1]);
        const dividend=divisor*q;
        if(dividend <= (d.divMax||120)) return { q: `${dividend} ÷ ${divisor}`, a: q };
      }
      const divisor=rint(2,10), q=rint(1,10);
      return { q: `${divisor*q} ÷ ${divisor}`, a: q };
    }
    return genOne("add");
  }

  function penaltyStep(){ return Math.max(1, Math.round(state.step/2)); }

  // ===== KEYPAD =====
  function buildPad(el){
    const keys = ["1","2","3","4","5","6","7","8","9","C","0","OK"];
    el.innerHTML = "";
    keys.forEach(k=>{
      const b = document.createElement("div");
      b.className = "key";
      b.textContent = k;
      if(k==="C") b.classList.add("keyC");
      if(k==="0") b.classList.add("key0");
      if(k==="OK") b.classList.add("keyOK");
      b.addEventListener("click", ()=>onKey(k));
      el.appendChild(b);
    });
  }

  function onKey(k){
    if(!state.gameStarted) return;
    if(state.lock || state.roundCooldown) return;

    if(bgOn.checked) startBg();

    if(k==="C"){ inOne.value = ""; return; }
    if(k==="OK"){ submit(); return; }
    if(inOne.value.length >= 4) return;
    inOne.value += k;
  }

  // ===== TIMERS (solo turno corrente) =====
  function stopTimers(){
    if(state.tInt){ clearInterval(state.tInt); state.tInt=null; }
    timerOne.textContent = state.tOn ? `${state.tLeft}s` : "—";
  }

  function startTimers(){
    stopTimers();
    state.tLeft = state.tSec;
    timerOne.textContent = `${state.tLeft}s`;

    state.tInt = setInterval(()=>{
      if(!state.gameStarted || state.lock) return;

      state.tLeft--;
      timerOne.textContent = `${state.tLeft}s`;

      if(state.tLeft <= 0){
        const rec = lastUnresolved();
        if(rec){ rec.resolved=true; rec.correct=false; rec.timeout=true; rec.input=null; rec.answeredAt=Date.now(); }
        const pen = penaltyStep();
        setStatus(`⏱️ Tempo scaduto ➜ penalità -${pen}`, "bad");
        playSfx("timeout");
        inOne.value = "";
        // penalità: se BLU sbaglia/timeout, palla va verso ROSSI (+pen). Se ROSSI, verso BLU (-pen).
        if(state.turn === "L") move(+pen);
        else move(-pen);

        if(checkWin()) return;
        nextTurnSoon();
      }
    }, 1000);
  }

  // ===== ROUND =====
  function newRound(){
    state.cur = genOne(state.mode);
    opOne.textContent = state.cur.q;
    // storico: registra operazione mostrata
    const now = Date.now();
    state.history.push({side: state.turn, q: state.cur.q, a: state.cur.a, type: opTypeFromQ(state.cur.q), shownAt: now, resolved:false});
    inOne.value = "";
    setStatus("");
    announce.textContent = "";
    updateTurnUI();
    if(state.tOn) startTimers(); else stopTimers();
  }

  function move(delta){
    state.pos = clamp(state.pos + delta, -100, 100);
    const range = (function(){
      if(!pitch || !marker) return 260;
      const w = pitch.clientWidth || 0;
      const bw = marker.offsetWidth || 34;
      const pad = 22; // margine interno per non uscire dal campo
      const r = Math.max(90, (w/2) - (bw/2) - pad);
      return Number.isFinite(r) ? r : 260;
    })();
    const x = (state.pos / 100) * range;

    const rot = state.pos * 0.8;
    marker.style.transform = `translate(calc(-50% + ${x}px), -50%) rotate(${rot}deg)`;

    if(ballShadow){
      ballShadow.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + 26px))`;
    }

    marker.classList.remove("pulse");
    void marker.offsetWidth;
    marker.classList.add("pulse");

    goalL?.classList.toggle("danger", state.pos <= -60);
    goalR?.classList.toggle("danger", state.pos >= 60);

    updateEnergy();
  }

  function win(side){
    state.lock = true;
    stopTimers();
    playSfx("win");
    showWinFX(side);
    announce.textContent = (side==="L") ? "🏁 VINCE LA SQUADRA BLU!" : "🏁 VINCE LA SQUADRA ROSSA!";
  }

  function checkWin(){
    if(state.pos <= -100){ win("L"); return true; }
    if(state.pos >= 100){ win("R"); return true; }
    return false;
  }

  function nextTurnSoon(){
    stopTimers();
    state.roundCooldown = true;
    setTimeout(()=>{
      state.roundCooldown = false;
      if(state.lock) return;
      // cambia turno
      state.turn = (state.turn === "L") ? "R" : "L";
      newRound();
    }, 450);
  }

  function submit(){
    if(!state.gameStarted) return;
    if(state.lock || state.roundCooldown) return;

    if(bgOn.checked) startBg();

    const val = inOne.value.trim();
    const n = (val === "") ? NaN : Number(val);
    
    const rec = lastUnresolved();
if(Number.isNaN(n)){
      setStatus("Inserisci un numero", "bad");
      playSfx("wrong");
      return;
    }

    const cur = state.cur;
    if(n === cur.a){
      if(rec){ rec.resolved=true; rec.correct=true; rec.timeout=false; rec.input=n; rec.answeredAt=Date.now(); }

      setStatus("✅ Corretto!", "good");
      playSfx("correct");
      if(state.turn === "L"){ state.pointsL++; move(-state.step); }
      else{ state.pointsR++; move(+state.step); }
      updateScore();
      if(!checkWin()) nextTurnSoon();
    }else{
      if(rec){ rec.resolved=true; rec.correct=false; rec.timeout=false; rec.input=n; rec.answeredAt=Date.now(); }
      const pen = penaltyStep();
      setStatus(`❌ Sbagliato (${cur.a})  ➜ penalità -${pen}`, "bad");
      playSfx("wrong");
      // sbagliato: BLU spinge verso ROSSI (+pen), ROSSI verso BLU (-pen)
      if(state.turn === "L") move(+pen);
      else move(-pen);
      if(!checkWin()) nextTurnSoon();
    }
  }

  // ===== SETTINGS / START =====
  function applySettingsFromUI(){
    state.mode = modeSel.value;
    state.diff = diffSel.value;
    state.step = Number(stepSel.value) || 10;
    state.tOn  = !!timerOn.checked;
    state.tSec = Number(timerSec.value) || 8;
    timerSec.disabled = !state.tOn;
  }

  function markDirty(){
    state.dirtySettings = true;
    btnStart.style.display = "inline-flex";
  }

  function startGame(){
    applySettingsFromUI();
    state.gameStarted = true;
    state.history = [];
    closeSummary();
    state.lock = false;
    state.roundCooldown = false;

    state.pos = 0;
    state.pointsL = 0;
    state.pointsR = 0;
    state.turn = "L";
    updateTurnUI();

    updateScore();
    updateEnergy();
    marker.style.transform = `translate(-50%, -50%)`;
    if(ballShadow) ballShadow.style.transform = `translate(-50%, calc(-50% + 26px))`;

    setupBanner.classList.add("hide");
    btnStart.style.display = "none";
    state.dirtySettings = false;

    // compatta settings (può “scomparire”)
    mTop?.classList.add("compact");
    btnSettings?.setAttribute("aria-expanded", "false");
    settingsPanel?.classList.add("isHidden");

    if(bgOn.checked) startBg();
    winFX?.classList.remove("show");
    winFX?.setAttribute("aria-hidden","true");

    newRound();
  }

  function resetToSetup(){
    state.gameStarted = false;
    closeSummary();
    state.lock = false;
    state.roundCooldown = false;

    winFX?.classList.remove("show");
    winFX?.setAttribute("aria-hidden","true");

    stopTimers();
    stopBg();

    opOne.textContent = "—";
    inOne.value = "";
    setStatus("Imposta in alto e poi premi GIOCA");
    announce.textContent = "";

    state.pos = 0;
    state.pointsL = 0;
    state.pointsR = 0;
    state.turn = "L";
    updateTurnUI();
    updateScore();
    updateEnergy();

    marker.style.transform = `translate(-50%, -50%)`;

    setupBanner.classList.remove("hide");
    btnStart.style.display = "none";
    state.dirtySettings = false;

    // riapri settings
    mTop?.classList.remove("compact");
    btnSettings?.setAttribute("aria-expanded", "true");
    settingsPanel?.classList.remove("isHidden");
  }

  // ===== PREFS =====
  function loadBgPrefs(){
    try{
      bgOn.checked = (localStorage.getItem(LS_BG_ON) === "1");
      const v = Number(localStorage.getItem(LS_BG_VOL) ?? 35);
      bgVol.value = String(Number.isFinite(v) ? clamp(v,0,100) : 35);
      setBgVolume01(Number(bgVol.value)/100);
    }catch(e){}
  }
  function saveBgPrefs(){
    try{
      localStorage.setItem(LS_BG_ON, bgOn.checked ? "1" : "0");
      localStorage.setItem(LS_BG_VOL, String(bgVol.value));
    }catch(e){}
  }

  // ===== SETTINGS COLLAPSE =====
  function toggleSettings(){
    const expanded = btnSettings.getAttribute("aria-expanded") !== "false";
    if(expanded){
      btnSettings.setAttribute("aria-expanded", "false");
      settingsPanel.classList.add("isHidden");
    }else{
      btnSettings.setAttribute("aria-expanded", "true");
      settingsPanel.classList.remove("isHidden");
      mTop.classList.remove("compact");
    }
  }

  function init(){
    // collapse settings
    btnSettings?.addEventListener("click", toggleSettings);

    // keypad
    buildPad(padOne);
// start/reset
    btnStart.addEventListener("click", startGame);
    btnReset.addEventListener("click", resetToSetup);

    // show GIOCA when settings change
    [modeSel, diffSel, stepSel, timerOn, timerSec].forEach(el=>{
      el.addEventListener("change", ()=>{
        applySettingsFromUI();
        markDirty();
      });
    });

    timerOn.addEventListener("change", ()=>{ timerSec.disabled = !timerOn.checked; });

    bgOn.addEventListener("change", ()=>{ saveBgPrefs(); markDirty(); });
    bgVol.addEventListener("input", ()=>{
      setBgVolume01(Number(bgVol.value)/100);
      saveBgPrefs();
      markDirty();
    });

    // home/replay
    btnReplay.addEventListener("click", replayGame);
    btnHome.addEventListener("click", ()=>{ window.location.href = "giochi_didattici.html"; });

    

    btnSummary?.addEventListener("click", openSummary);
    btnSumClose?.addEventListener("click", closeSummary);
    sumModal?.addEventListener("click", (e)=>{ if(e.target===sumModal) closeSummary(); });
// zoom
    (function initZoom(){
      let saved = 1.0;
      try{
        const s = localStorage.getItem(LS_ZOOM);
        if(s != null) saved = Number(s);
      }catch(e){}
      if(zoomSel){
        const nearest = Z.reduce((best, v)=> (Math.abs(v-saved) < Math.abs(best-saved) ? v : best), 1.0);
        zoomSel.value = String(nearest);
        applyZoom(nearest);
        zoomSel.addEventListener("change", ()=> applyZoom(zoomSel.value));
      }else{
        applyZoom(saved);
      }
      btnZoomIn?.addEventListener("click", ()=>{
        const i = getZoomIndex();
        const nxt = Z[Math.min(Z.length-1, i+1)];
        if(zoomSel) zoomSel.value = String(nxt);
        applyZoom(nxt);
      });
      btnZoomOut?.addEventListener("click", ()=>{
        const i = getZoomIndex();
        const nxt = Z[Math.max(0, i-1)];
        if(zoomSel) zoomSel.value = String(nxt);
        applyZoom(nxt);
      });
    })();

    // init state
    loadBgPrefs();
    applySettingsFromUI();
    updateEnergy();
    updateScore();
    resetToSetup();
  }

  init();
})();