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
  [prevIn, nextIn].forEach(el=>{
    el.classList.remove("ok","bad");
  });
}

function setFeedback(okPrev, okNext){
  prevIn.classList.toggle("ok", !!okPrev);
  prevIn.classList.toggle("bad", !okPrev);
  nextIn.classList.toggle("ok", !!okNext);
  nextIn.classList.toggle("bad", !okNext);
}

function popCenter(){
  centerNumEl.classList.remove("pop");
  // force reflow
  void centerNumEl.offsetWidth;
  centerNumEl.classList.add("pop");
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
  popCenter();
  clearFeedback();

  prevIn.value = "";
  nextIn.value = "";
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
    return;
  }

  const okPrev = (p === prevAns);
  const okNext = (n === nextAns);

  setFeedback(okPrev, okNext);

  if(okPrev && okNext){
    setMsg("ok", "BRAVISSIMO! ✅");
  }else{
    setMsg("bad", `NO ❌  •  Precedente: ${prevAns}  •  Successivo: ${nextAns}`);
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

// start
generateCenter();
