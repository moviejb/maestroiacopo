(function(){
  const $ = (id)=>document.getElementById(id);

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

  const opL = $("opL"), opR = $("opR");
  const inL = $("inL"), inR = $("inR");
  const padL = $("padL"), padR = $("padR");
  const okL = $("okL"), okR = $("okR");

  const panelL = $("panelL");
  const panelR = $("panelR");

  const statusL = $("statusL"), statusR = $("statusR");
  const scoreL = $("scoreL"), scoreR = $("scoreR");
  const timerL = $("timerL"), timerR = $("timerR");
  const marker = $("marker");
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
const ballShadow = document.getElementById("ballShadow");
const pitch = document.getElementById("pitch");
const goalL = document.querySelector(".goalL");
const goalR = document.querySelector(".goalR");

// Zoom
const zoomSel = document.getElementById("zoomSel");
const btnZoomIn = document.getElementById("btnZoomIn");
const btnZoomOut = document.getElementById("btnZoomOut");
const Z = [0.7,0.8, 0.9, 1.0, 1.1, 1.2];
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

  function recordForSide(side){
    for(let i=state.history.length-1;i>=0;i--){
      const h = state.history[i];
      if(h.side===side && !h.resolved) return h;
    }
    return null;
  }

    function buildSummaryHTML(){
    const rows = state.history.slice().filter(r=>r.resolved);
    const wrong = rows.filter(r=>!r.correct && !r.timeout);

    const wrongL = wrong.filter(r=>r.side==="L");
    const wrongR = wrong.filter(r=>r.side==="R");

    const header = `
      <div class="sumKpi">
        <div class="sumKpiTitle">Operazioni errate (con risultato corretto + errore)</div>
        <div class="sumKpiVal">BLU: ${wrongL.length} • ROSSO: ${wrongR.length}</div>
      </div>
    `;

    function renderCol(side, arr){
      const isL = side==="L";
      const title = isL ? "BLU" : "ROSSO";
      const dotCls = isL ? "blue" : "red";

      const items = arr.slice(-60).map(r=>{
        const err = (typeof r.input === "number") ? Math.abs(r.input - r.a) : null;
        const op = `[ ${r.q} = ${r.a} ]`;
        const errTxt = (err==null) ? "[ TIMEOUT ]" : `[ ERROR ${err} ]`;

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

    return `
      ${header}
      <div class="sumCols">
        ${renderCol("L", wrongL)}
        ${renderCol("R", wrongR)}
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

function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }
  function rint(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function setBgVolume01(v01){ bg.volume = Math.max(0, Math.min(1, v01)); }
  function startBg(){ try{ bg.play().catch(()=>{}); }catch(e){} }
  function stopBg(){ try{ bg.pause(); }catch(e){} }

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
  return i >= 0 ? i : 2; // 1.0
}


  const state = {
    gameStarted: false,
    dirtySettings: false,

    mode: "mix",
    diff: "easy",
    step: 10,

    pos: 0,
    pointsL: 0,
    pointsR: 0,

    curL: null,
    curR: null,

    lock: false,
    roundCooldown: false,

    tOn: false,
    tSec: 8,
    tLeftL: 0,
    tLeftR: 0,
    tInt: null,
    history: []
  
  };

  // Effetti pannello
  function pulsePanel(panel, cls){
    if(!panel) return;
    panel.classList.remove("hitBad","hitGood");
    void panel.offsetWidth;
    panel.classList.add(cls);
    setTimeout(()=>panel.classList.remove(cls), 280);
  }

function showWinFX(side){

  
  closeSummary();
if(side === "L"){
    winFXTitle.textContent = "🏁 VITTORIA BLU!";
    winFXSub.textContent = "Grande! Hai conquistato la bandierina.";
  }else{
    winFXTitle.textContent = "🏁 VITTORIA ROSSA!";
    winFXSub.textContent = "Grande! Hai conquistato la bandierina.";
  }

  // rigenera coriandoli
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

  // nasconde overlay
  winFX.classList.remove("show");
  winFX.setAttribute("aria-hidden","true");

  state.lock = false;
  state.roundCooldown = false;

  state.pos = 0;
  state.pointsL = 0;
  state.pointsR = 0;

  
  state.history = [];
  closeSummary();
updateScore();
  updateEnergy();
  

marker.style.transform = `translate(-50%, -50%) rotate(0deg)`;

if(ballShadow){
  ballShadow.style.transform =
    `translate(-50%, calc(-50% + 26px))`;
}

goalL?.classList.remove("danger");
goalR?.classList.remove("danger");

  announce.textContent = "";

  newRound();
}

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

  // Difficoltà
  const DIFF = {
    easy: { addMax:50, subMax:50, mulA:[2,10], mulB:[0,10], divB:[2,10], divQ:[1,10], divMax:100 },
    med:  { addMax:200, subMax:200, mulA:[2,12], mulB:[0,12], divB:[2,12], divQ:[1,12], divMax:144 },
    hard: { addMax:1000, subMax:1000, mulA:[2,15], mulB:[0,15], divB:[2,15], divQ:[1,12], divMax:180 }
  };

  function genOne(mode){
    const d = DIFF[state.diff] || DIFF.easy;
    const m = (mode === "mix") ? pick(["add","sub","mul","div"]) : mode;

    if(m === "add"){
      let a=rint(0,d.addMax), b=rint(0,d.addMax);
      if(a===0 && b===0) a=1;
      return { q: `${a} + ${b}`, a: a+b };
    }
    if(m === "sub"){
      let a=rint(0,d.subMax), b=rint(0,d.subMax);
      if(b>a) [a,b]=[b,a];
      return { q: `${a} - ${b}`, a: a-b };
    }
    if(m === "mul"){
      const a=rint(d.mulA[0], d.mulA[1]);
      const b=rint(d.mulB[0], d.mulB[1]);
      return { q: `${a} × ${b}`, a: a*b };
    }
    if(m === "div"){
      for(let i=0;i<40;i++){
        const divisor=rint(d.divB[0], d.divB[1]);
        const q=rint(d.divQ[0], d.divQ[1]);
        const dividend=divisor*q;
        if(dividend <= (d.divMax||120)){
          return { q: `${dividend} ÷ ${divisor}`, a: q };
        }
      }
      const divisor=rint(2,10), q=rint(1,10);
      return { q: `${divisor*q} ÷ ${divisor}`, a: q };
    }
    return genOne("add");
  }



/*  PRIMA VERSIONE MODALITà FACILE - MEDIA - DIFFICILE 
  function genOne(mode){
  const d = DIFF[state.diff] || DIFF.easy;
  const m = (mode === "mix") ? pick(["add","sub","mul","div"]) : mode;

  // 🎯 Generatore EASY speciale
  function easyNum(){
    if(Math.random() < 0.5){
      return rint(0,9); // una cifra
    }else{
      const mult5 = [10,15,20,25,30,35,40,45,50];
      return pick(mult5);
    }
  }

  if(state.diff === "easy"){

    if(m === "add"){
      const a = easyNum();
      const b = easyNum();
      return { q: `${a} + ${b}`, a: a+b };
    }

    if(m === "sub"){
      let a = easyNum();
      let b = easyNum();
      if(b > a) [a,b] = [b,a];
      return { q: `${a} - ${b}`, a: a-b };
    }

    if(m === "mul"){
      const a = rint(2,10);   // tabelline base
      const b = rint(0,5);    // piccole
      return { q: `${a} × ${b}`, a: a*b };
    }

    if(m === "div"){
      const divisor = rint(2,10);
      const q = rint(1,5);
      return { q: `${divisor*q} ÷ ${divisor}`, a: q };
    }
  }

  // ----- MEDIO / HARD restano invariati -----

  if(m === "add"){
    let a=rint(0,d.addMax), b=rint(0,d.addMax);
    if(a===0 && b===0) a=1;
    return { q: `${a} + ${b}`, a: a+b };
  }

  if(m === "sub"){
    let a=rint(0,d.subMax), b=rint(0,d.subMax);
    if(b>a) [a,b]=[b,a];
    return { q: `${a} - ${b}`, a: a-b };
  }

  if(m === "mul"){
    const a=rint(d.mulA[0], d.mulA[1]);
    const b=rint(d.mulB[0], d.mulB[1]);
    return { q: `${a} × ${b}`, a: a*b };
  }

  if(m === "div"){
    for(let i=0;i<40;i++){
      const divisor=rint(d.divB[0], d.divB[1]);
      const q=rint(d.divQ[0], d.divQ[1]);
      const dividend=divisor*q;
      if(dividend <= (d.divMax||120)){
        return { q: `${dividend} ÷ ${divisor}`, a: q };
      }
    }
    const divisor=rint(2,10), q=rint(1,10);
    return { q: `${divisor*q} ÷ ${divisor}`, a: q };
  }

  return genOne("add");
}

*/


function genOne(mode){
  const d = DIFF[state.diff] || DIFF.easy;
  const m = (mode === "mix") ? pick(["add","sub","mul","div"]) : mode;

  // 🎯 Generatore EASY speciale
  function easyNum(){
    if(Math.random() < 0.5){
      return rint(0,9); // una cifra
    }else{
      const mult5 = [10,15,20,25,30,35,40,45,50];
      return pick(mult5);
    }
  }

  if(state.diff === "easy"){

    if(m === "add"){
      const a = easyNum();
      const b = easyNum();
      return { q: `${a} + ${b}`, a: a+b };
    }

    if(m === "sub"){
      let a = easyNum();
      let b = easyNum();
      if(b > a) [a,b] = [b,a];
      return { q: `${a} - ${b}`, a: a-b };
    }

    if(m === "mul"){
      const a = rint(2,10);   // tabelline base
      const b = rint(0,5);    // piccole
      return { q: `${a} × ${b}`, a: a*b };
    }

    if(m === "div"){
      const divisor = rint(2,10);
      const q = rint(1,5);
      return { q: `${divisor*q} ÷ ${divisor}`, a: q };
    }
  }

  // ----- MEDIO / HARD restano invariati -----

  if(m === "add"){
    let a=rint(0,d.addMax), b=rint(0,d.addMax);
    if(a===0 && b===0) a=1;
    return { q: `${a} + ${b}`, a: a+b };
  }

  if(m === "sub"){
    let a=rint(0,d.subMax), b=rint(0,d.subMax);
    if(b>a) [a,b]=[b,a];
    return { q: `${a} - ${b}`, a: a-b };
  }

  if(m === "mul"){
    const a=rint(d.mulA[0], d.mulA[1]);
    const b=rint(d.mulB[0], d.mulB[1]);
    return { q: `${a} × ${b}`, a: a*b };
  }

  if(m === "div"){
    for(let i=0;i<40;i++){
      const divisor=rint(d.divB[0], d.divB[1]);
      const q=rint(d.divQ[0], d.divQ[1]);
      const dividend=divisor*q;
      if(dividend <= (d.divMax||120)){
        return { q: `${dividend} ÷ ${divisor}`, a: q };
      }
    }
    const divisor=rint(2,10), q=rint(1,10);
    return { q: `${divisor*q} ÷ ${divisor}`, a: q };
  }

  return genOne("add");
}

  function penaltyStep(){ return Math.max(1, Math.round(state.step/2)); }

  // Tastiere
  function buildPad(el, side){
    const keys = ["1","2","3","4","5","6","7","8","9","C","0","OK"];
    el.innerHTML = "";
    keys.forEach(k=>{
      const b = document.createElement("div");
      b.className = "key";
      b.textContent = k;
      if(k==="C") b.classList.add("keyC");
      if(k==="0") b.classList.add("key0");
      if(k==="OK") b.classList.add("keyOK");
      b.addEventListener("click", ()=>onKey(side,k));
      el.appendChild(b);
    });
  }

  function setStatus(side, msg, cls){
    const el = side==="L" ? statusL : statusR;
    el.textContent = msg || "";
    el.classList.remove("good","bad");
    if(cls) el.classList.add(cls);
  }

  function stopTimers(){
    if(state.tInt){ clearInterval(state.tInt); state.tInt=null; }
    timerL.textContent = state.tOn ? `${state.tLeftL}s` : "—";
    timerR.textContent = state.tOn ? `${state.tLeftR}s` : "—";
  }

  function startTimers(){
    stopTimers();
    state.tLeftL = state.tSec;
    state.tLeftR = state.tSec;
    timerL.textContent = `${state.tLeftL}s`;
    timerR.textContent = `${state.tLeftR}s`;

    state.tInt = setInterval(()=>{
      if(!state.gameStarted || state.lock) return;

      state.tLeftL--; state.tLeftR--;
      timerL.textContent = `${state.tLeftL}s`;
      timerR.textContent = `${state.tLeftR}s`;

      if(state.tLeftL <= 0){
        const rec = recordForSide("L");
        if(rec){ rec.resolved=true; rec.correct=false; rec.timeout=true; rec.input=null; rec.answeredAt=Date.now(); }
        const pen = penaltyStep();
        setStatus("L", `⏱️ Tempo scaduto ➜ penalità -${pen}`, "bad");
        playSfx("timeout");
        pulsePanel(panelL, "hitBad");
        inL.value="";
        move(+pen);
        if(checkWin()) return;
        nextRoundSoon();
      }
      if(state.tLeftR <= 0){
        const rec = recordForSide("R");
        if(rec){ rec.resolved=true; rec.correct=false; rec.timeout=true; rec.input=null; rec.answeredAt=Date.now(); }
        const pen = penaltyStep();
        setStatus("R", `⏱️ Tempo scaduto ➜ penalità -${pen}`, "bad");
        playSfx("timeout");
        pulsePanel(panelR, "hitBad");
        inR.value="";
        move(-pen);
        if(checkWin()) return;
        nextRoundSoon();
      }
    }, 1000);
  }

  function newRound(){
    state.curL = genOne(state.mode);
    state.curR = genOne(state.mode);
    opL.textContent = state.curL.q;
    opR.textContent = state.curR.q;
    // storico operazioni
    const now = Date.now();
    state.history.push({side:"L", q: state.curL.q, a: state.curL.a, type: opTypeFromQ(state.curL.q), shownAt: now, resolved:false});
    state.history.push({side:"R", q: state.curR.q, a: state.curR.a, type: opTypeFromQ(state.curR.q), shownAt: now, resolved:false});
    inL.value=""; inR.value="";
    setStatus("L",""); setStatus("R","");
    announce.textContent="";
    if(state.tOn) startTimers(); else stopTimers();
  }
function move(delta){
  state.pos = clamp(state.pos + delta, -100, 100);

  const x = (state.pos / 100) * 260;

  // movimento + rotazione pallone
  const rot = state.pos * 0.8;
  marker.style.transform =
    `translate(calc(-50% + ${x}px), -50%) rotate(${rot}deg)`;

  // ombra segue
  if(ballShadow){
    ballShadow.style.transform =
      `translate(calc(-50% + ${x}px), calc(-50% + 26px))`;
  }

  // pulse
  marker.classList.remove("pulse");
  void marker.offsetWidth;
  marker.classList.add("pulse");

  // zona pericolo vicino alle porte
  if(goalL && goalR){
    goalL.classList.toggle("danger", state.pos <= -60);
    goalR.classList.toggle("danger", state.pos >= 60);
  }

  updateEnergy();
}
  

  function win(side){
  state.lock = true;
  stopTimers();
  playSfx("win");
  showWinFX(side);

  announce.textContent = (side==="L")
    ? "🏁 VINCE LA SQUADRA BLU!"
    : "🏁 VINCE LA SQUADRA ROSSA!";
}

  function checkWin(){
    if(state.pos <= -100){ win("L"); return true; }
    if(state.pos >= 100){ win("R"); return true; }
    return false;
  }

  function nextRoundSoon(){
    stopTimers();
    state.roundCooldown = true;
    setTimeout(()=>{
      state.roundCooldown = false;
      if(!state.lock) newRound();
    }, 500);
  }

  function submit(side){
    if(!state.gameStarted) return;
    if(state.lock || state.roundCooldown) return;

    if(bgOn.checked) startBg();

    const cur   = side==="L" ? state.curL : state.curR;
    const input = side==="L" ? inL : inR;
    const val = input.value.trim();
    const n = (val === "") ? NaN : Number(val);

    
    const rec = recordForSide(side);
if(Number.isNaN(n)){
      setStatus(side, "Inserisci un numero", "bad");
      pulsePanel(side==="L" ? panelL : panelR, "hitBad");
      playSfx("wrong");
      return;
    }

    if(n === cur.a){
      if(rec){ rec.resolved=true; rec.correct=true; rec.timeout=false; rec.input=n; rec.answeredAt=Date.now(); }
setStatus(side, "✅ Corretto!", "good");
      playSfx("correct");
      pulsePanel(side==="L" ? panelL : panelR, "hitGood");
    if(side==="L"){ state.pointsL++; move(-state.step); }
    else{ state.pointsR++; move(+state.step); }
      updateScore();
      if(!checkWin()) nextRoundSoon();
    }else{
      if(rec){ rec.resolved=true; rec.correct=false; rec.timeout=false; rec.input=n; rec.answeredAt=Date.now(); }
      const pen = penaltyStep();
      setStatus(side, `❌ Sbagliato (${cur.a})  ➜ penalità -${pen}`, "bad");
      playSfx("wrong");
      pulsePanel(side==="L" ? panelL : panelR, "hitBad");
      if(side==="L") move(+pen); else move(-pen);
      if(!checkWin()) nextRoundSoon();
    }
  }

  function onKey(side, k){
    if(!state.gameStarted) return;
    if(state.lock || state.roundCooldown) return;

    if(bgOn.checked) startBg();

    const input = side==="L" ? inL : inR;
    if(k==="C"){ input.value=""; return; }
    if(k==="OK"){ submit(side); return; }
    if(input.value.length >= 4) return;
    input.value += k;
  }

  // SETTINGS / START FLOW
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
    state.lock = false;
    state.roundCooldown = false;

    state.pos = 0;
    state.pointsL = 0;
    state.pointsR = 0;
    
    state.history = [];
    closeSummary();
updateScore();
    updateEnergy();
    marker.style.transform = `translate(-50%, -50%)`;
    setupBanner.classList.add("hide");
    btnStart.style.display = "none";
    state.dirtySettings = false;

    if(bgOn.checked) startBg();
    if(winFX){
  winFX.classList.remove("show");
  winFX.setAttribute("aria-hidden","true");
}
    newRound();
  }

  function resetToSetup(){
    state.gameStarted = false;
    state.lock = false;
    state.roundCooldown = false;
    if(winFX){
  winFX.classList.remove("show");
  winFX.setAttribute("aria-hidden","true");
}
    stopTimers();
    stopBg();

    
    closeSummary();
opL.textContent="—"; opR.textContent="—";
    inL.value=""; inR.value="";
    setStatus("L","Imposta in alto e poi premi GIOCA");
    setStatus("R","Imposta in alto e poi premi GIOCA");
    announce.textContent="";
    state.pos = 0;
    marker.style.transform = `translate(-50%, -50%)`;
    updateEnergy();

    setupBanner.classList.remove("hide");
    btnStart.style.display = "none";
    state.dirtySettings = false;
  }

  // Music prefs
  function loadBgPrefs(){
    bgOn.checked = (localStorage.getItem(LS_BG_ON) === "1");
    const v = Number(localStorage.getItem(LS_BG_VOL) ?? 35);
    bgVol.value = String(Number.isFinite(v) ? clamp(v,0,100) : 35);
    setBgVolume01(Number(bgVol.value)/100);
  }
  function saveBgPrefs(){
    localStorage.setItem(LS_BG_ON, bgOn.checked ? "1" : "0");
    localStorage.setItem(LS_BG_VOL, String(bgVol.value));
  }

  function init(){
    buildPad(padL,"L");
    buildPad(padR,"R");

    okL.addEventListener("click", ()=>submit("L"));
    okR.addEventListener("click", ()=>submit("R"));

    btnStart.addEventListener("click", startGame);
    btnReset.addEventListener("click", resetToSetup);

    // se tocchi impostazioni => mostra GIOCA
    [modeSel, diffSel, stepSel, timerOn, timerSec].forEach(el=>{
      el.addEventListener("change", ()=>{
        applySettingsFromUI();
        markDirty();
      });
    });
    [bgOn].forEach(el=>{
      el.addEventListener("change", ()=>{
        saveBgPrefs();
        markDirty();
      });
    });
    bgVol.addEventListener("input", ()=>{
      setBgVolume01(Number(bgVol.value)/100);
      saveBgPrefs();
      markDirty();
    });
btnReplay.addEventListener("click", replayGame);

btnHome.addEventListener("click", ()=>{
  window.location.href = "giochi_didattici.html";
});
    

  btnSummary?.addEventListener("click", openSummary);
  btnSumClose?.addEventListener("click", closeSummary);
  sumModal?.addEventListener("click", (e)=>{ if(e.target===sumModal) closeSummary(); });
timerOn.addEventListener("change", ()=>{ timerSec.disabled = !timerOn.checked; });

    // ---- ZOOM init + handlers ----
(function initZoom(){
  // load
  let saved = 1.0;
  try{
    const s = localStorage.getItem(LS_ZOOM);
    if(s != null) saved = Number(s);
  }catch(e){}
  if(zoomSel){
    // imposta select sul valore salvato più vicino
    const nearest = Z.reduce((best, v)=> (Math.abs(v-saved) < Math.abs(best-saved) ? v : best), 1.0);
    zoomSel.value = String(nearest);
    applyZoom(nearest);

    zoomSel.addEventListener("change", ()=> applyZoom(zoomSel.value));
  }else{
    applyZoom(saved);
  }

  if(btnZoomIn){
    btnZoomIn.addEventListener("click", ()=>{
      const i = getZoomIndex();
      const nxt = Z[Math.min(Z.length-1, i+1)];
      if(zoomSel) zoomSel.value = String(nxt);
      applyZoom(nxt);
    });
  }
  if(btnZoomOut){
    btnZoomOut.addEventListener("click", ()=>{
      const i = getZoomIndex();
      const nxt = Z[Math.max(0, i-1)];
      if(zoomSel) zoomSel.value = String(nxt);
      applyZoom(nxt);
    });
  }
})();
    loadBgPrefs();

    // stato iniziale
    applySettingsFromUI();
    updateEnergy();
    updateScore();
    resetToSetup();
  }

  init();
})();