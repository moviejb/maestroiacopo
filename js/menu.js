/* js/menu.js
   - menu unico (HOME | DIDATTICI | GRUPPO | ADMIN)
   - sottovoci DIDATTICI: Quiz | Abbinamenti | Memory
   - evidenziazione automatica pulsante attivo (anche sulle sottopagine)
   - hamburger mobile con animazione fluida
   - dropdown click-friendly (LIM) + chiusura se tocchi fuori + ESC
   Richiede: js/nav.js (goHome/goDidattici/goGruppo/goAdmin)
*/
(function () {

  function pageName() {
    return (location.pathname.split("/").pop() || "index.html").toLowerCase();
  }

  function inPath(token) {
    return (location.pathname || "").toLowerCase().includes(token);
  }

  function activeKey() {
    const p = pageName();

    // Home
    if (p === "index.html" || p === "" || p === "/") return "home";

    // Didattici (pagina lista + sottopagine)
   if (
  p.includes("giochi_didattici") ||
  p.includes("index_quiz") ||
  p.includes("memory") ||
  p.includes("tug_of_math") ||
  inPath("/pairs/")
) return "didattici";

    // Gruppo
    if (p.includes("giochi_gruppo")) return "gruppo";

    // Admin
    if (p.includes("admin")) return "admin";

    return "";
  }

  function ensureHost() {
    let host = document.querySelector("#appMenu");
    if (!host) {
      host = document.createElement("div");
      host.id = "appMenu";
      document.body.prepend(host);
    }
    return host;
  }

  function injectStyles() {
    if (document.getElementById("appMenuStyles")) return;

    const style = document.createElement("style");
    style.id = "appMenuStyles";
    style.textContent = `
/* --- sub menu (solo game_combo admin) --- */
#adminSubnav{
  display:none;
  width:100%;
  box-sizing:border-box;
  padding: 8px 14px;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0,0,0,.06);
}
#adminSubnav.show{
  display:flex;
  justify-content:flex-end;
  gap:8px;
}
#adminSubnav .subbtn{
  border: 1px solid rgba(0,0,0,.10);
  background: rgba(0,0,0,.04);
  padding: 8px 10px;
  border-radius: 999px;
  font-weight: 900;
  cursor: pointer;
}
#adminSubnav .subbtn.active{
  background: #1f2937;
  color: #fff;
  border-color: #111827;
}

#appMenu{ position:sticky; top:0; z-index:9999; }

/* top bar minimal */
.topnav{
  background: rgba(255,255,255,.86);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom:1px solid rgba(15,23,42,.10);
}

.navwrap{
  max-width: 1100px;
  margin: 0 auto;
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 14px;
}

.brand{
  font-weight:700;
  letter-spacing:.2px;
  color:#0f172a;
  white-space:nowrap;
  margin-right:6px;
  display:flex;
  align-items:center;
  gap:8px;
}

.navbtn{
  appearance:none;
  border:0;
  background: transparent;
  color:#0f172a;
  padding:10px 10px;
  border-radius:12px;
  font-weight:600;
  cursor:pointer;
  white-space:nowrap;
  position:relative;
}

.navbtn:hover{
  background: rgba(15,23,42,.05);
}

.navbtn.active{
  background: rgba(15,23,42,.06);
}

.navbtn.active::after{
  content:"";
  position:absolute;
  left:10px; right:10px;
  bottom:6px;
  height:2px;
  border-radius:2px;
  background: rgba(15,23,42,.45);
}

.navbtn.lock{
  padding-left:12px;
}

.spacer{ flex:1; }

/* Dropdown DIDATTICI */
.dd{
  position:relative;
  display:inline-flex;
  align-items:center;
}
.dd .caret{
  opacity:.6;
  margin-left:6px;
  font-weight:700;
}
.ddpanel{
  position:absolute;
  top:46px;
  left:0;
  min-width: 210px;
  background: rgba(255,255,255,.98);
  border:1px solid rgba(15,23,42,.10);
  border-radius:14px;
  box-shadow: 0 18px 40px rgba(15,23,42,.12);
  padding:8px;
  display:none;
}
.ddpanel .dditem{
  width:100%;
  text-align:left;
  border:0;
  background:transparent;
  padding:10px 10px;
  border-radius:12px;
  cursor:pointer;
  font-weight:650;
  color:#0f172a;
}
.ddpanel .dditem:hover{
  background: rgba(15,23,42,.06);
}
.dd.open .ddpanel{ display:block; }

/* hover on desktop (comodità mouse) */
@media (hover:hover){
  .dd:hover .ddpanel{ display:block; }
  .dd:hover{ z-index:10000; }
}

/* Hamburger */
.burger{
  display:none;
  width:44px; height:40px;
  border-radius:14px;
  border:1px solid rgba(15,23,42,.12);
  background: rgba(255,255,255,.75);
  align-items:center; justify-content:center;
  cursor:pointer;
}

.burger:hover{
  background: rgba(15,23,42,.05);
}

.burger .lines{ width:18px; height:12px; position:relative; }
.burger .lines span{
  position:absolute; left:0; right:0;
  height:2px; background:#0f172a; border-radius:2px;
  transition: transform .22s ease, top .22s ease, opacity .18s ease;
}
.burger .lines span:nth-child(1){ top:0; }
.burger .lines span:nth-child(2){ top:5px; }
.burger .lines span:nth-child(3){ top:10px; }

/* drawer mobile */
.drawer{
  background: rgba(255,255,255,.96);
  border-bottom:1px solid rgba(15,23,42,.10);
  overflow:hidden;
  max-height:0;
  opacity:0;
  transform: translateY(-6px);
  transition: max-height .28s ease, opacity .22s ease, transform .22s ease;
}

.drawer .inner{
  max-width: 1100px;
  margin: 0 auto;
  padding: 8px 14px 14px;
  display:flex;
  flex-direction:column;
  gap:8px;
}

.drawer .inner .navbtn,
.drawer .inner .dditem{
  width:100%;
  text-align:left;
  padding:12px 12px;
  border:1px solid rgba(15,23,42,.10);
  background:#fff;
  border-radius:14px;
}

.drawer .inner .navbtn.active::after{
  left:12px; right:12px;
  bottom:8px;
}

/* sottovoci in drawer */
.drawer .sub{
  margin-top:-2px;
  display:flex;
  flex-direction:column;
  gap:6px;
  padding-left:10px;
}
.drawer .sub .dditem{
  border-style:dashed;
  opacity:.96;
}

.drawer.open{
  max-height:520px;
  opacity:1;
  transform: translateY(0);
}

/* burger “X” when open */
.burger.open .lines span:nth-child(1){ top:5px; transform: rotate(45deg); }
.burger.open .lines span:nth-child(2){ opacity:0; }
.burger.open .lines span:nth-child(3){ top:5px; transform: rotate(-45deg); }

/* MOBILE */
@media (max-width:780px){
  .navwrap .navbtn{ display:none; }
  .navwrap .dd{ display:none; }
  .burger{ display:flex; }
}
`;
    document.head.appendChild(style);
  }

  function setActiveButtons(key) {
    document.querySelectorAll("#appMenu [data-act]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.act === key);
    });
  }

  function safeCall(fnName, ...args) {
    const fn = window[fnName];
    if (typeof fn === "function") return fn(...args);
    console.warn(`[menu] Funzione mancante: ${fnName}()`);
  }

  function goTo(relPath) {
    try {
      location.href = new URL(relPath, location.href).href;
    } catch (e) {
      location.href = relPath;
    }
  }

  function render() {
    const host = ensureHost();

    host.innerHTML = `
<div class="topnav">
  <div class="navwrap">
    <div class="brand">LIVE GAME</div>

    <button class="navbtn" type="button" data-act="home">HOME</button>

    <div class="dd" id="ddDidattici">
      <button class="navbtn" type="button" data-act="didattici">
        GIOCHI DIDATTICI <span class="caret">▾</span>
      </button>
      <div class="ddpanel" role="menu" aria-label="Giochi didattici">
  <button class="dditem" type="button" data-href="index_quiz.html">Quiz</button>
  <button class="dditem" type="button" data-href="pairs_select.html">Abbinamenti</button>
  <button class="dditem" type="button" data-href="memory.html">Memory</button>
  <button class="dditem" type="button" data-href="tug_of_math.html">Super Sfida Matematica</button>
</div>
    </div>

    <button class="navbtn" type="button" data-act="gruppo">GIOCHI DI GRUPPO</button>

    <div class="spacer"></div>

    <button class="navbtn lock" type="button" data-act="admin">🔒 ADMIN</button>

    <button class="burger" type="button" aria-label="Apri menu" aria-expanded="false">
      <div class="lines"><span></span><span></span><span></span></div>
    </button>
  </div>
</div>

<div class="drawer" id="drawer" aria-hidden="true">
  <div class="inner">
    <button class="navbtn" type="button" data-act="home">HOME</button>
    <button class="navbtn" type="button" data-act="didattici">GIOCHI DIDATTICI</button>
    <div class="sub" aria-label="Sottopagine didattici">
      <button class="dditem" type="button" data-href="index_quiz.html">↳ Quiz</button>
      <button class="dditem" type="button" data-href="pairs_select.html">↳ Abbinamenti</button>
      <button class="dditem" type="button" data-href="memory.html">↳ Memory</button>
      <button class="dditem" type="button" data-href="tug_of_math.html">↳ Super Sfida Matematica</button>
    </div>
    <button class="navbtn" type="button" data-act="gruppo">GIOCHI DI GRUPPO</button>
    <button class="navbtn lock" type="button" data-act="admin">🔒 ADMIN</button>
  </div>
</div>

<div class="subnav" id="adminSubnav">
  <button class="subbtn" type="button" data-sub="home">Scegli domande</button>
  <button class="subbtn" type="button" data-sub="library">Archivio domande</button>
  <button class="subbtn" type="button" data-sub="teacher">Inserisci domande</button>
</div>
`;

    // attivo automatico
    setActiveButtons(activeKey());

    // ===== Admin subnav SOLO in game_combo (screens: home/library/teacher) =====
    const subnav = host.querySelector("#adminSubnav");

    // base padding (se la pagina già lo usa, lo rispettiamo)
    const __bodyPad0 = (() => {
      try { return parseFloat(getComputedStyle(document.body).paddingTop) || 0; }
      catch (e) { return 0; }
    })();

    function adjustBodyForSubnav(){
      if(!subnav) return;
      try{
        const extra = subnav.classList.contains("show") ? subnav.offsetHeight : 0;
        // Applichiamo sempre: così non sovrappone mai (anche con position:sticky)
        document.body.style.paddingTop = (__bodyPad0 + extra) + "px";
      }catch(e){}
    }

    function adminSessionOk(){
      try{
        // compat: quiz manager + admin area
        return (sessionStorage.getItem("QM_ACCESS_OK_V1") === "1") ||
               (sessionStorage.getItem("ADMIN_OK") === "1") ||
               (localStorage.getItem("ADMIN_OK") === "1");
      }catch(e){ return false; }
    }

    function activeGameComboScreen(){
      try{
        const s = document.querySelector(".screen.active");
        return s ? (s.id || "") : "";
      }catch(e){ return ""; }
    }

    function setSubActive(id){
      if(!subnav) return;
      subnav.querySelectorAll(".subbtn").forEach(b=>b.classList.remove("active"));
      const btn = subnav.querySelector(`.subbtn[data-sub="${id}"]`);
      if(btn) btn.classList.add("active");
    }

    function ensureSubnav(){
      if(!subnav) return;

      const isGameCombo = pageName().includes("game_combo");
      if(!isGameCombo || !adminSessionOk()){
        subnav.classList.remove("show");
        adjustBodyForSubnav();
        return;
      }

      const scr = activeGameComboScreen();
      // mostra solo nelle schermate "admin" (no durante il quiz in corso)
      const shouldShow = (scr === "library" || scr === "teacher" || scr === "home");
      subnav.classList.toggle("show", shouldShow);

      if(shouldShow) setSubActive(scr || "home");
      adjustBodyForSubnav();
    }

    // click subnav
    if(subnav){
      subnav.addEventListener("click", (e)=>{
        const b = e.target && e.target.closest ? e.target.closest(".subbtn") : null;
        if(!b) return;
        const dest = b.getAttribute("data-sub") || "";
        try{ closeDrawer(); }catch(err){}
        try{ closeDropdown(); }catch(err){}

        if(dest === "library" && typeof window.openLibrary === "function") window.openLibrary();
        else if(dest === "teacher" && typeof window.openTeacher === "function") window.openTeacher();
        else if(dest === "home" && typeof window.openChooseProtected === "function") window.openChooseProtected();
        else{
          try{ if(typeof window.show === "function") window.show("home"); }catch(err){}
        }

        setTimeout(ensureSubnav, 50);
      }, true);
    }

    // aggiornamento automatico (poll leggero)
    try{
      if(!window.__adminSubnavTimer){
        window.__adminSubnavTimer = setInterval(ensureSubnav, 200);
      }
    }catch(e){}

    // prima sincronizzazione
    ensureSubnav();

    const burger = host.querySelector(".burger");
    const drawer = host.querySelector("#drawer");
    const dd = host.querySelector("#ddDidattici");

    const openDrawer = () => {
      drawer.classList.add("open");
      burger.classList.add("open");
      burger.setAttribute("aria-expanded", "true");
      drawer.setAttribute("aria-hidden", "false");
      setActiveButtons(activeKey());
    };

    const closeDrawer = () => {
      drawer.classList.remove("open");
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
      dd && dd.classList.remove("open");
    };

    const isOpen = () => drawer.classList.contains("open");

    const closeDropdown = () => dd && dd.classList.remove("open");
    const toggleDropdown = () => dd && dd.classList.toggle("open");

    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      isOpen() ? closeDrawer() : openDrawer();
    });

    // Toggle dropdown on click (utile su LIM)
    const ddBtn = dd ? dd.querySelector('[data-act="didattici"]') : null;
    ddBtn && ddBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown();
      setActiveButtons(activeKey());
    });

    // click fuori chiude tutto
    document.addEventListener("click", (e) => {
      if (isOpen() && !host.contains(e.target)) closeDrawer();
      if (dd && dd.classList.contains("open") && !dd.contains(e.target)) closeDropdown();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (isOpen()) closeDrawer();
        closeDropdown();
      }
    });

    // handler pulsanti principali
    host.querySelectorAll("[data-act]").forEach(btn => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.act;

        // se è didattici (top) il click gestisce il dropdown, non navigare
        if (btn.closest(".dd")) return;

        closeDrawer();
        closeDropdown();

        if (act === "home") return safeCall("goHome");
        if (act === "didattici") return safeCall("goDidattici");
        if (act === "gruppo") return safeCall("goGruppo");
        if (act === "admin") return safeCall("goAdmin");
      });
    });

    // handler sottovoci (top dropdown + drawer)
    host.querySelectorAll("[data-href]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeDrawer();
        closeDropdown();
        goTo(btn.dataset.href);
      });
    });

    window.__menuRefreshActive = () => setActiveButtons(activeKey());
  }

  function init() {
    injectStyles();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();