/* Duello in Buca – JS
   Regole:
   - Ogni squadra ha la sua operazione indipendente.
   - Risposta corretta: la tua palla avanza verso la buca.
   - Risposta sbagliata (o tempo): regali 1 passo all'altro.
   - L'operazione dell'avversario NON cambia quando rispondi.
   - Vince chi mette per primo la propria palla nella buca (raggiunge il centro).
*/
(function(){
  "use strict";

  const $ = (id)=>document.getElementById(id);

  const pitch  = $("pitch");
  const ballL  = $("ballL");
  const ballR  = $("ballR");
  const progL  = $("progL");
  const progR  = $("progR");

  const qL = $("qL"), qR = $("qR");
  const inL = $("inL"), inR = $("inR");
  const okL = $("okL"), okR = $("okR");
  const msgL = $("msgL"), msgR = $("msgR");

  const diffSel = $("diffSel");
  const modeSel = $("modeSel");
  const stepSel = $("stepSel");
  const timeOn  = $("timerOn");
  const timeSel = $("timerSec");

  const bgOn = $("bgOn");
  const bgVol = $("bgVol");

  const btnReset = $("btnReset");
  const btnStart = $("btnStart");

  const btnZoomOut = $("btnZoomOut");
  const btnZoomIn  = $("btnZoomIn");
  const zoomSel    = $("zoomSel");
  const zoomWrap   = $("zoomWrap");

  const btnHide = $("btnHide"); // (legacy, may be null with menu unico)
  const btnHome = $("btnHome"); // (legacy, may be null with menu unico)


  const winFX = $("winFX");
  const winTitle = $("winTitle");
  const winSub = $("winSub");
  const btnReplay = $("btnReplay");
  const btnToHome2 = $("btnToHome2");

  const timerL = $("timerL");
  const timerR = $("timerR");

  const state = {
    step: 8,
    diff: "easy",
    timeOn: false,
    timeSec: 8,
    // progress 0..100 (100 = buca al centro)
    pL: 0,
    pR: 0,
    mode: "mix",
    // current question per side
    curL: null,
    curR: null,
    // lock per side during feedback
    lockL: false,
    lockR: false,
    ended: false,
    // timers
    tLeftL: 0,
    tLeftR: 0,
    tInt: null,
    // audio
    bg: null
  };

  function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

  function applyZoom(zOverride){
    const z = Number.isFinite(Number(zOverride)) ? Number(zOverride)
            : parseFloat((zoomSel && zoomSel.value) || "1");
    if(!zoomWrap) return;
    zoomWrap.style.transform = `scale(${z})`;
    zoomWrap.style.transformOrigin = "top center";
  }

  function beep(freq=660, dur=0.08, gain=0.05){
    try{
      const ctx = beep._ctx || (beep._ctx = new (window.AudioContext||window.webkitAudioContext)());
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    }catch(_){}
  }

  function setMsg(side, text, cls){
    const el = side==="L" ? msgL : msgR;
    el.className = "msg" + (cls ? " " + cls : "");
    el.textContent = text || "";
  }

  function setTimerUI(){
    timerL.textContent = state.timeOn ? `${state.tLeftL}s` : "—";
    timerR.textContent = state.timeOn ? `${state.tLeftR}s` : "—";
  }

  function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

  function genQuestion(diff){
    let a,b,op;

    const modes = {
      add:"+",
      sub:"-",
      mul:"×",
      div:"÷"
    };

    if(state.mode === "mix"){
      const ops = ["+","-","×","÷"];
      op = ops[Math.floor(Math.random()*ops.length)];
    }else{
      op = modes[state.mode] || "+";
    }

    if(diff==="easy"){
      // FACILE: operazioni da fare a mente (numeri a 1 cifra o max 2 cifre, sempre semplici)
      if(op==="+"){
        // somme piccole (risultato non troppo alto)
        a = randInt(0,20);
        b = randInt(0,20);
        if(a+b>30){
          // riprova una volta, poi limita b
          b = Math.max(0, 30 - a);
        }
      }else if(op==="-"){
        // sottrazioni con risultato positivo e piccolo
        a = randInt(0,30);
        b = randInt(0,20);
        if(b>a) [a,b]=[b,a];
        if(a-b>20){
          b = a - randInt(0,20);
        }
      }else if(op==="×"){
        // tabelline (1 cifra)
        a = randInt(2,9);
        b = randInt(2,9);
      }else if(op==="÷"){
        // divisioni esatte dentro le tabelline (dividendo max 81)
        b = randInt(2,9);
        const res = randInt(2,9);
        a = b * res;
        return { q: `${a} ÷ ${b}`, a: res };
      }else{
        a = randInt(0,20);
        b = randInt(0,20);
      }
    }else if(diff==="mid"){
      a = randInt(20,120);
      b = randInt(5,50);
    }else{
      a = randInt(50,300);
      b = randInt(5,100);
    }

    if(op==="-" && b>a) [a,b]=[b,a];

    if(op==="÷"){
      b = randInt(2,12);
      const res = randInt(2,12);
      a = b * res;
      return { q: `${a} ÷ ${b}`, a: res };
    }

    const ans = (op==="+") ? a+b :
                (op==="-" ? a-b :
                (op==="×" ? a*b : 0));

    return { q: `${a} ${op} ${b}`, a: ans };
  }

  function setQuestion(side){
    const q = genQuestion(state.diff);
    if(side==="L"){
      state.curL = q;
      qL.textContent = q.q;
    }else{
      state.curR = q;
      qR.textContent = q.q;
    }
  }

  function updatePositions(){
    const w = pitch.clientWidth || 800;
    const pad = 26;
    const holeRadius = 37; // approx
    const range = Math.max(120, (w/2) - pad - holeRadius);

    // blue from left edge to center
    const xL = (-range) + (state.pL/100)*range;
    // red from right edge to center
    const xR = (range) - (state.pR/100)*range;

    ballL.style.left = `calc(50% + ${xL}px)`;
    ballR.style.left = `calc(50% + ${xR}px)`;

    progL.textContent = `${Math.round(state.pL)}%`;
    progR.textContent = `${Math.round(state.pR)}%`;

    // slight "danger" glow when close
    const near = 75;
    pitch.classList.toggle("nearBlue", state.pL >= near);
    pitch.classList.toggle("nearRed",  state.pR >= near);
  }

  function showWin(side){
    state.ended = true;
    clearInterval(state.tInt); state.tInt = null;
    winFX.classList.add("show");
    winFX.setAttribute("aria-hidden","false");
    const name = side==="L" ? "BLU" : "ROSSI";
    winTitle.textContent = `GOOOL ${name}!`;
    winSub.textContent = `La palla ${side==="L" ? "blu" : "rossa"} è finita nella buca.`;
    beep(side==="L" ? 740 : 520, 0.12, 0.06);
    setMsg("L","", "");
    setMsg("R","", "");
  }

  function checkWin(){
    if(state.pL >= 100){ showWin("L"); return true; }
    if(state.pR >= 100){ showWin("R"); return true; }
    return false;
  }

  function giveStep(toSide, amount){
    if(state.ended) return;
    if(toSide==="L") state.pL = clamp(state.pL + amount, 0, 100);
    else state.pR = clamp(state.pR + amount, 0, 100);
    updatePositions();
    checkWin();
  }

  function onAnswer(side){
    if(state.ended) return;

    const isL = side==="L";
    if(isL && state.lockL) return;
    if(!isL && state.lockR) return;

    const inp = isL ? inL : inR;
    const valRaw = (inp.value||"").trim().replace(",",".");
    const val = Number(valRaw);

    const q = isL ? state.curL : state.curR;
    if(!q) return;

    const step = state.step;

    // lock small feedback window
    if(isL) state.lockL = true; else state.lockR = true;

    const ok = Number.isFinite(val) && val === q.a;

    if(ok){
      // correct -> you advance
      if(isL) state.pL = clamp(state.pL + step, 0, 100);
      else state.pR = clamp(state.pR + step, 0, 100);

      updatePositions();
      setMsg(side, "✅ Giusto! Avanzi verso la buca.", "good");
      beep(740, 0.08, 0.05);

      // reset your timer only
      if(state.timeOn){
        if(isL) state.tLeftL = state.timeSec;
        else state.tLeftR = state.timeSec;
        setTimerUI();
      }

      inp.value = "";
      setQuestion(side);

      if(checkWin()) return;

      setTimeout(()=>{
        if(isL) state.lockL=false; else state.lockR=false;
        setMsg(side,"","");
      }, 650);

    }else{
      // wrong -> opponent gains 1 step
      const opp = isL ? "R" : "L";
      giveStep(opp, step);

      updatePositions();
      setMsg(side, `❌ Sbagliato. Era ${q.a}. 1 passo all'altro!`, "bad");
      beep(420, 0.10, 0.05);

      if(state.timeOn){
        if(isL) state.tLeftL = state.timeSec;
        else state.tLeftR = state.timeSec;
        setTimerUI();
      }

      inp.value = "";
      setQuestion(side);

      if(checkWin()) return;

      setTimeout(()=>{
        if(isL) state.lockL=false; else state.lockR=false;
        setMsg(side,"","");
      }, 900);
    }
  }

  function tickTimers(){
    if(state.ended || !state.timeOn) return;

    state.tLeftL = Math.max(0, state.tLeftL - 1);
    state.tLeftR = Math.max(0, state.tLeftR - 1);
    setTimerUI();

    // timeout L
    if(state.tLeftL === 0 && !state.lockL){
      state.lockL = true;
      setMsg("L", "⏱️ Tempo! 1 passo ai ROSSI.", "bad");
      giveStep("R", state.step);
      setQuestion("L");
      state.tLeftL = state.timeSec;
      setTimerUI();
      setTimeout(()=>{ state.lockL=false; setMsg("L","", ""); }, 900);
    }
    // timeout R
    if(state.tLeftR === 0 && !state.lockR){
      state.lockR = true;
      setMsg("R", "⏱️ Tempo! 1 passo ai BLU.", "bad");
      giveStep("L", state.step);
      setQuestion("R");
      state.tLeftR = state.timeSec;
      setTimerUI();
      setTimeout(()=>{ state.lockR=false; setMsg("R","", ""); }, 900);
    }
  }

  function resetGame(){
    state.ended = false;
    state.lockL = state.lockR = false;
    state.pL = 0; state.pR = 0;
    setMsg("L","", "");
    setMsg("R","", "");
    inL.value = ""; inR.value = "";
    winFX.classList.remove("show");
    winFX.setAttribute("aria-hidden","true");

    state.step = parseInt((stepSel && stepSel.value) || String(state.step || 8),10) || 8;
    state.diff = (diffSel && diffSel.value) || state.diff || "easy";
    state.mode = (modeSel && modeSel.value) || state.mode || "mix";
    state.timeOn = !!((timeOn && timeOn.checked) || state.timeOn);
    state.timeSec = parseInt((timeSel && timeSel.value) || String(state.timeSec || 8),10) || 8;

    setQuestion("L");
    setQuestion("R");

    // timers
    clearInterval(state.tInt); state.tInt = null;
    state.tLeftL = state.timeSec;
    state.tLeftR = state.timeSec;
    setTimerUI();
    if(state.timeOn){
      state.tInt = setInterval(tickTimers, 1000);
    }else{
      timerL.textContent = "—";
      timerR.textContent = "—";
    }

    updatePositions();
  }

  function setMusic(on){
    if(!on){
      if(state.bg){
        state.bg.pause();
        state.bg = null;
      }
      return;
    }
    if(!state.bg){
      // optional: if file not present, it's fine (no crash)
      const a = new Audio("audio/bg_loop.mp3");
      a.loop = true;
      a.volume = (parseInt((bgVol && bgVol.value) || "35",10) || 35) / 100;
      a.play().catch(()=>{});
      state.bg = a;
    }
  }

  function syncVol(){
    if(state.bg){
      state.bg.volume = (parseInt((bgVol && bgVol.value) || "35",10) || 35) / 100;
    }
  }

  function hideControls(toggle){
    const c = document.querySelector(".controls");
    if(!c) return;
    c.classList.toggle("hidden", toggle);
  }




// Il menu unico emette eventi con i valori: li ascoltiamo per non dipendere dagli ID/controlli presenti.
window.addEventListener("game:options", (e)=>{
  const d = (e && e.detail) || {};
  if(d.mode) state.mode = d.mode;
  if(d.diff) state.diff = d.diff;
  if(Number.isFinite(d.step)) state.step = d.step;
  if(typeof d.tOn === "boolean") state.timeOn = d.tOn;
  if(Number.isFinite(d.tSec)) state.timeSec = d.tSec;
  resetGame();
});
window.addEventListener("game:zoom", (e)=>{
  const z = (e && e.detail && e.detail.z);
  applyZoom(z);
});
window.addEventListener("game:music", (e)=>{
  const d = (e && e.detail) || {};
  if(typeof d.vol === "number" && state.bg) state.bg.volume = d.vol;
  if(typeof d.on === "boolean") setMusic(d.on);
});
// ===== MENU UNICO (shared/game_menu.js) =====
// I bottoni del menu unico emettono anche eventi, così non dipendiamo da ID "legacy".
window.addEventListener("game:reset", resetGame);
window.addEventListener("game:play", resetGame);
window.addEventListener("game:home", ()=>{ window.location.href = "giochi_didattici.html"; });

// (in più) se vuoi mantenere anche i click diretti quando presenti:
if(btnReset) btnReset.addEventListener("click", resetGame);
if(btnStart) btnStart.addEventListener("click", resetGame);

  // bindings
  if(okL) okL.addEventListener("click", ()=>onAnswer("L"));
  if(okR) okR.addEventListener("click", ()=>onAnswer("R"));

  if(inL) inL.addEventListener("keydown", (e)=>{ if(e.key==="Enter") onAnswer("L"); });
  if(inR) inR.addEventListener("keydown", (e)=>{ if(e.key==="Enter") onAnswer("R"); });

  // quick focus (DISABILITATO su LIM: evita tastiera di sistema)

  if(diffSel) diffSel.addEventListener("change", resetGame);
  if(modeSel) modeSel.addEventListener("change", resetGame);
  if(stepSel) stepSel.addEventListener("change", resetGame);
  if(timeOn) timeOn.addEventListener("change", resetGame);
  if(timeSel) timeSel.addEventListener("change", resetGame);

  if(bgOn) bgOn.addEventListener("change", ()=>setMusic(!!bgOn.checked));
  if(bgVol) bgVol.addEventListener("input", syncVol);

  if(zoomSel) zoomSel.addEventListener("change", ()=>applyZoom());
  if(btnZoomOut) btnZoomOut.addEventListener("click", ()=>{
    const vals = ["0.9","1.0","1.1","1.2"];
    const i = vals.indexOf(zoomSel.value);
    zoomSel.value = vals[Math.max(0,i-1)];
    applyZoom();
  });
  if(btnZoomIn) btnZoomIn.addEventListener("click", ()=>{
    const vals = ["0.9","1.0","1.1","1.2"];
    const i = vals.indexOf(zoomSel.value);
    zoomSel.value = vals[Math.min(vals.length-1,i+1)];
    applyZoom();
  });

  if(btnHide) btnHide.addEventListener("click", ()=>{
    const c = document.querySelector(".controls");
    const nowHidden = !(c && c.classList.contains("hidden"));
    hideControls(nowHidden);
  });

  if(btnHome) btnHome.addEventListener("click", ()=>{ window.location.href = "index.html"; });
  btnToHome2.addEventListener("click", ()=>{ window.location.href = "index.html"; });
  btnReplay.addEventListener("click", resetGame);

  window.addEventListener("resize", updatePositions);


  /* ===== Tastierini (LIM) ===== */
  function inputFor(side){ return side==="L" ? inL : inR; }

  function applyKey(side, key){
    const inp = inputFor(side);
    if(!inp) return;
    const cur = (inp.value || "");
    if(key === "bk"){
      inp.value = cur.slice(0, -1);
      return;
    }
    if(key === "clr"){
      inp.value = "";
      return;
    }
    if(key === "neg"){
      if(cur.startsWith("-")) inp.value = cur.slice(1);
      else inp.value = "-" + cur;
      return;
    }
    if(key === "ok"){
      onAnswer(side);
      return;
    }
    if(/^[0-9]$/.test(key)){
      if(cur === "0") inp.value = key;
      else inp.value = cur + key;
    }
  }

  function bindKeypads(){
    document.querySelectorAll(".keypad").forEach(kp=>{
      const side = kp.getAttribute("data-side") || "L";
      kp.querySelectorAll(".kbtn").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const key = btn.getAttribute("data-k");
          applyKey(side, key);
        });
      });
    });
  }


  /* ===== Anti-tastiera di sistema (LIM) =====
     Su alcune LIM il tap su <input> apre la tastiera della LIM (blocca l'altra squadra).
     Qui rendiamo gli input "solo display": si scrive SOLO tramite i tastierini on-screen. */
  function lockSystemKeyboard(inp){
    if(!inp) return;
    try{ inp.setAttribute("readonly","readonly"); }catch(e){}
    try{ inp.setAttribute("inputmode","none"); }catch(e){}
    const blur = ()=>{ try{ inp.blur(); }catch(e){} };
    inp.addEventListener("focus", blur);
    // blocca tap/click che tenta di portare il focus
    ["pointerdown","mousedown","touchstart"].forEach(ev=>{
      inp.addEventListener(ev, (e)=>{ e.preventDefault(); blur(); }, {passive:false});
    });
  }

  // init
  applyZoom();
  lockSystemKeyboard(inL);
  lockSystemKeyboard(inR);
  bindKeypads();
  resetGame();

})();
