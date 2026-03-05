const titleEl = document.getElementById("title");
const msg = document.getElementById("msg");
const stage = document.getElementById("stage");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const pointsLayer = document.getElementById("pointsLayer");
const revealImgEl = document.getElementById("revealImg");

const resetBtn = document.getElementById("resetBtn");
const nextBtn = document.getElementById("nextBtn");

// ======================
// GENERATORE FIGURE AUTO
// ======================
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function mapToPct(pt, padPct){
  const pad = padPct ?? 10;
  const x = ((pt.x + 1) / 2) * (100 - 2*pad) + pad;
  const y = ((pt.y + 1) / 2) * (100 - 2*pad) + pad;
  return { x, y };
}

function arcPoints(cx, cy, rx, ry, a0, a1, count){
  const out=[];
  for(let i=0;i<count;i++){
    const t = count === 1 ? 0 : i/(count-1);
    const a = a0 + (a1-a0)*t;
    out.push({ x: cx + Math.cos(a)*rx, y: cy + Math.sin(a)*ry });
  }
  return out;
}

function circlePoints(cx, cy, r, count){
  return arcPoints(cx, cy, r, r, 0, Math.PI*2, count);
}

function resamplePolyline(poly, n){
  const pts = poly.slice();
  if(pts.length < 2) return pts;

  const segLen=[];
  let total=0;
  for(let i=0;i<pts.length-1;i++){
    const dx=pts[i+1].x-pts[i].x;
    const dy=pts[i+1].y-pts[i].y;
    const L=Math.hypot(dx,dy);
    segLen.push(L);
    total += L;
  }
  if(total === 0) return pts;

  const step = total/(n-1);
  const out=[ {x:pts[0].x, y:pts[0].y} ];
  let curSeg=0, curDist=0;

  for(let i=1;i<n-1;i++){
    const target = step*i;
    while(curSeg < segLen.length && curDist + segLen[curSeg] < target){
      curDist += segLen[curSeg];
      curSeg++;
    }
    if(curSeg >= segLen.length) break;

    const remain = target - curDist;
    const t = segLen[curSeg] === 0 ? 0 : remain/segLen[curSeg];
    const a = pts[curSeg], b = pts[curSeg+1];
    out.push({ x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t });
  }

  out.push({x:pts[pts.length-1].x, y:pts[pts.length-1].y});
  return out;
}

// --------- FIGURE (tutte in [-1..1]) ---------

function shapeStar(){
  const spikes = 5, outer = 0.95, inner = 0.42, rot = -Math.PI/2;
  const pts = [];
  for(let i=0;i<spikes*2;i++){
    const r = (i%2===0) ? outer : inner;
    const a = rot + i*(Math.PI/spikes);
    pts.push({ x: Math.cos(a)*r, y: Math.sin(a)*r });
  }
  pts.push(pts[0]);
  return pts;
}

function shapeSun(){
  const rays = 12, outer = 0.95, inner = 0.70, rot = -Math.PI/2;
  const pts=[];
  for(let i=0;i<rays*2;i++){
    const r = (i%2===0) ? outer : inner;
    const a = rot + i*(Math.PI/rays);
    pts.push({ x: Math.cos(a)*r, y: Math.sin(a)*r });
  }
  pts.push(pts[0]);
  return pts;
}

function shapeMoon(){
  const outer = arcPoints(0, 0, 0.95, 0.95, -Math.PI/2, Math.PI/2, 22);
  const inner = arcPoints(0.35, 0, 0.70, 0.70, Math.PI/2, -Math.PI/2, 22);
  return [...outer, ...inner, outer[0]];
}

function shapeHeart(){
  const leftArc  = arcPoints(-0.45, -0.15, 0.45, 0.45, Math.PI, 0, 18);
  const rightArc = arcPoints( 0.45, -0.15, 0.45, 0.45, Math.PI, 0, 18);
  const tip = { x: 0, y: 0.95 };
  return [...leftArc, ...rightArc, tip, leftArc[0]];
}

