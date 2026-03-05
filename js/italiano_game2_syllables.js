const pic = document.getElementById("pic");
const msg = document.getElementById("msg");
const built = document.getElementById("built");
const opts = document.getElementById("opts");
const nextBtn = document.getElementById("nextBtn");
const resetBtn = document.getElementById("resetBtn");

function shuffle(a){
  a=a.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function pick(){
  const list = window.ITALIANO_CL3 || [];
  return list[Math.floor(Math.random()*list.length)];
}

async function findImagePath(id){
  const base = `img/italiano/classe3/${id}`;
  const exts = ["png","jpg","jpeg","webp","avif"];

  for(const ext of exts){
    const path = `${base}.${ext}`;
    try{
      await tryLoad(path);
      return path;
    }catch(e){}
  }
  return null;
}

function tryLoad(src){
  return new Promise((resolve,reject)=>{
    const im = new Image();
    im.onload = ()=>resolve(true);
    im.onerror = ()=>reject();
    im.src = src;
  });
}

let current=null;
let order=[];
let locked=false;

async function nextRound(){
  locked=false;
  order=[];
  built.className="msg";
  built.textContent="PAROLA: _";
  msg.className="msg";
  msg.textContent="Tocca le sillabe nell’ordine giusto.";
  opts.innerHTML="";

  const item=pick();
  current=item;

  const imgPath = await findImagePath(item.id);

  if(imgPath){
    pic.style.display="block";
    pic.src=imgPath;
  }else{
    pic.style.display="none";
  }

  render(item);
}

function render(item){
  const pieces = shuffle(item.syllables);
  pieces.forEach(syl=>{
    const b=document.createElement("div");
    b.className="opt";
    b.textContent=syl;
    b.onclick=()=>tapSyl(syl, b);
    opts.appendChild(b);
  });
}

function tapSyl(syl, el){
  if(locked) return;
  // impedisci doppio tap stessa tessera
  if(el.dataset.used==="1") return;

  const expected = current.syllables[order.length];
  if(syl === expected){
    el.dataset.used="1";
    el.style.opacity="0.35";
    order.push(syl);
    built.textContent = "PAROLA: " + order.join(" - ");

    if(order.length === current.syllables.length){
      locked=true;
      msg.className="msg ok";
      msg.textContent="BRAVO! ✅";
    }
  }else{
    msg.className="msg bad";
    msg.textContent=`NO ❌  •  Prossima sillaba: ${expected}`;
    setTimeout(()=>{
      if(!locked){
        msg.className="msg";
        msg.textContent="Riprova: tocchi le sillabe nell’ordine giusto.";
      }
    }, 900);
  }
}

resetBtn.addEventListener("click", ()=>nextRound());
nextBtn.addEventListener("click", ()=>nextRound());
nextRound();