/* =========================================================
   shared/game_menu.js
   MENU UNICO (stile "calcio") per tutti i giochi simili
   - Nessun fetch: genera HTML via JS (robusto su Pages)
   - Emissione eventi:
       game:play, game:reset, game:home
       game:zoom {z}
       game:options {mode,diff,step,tOn,tSec}
       game:music {on,vol}
   - Emette anche: game-menu:ready
   ========================================================= */
(function(){
  "use strict";

  const Z = [0.6,0.7,0.8,0.9,1.0,1.1,1.2];

  function emit(name, detail){
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function nearestZoom(v){
    v = Number(v);
    if(!Number.isFinite(v)) v = 1.0;
    return Z.reduce((best, z)=> (Math.abs(z - v) < Math.abs(best - v) ? z : best), 1.0);
  }

  function createMenu(){
    const mount = document.getElementById("menuMount");
    if(!mount) return;

    const title = window.__GAME_TITLE__ || "Gioco";
    mount.innerHTML = `
      <header class="gameTopbar">
       

        <div class="controls" id="gameControls" aria-label="Impostazioni">

          <label class="ctrl">
            <span class="lbl">Operazioni</span>
            <select id="modeSel">
              <option value="mix" selected>Miste</option>
              <option value="add">Addizioni</option>
              <option value="sub">Sottrazioni</option>
              <option value="mul">Moltiplicazioni</option>
              <option value="div">Divisioni</option>
            </select>
          </label>

          <label class="ctrl">
            <span class="lbl">Difficoltà</span>
            <select id="diffSel">
              <option value="easy" selected>Facile</option>
              <option value="med">Media</option>
              <option value="hard">Difficile</option>
            </select>
          </label>

          <label class="ctrl">
            <span class="lbl">Passo</span>
            <select id="stepSel">
              <option value="6">6</option>
              <option value="8">8</option>
              <option value="10" selected>10</option>
              <option value="12">12</option>
            </select>
          </label>

          <label class="ctrl">
            <span class="lbl">Tempo</span>
            <input id="timerOn" type="checkbox" aria-label="Timer on/off"/>
            <select id="timerSec" aria-label="Secondi">
              <option value="6">6s</option>
              <option value="8">8s</option>
              <option value="10" selected>10s</option>
              <option value="12">12s</option>
            </select>
          </label>

          <label class="ctrl musicCtrl">
            <span class="lbl">Musica</span>
            <input id="bgOn" type="checkbox" aria-label="Musica on/off"/>
            <input id="bgVol" type="range" min="0" max="100" value="35" aria-label="Volume musica"/>
          </label>

          <label class="ctrl zoomCtrl">
            <span class="lbl">Zoom</span>
            <button id="btnZoomOut" class="miniBtn" type="button" aria-label="Zoom meno">−</button>
            <select id="zoomSel" aria-label="Zoom">
             <option value="0.6">60%</option>
              <option value="0.7" selected>70%</option>
              <option value="0.8">80%</option>
              <option value="0.9">90%</option>
              <option value="1.0">100%</option>
              <option value="1.1">110%</option>
              <option value="1.2">120%</option>
            </select>
            <button id="btnZoomIn" class="miniBtn" type="button" aria-label="Zoom più">+</button>
          </label>

          <button id="btnReset" class="btn" type="button">RESET</button>
          <button id="btnStart" class="btn ok" type="button">GIOCA</button>
          <button id="btnHomeTop" class="btn ghost" type="button" aria-label="Home">🏠</button>
        </div>
      </header>
    `;

    wire();
    emit("game-menu:ready");
  }

  function wire(){
    const byId = (id)=>document.getElementById(id);

    const modeSel = byId("modeSel");
    const diffSel = byId("diffSel");
    const stepSel = byId("stepSel");
    const timerOn = byId("timerOn");
    const timerSec= byId("timerSec");

    const bgOn = byId("bgOn");
    const bgVol= byId("bgVol");

    const zoomSel= byId("zoomSel");
    const zOut   = byId("btnZoomOut");
    const zIn    = byId("btnZoomIn");

    function emitOptions(){
      emit("game:options", {
        mode: modeSel?.value,
        diff: diffSel?.value,
        step: stepSel ? parseInt(stepSel.value,10) : undefined,
        tOn:  !!timerOn?.checked,
        tSec: timerSec ? parseInt(timerSec.value,10) : undefined
      });
    }
    function emitMusic(){
      emit("game:music", {
        on: !!bgOn?.checked,
        vol: (parseInt(bgVol?.value || "35", 10) || 35) / 100
      });
    }
    function emitZoom(){
      const z = nearestZoom(zoomSel?.value || "1.0");
      if(zoomSel) zoomSel.value = String(z);
      emit("game:zoom", { z });
    }

    byId("btnReset")?.addEventListener("click", ()=>emit("game:reset"));
    byId("btnStart")?.addEventListener("click", ()=>emit("game:play"));
    byId("btnHomeTop")?.addEventListener("click", ()=>emit("game:home"));

    modeSel?.addEventListener("change", emitOptions);
    diffSel?.addEventListener("change", emitOptions);
    stepSel?.addEventListener("change", emitOptions);
    timerOn?.addEventListener("change", emitOptions);
    timerSec?.addEventListener("change", emitOptions);

    bgOn?.addEventListener("change", emitMusic);
    bgVol?.addEventListener("input", emitMusic);

    zoomSel?.addEventListener("change", emitZoom);
    zOut?.addEventListener("click", ()=>{
      const cur = nearestZoom(zoomSel?.value || "1.0");
      const i = Z.indexOf(cur);
      const next = Z[Math.max(0, i-1)];
      if(zoomSel) zoomSel.value = String(next);
      emit("game:zoom", { z: next });
    });
    zIn?.addEventListener("click", ()=>{
      const cur = nearestZoom(zoomSel?.value || "1.0");
      const i = Z.indexOf(cur);
      const next = Z[Math.min(Z.length-1, i+1)];
      if(zoomSel) zoomSel.value = String(next);
      emit("game:zoom", { z: next });
    });

    // initial push
    emitOptions();
    emitMusic();
    emitZoom();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", createMenu);
  }else{
    // DOM già pronto (es. script caricato tardi): crea subito
    createMenu();
  }
})();
