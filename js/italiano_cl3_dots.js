// js/italiano_cl3_dots.js
// 33 DISEGNI AUTOMATICI (nessun punto a mano) + difficoltà bilanciata.
// Consiglio: lascia questi count; su LIM risultano più leggibili.
// (Puoi aggiungere revealImg se vuoi, ma non serve.)

window.ITALIANO_CL3_DOTS = [
  // simboli semplici (molto leggibili)
  { id:"stella",      title:"UNISCI I PUNTI: STELLA",      auto:{ type:"stella", count:20, paddingPct:11 } },
  { id:"sole",        title:"UNISCI I PUNTI: SOLE",        auto:{ type:"sole",   count:22, paddingPct:11 } },
  { id:"luna",        title:"UNISCI I PUNTI: LUNA",        auto:{ type:"luna",   count:22, paddingPct:12 } },
  { id:"cuore",       title:"UNISCI I PUNTI: CUORE",       auto:{ type:"cuore",  count:26, paddingPct:12 } },
  { id:"faccina",     title:"UNISCI I PUNTI: FACCINA",     auto:{ type:"faccina",count:24, paddingPct:12 } },

  // natura / meteo
  { id:"nuvola",      title:"UNISCI I PUNTI: NUVOLA",      auto:{ type:"nuvola", count:24, paddingPct:13 } },
  { id:"fiore",       title:"UNISCI I PUNTI: FIORE",       auto:{ type:"fiore",  count:28, paddingPct:13 } },
  { id:"foglia",      title:"UNISCI I PUNTI: FOGLIA",      auto:{ type:"foglia", count:22, paddingPct:13 } },
  { id:"albero",      title:"UNISCI I PUNTI: ALBERO",      auto:{ type:"albero", count:26, paddingPct:13 } },
  { id:"fungo",       title:"UNISCI I PUNTI: FUNGO",       auto:{ type:"fungo",  count:22, paddingPct:13 } },

  // oggetti scuola / vita quotidiana
  { id:"casa",        title:"UNISCI I PUNTI: CASA",        auto:{ type:"casa",   count:18, paddingPct:12 } },
  { id:"ombrello",    title:"UNISCI I PUNTI: OMBRELLO",    auto:{ type:"ombrello",count:22, paddingPct:13 } },
  { id:"palloncino",  title:"UNISCI I PUNTI: PALLONCINO",  auto:{ type:"palloncino",count:22, paddingPct:13 } },
  { id:"matita",      title:"UNISCI I PUNTI: MATITA",      auto:{ type:"matita", count:18, paddingPct:13 } },
  { id:"libro",       title:"UNISCI I PUNTI: LIBRO",       auto:{ type:"libro",  count:20, paddingPct:13 } },

  // cibo
  { id:"mela",        title:"UNISCI I PUNTI: MELA",        auto:{ type:"mela",   count:22, paddingPct:13 } },
  { id:"gelato",      title:"UNISCI I PUNTI: GELATO",      auto:{ type:"gelato", count:18, paddingPct:13 } },

  // animali (i più riconoscibili)
  { id:"pesce",       title:"UNISCI I PUNTI: PESCE",       auto:{ type:"pesce",  count:22, paddingPct:12 } },
  { id:"tartaruga",   title:"UNISCI I PUNTI: TARTARUGA",   auto:{ type:"tartaruga",count:26, paddingPct:13 } },
  { id:"gatto",       title:"UNISCI I PUNTI: GATTO",       auto:{ type:"gatto",  count:24, paddingPct:13 } },
  { id:"farfalla",    title:"UNISCI I PUNTI: FARFALLA",    auto:{ type:"farfalla",count:26, paddingPct:13 } },
  { id:"uccello",     title:"UNISCI I PUNTI: UCCELLO",     auto:{ type:"uccello",count:18, paddingPct:13 } },
  { id:"coniglio",    title:"UNISCI I PUNTI: CONIGLIO",    auto:{ type:"coniglio",count:24, paddingPct:13 } },
  { id:"lumaca",      title:"UNISCI I PUNTI: LUMACA",      auto:{ type:"lumaca", count:26, paddingPct:13 } },

  // trasporti / oggetti “wow”
  { id:"auto",        title:"UNISCI I PUNTI: AUTO",        auto:{ type:"auto",   count:22, paddingPct:13 } },
  { id:"barca",       title:"UNISCI I PUNTI: BARCA",       auto:{ type:"barca",  count:20, paddingPct:13 } },
  { id:"razzo",       title:"UNISCI I PUNTI: RAZZO",       auto:{ type:"razzo",  count:22, paddingPct:13 } },
  { id:"corona",      title:"UNISCI I PUNTI: CORONA",      auto:{ type:"corona", count:18, paddingPct:13 } },

  // variazioni difficoltà (stesso disegno, più facile/difficile)
  { id:"stella_facile",   title:"UNISCI I PUNTI: STELLA (FACILE)",   auto:{ type:"stella", count:14, paddingPct:11 } },
  { id:"cuore_facile",    title:"UNISCI I PUNTI: CUORE (FACILE)",    auto:{ type:"cuore",  count:18, paddingPct:12 } },
  { id:"fiore_difficile", title:"UNISCI I PUNTI: FIORE (DIFFICILE)", auto:{ type:"fiore",  count:40, paddingPct:14 } },
  { id:"lumaca_difficile",title:"UNISCI I PUNTI: LUMACA (DIFFICILE)",auto:{ type:"lumaca", count:40, paddingPct:14 } },
];
