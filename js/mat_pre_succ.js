
const msg = document.getElementById("msg");
const centerNumEl = document.getElementById("centerNum");
const prevIn = document.getElementById("prevIn");
const nextIn = document.getElementById("nextIn");

const newBtn = document.getElementById("newBtn");
const checkBtn = document.getElementById("checkBtn");
const resetBtn = document.getElementById("resetBtn");

const minSel = document.getElementById("minSel");
const maxSel = document.getElementById("maxSel");
const stepSel = document.getElementById("stepSel");

let center = null;
let modalitàNumero = "interi"; // "interi" oppure "decimali"

function setMsg(type, text){
  msg.className = "msg" + (type ? " " + type : "");
  msg.textContent = text;
}

function randInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseNum(val){
  if(val == null) return null;
  const cleaned = String(val).trim().replace(",", ".");
  if(cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
} 

function getDecimalsFromStep(step){
  const s = String(step);
  if(!s.includes(".")) return 0;
  return s.split(".")[1].length;
}

function roundByStep(value, step){
  const decimals = getDecimalsFromStep(step);
  return Number(value.toFixed(decimals));
}

function aggiornaStepOptions(){
  const options = stepSel.querySelectorAll("option");

  options.forEach(opt => {
    const val = opt.value;

    const èDecimale = val.includes(".");

    if(modalitàNumero === "interi"){
      // nascondi decimali
      opt.style.display = èDecimale ? "none" : "block";
    } else {
      // nascondi interi
      opt.style.display = èDecimale ? "block" : "none";
    }
  });

  // sicurezza: se selezione attuale non è valida → correggi
  const current = stepSel.value;

  if(modalitàNumero === "interi" && current.includes(".")){
    stepSel.value = "1";
  }

  if(modalitàNumero === "decimali" && !current.includes(".")){
    stepSel.value = "0.1";
  }
}

// ===== SUONI MORBIDI =====
let audioCtx = null;

function getAudioCtx(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function tone(freq, time, volume=0.05){
  const ctx = getAudioCtx();
  if(ctx.state === "suspended") ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;

  gain.gain.value = volume;

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  setTimeout(()=>osc.stop(), time);
}

function sfxOk(){
  tone(880,120);
  setTimeout(()=>tone(1040,140),130);
}

function sfxBad(){
  tone(320,140);
  setTimeout(()=>tone(260,180),150);
}

function sfxNew(){
  tone(600,80,0.035);
}


// ===== UI feedback =====
function clearFeedback(){
  [prevIn, nextIn].forEach(el=> el.classList.remove("ok","bad"));
  centerNumEl.classList.remove("pop","win","shake");
}

function setFeedback(okPrev, okNext){
  prevIn.classList.toggle("ok", !!okPrev);
  prevIn.classList.toggle("bad", !okPrev);
  nextIn.classList.toggle("ok", !!okNext);
  nextIn.classList.toggle("bad", !okNext);
}

function animateCenter(kind){
  // kind: "pop" | "win" | "shake"
  centerNumEl.classList.remove("pop","win","shake");
  // force reflow to restart animation
  void centerNumEl.offsetWidth;
  centerNumEl.classList.add(kind);
}

// ===== Game logic =====
function generateCenter(){
  const min = parseInt(minSel.value, 10);
  const max = parseInt(maxSel.value, 10);
  const step = modalitàNumero === "decimali"
  ? parseFloat(stepSel.value)
  : parseInt(stepSel.value, 10);

  const low = min + step;
  const high = max - step;

  if(low > high){
    setMsg("bad", "Range troppo stretto per questo PASSO. Aumenta MAX o riduci PASSO.");
    center = null;
    centerNumEl.textContent = "—";
    clearFeedback();
    return;


  }

  const kMin = Math.ceil((low - min) / step);
  const kMax = Math.floor((high - min) / step);
  const k = randInt(kMin, kMax);

  center = min + k * step;

if(modalitàNumero === "decimali"){
  center = roundByStep(center, step);
}

  centerNumEl.textContent = center;
  sfxNew();
  animateCenter("pop");

  prevIn.value = "";
  nextIn.value = "";
  clearFeedback(); // rimuove colori input e animazioni precedenti

  prevIn.focus();
  setMsg("", "Scrivi il numero precedente e quello successivo.");
  newBtn.disabled = true;
}

function check(){
  if(center == null) return;

  const step = modalitàNumero === "decimali"
  ? parseFloat(stepSel.value)
  : parseInt(stepSel.value, 10);
  const prevAns = roundByStep(center - step, step);
const nextAns = roundByStep(center + step, step);

  const p = parseNum(prevIn.value);
  const n = parseNum(nextIn.value);

  if(p == null || n == null){
    setMsg("bad", "Compila entrambe le caselle.");
    prevIn.classList.add("bad");
    nextIn.classList.add("bad");
    animateCenter("shake");
    return;
  }

  const okPrev = (p === prevAns);
  const okNext = (n === nextAns);

  setFeedback(okPrev, okNext);

 if(okPrev && okNext){
  setMsg("ok", "OTTIMO! ✅");
  animateCenter("win");
  sfxOk();            // ✅ suono GIUSTO
}else{
  //setMsg("bad", `NO ❌  •  Precedente: ${prevAns}  •  Successivo: ${nextAns}`);
  setMsg("bad", `NO ❌`);
  animateCenter("shake");
  sfxBad();           // ❌ suono SBAGLIATO
}
     newBtn.disabled = false;
}

function resetSame(){
  if(center == null) generateCenter();
  prevIn.value = "";
  nextIn.value = "";
  clearFeedback();
  prevIn.focus();
  setMsg("", "Riprova.");
}

// Enter per verificare
[prevIn, nextIn].forEach(inp=>{
  inp.addEventListener("keydown", (e)=>{
    if(e.key === "Enter") check();
  });
});

newBtn.addEventListener("click", generateCenter);
checkBtn.addEventListener("click", check);
resetBtn.addEventListener("click", resetSame);

// Se cambi range/passo: rigenera subito
[minSel, maxSel, stepSel].forEach(sel=>{
  sel.addEventListener("change", generateCenter);
});

generateCenter();



// ===== ZOOM (topbar) =====
const zoomSel = document.getElementById("zoomSel");
const zoomVal = document.getElementById("zoomVal");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");

const ZOOM_KEY = "mat_pre_succ_zoom";

function applyZoom(z){
  z = Math.max(0.6, Math.min(1.6, z));
  document.body.style.setProperty("--zoom", String(z));
  zoomSel.value = String(z);
  zoomVal.textContent = Math.round(z * 100) + "%";
  localStorage.setItem(ZOOM_KEY, String(z));
}

function getNextZoom(current, dir){
  const steps = Array.from(zoomSel.options).map(o => Number(o.value));
  const i = steps.indexOf(current);
  if(i === -1) return current;
  const ni = Math.max(0, Math.min(steps.length - 1, i + dir));
  return steps[ni];
}

// init zoom
(function(){
  const saved = Number(localStorage.getItem(ZOOM_KEY));
  const start = Number.isFinite(saved) ? saved : Number(zoomSel.value);
  applyZoom(start);
})();

zoomSel.addEventListener("change", () => applyZoom(Number(zoomSel.value)));
zoomInBtn.addEventListener("click", () => {
  const cur = Number(zoomSel.value);
  applyZoom(getNextZoom(cur, +1));
});
zoomOutBtn.addEventListener("click", () => {
  const cur = Number(zoomSel.value);
  applyZoom(getNextZoom(cur, -1));
});

const btnInteri = document.getElementById("integersBtn");
const btnDecimali = document.getElementById("decimalsBtn");

btnInteri.addEventListener("click", () => {
  modalitàNumero = "interi";

  aggiornaStepOptions();   // 👈 NUOVO

  aggiornaBottoni();
  generateCenter();
});

btnDecimali.addEventListener("click", () => {
  modalitàNumero = "decimali";

  aggiornaStepOptions();   // 👈 NUOVO

  aggiornaBottoni();
  generateCenter();
});

function aggiornaBottoni(){
  btnInteri.classList.toggle("active", modalitàNumero === "interi");
  btnDecimali.classList.toggle("active", modalitàNumero === "decimali");
}

aggiornaBottoni();
aggiornaBottoni();