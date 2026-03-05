const pic = document.getElementById("pic");
const msg = document.getElementById("msg");
const opts = document.getElementById("opts");
const nextBtn = document.getElementById("nextBtn");

function shuffle(a){
  a = a.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
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

let current = null;
let locked = false;

async function nextRound(){
  locked = false;
  msg.className = "msg";
  msg.textContent = "Scegli la parola corretta.";
  opts.innerHTML = "";

  const item = pick();
  current = item;

  const imgPath = await findImagePath(item.id);

  if(imgPath){
    pic.style.display = "block";
    pic.src = imgPath;
  }else{
    pic.style.display = "none";
  }

  renderOptions(item);
}

function renderOptions(item){
  const wrong = (item.wrong && item.wrong[0]) ? item.wrong[0] : null;
  if(!wrong){
    msg.className="msg bad";
    msg.textContent="Record senza parola sbagliata (wrong).";
    return;
  }
  const options = shuffle([item.word, wrong]);
  options.forEach(text=>{
    const b = document.createElement("div");
    b.className = "opt";
    b.textContent = text;
    b.onclick = ()=> choose(text);
    opts.appendChild(b);
  });
}

function choose(text){
  if(locked) return;
  locked = true;
  if(text === current.word){
    msg.className = "msg ok";
    msg.textContent = "BRAVO! ✅";
  }else{
    msg.className = "msg bad";
    msg.textContent = `NO ❌  •  Giusta: ${current.word}`;
  }
}

nextBtn.addEventListener("click", nextRound);
nextRound();