function shapeHouse(){
  const w = 0.95;
  const left = -w, right = w, bottom = 0.95, top = 0.10;
  const roofTop = { x: 0, y: -0.95 };
  const roofL = { x: left, y: top };
  const roofR = { x: right, y: top };
  return [roofL, roofTop, roofR, {x:right,y:bottom}, {x:left,y:bottom}, roofL];
}

function shapeTree(){
  const crown = circlePoints(0, -0.25, 0.60, 22);
  const trunk = [
    {x:-0.20,y:0.25},{x:-0.20,y:0.95},{x: 0.20,y:0.95},{x: 0.20,y:0.25},{x:-0.20,y:0.25}
  ];
  return [...crown, crown[0], ...trunk, crown[0]];
}

function shapeFlower(){
  const petals = 6;
  const out=[];
  const r = 0.35;
  for(let k=0;k<petals;k++){
    const a = -Math.PI/2 + k*(2*Math.PI/petals);
    const cx = Math.cos(a)*0.25;
    const cy = Math.sin(a)*0.25;
    const pet = arcPoints(cx, cy, r, r, a - Math.PI/2, a + Math.PI*3/2, 10);
    pet.forEach(p=> out.push(p));
  }
  out.push(out[0]);
  return out;
}

function shapeFish(){
  const oval = arcPoints(-0.15, 0.05, 0.80, 0.45, 0.2, Math.PI*2-0.2, 30);
  const tailTop = { x: 0.95, y: -0.15 };
  const tailMid = { x: 0.65, y: 0.05 };
  const tailBot = { x: 0.95, y: 0.25 };
  return [...oval, tailTop, tailMid, tailBot, oval[0]];
}

function shapeTurtle(){
  const shell = arcPoints(0, 0.05, 0.75, 0.55, 0, Math.PI*2, 26);
  const legs = [
    {x:-0.55,y:0.25},{x:-0.75,y:0.35},{x:-0.55,y:0.45},
    {x: 0.55,y:0.25},{x: 0.75,y:0.35},{x: 0.55,y:0.45},
    {x:-0.25,y:0.55},{x:-0.35,y:0.85},{x:-0.15,y:0.55},
    {x: 0.25,y:0.55},{x: 0.35,y:0.85},{x: 0.15,y:0.55},
  ];
  return [...shell, shell[0], ...legs, shell[0]];
}

function shapeCat(){
  const head = circlePoints(0, 0.10, 0.65, 22);
  const ears = [
    {x:-0.35,y:-0.35},{x:-0.55,y:-0.95},{x:-0.10,y:-0.60},
    {x: 0.10,y:-0.60},{x: 0.55,y:-0.95},{x: 0.35,y:-0.35},
    {x:-0.35,y:-0.35}
  ];
  return [...head, head[0], ...ears, head[0]];
}

function shapeButterfly(){
  const left = arcPoints(-0.45, 0, 0.50, 0.70, -Math.PI/2, Math.PI*3/2, 18);
  const right= arcPoints( 0.45, 0, 0.50, 0.70, Math.PI*3/2, -Math.PI/2, 18);
  const body = [{x:0,y:-0.75},{x:0,y:0.85},{x:0,y:-0.75}];
  return [...left, ...right, ...body, left[0]];
}

function shapeBalloon(){
  const ball = arcPoints(0, -0.20, 0.55, 0.70, 0, Math.PI*2, 24);
  const knot = [{x:0,y:0.55},{x:-0.08,y:0.68},{x:0.08,y:0.68},{x:0,y:0.55}];
  const string = [{x:0,y:0.68},{x:-0.15,y:0.95},{x:0.10,y:0.95}];
  return [...ball, ball[0], ...knot, ...string, ball[0]];
}

function shapeCloud(){
  const p1 = arcPoints(-0.45, 0.05, 0.35, 0.28, Math.PI, 0, 10);
  const p2 = arcPoints( 0.00,-0.10, 0.50, 0.38, Math.PI, 0, 12);
  const p3 = arcPoints( 0.50, 0.05, 0.35, 0.28, Math.PI, 0, 10);
  const bottom = [
    {x:0.85,y:0.30},{x:0.70,y:0.55},{x:-0.70,y:0.55},{x:-0.85,y:0.30},p1[0]
  ];
  return [...p1, ...p2, ...p3, ...bottom];
}

