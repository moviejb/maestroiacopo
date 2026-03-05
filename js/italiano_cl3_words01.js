// Classe 3 - Facile - Italiano (dataset unico per 3 giochi)
// Immagini: img/italiano/classe3/<id>.png  (es: gatto.png)

window.ITALIANO_CL3 = [
  // DOPPIE
  { id:"gatto",    word:"GATTO",    wrong:["GATO"],      syllables:["GAT","TO"], missing:{pattern:"GA..O", answer:"TT", options:["TT","T","DD"]}},
  { id:"palla",    word:"PALLA",    wrong:["PALA"],      syllables:["PAL","LA"], missing:{pattern:"PA..A", answer:"LL", options:["LL","L","GL"]}},
  { id:"penna",    word:"PENNA",    wrong:["PENA"],      syllables:["PEN","NA"], missing:{pattern:"PE..A", answer:"NN", options:["NN","N","MM"]}},
  { id:"tetto",    word:"TETTO",    wrong:["TETO"],      syllables:["TET","TO"], missing:{pattern:"TE..O", answer:"TT", options:["TT","T","CC"]}},
  { id:"carro",    word:"CARRO",    wrong:["CARO"],      syllables:["CAR","RO"], missing:{pattern:"CA..O", answer:"RR", options:["RR","R","LL"]}},
  { id:"torre",    word:"TORRE",    wrong:["TORE"],      syllables:["TOR","RE"], missing:{pattern:"TO..E", answer:"RR", options:["RR","R","NN"]}},
  { id:"cassa",    word:"CASSA",    wrong:["CASA"],      syllables:["CAS","SA"], missing:{pattern:"CA..A", answer:"SS", options:["SS","S","ZZ"]}},

  // CHI/CHE - GHI/GHE
  { id:"chiave",   word:"CHIAVE",   wrong:["CIAVE"],     syllables:["CHIA","VE"], missing:{pattern:"..IAVE", answer:"CH", options:["CH","C","GH"]}},
  { id:"chiesa",   word:"CHIESA",   wrong:["CIESA"],     syllables:["CHIE","SA"], missing:{pattern:"..IESA", answer:"CH", options:["CH","C","GH"]}},
  { id:"chela",    word:"CHELA",    wrong:["CELA"],      syllables:["CHE","LA"],  missing:{pattern:"..ELA",  answer:"CH", options:["CH","C","GH"]}}, // parola semplice (che-la)
  { id:"ghiro",    word:"GHIRO",    wrong:["GIRO"],      syllables:["GHI","RO"],  missing:{pattern:"..IRO",  answer:"GH", options:["GH","G","CH"]}},
  { id:"ghepardo", word:"GHEPARDO", wrong:["GEPARDO"],   syllables:["GHE","PAR","DO"], missing:{pattern:"..EPARDO", answer:"GH", options:["GH","G","CH"]}},

  // SC - SCI/SCE
  { id:"scuola",   word:"SCUOLA",   wrong:["SQUOLA"],    syllables:["SCUO","LA"], missing:{pattern:"S..OLA", answer:"CU", options:["CU","QU","CQU"]}},
  { id:"pesce",    word:"PESCE",    wrong:["PESE"],      syllables:["PE","SCE"],  missing:{pattern:"PE..E", answer:"SC", options:["SC","S","SS"]}},
  { id:"scala",    word:"SCALA",    wrong:["SALA"],      syllables:["SCA","LA"],  missing:{pattern:"..ALA",  answer:"SC", options:["SC","S","SS"]}},

  // GLI / GN
  { id:"figlio",   word:"FIGLIO",   wrong:["FILIO"],     syllables:["FI","GLI","O"], missing:{pattern:"FI..O", answer:"GLI", options:["GLI","LI","LLI"]}},
  { id:"coniglio", word:"CONIGLIO", wrong:["CONILIO"],   syllables:["CO","NI","GLIO"], missing:{pattern:"CONI..O", answer:"GLI", options:["GLI","LI","LLI"]}},
  { id:"bagno",    word:"BAGNO",    wrong:["BANO"],      syllables:["BA","GNO"],  missing:{pattern:"BA..O", answer:"GN", options:["GN","N","NG"]}},
  { id:"ragno",    word:"RAGNO",    wrong:["RANO"],      syllables:["RA","GNO"],  missing:{pattern:"RA..O", answer:"GN", options:["GN","N","NG"]}},

  // CU / QU / CQU
  { id:"acqua",    word:"ACQUA",    wrong:["AQUA"],      syllables:["AC","QUA"],  missing:{pattern:"A..UA", answer:"CQ", options:["CQ","Q","CC"]}},
  { id:"cuore",    word:"CUORE",    wrong:["QUORE"],     syllables:["CUO","RE"],  missing:{pattern:"..ORE", answer:"CU", options:["CU","QU","CQU"]}},
  { id:"quadro",   word:"QUADRO",   wrong:["CUADRO"],    syllables:["QUA","DRO"], missing:{pattern:"..ADRO", answer:"QU", options:["QU","CU","CQU"]}},

  // SUONI SEMPLICI (facili, per aumentare varietà)
  { id:"mare",     word:"MARE",     wrong:["Mare"],      syllables:["MA","RE"],   missing:{pattern:"M..E", answer:"AR", options:["AR","ER","IR"]}},
  { id:"luna",     word:"LUNA",     wrong:["LONA"],      syllables:["LU","NA"],   missing:{pattern:"L..A", answer:"UN", options:["UN","ON","AN"]}},
  { id:"limone",   word:"LIMONE",   wrong:["LIMONI"],    syllables:["LI","MO","NE"], missing:{pattern:"LI..NE", answer:"MO", options:["MO","MA","MU"]}},
  { id:"banana",   word:"BANANA",   wrong:["BANANA"],    syllables:["BA","NA","NA"], missing:{pattern:"BA..NA", answer:"NA", options:["NA","NE","NI"]}},
  { id:"gelato",   word:"GELATO",   wrong:["GHELATO"],   syllables:["GE","LA","TO"], missing:{pattern:"GE..TO", answer:"LA", options:["LA","LE","LI"]}},
];

// Aggiunge automaticamente il percorso immagine (gatto -> img/.../gatto.png)
window.ITALIANO_CL3.forEach(o => {
  o.img = `img/italiano/classe3/${o.id}.png`;
});