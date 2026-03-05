const pic = document.getElementById("pic");
const patternEl = document.getElementById("pattern");
const msg = document.getElementById("msg");
const opts = document.getElementById("opts");
const nextBtn = document.getElementById("nextBtn");

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
let locked=false;

async function nextRound(){
  locked=false;
  msg.className="msg";
  msg.textContent="Scegli la parte mancante.";
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

  patternEl.className="msg";
  patternEl.textContent = item.missing.pattern;

  render(item);
}

function render(item){
  const m=item.missing;
  const options = shuffle(m.options);
  options.forEach(t=>{
    const b=document.createElement("div");
    b.className="opt";
    b.textContent=t;
    b.onclick=()=>choose(t);
    opts.appendChild(b);
  });
}

function choose(t){
  if(locked) return;
  locked=true;

  if(t === current.missing.answer){
    msg.className="msg ok";
    msg.textContent="BRAVO! ✅";
  }else{
    msg.className="msg bad";
    msg.textContent=`NO ❌  •  Risposta: ${current.missing.answer}`;
  }
}

nextBtn.addEventListener("click", nextRound);
nextRound();