function shapeCar(){
  const body = [
    {x:-0.90,y:0.35},{x:-0.60,y:0.05},{x: 0.20,y:0.05},{x: 0.55,y:0.20},
    {x: 0.90,y:0.20},{x: 0.90,y:0.55},{x:-0.90,y:0.55},{x:-0.90,y:0.35}
  ];
  const w1 = circlePoints(-0.45,0.55,0.18,12);
  const w2 = circlePoints( 0.45,0.55,0.18,12);
  return [...body, ...w1, w1[0], ...w2, w2[0], body[0]];
}

function shapeBoat(){
  const hull = [{x:-0.90,y:0.55},{x:-0.55,y:0.85},{x: 0.55,y:0.85},{x: 0.90,y:0.55},{x:-0.90,y:0.55}];
  const mast = [{x:0,y:0.55},{x:0,y:-0.85},{x:0,y:0.55}];
  const sail = [{x:0,y:-0.85},{x:-0.75,y:0.10},{x:0,y:0.10},{x:0,y:-0.85}];
  return [...hull, ...mast, ...sail, hull[0]];
}

function shapeRocket(){
  const nose = [{x:0,y:-0.95},{x:-0.35,y:-0.55},{x:0.35,y:-0.55},{x:0,y:-0.95}];
  const body = [{x:-0.35,y:-0.55},{x:-0.35,y:0.55},{x:0.35,y:0.55},{x:0.35,y:-0.55}];
  const fins = [
    {x:-0.35,y:0.25},{x:-0.70,y:0.55},{x:-0.35,y:0.55},
    {x: 0.35,y:0.25},{x: 0.70,y:0.55},{x: 0.35,y:0.55}
  ];
  const flame = [{x:0,y:0.55},{x:-0.20,y:0.95},{x:0.20,y:0.95},{x:0,y:0.55}];
  return [...nose, ...body, ...fins, ...flame, nose[0]];
}

function shapePencil(){
  const body = [
    {x:-0.70,y:-0.75},{x: 0.70,y:-0.75},{x: 0.70,y: 0.35},{x:-0.70,y: 0.35},{x:-0.70,y:-0.75}
  ];
  const tip = [{x:-0.70,y:0.35},{x:0,y:0.95},{x:0.70,y:0.35},{x:-0.70,y:0.35}];
  return [...body, ...tip, body[0]];
}

function shapeBook(){
  const left = [
    {x:-0.90,y:-0.70},{x:-0.10,y:-0.80},{x:-0.10,y:0.85},{x:-0.90,y:0.70},{x:-0.90,y:-0.70}
  ];
  const right = [
    {x:0.90,y:-0.70},{x:0.10,y:-0.80},{x:0.10,y:0.85},{x:0.90,y:0.70},{x:0.90,y:-0.70}
  ];
  const spine = [{x:0,y:-0.80},{x:0,y:0.85}];
  return [...left, ...spine, ...right, left[0]];
}

function shapeApple(){
  const round = arcPoints(0, 0.10, 0.70, 0.75, 0, Math.PI*2, 26);
  const notch = [{x:-0.15,y:-0.55},{x:0,y:-0.75},{x:0.15,y:-0.55}];
  const stem = [{x:0,y:-0.75},{x:0.05,y:-0.95},{x:0,y:-0.75}];
  return [...round, round[0], ...notch, ...stem, round[0]];
}

function shapeIceCream(){
  const scoop = arcPoints(0, -0.35, 0.60, 0.55, Math.PI, 0, 18);
  const cone = [{x:-0.45,y:-0.35},{x:0,y:0.95},{x:0.45,y:-0.35},{x:-0.45,y:-0.35}];
  return [...scoop, ...cone, scoop[0]];
}

