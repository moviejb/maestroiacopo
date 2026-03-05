const titleEl = document.getElementById("title");
const msg = document.getElementById("msg");
const stage = document.getElementById("stage");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const pointsLayer = document.getElementById("pointsLayer");
const revealImgEl = document.getElementById("revealImg");

const resetBtn = document.getElementById("resetBtn");
const nextBtn = document.getElementById("nextBtn");

function shuffle(a){
  a=a.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

let sets = window.ITALIANO_CL3_DOTS || [];
let setIndex = 0;

let currentSet = null;
let nextN = 1;
let done = new Set();

function resizeCanvas(){
  const r = stage.getBoundingClientRect();
  canvas.width = Math.round(r.width * devicePixelRatio);
  canvas.height = Math.round(r.height * devicePixelRatio);
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  redrawLines();
}

function pctToPx(xPct, yPct){
  const r = stage.getBoundingClientRect();
  return {
    x: (xPct/100) * r.width,
    y: (yPct/100) * r.height
  };
}

function clear(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function redrawLines(){
  clear();
  if(!currentSet) return;

  // Linee tra punti completati in ordine
  const pts = currentSet.points.slice().sort((a,b)=>a.n-b.n);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(233,240,255,.9)";

  let started = false;
  ctx.beginPath();

  for(let i=0;i<pts.length;i++){
    const p = pts[i];
    if(!done.has(p.n)) break;
    const {x,y} = pctToPx(p.x,p.y);
    if(!started){ ctx.moveTo(x,y); started = true; }
    else ctx.lineTo(x,y);
  }
  ctx.stroke();
}

function makePointBtn(p){
  const b = document.createElement("div");
  b.className = "pointBtn";
  b.textContent = p.n;

  const pos = pctToPx(p.x,p.y);
  b.style.left = `${pos.x}px`;
  b.style.top  = `${pos.y}px`;

  b.addEventListener("click", ()=> onPick(p.n));
  return b;
}

function renderPoints(){
  pointsLayer.innerHTML = "";
  const pts = currentSet.points.slice().sort((a,b)=>a.n-b.n);

  pts.forEach(p=>{
    const b = makePointBtn(p);
    if(done.has(p.n)) b.classList.add("done");
    if(p.n === nextN) b.classList.add("next");
    pointsLayer.appendChild(b);
  });
}

function onPick(n){
  if(!currentSet) return;

  if(n !== nextN){
    msg.className = "msg bad";
    msg.textContent = `NO ❌ Tocca il numero ${nextN}`;
    setTimeout(()=>{
      msg.className = "msg";
      msg.textContent = "Tocca i numeri in ordine: 1 → 2 → 3…";
    }, 800);
    return;
  }

  done.add(n);
  nextN++;

  msg.className = "msg ok";
  msg.textContent = "BRAVO! ✅";

  renderPoints();
  redrawLines();

  const maxN = Math.max(...currentSet.points.map(p=>p.n));
  if(done.size >= maxN){
    msg.className = "msg ok";
    msg.textContent = "COMPLETATO! 🎉";
    if(currentSet.revealImg){
      revealImgEl.classList.add("show");
    }
  }
}

function loadSet(index){
  if(!sets.length){
    msg.className="msg bad";
    msg.textContent="Nessun set punti trovato in js/italiano_cl3_dots.js";
    return;
  }

  setIndex = (index + sets.length) % sets.length;
  currentSet = sets[setIndex];
  titleEl.textContent = currentSet.title || "ITALIANO 3ª • UNISCI I PUNTI";

  done = new Set();
  nextN = 1;

  revealImgEl.classList.remove("show");
  if(currentSet.revealImg){
    revealImgEl.src = currentSet.revealImg;
    revealImgEl.alt = currentSet.id || "";
  }else{
    revealImgEl.removeAttribute("src");
  }

  msg.className="msg";
  msg.textContent="Tocca i numeri in ordine: 1 → 2 → 3…";

  renderPoints();
  resizeCanvas();
}

resetBtn.addEventListener("click", ()=> loadSet(setIndex));
nextBtn.addEventListener("click", ()=> loadSet(setIndex+1));
window.addEventListener("resize", ()=>{
  // aggiorna posizione bottoni e canvas
  renderPoints();
  resizeCanvas();
});

loadSet(0);