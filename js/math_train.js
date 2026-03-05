(() => {
  // ====== DOM ======
  const track = document.getElementById("track");
  const statusEl = document.getElementById("status");
  const progressEl = document.getElementById("progress");

  const opsModeSel = document.getElementById("opsMode");
  const nStepsSel = document.getElementById("nSteps");
  const diffSel = document.getElementById("difficulty");
  const themeSel = document.getElementById("themeSel");

  const btnStart = document.getElementById("btnStart");
  const btnReset = document.getElementById("btnReset");

  const zoomRange = document.getElementById("zoomRange");
  const zoomVal = document.getElementById("zoomVal");

  const sndOk  = document.getElementById("sndOk");
  const sndErr = document.getElementById("sndErr");
  const sndWin = document.getElementById("sndWin");

  // ====== AUDIO ======
  function playSound(aud){
    if(!aud) return;
    try{
      aud.pause();
      aud.currentTime = 0;
      const p = aud.play();
      if(p && typeof p.catch === "function") p.catch(()=>{});
    }catch(e){}
  }

  function stopSound(aud){
    if(!aud) return;
    try{
      aud.pause();
      aud.currentTime = 0;
    }catch(e){}
  }

  // ====== STATE ======
  let state = {
    started: false,
    stepIndex: 0,
    nSteps: 6,
    difficulty: "primary", // primary | hard
    opsMode: "mixed",      // mixed | add | sub | mul | div
    theme: "train",
    currentValue: 0,
    won: false,
    steps: [] // each step: { currentBefore, options:[op1,op2], revealedIndex, chosen, expected, done, result, justSolved }
  };

  // ====== UTILS ======
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  function setStatus(msg, kind = "info"){
    statusEl.textContent = msg;
    statusEl.style.borderColor =
      kind === "ok" ? "rgba(40, 220, 140, .45)" :
      kind === "bad" ? "rgba(255, 90, 120, .45)" :
      "rgba(255,255,255,.16)";
  }

  function applyTheme(theme){
    document.body.classList.remove("theme-train","theme-pirate","theme-cloud");
    document.body.classList.add(
      theme === "pirate" ? "theme-pirate" :
      theme === "cloud"  ? "theme-cloud"  :
      "theme-train"
    );
  }

  function applyZoom(pct){
    document.documentElement.style.setProperty("--uiScale", String(pct/100));
    zoomVal.textContent = `${pct}%`;
  }

  // ====== OP GENERATION ======
  function allowedOps(){
    switch(state.opsMode){
      case "add": return ["+"];
      case "sub": return ["-"];
      case "mul": return ["×"];
      case "div": return ["÷"];
      default:    return ["+","-","×","÷"];
    }
  }

  function genAddOp(){
    const max = state.difficulty === "hard" ? 30 : 20;
    const delta = randInt(1, max);
    return { sym:"+", k: delta, label:`+${delta}` };
  }

  function genSubOp(current){
    const max = state.difficulty === "hard" ? 30 : 20;
    let delta = randInt(1, max);

    if(state.difficulty === "primary"){
      // non scendere sotto 0
      delta = Math.min(delta, Math.max(0, current));
      if(delta === 0){
        // evitare "-0": fallback
        return genAddOp();
      }
    }
    return { sym:"-", k: delta, label:`-${delta}` };
  }

  /* LIVELLO DIFFICOLTA MAGGIORE
function genMulOp(current){

  // limitiamo il numero base per evitare operazioni troppo lunghe
  if(Math.abs(current) > 50){
    // se il numero è grande meglio fare addizione o sottrazione
    return genAddOp();
  }

  const maxFactor = state.difficulty === "hard" ? 10 : 8;
  const factor = randInt(2, maxFactor);

  return { sym:"×", k: factor, label:`×${factor}` };
}
*/

// DIFFICOLTA TABELLINE
function genMulOp(current){
  // TABELLINE: fattori piccoli (2..10)
  const maxFactor = state.difficulty === "hard" ? 10 : 10;
  const factor = randInt(2, maxFactor);

  // numero base piccolo (0..10) così il prodotto resta “da mente”
  const maxBase = state.difficulty === "hard" ? 12 : 10;
  const base = randInt(0, maxBase);

  // In questo gioco però l'operazione è "×k" applicata al numero corrente.
  // Quindi: se il numero corrente è troppo grande, NON proporre × (fallback).
  if(Math.abs(current) > (state.difficulty === "hard" ? 25 : 15)){
    return genAddOp(); // oppure genSubOp(current) se preferisci
  }

  return { sym:"×", k: factor, label:`×${factor}` };
}
  function genDivOp(current){
    // ÷k solo se current multiplo di k (risultato intero)
    const candidates = [];
    const maxDiv = state.difficulty === "hard" ? 12 : 10;
    for(let k=2; k<=maxDiv; k++){
      if(current % k === 0) candidates.push(k);
    }
    if(candidates.length === 0) return null;
    const k = candidates[randInt(0, candidates.length-1)];
    return { sym:"÷", k, label:`÷${k}` };
  }

function compute(current, op){
  let result;
  switch(op.sym){
    case "+": result = current + op.k; break;
    case "-": result = current - op.k; break;
    case "×": result = current * op.k; break;
    case "÷": result = current / op.k; break;
    default:  result = current;
  }

  if(state.difficulty === "primary"){
    const limit = 120;
    if(Math.abs(result) > limit) return current;
  }
  return result;
}

  function genOneOption(current){
    const ops = allowedOps();
    for(let tries=0; tries<25; tries++){
      const sym = ops[randInt(0, ops.length-1)];
      if(sym === "+") return genAddOp();
      if(sym === "-") return genSubOp(current);
      if(sym === "×") return genMulOp(current);
      if(sym === "÷"){
        const d = genDivOp(current);
        if(d) return d;
      }
    }
    return genAddOp();
  }

  function genStepOptions(current){
    let a = genOneOption(current);
    let b = genOneOption(current);
    let guard = 0;
    while(b.label === a.label && guard < 10){
      b = genOneOption(current);
      guard++;
    }
    return [a,b];
  }

  // ====== RENDER ======
  function clearTrack(){
    track.innerHTML = "";
  }

  function mkCar({type, title, bodyHTML, active=false}){
    const car = document.createElement("div");
    car.className = `car ${type} ${active ? "activeGlow" : ""}`;

    const h = document.createElement("div");
    h.className = "carHeader";
    h.textContent = title;

    const b = document.createElement("div");
    b.className = "carBody";
    b.innerHTML = bodyHTML;

    car.appendChild(h);
    car.appendChild(b);
    return car;
  }

  function scrollToEnd(){
    track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
  }

  function updateProgress(){
    const done = state.steps.filter(s => s && s.done).length;
    progressEl.textContent = `${done} / ${state.nSteps}`;
    progressEl.classList.toggle("ghost", !state.started);
  }

  function renderAll(){
    clearTrack();

    // Locomotiva
    track.appendChild(mkCar({
      type: "loco",
      title: "Partenza",
      bodyHTML: `
        <div class="badge">NUMERO INIZIALE</div>
        <div class="bigNum">${state.steps.length ? state.steps[0].startValue : state.currentValue}</div>
      `,
      active: state.stepIndex === 0 && state.started
    }));

    state.steps.forEach((st, idx) => {
      const isCurrent = idx === state.stepIndex;

      // CAR scelta
      const choiceCar = document.createElement("div");
      choiceCar.className = `car choice ${isCurrent ? "activeGlow" : ""} ${st.done ? "solved" : ""} ${st.justSolved ? "solvedGlow" : ""}`;

      const header = document.createElement("div");
      header.className = "carHeader";
      header.textContent = `Vagone ${idx+1}`;

      const body = document.createElement("div");
      body.className = "carBody";

      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = st.done ? "SCELTA FATTA" : "SCEGLI UNA CARD";
      body.appendChild(badge);

      const btnRow = document.createElement("div");
      btnRow.className = "choiceBtns";

      st.options.forEach((op, i) => {
        const btn = document.createElement("button");
        btn.className = "choiceBtn";
        btn.textContent = st.revealedIndex === i ? op.label : "?";
        if(st.revealedIndex === i) btn.classList.add("revealed");

        // BLOCCO immediato dell'altra card dopo la scelta
        const otherLocked = (st.revealedIndex !== null && st.revealedIndex !== i);
        if(otherLocked) btn.classList.add("locked");

        const locked = st.done || (!isCurrent) || otherLocked;
        btn.disabled = locked;

        btn.addEventListener("click", () => {
          // se già scelto, non permettere altri click
          if(st.revealedIndex !== null) return;

          st.revealedIndex = i;
          st.chosen = op;
          st.expected = compute(st.currentBefore, op);
          renderAll();
          setTimeout(() => scrollToEnd(), 60);
        });

        btnRow.appendChild(btn);
      });

      body.appendChild(btnRow);

      // Answer area
      if(isCurrent){
        if(st.chosen){
          const answerWrap = document.createElement("div");
          answerWrap.innerHTML = `
            <div class="answerRow">
              <input inputmode="numeric" autocomplete="off" autocapitalize="off" spellcheck="false"
                     id="ans_${idx}" placeholder="Risultato…" />
              <button class="checkBtn" id="chk_${idx}" title="Verifica">✓</button>
            </div>
            <div id="fb_${idx}" class="feedback"></div>
          `;
          body.appendChild(answerWrap);

          setTimeout(() => {
            const inp = document.getElementById(`ans_${idx}`);
            const chk = document.getElementById(`chk_${idx}`);
            const fb  = document.getElementById(`fb_${idx}`);
            if(!inp || !chk || !fb) return;

            inp.focus();

            const verify = () => {
              const raw = String(inp.value || "").trim().replace(",", ".");
              if(raw === ""){
                fb.className = "feedback warn";
                fb.textContent = "Scrivi un numero 🙂";
                playSound(sndErr);
                return;
              }

              const val = Number(raw);
              if(!Number.isFinite(val) || !Number.isInteger(val)){
                fb.className = "feedback warn";
                fb.textContent = "Solo numeri interi 🙂";
                playSound(sndErr);
                return;
              }

              if(val === st.expected){
                fb.className = "feedback ok";
                fb.textContent = "OTTIMO! ✅";
                playSound(sndOk);

                st.done = true;
                st.result = st.expected;

                // glow breve sul vagone risolto
                st.justSolved = true;
                setTimeout(() => {
                  st.justSolved = false;
                  renderAll();
                }, 600);

                // step successivo o vittoria
                if(idx + 1 < state.nSteps){
                  const next = makeStep(st.result);
                  state.steps[idx + 1] = next;
                  state.stepIndex = idx + 1;
                  setStatus("Continua! Scegli il prossimo vagone ✨", "ok");
                }else{
                  setStatus("Trenino completato! 🎉", "ok");
                  state.won = true;

                  try{ sndWin.loop = false; }catch(e){}
                  playSound(sndWin);
                }

                updateProgress();
                renderAll();
                setTimeout(() => scrollToEnd(), 120);
              }else{
                fb.className = "feedback bad";
                fb.textContent = "Ops… riprova 💛";
                playSound(sndErr);

                choiceCar.animate(
                  [{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}],
                  {duration: 220}
                );
                inp.select();
              }
            };

            chk.onclick = verify;
            inp.addEventListener("keydown", (e) => {
              if(e.key === "Enter") verify();
            });
          }, 0);

        } else {
          const fb = document.createElement("div");
          fb.className = "feedback warn";
          fb.textContent = "Clicca un “?” per scoprire l’operazione.";
          body.appendChild(fb);
        }
      }

      choiceCar.appendChild(header);
      choiceCar.appendChild(body);
      track.appendChild(choiceCar);

      // CAR risultato
      if(st.done){
        const isLast = (idx + 1 === state.nSteps) && state.won;

        const resCar = mkCar({
          type: "done",
          title: `Risultato ${idx+1}`,
          bodyHTML: `
            <div class="badge">${isLast ? "🏆 VITTORIA!" : "NUOVO NUMERO"}</div>
            <div class="bigNum">${st.result}</div>
          `,
          active: false
        });

        if(isLast) resCar.classList.add("finalWin"); // CSS: .car.done.finalWin { ... }
        track.appendChild(resCar);
      }
    });

    // Placeholder iniziale
    if(!state.started){
      track.appendChild(mkCar({
        type: "choice",
        title: "Come si gioca",
        bodyHTML: `
          <div class="badge">REGOLE</div>
          <div style="font-weight:800; line-height:1.35; color: var(--txt);">
            1) Imposta il gioco<br/>
            2) Premi <b>GIOCA</b><br/>
            3) Scegli una card <b>" ? "</b><br/>
            4) Fai il calcolo e inserisci il risultato<br/>
            5) Se è giusto, il viaggio continua!
          </div>
        `,
        active: false
      }));
    }
  }

  // ====== GAME INIT ======
  function genStartValue(){
    if(state.difficulty === "primary"){
      return randInt(0, 30);
    }
    // hard: a volte parte anche da negativi
    return Math.random() < 0.25 ? randInt(-20, 20) : randInt(0, 60);
  }

  function makeStep(currentBefore){
    const opts = genStepOptions(currentBefore);
    return {
      startValue: state.steps.length === 0 ? currentBefore : undefined,
      currentBefore,
      options: opts,
      revealedIndex: null,
      chosen: null,
      expected: null,
      done: false,
      result: null,
      justSolved: false
    };
  }

  function startGame(){
    stopSound(sndWin);

    state.started = true;
    state.stepIndex = 0;
    state.nSteps = Number(nStepsSel.value);
    state.difficulty = diffSel.value;
    state.opsMode = opsModeSel.value;
    state.theme = themeSel.value;
    state.won = false;

    applyTheme(state.theme);

    state.currentValue = genStartValue();
    state.steps = [];
    state.steps.push(makeStep(state.currentValue));

    setStatus("Scegli un vagone per scoprire l’operazione ✨", "info");
    updateProgress();
    renderAll();
    setTimeout(() => track.scrollTo({left:0, behavior:"smooth"}), 50);
  }

  // APRI IL MENU DI DEFAULT SU MOBILE (prima visualizzazione)
if (window.matchMedia && window.matchMedia("(max-width: 680px)").matches) {
  document.body.classList.add("menuOpen");
}
  function resetGame(){
    stopSound(sndWin);

    state.started = false;
    state.stepIndex = 0;
    state.steps = [];
    state.won = false;

    setStatus("Pronti a fare un po' di  calcoli?", "info");
    updateProgress();
    renderAll();
    track.scrollTo({left:0, behavior:"smooth"});
  }

  // ====== EVENTS ======
  btnStart.addEventListener("click", () => {
  startGame();

  /* su mobile chiude il menu */
  document.body.classList.remove("menuOpen");
});
  btnReset.addEventListener("click", resetGame);

  themeSel.addEventListener("change", () => {
    applyTheme(themeSel.value);
  });

  zoomRange.addEventListener("input", () => {
    applyZoom(Number(zoomRange.value));
  });

  // ====== BOOT ======
  applyTheme(themeSel.value);
  applyZoom(Number(zoomRange.value));
  resetGame();



  // ===== MOBILE MENU TOGGLE =====
const btnMobileMenu = document.getElementById("btnMobileMenu");
if(btnMobileMenu){
  btnMobileMenu.addEventListener("click", () => {
    document.body.classList.toggle("menuOpen");
  });
}


// chiude il menu mobile quando tocchi l'area di gioco
const gameArea = document.querySelector(".gameWrap");

if(gameArea){
  gameArea.addEventListener("click", () => {
    document.body.classList.remove("menuOpen");
  });
}


})();