function shapeUmbrella(){
  const top = arcPoints(0, -0.15, 0.90, 0.65, Math.PI, 0, 20);
  const scallop = [
    {x:0.90,y:-0.15},{x:0.60,y:0.05},{x:0.30,y:-0.15},{x:0.00,y:0.05},
    {x:-0.30,y:-0.15},{x:-0.60,y:0.05},{x:-0.90,y:-0.15}
  ];
  const handle = [{x:0,y:-0.15},{x:0,y:0.80},{x:0.25,y:0.95}];
  return [...top, ...scallop, ...handle, top[0]];
}

function shapeCrown(){
  return [
    {x:-0.90,y:0.55},{x:-0.65,y:-0.10},{x:-0.30,y:0.55},{x:0,y:-0.35},
    {x:0.30,y:0.55},{x:0.65,y:-0.10},{x:0.90,y:0.55},{x:0.90,y:0.85},
    {x:-0.90,y:0.85},{x:-0.90,y:0.55}
  ];
}

function shapeSmiley(){
  const face = circlePoints(0,0,0.85,26);
  const mouth = arcPoints(0,0.20,0.45,0.35,0,Math.PI,14);
  return [...face, face[0], ...mouth, face[0]];
}

function shapeLeaf(){
  const a = arcPoints(0,0,0.85,0.55,-Math.PI/2,Math.PI*3/2,26);
  const tip = {x:0,y:-0.95};
  const base = {x:0,y:0.95};
  return [tip, ...a, base, tip];
}

function shapeMushroom(){
  const cap = arcPoints(0, -0.10, 0.90, 0.65, Math.PI, 0, 22);
  const brim = [{x:0.90,y:-0.10},{x:-0.90,y:-0.10}];
  const stem = [{x:-0.35,y:-0.10},{x:-0.25,y:0.95},{x:0.25,y:0.95},{x:0.35,y:-0.10},{x:-0.35,y:-0.10}];
  return [...cap, ...brim, ...stem, cap[0]];
}

function shapeBird(){
  const left = arcPoints(-0.30,0.10,0.55,0.45,Math.PI*1.05,Math.PI*1.95,14);
  const right= arcPoints( 0.30,0.10,0.55,0.45,Math.PI*1.05,Math.PI*1.95,14);
  return [...left, ...right, left[0]];
}

function shapeRabbit(){
  const head = circlePoints(0,0.25,0.55,22);
  const ear1 = arcPoints(-0.25,-0.45,0.20,0.55,Math.PI,0,12);
  const ear2 = arcPoints( 0.25,-0.45,0.20,0.55,Math.PI,0,12);
  return [...head, head[0], ...ear1, ...ear2, head[0]];
}

function shapeSnail(){
  const spiral=[];
  const turns=2.5, steps=28;
  for(let i=0;i<steps;i++){
    const t=i/(steps-1);
    const a = t*turns*Math.PI*2;
    const r = 0.05 + t*0.55;
    spiral.push({x: Math.cos(a)*r -0.20, y: Math.sin(a)*r});
  }
  const body=[{x:-0.80,y:0.55},{x:0.60,y:0.55},{x:0.80,y:0.35},{x:0.60,y:0.25},{x:-0.80,y:0.25},{x:-0.80,y:0.55}];
  return [...spiral, ...body, spiral[0]];
}

