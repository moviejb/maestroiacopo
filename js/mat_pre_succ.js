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

function setMsg(type, text){
  msg.className = "msg" + (type ? " " + type : "");
  msg.textContent = text;
}

function randInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseNum(val){
  if(val == null) return null;
  const cleaned = String(val).trim();
  if(cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
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
  const step = parseInt(stepSel.value, 10);

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

  centerNumEl.textContent = center;
  animateCenter("pop");

  prevIn.value = "";
  nextIn.value = "";
  clearFeedback(); // rimuove colori input e animazioni precedenti

  prevIn.focus();
  setMsg("", "Scrivi il numero precedente e quello successivo.");
}

function check(){
  if(center == null) return;

  const step = parseInt(stepSel.value, 10);
  const prevAns = center - step;
  const nextAns = center + step;

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
  }else{
    //setMsg("bad", `NO ❌  •  Precedente: ${prevAns}  •  Successivo: ${nextAns}`);
     setMsg("bad", `NO ❌`);
    animateCenter("shake");
  }
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