function getShapeBuilder(type){
  const t = (type||"").toLowerCase().trim();
  const map = {
    "stella": shapeStar, "star": shapeStar,
    "sole": shapeSun, "sun": shapeSun,
    "luna": shapeMoon, "moon": shapeMoon,
    "cuore": shapeHeart, "heart": shapeHeart,
    "casa": shapeHouse, "house": shapeHouse,
    "albero": shapeTree, "tree": shapeTree,
    "fiore": shapeFlower, "flower": shapeFlower,
    "pesce": shapeFish, "fish": shapeFish,
    "tartaruga": shapeTurtle, "turtle": shapeTurtle,
    "gatto": shapeCat, "cat": shapeCat,
    "farfalla": shapeButterfly, "butterfly": shapeButterfly,
    "palloncino": shapeBalloon, "balloon": shapeBalloon,
    "nuvola": shapeCloud, "cloud": shapeCloud,
    "auto": shapeCar, "car": shapeCar, "macchina": shapeCar,
    "barca": shapeBoat, "boat": shapeBoat,
    "razzo": shapeRocket, "rocket": shapeRocket,
    "matita": shapePencil, "pencil": shapePencil,
    "libro": shapeBook, "book": shapeBook,
    "mela": shapeApple, "apple": shapeApple,
    "gelato": shapeIceCream, "icecream": shapeIceCream,
    "ombrello": shapeUmbrella, "umbrella": shapeUmbrella,
    "corona": shapeCrown, "crown": shapeCrown,
    "smiley": shapeSmiley, "faccina": shapeSmiley,
    "foglia": shapeLeaf, "leaf": shapeLeaf,
    "fungo": shapeMushroom, "mushroom": shapeMushroom,
    "uccello": shapeBird, "bird": shapeBird,
    "coniglio": shapeRabbit, "rabbit": shapeRabbit,
    "lumaca": shapeSnail, "snail": shapeSnail
  };
  return map[t] || shapeStar;
}

function generateAutoPoints(auto){
  const type = auto?.type || "stella";
  const count = clamp(parseInt(auto?.count ?? 24, 10) || 24, 8, 80);
  const padPct = clamp(parseFloat(auto?.paddingPct ?? 10), 3, 22);

  const builder = getShapeBuilder(type);
  const poly = builder(auto || {});
  const resampled = resamplePolyline(poly, count);

// ✅ se il primo e l'ultimo punto coincidono (chiusura), elimino l'ultimo
// così non si sovrappone al punto 1 (niente "1 nascosto")
if(resampled.length >= 2){
  const a = resampled[0];
  const b = resampled[resampled.length - 1];
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  if(d < 0.02){               // soglia piccola (in coordinate -1..1)
    resampled.pop();
    auto._closeLoop = true;   // memorizzo che la figura va chiusa
  }
}

const ptsPct = resampled.map(p=> mapToPct(p, padPct));

return ptsPct.map((p, i)=> ({ n: i+1, x: p.x, y: p.y }));
}

// ======================
// GIOCO
// ======================
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
  return { x: (xPct/100) * r.width, y: (yPct/100) * r.height };
}

function clear(){ ctx.clearRect(0,0,canvas.width,canvas.height); }

function redrawLines(){
  clear();
  if(!currentSet) return;

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
  // ✅ se completato e la figura è "closed", disegna l'ultima linea verso il punto 1
if(currentSet._closeLoop){
  const maxN = Math.max(...currentSet.points.map(p=>p.n));
  if(done.size >= maxN && maxN >= 2){
    const pts = currentSet.points.slice().sort((a,b)=>a.n-b.n);
    const first = pts[0];
    const last = pts[pts.length - 1];

    const A = pctToPx(last.x, last.y);
    const B = pctToPx(first.x, first.y);

    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
  }
}
}

function makePointBtn(p){
  const b = document.createElement("div");
  b.className = "pointBtn";
  b.textContent = p.n;

  const pos = pctToPx(p.x,p.y);

  // ✅ clamp anti-“punto 1 invisibile”
  const r = stage.getBoundingClientRect();
  const margin = 26;
  const x = clamp(pos.x, margin, r.width - margin);
  const y = clamp(pos.y, margin, r.height - margin);

  b.style.left = `${x}px`;
  b.style.top  = `${y}px`;

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

function normalizeSet(set){
  if(set && (!set.points || !set.points.length) && set.auto){
  set.auto._closeLoop = false;
  set.points = generateAutoPoints(set.auto);
  set._closeLoop = !!set.auto._closeLoop;   // ✅ chiudi la linea a fine gioco
}else{
  set._closeLoop = false;
}
return set;
}

function loadSet(index){
  if(!sets.length){
    msg.className="msg bad";
    msg.textContent="Nessun set punti trovato in js/italiano_cl3_dots.js";
    return;
  }

  setIndex = (index + sets.length) % sets.length;
  currentSet = normalizeSet(sets[setIndex]);

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
window.addEventListener("resize", ()=>{ renderPoints(); resizeCanvas(); });

loadSet(0);