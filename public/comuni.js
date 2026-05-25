// Province italiane con codice
const PROVINCE = [
{"c":"AG","n":"Agrigento"},{"c":"AL","n":"Alessandria"},{"c":"AN","n":"Ancona"},{"c":"AO","n":"Aosta"},{"c":"AQ","n":"L'Aquila"},{"c":"AR","n":"Arezzo"},{"c":"AP","n":"Ascoli Piceno"},{"c":"AT","n":"Asti"},{"c":"AV","n":"Avellino"},{"c":"BA","n":"Bari"},{"c":"BT","n":"Barletta-Andria-Trani"},{"c":"BL","n":"Belluno"},{"c":"BN","n":"Benevento"},{"c":"BG","n":"Bergamo"},{"c":"BI","n":"Biella"},{"c":"BO","n":"Bologna"},{"c":"BZ","n":"Bolzano"},{"c":"BS","n":"Brescia"},{"c":"BR","n":"Brindisi"},{"c":"CA","n":"Cagliari"},{"c":"CL","n":"Caltanissetta"},{"c":"CB","n":"Campobasso"},{"c":"CI","n":"Carbonia-Iglesias"},{"c":"CE","n":"Caserta"},{"c":"CT","n":"Catania"},{"c":"CZ","n":"Catanzaro"},{"c":"CH","n":"Chieti"},{"c":"CO","n":"Como"},{"c":"CS","n":"Cosenza"},{"c":"CR","n":"Cremona"},{"c":"KR","n":"Crotone"},{"c":"CN","n":"Cuneo"},{"c":"EN","n":"Enna"},{"c":"FM","n":"Fermo"},{"c":"FE","n":"Ferrara"},{"c":"FI","n":"Firenze"},{"c":"FG","n":"Foggia"},{"c":"FC","n":"Forlì-Cesena"},{"c":"FR","n":"Frosinone"},{"c":"GE","n":"Genova"},{"c":"GO","n":"Gorizia"},{"c":"GR","n":"Grosseto"},{"c":"IM","n":"Imperia"},{"c":"IS","n":"Isernia"},{"c":"SP","n":"La Spezia"},{"c":"LT","n":"Latina"},{"c":"LE","n":"Lecce"},{"c":"LC","n":"Lecco"},{"c":"LI","n":"Livorno"},{"c":"LO","n":"Lodi"},{"c":"LU","n":"Lucca"},{"c":"MC","n":"Macerata"},{"c":"MN","n":"Mantova"},{"c":"MS","n":"Massa-Carrara"},{"c":"MT","n":"Matera"},{"c":"VS","n":"Medio Campidano"},{"c":"ME","n":"Messina"},{"c":"MI","n":"Milano"},{"c":"MO","n":"Modena"},{"c":"MB","n":"Monza e Brianza"},{"c":"NA","n":"Napoli"},{"c":"NO","n":"Novara"},{"c":"NU","n":"Nuoro"},{"c":"OG","n":"Ogliastra"},{"c":"OT","n":"Olbia-Tempio"},{"c":"OR","n":"Oristano"},{"c":"PD","n":"Padova"},{"c":"PA","n":"Palermo"},{"c":"PR","n":"Parma"},{"c":"PV","n":"Pavia"},{"c":"PG","n":"Perugia"},{"c":"PU","n":"Pesaro e Urbino"},{"c":"PE","n":"Pescara"},{"c":"PC","n":"Piacenza"},{"c":"PI","n":"Pisa"},{"c":"PT","n":"Pistoia"},{"c":"PN","n":"Pordenone"},{"c":"PZ","n":"Potenza"},{"c":"PO","n":"Prato"},{"c":"RG","n":"Ragusa"},{"c":"RA","n":"Ravenna"},{"c":"RC","n":"Reggio Calabria"},{"c":"RE","n":"Reggio Emilia"},{"c":"RI","n":"Rieti"},{"c":"RN","n":"Rimini"},{"c":"RM","n":"Roma"},{"c":"RO","n":"Rovigo"},{"c":"SA","n":"Salerno"},{"c":"SS","n":"Sassari"},{"c":"SV","n":"Savona"},{"c":"SI","n":"Siena"},{"c":"SR","n":"Siracusa"},{"c":"SO","n":"Sondrio"},{"c":"TA","n":"Taranto"},{"c":"TE","n":"Teramo"},{"c":"TR","n":"Terni"},{"c":"TO","n":"Torino"},{"c":"TP","n":"Trapani"},{"c":"TN","n":"Trento"},{"c":"TV","n":"Treviso"},{"c":"TS","n":"Trieste"},{"c":"UD","n":"Udine"},{"c":"VA","n":"Varese"},{"c":"VE","n":"Venezia"},{"c":"VB","n":"Verbano-Cusio-Ossola"},{"c":"VC","n":"Vercelli"},{"c":"VR","n":"Verona"},{"c":"VV","n":"Vibo Valentia"},{"c":"VI","n":"Vicenza"},{"c":"VT","n":"Viterbo"}
];

// Categorie ATECO principali (Camera di Commercio)
const CATEGORIE = [
{"cod":"A01","label":"Coltivazioni agricole e produzione di prodotti animali"},
{"cod":"A02","label":"Silvicoltura e utilizzo di aree forestali"},
{"cod":"A03","label":"Pesca e acquacoltura"},
{"cod":"B","label":"Estrazione di minerali da cave e miniere"},
{"cod":"C10","label":"Industrie alimentari"},
{"cod":"C11","label":"Industria delle bevande"},
{"cod":"C12","label":"Industria del tabacco"},
{"cod":"C13","label":"Industrie tessili"},
{"cod":"C14","label":"Confezione di articoli di abbigliamento"},
{"cod":"C15","label":"Fabbricazione di articoli in pelle e simili"},
{"cod":"C16","label":"Industria del legno e dei prodotti in legno e sughero"},
{"cod":"C17","label":"Fabbricazione di carta e di prodotti di carta"},
{"cod":"C18","label":"Stampa e riproduzione di supporti registrati"},
{"cod":"C19","label":"Fabbricazione di coke e prodotti derivanti dalla raffinazione del petrolio"},
{"cod":"C20","label":"Fabbricazione di prodotti chimici"},
{"cod":"C21","label":"Fabbricazione di prodotti farmaceutici di base"},
{"cod":"C22","label":"Fabbricazione di articoli in gomma e materie plastiche"},
{"cod":"C23","label":"Fabbricazione di altri prodotti della lavorazione di minerali non metalliferi"},
{"cod":"C24","label":"Metallurgia"},
{"cod":"C25","label":"Fabbricazione di prodotti in metallo (esclusi macchinari)"},
{"cod":"C26","label":"Fabbricazione di computer e prodotti di elettronica"},
{"cod":"C27","label":"Fabbricazione di apparecchiature elettriche"},
{"cod":"C28","label":"Fabbricazione di macchinari e apparecchiature"},
{"cod":"C29","label":"Fabbricazione di autoveicoli, rimorchi e semirimorchi"},
{"cod":"C30","label":"Fabbricazione di altri mezzi di trasporto"},
{"cod":"C31","label":"Fabbricazione di mobili"},
{"cod":"C32","label":"Altre industrie manifatturiere"},
{"cod":"C33","label":"Riparazione e manutenzione di macchine e apparecchiature"},
{"cod":"D","label":"Fornitura di energia elettrica, gas, vapore e aria condizionata"},
{"cod":"E","label":"Fornitura di acqua, reti fognarie, gestione rifiuti e risanamento"},
{"cod":"F41","label":"Costruzione di edifici"},
{"cod":"F42","label":"Ingegneria civile"},
{"cod":"F43","label":"Lavori di costruzione specializzati (impianti, finiture, ecc.)"},
{"cod":"G45","label":"Commercio e riparazione di autoveicoli e motocicli"},
{"cod":"G46","label":"Commercio all'ingrosso (escluso autoveicoli)"},
{"cod":"G47","label":"Commercio al dettaglio (escluso autoveicoli)"},
{"cod":"H49","label":"Trasporto terrestre e mediante condotte"},
{"cod":"H50","label":"Trasporto marittimo e per vie d'acqua"},
{"cod":"H51","label":"Trasporto aereo"},
{"cod":"H52","label":"Magazzinaggio e attività di supporto ai trasporti"},
{"cod":"H53","label":"Servizi postali e attività di corriere"},
{"cod":"I55","label":"Alloggio (hotel, B&B, agriturismo, ecc.)"},
{"cod":"I56","label":"Attività di ristorazione (ristoranti, bar, catering)"},
{"cod":"J58","label":"Attività editoriali"},
{"cod":"J59","label":"Produzione cinematografica, video, programmi TV"},
{"cod":"J60","label":"Attività di programmazione e trasmissione"},
{"cod":"J61","label":"Telecomunicazioni"},
{"cod":"J62","label":"Produzione di software e consulenza informatica"},
{"cod":"J63","label":"Attività dei servizi d'informazione e altri servizi informatici"},
{"cod":"K64","label":"Attività di servizi finanziari (banche, credito)"},
{"cod":"K65","label":"Assicurazioni e fondi pensione"},
{"cod":"K66","label":"Attività ausiliarie dei servizi finanziari"},
{"cod":"L","label":"Attività immobiliari"},
{"cod":"M69","label":"Attività legali e contabilità (avvocati, commercialisti)"},
{"cod":"M70","label":"Attività di direzione aziendale e consulenza gestionale"},
{"cod":"M71","label":"Attività degli studi di architettura e ingegneria"},
{"cod":"M72","label":"Ricerca scientifica e sviluppo"},
{"cod":"M73","label":"Pubblicità e ricerche di mercato"},
{"cod":"M74","label":"Altre attività professionali, scientifiche e tecniche"},
{"cod":"M75","label":"Servizi veterinari"},
{"cod":"N77","label":"Attività di noleggio e leasing"},
{"cod":"N78","label":"Attività di ricerca, selezione, fornitura di personale"},
{"cod":"N79","label":"Attività dei servizi delle agenzie di viaggio"},
{"cod":"N80","label":"Servizi di vigilanza e investigazione"},
{"cod":"N81","label":"Attività di servizi per edifici e paesaggio (pulizie, giardinaggio)"},
{"cod":"N82","label":"Attività di supporto per le funzioni d'ufficio"},
{"cod":"O","label":"Amministrazione pubblica e difesa"},
{"cod":"P","label":"Istruzione (scuole, corsi, formazione)"},
{"cod":"Q86","label":"Assistenza sanitaria (medici, ospedali, cliniche)"},
{"cod":"Q87","label":"Servizi di assistenza sociale residenziale"},
{"cod":"Q88","label":"Assistenza sociale non residenziale"},
{"cod":"R90","label":"Attività creative, artistiche e di intrattenimento"},
{"cod":"R91","label":"Biblioteche, archivi, musei e altre attività culturali"},
{"cod":"R92","label":"Attività riguardanti le lotterie, scommesse, case da gioco"},
{"cod":"R93","label":"Attività sportive, di intrattenimento e di divertimento"},
{"cod":"S94","label":"Attività di organizzazioni associative"},
{"cod":"S95","label":"Riparazione di computer, beni personali e per la casa"},
{"cod":"S96","label":"Altre attività di servizi per la persona (parrucchieri, estetisti, ecc.)"},
{"cod":"T","label":"Attività di famiglie e convivenze"},
{"cod":"U","label":"Organizzazioni e organismi extraterritoriali"},
{"cod":"ARTIG","label":"Artigianato (produzione manufatti, lavorazioni su misura)"},
{"cod":"INFISSI","label":"Fabbricazione e installazione infissi, porte e finestre"},
{"cod":"SERRAMENTI","label":"Serramenti, persiane, tende da sole e schermature solari"},
{"cod":"IDRAUL","label":"Impianti idraulici e termoidraulici"},
{"cod":"ELETTR","label":"Impianti elettrici e fotovoltaici"},
{"cod":"KLIMAT","label":"Climatizzazione, riscaldamento e condizionamento"},
{"cod":"RISTRU","label":"Ristrutturazioni edili e interior design"},
{"cod":"PAVIM","label":"Pavimenti, rivestimenti e piastrelle"},
{"cod":"GIARDIN","label":"Giardinaggio, verde urbano e paesaggistica"},
{"cod":"BENESSERE","label":"Centri benessere, spa e centri estetici"},
{"cod":"OTTICA","label":"Ottica e optometria"},
{"cod":"FARMACIA","label":"Farmacie e parafarmacie"},
{"cod":"DENTISTA","label":"Odontoiatria e studi dentistici"},
{"cod":"FISIO","label":"Fisioterapia e riabilitazione"},
{"cod":"PSICOL","label":"Psicologia e psicoterapia"},
{"cod":"NUTRIZIONE","label":"Nutrizione, dietologia e alimentazione"},
{"cod":"PALESTRA","label":"Palestre, fitness e sport"},
{"cod":"MODA","label":"Moda, abbigliamento e accessori"},
{"cod":"GIOIELLI","label":"Gioielleria e oreficeria"},
{"cod":"FOTO","label":"Fotografia e videomaking"},
{"cod":"EVENTI","label":"Organizzazione eventi, matrimoni e cerimonie"},
{"cod":"TRASLOCHI","label":"Traslochi e facchinaggio"},
{"cod":"ONORANZE","label":"Onoranze funebri e pompe funebri"},
{"cod":"ANIMALI","label":"Servizi per animali (veterinari, toelettatura, pensioni)"},
{"cod":"AUTOSC","label":"Autoscuole e scuole guida"},
{"cod":"AUTOOFF","label":"Officine auto, carrozzerie e gommaio"},
{"cod":"PIZZERIA","label":"Pizzerie"},
{"cod":"GELATERIA","label":"Gelaterie e pasticcerie"},
{"cod":"PANIFICIO","label":"Panifici e forni"},
{"cod":"MACELLERIA","label":"Macellerie e salumerie"},
{"cod":"PESCHERIA","label":"Pescherie"},
{"cod":"FRUTTIVENDOLO","label":"Frutterie e verdurerie"},
{"cod":"SUPERMERCATO","label":"Supermercati e alimentari"},
{"cod":"FERRAMENTA","label":"Ferramenta e materiali edili"},
{"cod":"LIBRERIA","label":"Librerie e cartolerie"},
{"cod":"FARMACOSMETICA","label":"Cosmetica e profumeria"},
{"cod":"WEDDING","label":"Wedding planner e servizi matrimoniali"},
{"cod":"CONSULENZA","label":"Consulenza aziendale e management"},
{"cod":"MARKETING","label":"Marketing, comunicazione e pubblicita"},
{"cod":"WEB","label":"Web agency e sviluppo digitale"},
{"cod":"ECOMMERCE","label":"E-commerce e vendita online"},
{"cod":"LOGISTICA","label":"Logistica e supply chain"},
{"cod":"ENERGIA","label":"Energie rinnovabili e sostenibilita"},
{"cod":"SICUREZZA","label":"Sistemi di sicurezza e antifurto"},
{"cod":"PULIZIE","label":"Imprese di pulizia e sanificazione"},
{"cod":"BADANTE","label":"Assistenza anziani e badanti"},
{"cod":"ASILO","label":"Asili nido e scuole dell'infanzia"},
{"cod":"AGENZIA_IMM","label":"Agenzie immobiliari"},
{"cod":"NOTAIO","label":"Notai"},
{"cod":"ASSICUR","label":"Agenzie assicurative"},
{"cod":"BANCA","label":"Banche e istituti di credito"},
{"cod":"POSTA","label":"Servizi postali e spedizioni"},
{"cod":"HOTEL","label":"Hotel e strutture ricettive"},
{"cod":"AGRITUR","label":"Agriturismi e turismo rurale"},
{"cod":"CAMPEGGIO","label":"Campeggi e villaggi turistici"},
{"cod":"AGENZIA_VIAGGI","label":"Agenzie di viaggio e tour operator"},
{"cod":"NOLO","label":"Noleggio veicoli e attrezzature"},
{"cod":"CANTINA","label":"Cantine vinicole e produzione vino"},
{"cod":"OLEIFICIO","label":"Oleifici e produzione olio"},
{"cod":"CASEIFICIO","label":"Caseifici e produzione formaggi"},
{"cod":"BIRRIFICIO","label":"Birrifici artigianali"},
{"cod":"DISTILLERIA","label":"Distillerie e produzione liquori"}
];

// Comuni per provincia (campione esteso - le piu grandi + tutte AN, MC, PU, FM)
const COMUNI = {
"AG":["Agrigento","Alessandria della Rocca","Aragona","Bivona","Burgio","Calamonaci","Caltabellotta","Camastra","Cammarata","Campobello di Licata","Canicatti","Casteltermini","Castrofilippo","Cattolica Eraclea","Cianciana","Comitini","Favara","Grotte","Joppolo Giancaxio","Licata","Lucca Sicula","Menfi","Montallegro","Montevago","Naro","Palma di Montechiaro","Porto Empedocle","Racalmuto","Raffadali","Ravanusa","Realmonte","Ribera","Sambuca di Sicilia","San Biagio Platani","San Giovanni Gemini","Sant'Angelo Muxaro","Santa Elisabetta","Santa Margherita di Belice","Santo Stefano Quisquina","Sciacca","Siculiana","Villafranca Sicula"],
"AL":["Alessandria","Acqui Terme","Bosco Marengo","Casale Monferrato","Novi Ligure","Ovada","Tortona","Valenza"],
"AN":["Agugliano","Ancona","Barbara","Belvedere Ostrense","Camerano","Camerata Picena","Castel Colonna","Castelleone di Suasa","Castelbellino","Castelplanio","Castelfidardo","Cerreto d'Esi","Chiaravalle","Corinaldo","Cupramontana","Fabriano","Falconara Marittima","Filottrano","Genga","Jesi","Loreto","Maiolati Spontini","Mergo","Monsano","Montecarotto","Monte Roberto","Monte San Vito","Montefranco","Morro d'Alba","Numana","Offagna","Osimo","Ostra","Ostra Vetere","Polverigi","Porto Recanati","Ripe","Rosora","San Marcello","San Paolo di Jesi","Santa Maria Nuova","Sassoferrato","Senigallia","Serra de' Conti","Serra San Quirico","Sirolo","Staffolo","Trecastelli","Poggio San Marcello"],
"AO":["Aosta","Courmayeur","Saint-Vincent","Sarre","Nus"],
"AQ":["L'Aquila","Avezzano","Sulmona","Castel di Sangro","Tagliacozzo"],
"AR":["Arezzo","Cortona","Sansepolcro","Bibbiena","Cavriglia"],
"AP":["Ascoli Piceno","San Benedetto del Tronto","Acquaviva Picena","Amandola","Arquata del Tronto","Castignano","Castorano","Colli del Tronto","Comunanza","Cossignano","Folignano","Force","Grottammare","Maltignano","Massignano","Montalto delle Marche","Montedinove","Montefiore dell'Aso","Montegallo","Montemonaco","Monterubbiano","Montottone","Moresco","Offida","Palmiano","Pedaso","Ripatransone","Rotella","Spinetoli","Venarotta"],
"AT":["Asti","Canelli","Nizza Monferrato"],
"AV":["Avellino","Ariano Irpino","Mercogliano"],
"BA":["Bari","Altamura","Barletta","Bitonto","Gravina in Puglia","Molfetta","Monopoli","Trani"],
"BT":["Barletta","Andria","Trani","Bisceglie","Canosa di Puglia","Minervino Murge","San Ferdinando di Puglia","Spinazzola","Trinitapoli"],
"BL":["Belluno","Feltre","Cortina d'Ampezzo"],
"BN":["Benevento","Montesarchio","San Giorgio del Sannio"],
"BG":["Bergamo","Treviglio","Seriate","Dalmine","Romano di Lombardia"],
"BI":["Biella","Cossato","Gaglianico"],
"BO":["Bologna","Imola","Casalecchio di Reno","San Lazzaro di Savena","Castel Maggiore"],
"BZ":["Bolzano","Merano","Bressanone","Laives","Brunico"],
"BS":["Brescia","Desenzano del Garda","Salo","Chiari","Lumezzane"],
"BR":["Brindisi","Fasano","Francavilla Fontana","Mesagne","Ostuni"],
"CA":["Cagliari","Assemini","Capoterra","Quartu Sant'Elena","Selargius"],
"CL":["Caltanissetta","Gela","Niscemi","Riesi","San Cataldo"],
"CB":["Campobasso","Termoli","Bojano","Isernia","Venafro"],
"CE":["Caserta","Aversa","Capua","Marcianise","Santa Maria Capua Vetere"],
"CT":["Catania","Acireale","Caltagirone","Misterbianco","Paternò"],
"CZ":["Catanzaro","Lamezia Terme","Soverato","Crotone"],
"CH":["Chieti","Lanciano","Ortona","Vasto","Guardiagrele"],
"CO":["Como","Cantù","Erba","Mariano Comense","Olgiate Comasco"],
"CS":["Cosenza","Rende","Corigliano-Rossano","Castrovillari","Acri"],
"CR":["Cremona","Crema","Casalmaggiore","Soresina"],
"KR":["Crotone","Cirò Marina","Isola di Capo Rizzuto","Petilia Policastro"],
"CN":["Cuneo","Alba","Bra","Fossano","Mondovì","Saluzzo"],
"EN":["Enna","Piazza Armerina","Nicosia","Troina","Leonforte"],
"FM":["Fermo","Altidona","Amandola","Belmonte Piceno","Campofilone","Carassai","Civitanova Marche","Falerone","Francavilla d'Ete","Grottazzolina","Lapedona","Lido di Fermo","Magliano di Tenna","Massa Fermana","Missione","Mogliano","Montappone","Monte Giberto","Monte Rinaldo","Monte San Pietrangeli","Monte Urano","Monte Vidon Combatte","Monte Vidon Corrado","Montefalcone Appennino","Montefortino","Montegiorgio","Montegranaro","Monteleone di Fermo","Monterubbiano","Montottone","Moresco","Ortezzano","Pedaso","Petritoli","Ponzano di Fermo","Porto San Giorgio","Porto Sant'Elpidio","Rapagnano","Sant'Elpidio a Mare","Santa Vittoria in Matenano","Servigliano","Smerillo","Torre San Patrizio"],
"FE":["Ferrara","Cento","Argenta","Comacchio","Bondeno"],
"FI":["Firenze","Empoli","Scandicci","Sesto Fiorentino","Prato"],
"FG":["Foggia","Cerignola","Manfredonia","Lucera","San Severo"],
"FC":["Forli","Cesena","Cesenatico","Faenza","Rimini"],
"FR":["Frosinone","Cassino","Alatri","Anagni","Sora"],
"GE":["Genova","Savona","Rapallo","Chiavari","La Spezia"],
"GO":["Gorizia","Monfalcone","Gradisca d'Isonzo"],
"GR":["Grosseto","Orbetello","Follonica","Porto Ercole"],
"IM":["Imperia","Sanremo","Ventimiglia","Bordighera"],
"IS":["Isernia","Venafro","Agnone"],
"SP":["La Spezia","Sarzana","Lerici","Portovenere"],
"LT":["Latina","Aprilia","Formia","Gaeta","Terracina"],
"LE":["Lecce","Gallipoli","Brindisi","Nardo","Casarano"],
"LC":["Lecco","Merate","Calolziocorte"],
"LI":["Livorno","Piombino","Cecina","Rosignano Marittimo"],
"LO":["Lodi","Codogno","Sant'Angelo Lodigiano"],
"LU":["Lucca","Viareggio","Capannori","Camaiore","Forte dei Marmi"],
"MC":["Macerata","Civitanova Marche","Porto Recanati","Recanati","Tolentino","Camerino","Cingoli","Corridonia","Montecassiano","Montecosaro","Montelupone","Monte San Giusto","Monte San Martino","Morrovalle","Penna San Giovanni","Petriolo","Piediripa","Porto Civitanova","Potenza Picena","Ripe San Ginesio","San Ginesio","San Severino Marche","Sant'Angelo in Pontano","Sarnano","Serrapetrona","Ussita","Visso"],
"MN":["Mantova","Guidizzolo","Castiglione delle Stiviere","Viadana"],
"MS":["Massa","Carrara","Pontremoli","Sarzana"],
"MT":["Matera","Pisticci","Policoro","Nova Siri"],
"ME":["Messina","Barcellona Pozzo di Gotto","Milazzo","Patti","Taormina"],
"MI":["Milano","Sesto San Giovanni","Monza","Cologno Monzese","Cinisello Balsamo","Rho","Legnano","Corsico","Pioltello","Settimo Milanese"],
"MO":["Modena","Carpi","Sassuolo","Formigine","Castelfranco Emilia"],
"MB":["Monza","Cesano Maderno","Sesto San Giovanni","Limbiate","Lissone"],
"NA":["Napoli","Pozzuoli","Castellammare di Stabia","Torre del Greco","Portici","Ercolano","Casoria","Afragola","Acerra","Giugliano in Campania"],
"NO":["Novara","Borgomanero","Trecate","Arona"],
"NU":["Nuoro","Orgosolo","Oliena","Dorgali","Siniscola"],
"OR":["Oristano","Carbonia","Terralba","Bosa"],
"PD":["Padova","Abano Terme","Cittadella","Este","Montagnana"],
"PA":["Palermo","Bagheria","Monreale","Partinico","Carini","Misilmeri","Termini Imerese","Caltavuturo"],
"PR":["Parma","Fidenza","Salsomaggiore Terme","Langhirano"],
"PV":["Pavia","Vigevano","Voghera","Mortara","Lomello"],
"PG":["Perugia","Terni","Foligno","Citta di Castello","Spoleto","Assisi","Gubbio"],
"PU":["Pesaro","Urbino","Fano","Fossombrone","Mondavio","Mondolfo","Monte Cerignone","Monte Grimano Terme","Montecalvo in Foglia","Monteciccardo","Montecopiolo","Montefelcino","Montelabbate","Monteporzio","Pergola","Piandimeleto","Pietrarubbia","Piticchio","San Costanzo","San Giorgio di Pesaro","San Leo","Sant'Angelo in Lizzola","Sant'Angelo in Vado","Sant'Ippolito","Sassofeltrio","Sassocorvaro Auditore","Serrungarina","Tavoleto","Tavullia","Urbania"],
"PE":["Pescara","Montesilvano","Chieti","Lanciano"],
"PC":["Piacenza","Fiorenzuola d'Arda","Castel San Giovanni","Cortemaggiore"],
"PI":["Pisa","Pontedera","Cascina","Poggibonsi","San Miniato"],
"PT":["Pistoia","Montecatini-Terme","Pescia","Agliana"],
"PN":["Pordenone","Sacile","Spilimbergo","Maniago"],
"PZ":["Potenza","Melfi","Lagonegro","Lauria","Venosa"],
"PO":["Prato","Montemurlo","Vaiano","Poggio a Caiano"],
"RG":["Ragusa","Modica","Vittoria","Scicli","Comiso"],
"RA":["Ravenna","Faenza","Cervia","Lugo","Russi"],
"RC":["Reggio Calabria","Palmi","Locri","Gioia Tauro","Villa San Giovanni"],
"RE":["Reggio Emilia","Scandiano","Correggio","Guastalla","Rubiera"],
"RI":["Rieti","Poggio Mirteto","Fara in Sabina","Leonessa"],
"RN":["Rimini","Riccione","Cattolica","Misano Adriatico","Bellaria-Igea Marina"],
"RM":["Roma","Fiumicino","Guidonia Montecelio","Tivoli","Velletri","Pomezia","Anzio","Nettuno","Civitavecchia","Ciampino"],
"RO":["Rovigo","Adria","Trecenta","Lendinara","Badia Polesine"],
"SA":["Salerno","Battipaglia","Eboli","Cava de' Tirreni","Nocera Inferiore","Mercato San Severino","Pagani","Sarno"],
"SS":["Sassari","Alghero","Olbia","Porto Torres","Ozieri"],
"SV":["Savona","Albenga","Finale Ligure","Varazze","Loano"],
"SI":["Siena","Poggibonsi","Colle di Val d'Elsa","Montepulciano","Chianciano Terme"],
"SR":["Siracusa","Augusta","Noto","Avola","Lentini"],
"SO":["Sondrio","Morbegno","Tirano","Bormio","Chiavenna"],
"TA":["Taranto","Manduria","Grottaglie","Martina Franca","Massafra"],
"TE":["Teramo","Atri","Giulianova","Roseto degli Abruzzi","Pescara"],
"TR":["Terni","Narni","Amelia","Orvieto","Spoleto"],
"TO":["Torino","Moncalieri","Rivoli","Collegno","Settimo Torinese","Nichelino","Grugliasco","Chieri","Venaria Reale","Pinerolo"],
"TP":["Trapani","Marsala","Mazara del Vallo","Alcamo","Castelvetrano"],
"TN":["Trento","Rovereto","Riva del Garda","Arco","Pergine Valsugana"],
"TV":["Treviso","Vittorio Veneto","Conegliano","Oderzo","Montebelluna"],
"TS":["Trieste","Muggia","Duino-Aurisina","Monrupino"],
"UD":["Udine","Cividale del Friuli","Cervignano del Friuli","Tolmezzo","Codroipo"],
"VA":["Varese","Busto Arsizio","Gallarate","Saronno","Luino"],
"VE":["Venezia","Mestre","Chioggia","Jesolo","San Dona di Piave","Mirano"],
"VB":["Verbania","Domodossola","Omegna","Gravellona Toce"],
"VC":["Vercelli","Borgosesia","Gattinara","Santhia"],
"VR":["Verona","Villafranca di Verona","Legnago","San Bonifacio","Bardolino"],
"VV":["Vibo Valentia","Tropea","Pizzo","Mileto"],
"VI":["Vicenza","Bassano del Grappa","Schio","Thiene","Valdagno"],
"VT":["Viterbo","Civita Castellana","Tarquinia","Montefiascone","Orte"]
};

// Coordinate approssimative capoluoghi di provincia (lat, lng)
const PROVINCE_COORDS = {
"AG":[37.32,13.59],"AL":[44.91,8.62],"AN":[43.61,13.51],"AO":[45.74,7.32],"AQ":[42.35,13.40],
"AR":[43.46,11.88],"AP":[42.86,13.57],"AT":[44.90,8.21],"AV":[40.91,14.79],"BA":[41.12,16.87],
"BT":[41.20,16.29],"BL":[46.14,12.22],"BN":[41.13,14.78],"BG":[45.70,9.67],"BI":[45.56,8.06],
"BO":[44.49,11.34],"BZ":[46.50,11.36],"BS":[45.54,10.22],"BR":[40.63,17.94],"CA":[39.22,9.11],
"CL":[37.49,14.06],"CB":[41.56,14.66],"CE":[41.07,14.33],"CT":[37.50,15.09],"CZ":[38.91,16.59],
"CH":[42.36,14.16],"CO":[45.81,9.09],"CS":[39.30,16.25],"CR":[45.13,10.03],"KR":[39.08,17.13],
"CN":[44.39,7.55],"EN":[37.57,14.28],"FM":[43.16,13.72],"FE":[44.83,11.62],"FI":[43.77,11.25],
"FG":[41.46,15.55],"FC":[44.22,12.04],"FR":[41.64,13.34],"GE":[44.41,8.93],"GO":[45.94,13.62],
"GR":[42.76,11.11],"IM":[43.89,8.03],"IS":[41.60,14.23],"SP":[44.10,9.82],"LT":[41.46,12.90],
"LE":[40.35,18.17],"LC":[45.85,9.40],"LI":[43.55,10.31],"LO":[45.31,9.50],"LU":[43.84,10.50],
"MC":[43.30,13.45],"MN":[45.16,10.79],"MS":[44.04,10.14],"MT":[40.67,16.60],"ME":[38.19,15.55],
"MI":[45.47,9.19],"MO":[44.65,10.92],"MB":[45.58,9.27],"NA":[40.85,14.27],"NO":[45.44,8.62],
"NU":[40.32,9.33],"OR":[39.90,8.58],"PD":[45.41,11.88],"PA":[38.12,13.36],"PR":[44.80,10.33],
"PV":[45.19,9.16],"PG":[43.11,12.39],"PU":[43.91,12.91],"PE":[42.46,14.21],"PC":[45.05,9.70],
"PI":[43.72,10.40],"PT":[43.93,10.91],"PN":[45.96,12.66],"PZ":[40.64,15.80],"PO":[43.88,11.10],
"RG":[36.93,14.73],"RA":[44.42,12.20],"RC":[38.11,15.65],"RE":[44.70,10.63],"RI":[42.40,12.86],
"RN":[44.06,12.57],"RM":[41.89,12.51],"RO":[45.07,11.79],"SA":[40.68,14.76],"SS":[40.72,8.56],
"SV":[44.31,8.48],"SI":[43.32,11.33],"SR":[37.07,15.29],"SO":[46.17,9.86],"TA":[40.47,17.24],
"TE":[42.66,13.70],"TR":[42.56,12.64],"TO":[45.07,7.69],"TP":[37.88,12.67],"TN":[46.07,11.12],
"TV":[45.67,12.24],"TS":[45.65,13.77],"UD":[46.07,13.24],"VA":[45.82,8.83],"VE":[45.44,12.32],
"VB":[46.13,8.27],"VC":[45.32,8.42],"VR":[45.44,10.99],"VV":[38.67,16.10],"VI":[45.55,11.55],
"VT":[42.42,12.11]
};

// Offset coordinate per comuni (griglia regolare attorno al capoluogo)
function getComuniCoords(provCode, comuni){
  const base = PROVINCE_COORDS[provCode];
  if(!base) return [];
  const result = [];
  const n = comuni.length;
  for(let i=0; i<n; i++){
    const angle = (i/n)*2*Math.PI;
    const radius = 0.15 + (Math.floor(i/8)*0.12);
    const lat = base[0] + radius*Math.sin(angle);
    const lng = base[1] + radius*Math.cos(angle);
    result.push({name:comuni[i], lat:parseFloat(lat.toFixed(4)), lng:parseFloat(lng.toFixed(4))});
  }
  return result;
}

// Coordinate reali comuni italiani (lat, lng)
const COMUNI_COORDS = {
// Ancona province
"Ancona":[43.6158,13.5189],"Jesi":[43.5222,13.2433],"Fabriano":[43.3339,12.9032],
"Senigallia":[43.7150,13.2177],"Osimo":[43.4786,13.4803],"Civitanova Marche":[43.3069,13.7312],
"Chiaravalle":[43.5997,13.3269],"Falconara Marittima":[43.6311,13.4011],"Loreto":[43.4408,13.6067],
"Porto Recanati":[43.4378,13.6597],"Recanati":[43.4013,13.5508],"Castelfidardo":[43.4654,13.5461],
"Camerano":[43.5364,13.4572],"Serra de' Conti":[43.5372,13.0369],"Corinaldo":[43.6481,12.9728],
"Arcevia":[43.4978,12.9378],"Barbara":[43.5994,13.0192],"Sassoferrato":[43.4344,12.8619],
"Cerreto d'Esi":[43.3519,13.0253],"Cupramontana":[43.4436,13.1181],
"Maiolati Spontini":[43.4797,13.1461],"Staffolo":[43.4108,13.2158],
"Serra San Quirico":[43.4500,13.0917],"Montecarotto":[43.5169,13.1194],
"Castelplanio":[43.4739,13.1347],"Rosora":[43.4169,13.0875],
"Poggio San Marcello":[43.4750,13.1472],"Monte Roberto":[43.4486,13.1914],
"San Paolo di Jesi":[43.4958,13.2100],"Monsano":[43.5450,13.2714],
"Castel Colonna":[43.6367,13.1042],"Belvedere Ostrense":[43.5597,13.1561],
"Morro d'Alba":[43.5583,13.2047],"Ostra":[43.6097,13.1600],"Ostra Vetere":[43.5883,13.1011],
"Santa Maria Nuova":[43.5344,13.3481],"Polverigi":[43.5569,13.3878],
"Offagna":[43.5358,13.4197],"Agugliano":[43.5489,13.3772],
"Camerata Picena":[43.5736,13.3350],"Monte San Vito":[43.5747,13.2828],
"Montemarciano":[43.6394,13.3175],"Trecastelli":[43.6264,13.0947],
"Numana":[43.5092,13.6225],"Sirolo":[43.5239,13.6139],
// Macerata province  
"Macerata":[43.2994,13.4528],"Tolentino":[43.2089,13.2750],"San Severino Marche":[43.2297,13.1789],
"Cingoli":[43.3706,13.2136],"Corridonia":[43.2497,13.5028],"Potenza Picena":[43.3714,13.6183],
"Morrovalle":[43.3197,13.5667],"Porto Civitanova":[43.3069,13.7312],
"Montecosaro":[43.3228,13.6231],"Monte San Giusto":[43.2631,13.5783],
"Montecassiano":[43.3647,13.4372],"Montelupone":[43.3444,13.5728],
// Pesaro province
"Pesaro":[43.9097,12.9133],"Urbino":[43.7261,12.6364],"Fano":[43.8436,13.0178],
"Fossombrone":[43.6892,12.8086],"Mondavio":[43.6714,12.9714],"Mondolfo":[43.7542,13.0939],
"San Costanzo":[43.7636,13.0594],"Colli al Metauro":[43.7042,12.8917],
// Other major cities
"Roma":[41.8919,12.5113],"Milano":[45.4654,9.1866],"Napoli":[40.8518,14.2681],
"Torino":[45.0703,7.6869],"Palermo":[38.1157,13.3615],"Genova":[44.4056,8.9463],
"Bologna":[44.4949,11.3426],"Firenze":[43.7696,11.2558],"Bari":[41.1177,16.8719],
"Catania":[37.5079,15.0830],"Venezia":[45.4408,12.3155],"Verona":[45.4384,10.9916],
"Messina":[38.1938,15.5540],"Padova":[45.4064,11.8768],"Trieste":[45.6495,13.7768],
"Taranto":[40.4765,17.2283],"Brescia":[45.5416,10.2118],"Reggio Calabria":[38.1147,15.6501],
"Modena":[44.6471,10.9252],"Reggio Emilia":[44.6989,10.6297],"Perugia":[43.1122,12.3888],
"Ravenna":[44.4184,12.2035],"Livorno":[43.5485,10.3106],"Cagliari":[39.2238,9.1217],
"Foggia":[41.4621,15.5444],"Rimini":[44.0678,12.5695],"Salerno":[40.6824,14.7681],
"Ferrara":[44.8353,11.6197],"Sassari":[40.7259,8.5556],"Latina":[41.4665,12.9035],
"Giugliano in Campania":[40.9268,14.1987],"Monza":[45.5845,9.2744],
"Bergamo":[45.6950,9.6700],"Syracuse":[37.0755,15.2866],"Pescara":[42.4602,14.2161],
"Forlì":[44.2228,12.0408],"Trento":[46.0748,11.1217],"Vicenza":[45.5452,11.5354],
"Terni":[42.5636,12.6429],"Bolzano":[46.4983,11.3548],"Prato":[43.8805,11.0972],
"Andria":[41.2265,16.2988],"Novara":[45.4469,8.6224],"Piacenza":[45.0526,9.6930],
"Arezzo":[43.4636,11.8799],"Udine":[46.0711,13.2347],"La Spezia":[44.1025,9.8242],
"Ancona":[43.6158,13.5189]
};

// Get accurate coordinates for a comune
function getComuneCoord(name){
  if(COMUNI_COORDS[name]) return COMUNI_COORDS[name];
  // Fallback: use province capital + small offset based on name hash
  return null;
}

// ── COMUNI COMPLETI PER PROVINCIA (dataset esteso) ──────────────
(function(){
var FULL = {
"AN":["Agugliano","Ancona","Arcevia","Barbara","Belvedere Ostrense","Camerano","Camerata Picena","Castelbellino","Castelfidardo","Castelleone di Suasa","Castelplanio","Cerreto d'Esi","Chiaravalle","Corinaldo","Cupramontana","Fabriano","Falconara Marittima","Filottrano","Genga","Jesi","Loreto","Maiolati Spontini","Mergo","Monsano","Montecarotto","Montemarciano","Monte Roberto","Monte San Vito","Morro d'Alba","Numana","Offagna","Osimo","Ostra","Ostra Vetere","Poggio San Marcello","Polverigi","Rosora","San Marcello","San Paolo di Jesi","Santa Maria Nuova","Sassoferrato","Senigallia","Serra de' Conti","Serra San Quirico","Sirolo","Staffolo","Trecastelli"],
"AP":["Acquasanta Terme","Acquaviva Picena","Appignano del Tronto","Arquata del Tronto","Ascoli Piceno","Carassai","Castel di Lama","Castignano","Castorano","Colli del Tronto","Comunanza","Cossignano","Cupra Marittima","Folignano","Force","Grottammare","Maltignano","Massignano","Monsampolo del Tronto","Montalto delle Marche","Montedinove","Montefiore dell'Aso","Montegallo","Monteprandone","Offida","Palmiano","Ripatransone","Roccafluvione","Rotella","San Benedetto del Tronto","Spinetoli","Venarotta"],
"AR":["Anghiari","Arezzo","Badia Tedalda","Bibbiena","Bucine","Capolona","Caprese Michelangelo","Castel Focognano","Castel San Niccolò","Castiglion Fibocchi","Castiglion Fiorentino","Cavriglia","Chitignano","Chiusi della Verna","Civitella in Val di Chiana","Cortona","Foiano della Chiana","Laterina Pergine Valdarno","Loro Ciuffenna","Lucignano","Marciano della Chiana","Montemignaio","Monterchi","Monte San Savino","Montevarchi","Ortignano Raggiolo","Pieve Santo Stefano","Poppi","Pratovecchio Stia","San Giovanni Valdarno","Sansepolcro","Sestino","Subbiano","Talla","Terranuova Bracciolini"],
"BA":["Acquaviva delle Fonti","Adelfia","Alberobello","Altamura","Bari","Binetto","Bitetto","Bitonto","Bitritto","Capurso","Casamassima","Cassano delle Murge","Castellana Grotte","Cellamare","Conversano","Corato","Gioia del Colle","Giovinazzo","Gravina in Puglia","Grumo Appula","Locorotondo","Modugno","Mola di Bari","Molfetta","Monopoli","Noci","Noicattaro","Palo del Colle","Poggiorsini","Polignano a Mare","Putignano","Rutigliano","Ruvo di Puglia","Sammichele di Bari","Sannicandro di Bari","Santeramo in Colle","Terlizzi","Toritto","Triggiano","Turi","Valenzano"],
"BG":["Adrara San Martino","Adrara San Rocco","Albano Sant'Alessandro","Albino","Algua","Almè","Almenno San Bartolomeo","Almenno San Salvatore","Alzano Lombardo","Ambivere","Antegnate","Arcene","Ardesio","Averara","Aviatico","Azzano San Paolo","Azzone","Bagnatica","Barbata","Bariano","Barzana","Bedulita","Berbenno","Bergamo","Berzo San Fermo","Bianzano","Blello","Bolgare","Boltiere","Bonate Sopra","Bonate Sotto","Borgo di Terzo","Bossico","Bottanuco","Bracca","Branzi","Brembate","Brembate di Sopra","Brignano Gera d'Adda","Brumano","Brusaporto","Calcinate","Calcio","Calusco d'Adda","Calvenzano","Camerata Cornello","Canonica d'Adda","Capizzone","Capriate San Gervasio","Caprino Bergamasco","Caravaggio","Carobbio degli Angeli","Carona","Carvico","Casazza","Casirate d'Adda","Casnigo","Cassiglio","Castel Rozzone","Castelli Calepio","Castione della Presolana","Castro","Cavernago","Cazzano Sant'Andrea","Cenate Sopra","Cenate Sotto","Cene","Cerete","Chignolo d'Isola","Chiuduno","Cisano Bergamasco","Ciserano","Cividate al Piano","Clusone","Colere","Cologno al Serio","Colzate","Comun Nuovo","Corna Imagna","Cortenuova","Costa di Mezzate","Costa Serina","Costa Valle Imagna","Costa Volpino","Covo","Credaro","Curno","Dalmine","Dossena","Endine Gaiano","Entratico","Fara Gera d'Adda","Fara Olivana con Sola","Filago","Fino del Monte","Fiorano al Serio","Fontanella","Fonteno","Foppolo","Foresto Sparso","Fornovo San Giovanni","Fuipiano Valle Imagna","Gandellino","Gandino","Gandosso","Gaverina Terme","Gazzaniga","Ghisalba","Gorlago","Gorle","Gorno","Grassobbio","Gromo","Grone","Grumello del Monte","Isola di Fondra","Isso","Lallio","Leffe","Lenna","Levate","Locatello","Lovere","Lurano","Luzzana","Madone","Mapello","Martinengo","Medolago","Mezzoldo","Misano di Gera d'Adda","Moio de' Calvi","Monasterolo del Castello","Montello","Morengo","Mornico al Serio","Mozzanica","Mozzo","Nembro","Olmo al Brembo","Oltre il Colle","Oltressenda Alta","Oneta","Onore","Orio al Serio","Ornica","Osio Sopra","Osio Sotto","Pagazzano","Paladina","Palazzago","Palosco","Parre","Parzanica","Pedrengo","Peia","Pianico","Piario","Piazza Brembana","Piazzatorre","Piazzolo","Pognano","Ponte Nossa","Ponte San Pietro","Ponteranica","Pontida","Pontirolo Nuovo","Pradalunga","Predore","Premolo","Presezzo","Pumenengo","Ranica","Ranzanico","Riva di Solto","Rogno","Romano di Lombardia","Roncobello","Roncola","Rota d'Imagna","Rovetta","San Giovanni Bianco","San Paolo d'Argon","San Pellegrino Terme","Santa Brigida","Sant'Omobono Terme","Sarnico","Scanzorosciate","Schilpario","Sedrina","Selvino","Seriate","Serina","Solto Collina","Solza","Songavazzo","Sorisole","Sotto il Monte Giovanni XXIII","Sovere","Spinone al Lago","Spirano","Stezzano","Strozza","Suisio","Taleggio","Tavernola Bergamasca","Telgate","Terno d'Isola","Torre Boldone","Torre de' Busi","Torre de' Roveri","Torre Pallavicina","Trescore Balneario","Treviglio","Treviolo","Ubiale Clanezzo","Urgnano","Val Brembilla","Valbondione","Valbrembo","Valgoglio","Valleve","Valnegra","Valtorta","Vedeseta","Verdellino","Verdello","Vertova","Viadanica","Vigano San Martino","Vigolo","Villa d'Adda","Villa d'Almè","Villa di Serio","Villa d'Ogna","Villongo","Vilminore di Scalve","Zandobbio","Zanica","Zogno"],
"BL":["Agordo","Alano di Piave","Alleghe","Arsiè","Auronzo di Cadore","Borca di Cadore","Borgo Valbelluna","Calalzo di Cadore","Canale d'Agordo","Cencenighe Agordino","Cesiomaggiore","Chies d'Alpago","Cibiana di Cadore","Colle Santa Lucia","Comelico Superiore","Cortina d'Ampezzo","Danta di Cadore","Domegge di Cadore","Falcade","Feltre","Fonzaso","Gosaldo","La Valle Agordina","Lamon","Limana","Livinallongo del Col di Lana","Longarone","Lorenzago di Cadore","Lozzo di Cadore","Ospitale di Cadore","Pedavena","Perarolo di Cadore","Pieve di Cadore","Ponte nelle Alpi","Quero Vas","Rivamonte Agordino","Rocca Pietore","San Gregorio nelle Alpi","San Nicolò di Comelico","San Pietro di Cadore","Santa Giustina","San Tomaso Agordino","San Vito di Cadore","Santo Stefano di Cadore","Sedico","Selva di Cadore","Seren del Grappa","Sospirolo","Soverzene","Sovramonte","Taibon Agordino","Tambre","Vallada Agordina","Valle di Cadore","Vodo Cadore","Voltago Agordino","Zoldo","Zoppè di Cadore"],
"BO":["Alto Reno Terme","Anzola dell'Emilia","Argelato","Baricella","Bentivoglio","Bologna","Borgo Tossignano","Budrio","Calderara di Reno","Camugnano","Casalecchio di Reno","Casalfiumanese","Castel d'Aiano","Castel del Rio","Castel di Casio","Castel Guelfo di Bologna","Castello d'Argile","Castel Maggiore","Castel San Pietro Terme","Castenaso","Castiglione dei Pepoli","Crevalcore","Dozza","Fontanelice","Gaggio Montano","Galliera","Granarolo dell'Emilia","Grizzana Morandi","Imola","Lizzano in Belvedere","Loiano","Malalbergo","Marzabotto","Medicina","Minerbio","Molinella","Monghidoro","Monterenzio","Monte San Pietro","Monzuno","Mordano","Ozzano dell'Emilia","Pianoro","Pieve di Cento","Sala Bolognese","San Benedetto Val di Sambro","San Giorgio di Piano","San Giovanni in Persiceto","San Lazzaro di Savena","San Pietro in Casale","Sant'Agata Bolognese","Sasso Marconi","Valsamoggia","Vergato","Zola Predosa"],
"BS":["Acquafredda","Adro","Agnosine","Alfianello","Anfo","Angolo Terme","Artogne","Azzano Mella","Bagnolo Mella","Bagolino","Barbariga","Barghe","Bassano Bresciano","Bedizzole","Berlingo","Berzo Demo","Berzo Inferiore","Bienno","Bione","Borgo San Giacomo","Borgosatollo","Borno","Botticino","Bovegno","Bovezzo","Brandico","Braone","Breno","Brescia","Brione","Caino","Calcinato","Calvagese della Riviera","Calvisano","Capo di Ponte","Capovalle","Capriano del Colle","Capriolo","Carpenedolo","Castegnato","Castelcovati","Castel Mella","Castenedolo","Casto","Castrezzato","Cazzago San Martino","Cedegolo","Cellatica","Cerveno","Ceto","Cevo","Chiari","Cigole","Cimbergo","Cividate Camuno","Coccaglio","Collebeato","Collio","Cologne","Comezzano-Cizzago","Concesio","Corte Franca","Corteno Golgi","Corzano","Darfo Boario Terme","Dello","Desenzano del Garda","Edolo","Erbusco","Esine","Fiesse","Flero","Gambara","Gardone Riviera","Gardone Val Trompia","Gargnano","Gavardo","Ghedi","Gianico","Gottolengo","Gussago","Idro","Incudine","Irma","Iseo","Isorella","Lavenone","Leno","Limone sul Garda","Lodrino","Lograto","Lonato del Garda","Longhena","Losine","Lozio","Lumezzane","Maclodio","Magasa","Mairano","Malegno","Malonno","Manerba del Garda","Manerbio","Marcheno","Marmentino","Marone","Mazzano","Milzano","Moniga del Garda","Monno","Monte Isola","Monticelli Brusati","Montichiari","Montirone","Mura","Muscoline","Nave","Niardo","Nuvolento","Nuvolera","Odolo","Offlaga","Ome","Ono San Pietro","Orzinuovi","Orzivecchi","Ospitaletto","Ossimo","Padenghe sul Garda","Paderno Franciacorta","Paisco Loveno","Paitone","Palazzolo sull'Oglio","Paratico","Paspardo","Passirano","Pavone del Mella","Pertica Alta","Pertica Bassa","Pezzaze","Pian Camuno","Pisogne","Polaveno","Polpenazze del Garda","Pompiano","Poncarale","Ponte di Legno","Pontevico","Pontoglio","Pozzolengo","Pralboino","Preseglie","Prevalle","Provaglio d'Iseo","Provaglio Val Sabbia","Puegnago del Garda","Quinzano d'Oglio","Remedello","Rezzato","Roccafranca","Rodengo Saiano","Roè Volciano","Roncadelle","Rovato","Rudiano","Sabbio Chiese","Sale Marasino","Salò","San Felice del Benaco","San Gervasio Bresciano","San Paolo","San Zeno Naviglio","Sarezzo","Saviore dell'Adamello","Sellero","Seniga","Serle","Sirmione","Soiano del Lago","Sonico","Sulzano","Tavernole sul Mella","Temù","Tignale","Torbole Casaglia","Toscolano-Maderno","Travagliato","Tremosine sul Garda","Trenzano","Treviso Bresciano","Urago d'Oglio","Vallio Terme","Valvestino","Verolanuova","Verolavecchia","Vestone","Vezza d'Oglio","Villa Carcina","Villachiara","Villanuova sul Clisi","Vione","Visano","Vobarno","Zone"],
"CN":["Acceglio","Aisone","Alba","Albaretto della Torre","Alto","Argentera","Arguello","Bagnasco","Bagnolo Piemonte","Barbaresco","Barge","Barolo","Bastia Mondovì","Battifollo","Beinette","Bellino","Belvedere Langhe","Bene Vagienna","Benevello","Bergolo","Bernezzo","Bonvicino","Borgomale","Borgo San Dalmazzo","Bosia","Bossolasco","Boves","Bra","Briaglia","Briga Alta","Brondello","Brossasco","Busca","Camerana","Canale","Canosio","Caprauna","Caraglio","Caramagna Piemonte","Cardè","Carrù","Cartignano","Casalgrasso","Castagnito","Casteldelfino","Castelletto Stura","Castelletto Uzzone","Castellinaldo d'Alba","Castellino Tanaro","Castelmagno","Castelnuovo di Ceva","Castiglione Falletto","Castiglione Tinella","Castino","Cavallerleone","Cavallermaggiore","Celle di Macra","Centallo","Ceresole Alba","Cerretto Langhe","Cervasca","Cervere","Ceva","Cherasco","Chiusa di Pesio","Cigliè","Cissone","Clavesana","Corneliano d'Alba","Cortemilia","Cossano Belbo","Costigliole Saluzzo","Cravanzana","Cuneo","Demonte","Diano d'Alba","Dogliani","Dronero","Elva","Entracque","Envie","Farigliano","Faule","Feisoglio","Fossano","Frabosa Soprana","Frabosa Sottana","Frassino","Gaiola","Gambasca","Garessio","Genola","Gorzegno","Gottasecca","Govone","Grinzane Cavour","Guarene","Igliano","Isasca","Lagnasco","La Morra","Lequio Berria","Lequio Tanaro","Lesegno","Levice","Limone Piemonte","Lisio","Macra","Magliano Alfieri","Magliano Alpi","Mango","Manta","Marene","Margarita","Marmora","Marsaglia","Martiniana Po","Melle","Moiola","Mombarcaro","Mombasiglio","Monastero di Vasco","Monasterolo Casotto","Monasterolo di Savigliano","Mondovì","Monesiglio","Monforte d'Alba","Montà","Montaldo di Mondovì","Montaldo Roero","Montanera","Montegrosso d'Asti","Montelupo Albese","Montemale di Cuneo","Monterosso Grana","Monticello d'Alba","Moretta","Morozzo","Murazzano","Murello","Narzole","Neive","Neviglie","Niella Belbo","Niella Tanaro","Novello","Nucetto","Oncino","Ormea","Ostana","Paesana","Pagno","Pamparato","Paroldo","Perletto","Perlo","Peveragno","Pezzolo Valle Uzzone","Pianfei","Piasco","Pietraporzio","Piobesi d'Alba","Piozzo","Pocapaglia","Polonghera","Pontechianale","Pradleves","Prazzo","Priero","Priocca","Priola","Prunetto","Racconigi","Revello","Rifreddo","Rittana","Roaschia","Roascio","Robilante","Roburent","Roccabruna","Rocca Cigliè","Rocca de' Baldi","Roccaforte Mondovì","Roccasparvera","Roccavione","Roddi","Roddino","Rodello","Rossana","Ruffia","Sale delle Langhe","Sale San Giovanni","Saliceto","Salmour","Saluzzo","Sambuco","Sampeyre","San Benedetto Belbo","San Damiano Macra","Sanfront","Sanfrè","San Michele Mondovì","Sant'Albano Stura","Santa Vittoria d'Alba","Santo Stefano Belbo","Santo Stefano Roero","Savigliano","Scagnello","Scarnafigi","Serralunga d'Alba","Serravalle Langhe","Sinio","Somano","Sommariva del Bosco","Sommariva Perno","Stroppo","Tarantasca","Torre Bormida","Torre Mondovì","Torre San Giorgio","Torresina","Treiso","Trezzo Tinella","Trinità","Valdieri","Valgrana","Valloriate","Venasca","Verduno","Vernante","Verzuolo","Vezza d'Alba","Vicoforte","Vignolo","Villafalletto","Villanova Mondovì","Villanova Solaro","Villar San Costanzo","Vinadio","Viola","Vottignasco"],
"CO":["Albavilla","Albese con Cassano","Albiolo","Alserio","Alzate Brianza","Anzano del Parco","Appiano Gentile","Argegno","Arosio","Asso","Barni","Bene Lario","Beregazzo con Figliaro","Binago","Bizzarone","Blessagno","Blevio","Bregnano","Brenna","Brienno","Brunate","Bulgarograsso","Cabiate","Cadorago","Caglio","Cagno","Campione d'Italia","Cantù","Canzo","Capiago Intimiano","Carate Urio","Carbonate","Carimate","Carlazzo","Carugo","Caslino d'Erba","Casnate con Bernate","Cassina Rizzardi","Castelmarte","Castelnuovo Bozzente","Cavargna","Cerano d'Intelvi","Cermenate","Cernobbio","Cirimido","Claino con Osteno","Colonno","Como","Corrido","Cremia","Cucciago","Cusino","Dizzasco","Domaso","Dongo","Dosso del Liro","Erba","Eupilio","Faggeto Lario","Faloppio","Fenegrò","Figino Serenza","Fino Mornasco","Garzeno","Gera Lario","Grandate","Grandola ed Uniti","Gravedona ed Uniti","Griante","Guanzate","Inverigo","Laglio","Laino","Lambrugo","Lasnigo","Lezzeno","Lipomo","Livo","Locate Varesino","Lomazzo","Longone al Segrino","Luisago","Lurago d'Erba","Lurago Marinone","Lurate Caccivio","Magreglio","Mariano Comense","Maslianico","Menaggio","Merone","Mezzegra","Moltrasio","Monguzzo","Montano Lucino","Montemezzo","Montorfano","Mozzate","Musso","Nesso","Novedrate","Olgiate Comasco","Oltrona di San Mamette","Orsenigo","Peglio","Pianello del Lario","Pigra","Plesio","Pognana Lario","Ponna","Ponte Lambro","Porlezza","Proserpio","Pusiano","Rezzago","Rodero","Ronago","Rovellasca","Rovello Porro","Sala Comacina","San Bartolomeo Val Cavargna","San Fermo della Battaglia","San Nazzaro Val Cavargna","San Siro","Schignano","Senna Comasco","Solbiate con Cagno","Sorico","Sormano","Stazzona","Tavernerio","Torno","Trezzone","Turate","Uggiate-Trevano","Valbrona","Valmorea","Val Rezzo","Valsolda","Veleso","Veniano","Vercana","Vertemate con Minoprio","Villa Guardia","Zelbio"],
"CR":["Acquanegra Cremonese","Agnadello","Annicco","Azzanello","Bagnolo Cremasco","Bonemerse","Bordolano","Calvatone","Camisano","Campagnola Cremasca","Capergnanica","Cappella Cantone","Cappella de' Picenardi","Capralba","Casalbuttano ed Uniti","Casale Cremasco-Vidolasco","Casaletto Ceredano","Casaletto di Sopra","Casaletto Vaprio","Casalmaggiore","Casalmorano","Casalromano","Casteldidone","Castel Gabbiano","Castelleone","Castelverde","Castelvisconti","Cella Dati","Chieve","Cicognolo","Cingia de' Botti","Corte de' Cortesi con Cignone","Corte de' Frati","Credera Rubbiano","Crema","Cremona","Cremosano","Crotta d'Adda","Cumignano sul Naviglio","Derovere","Dovera","Drizzona","Fiesco","Formigara","Genivolta","Gerre de' Caprioli","Gombito","Grontardo","Grumello Cremonese ed Uniti","Gussola","Isola Dovarese","Izano","Madignano","Malagnino","Martignana di Po","Monte Cremasco","Montodine","Moscazzano","Motta Baluffi","Offanengo","Olmeneta","Ostiano","Paderno Ponchielli","Palazzo Pignano","Pandino","Persico Dosimo","Pescarolo ed Uniti","Pessina Cremonese","Pian Camuno","Pianengo","Pieranica","Pieve d'Olmi","Pieve San Giacomo","Pizzighettone","Pozzaglio ed Uniti","Quintano","Ricengo","Ripalta Arpina","Ripalta Cremasca","Ripalta Guerina","Rivarolo del Re ed Uniti","Rivolta d'Adda","Robecco d'Oglio","Romanengo","Salvirola","San Bassano","San Daniele Po","San Giovanni in Croce","San Martino del Lago","Scandolara Ravara","Scandolara Ripa d'Oglio","Sergnano","Sesto ed Uniti","Solarolo Rainerio","Soncino","Soresina","Sospiro","Spinadesco","Spineda","Spino d'Adda","Stagno Lombardo","Ticengo","Torlino Vimercati","Tornata","Torre de' Picenardi","Torricella del Pizzo","Trescore Cremasco","Trigolo","Vaiano Cremasco","Vailate","Vescovato","Volongo","Voltido"],
"FC":["Bagno di Romagna","Bertinoro","Borghi","Castrocaro Terme e Terra del Sole","Cesena","Cesenatico","Civitella di Romagna","Dovadola","Forlì","Forlimpopoli","Galeata","Gambettola","Gatteo","Longiano","Mercato Saraceno","Modigliana","Montiano","Portico e San Benedetto","Predappio","Premilcuore","Roncofreddo","Rocca San Casciano","San Mauro Pascoli","Santa Sofia","Sarsina","Savignano sul Rubicone","Sogliano al Rubicone","Tredozio","Verghereto","Meldola"],
"FE":["Argenta","Bondeno","Cento","Codigoro","Comacchio","Copparo","Ferrara","Fiscaglia","Goro","Jolanda di Savoia","Lagosanto","Masi Torello","Mesola","Ostellato","Poggio Renatico","Portomaggiore","Riva del Po","Terre del Reno","Tresignana","Vigarano Mainarda","Voghiera"],
"FI":["Bagno a Ripoli","Barberino di Mugello","Barberino Tavarnelle","Borgo San Lorenzo","Calenzano","Campi Bisenzio","Capraia e Limite","Castelfiorentino","Cerreto Guidi","Certaldo","Dicomano","Empoli","Fiesole","Figline e Incisa Valdarno","Firenze","Firenzuola","Fucecchio","Gambassi Terme","Greve in Chianti","Impruneta","Lastra a Signa","Londa","Marradi","Montaione","Montelupo Fiorentino","Montespertoli","Palazzuolo sul Senio","Pelago","Pontassieve","Reggello","Rignano sull'Arno","Rufina","San Casciano in Val di Pesa","San Godenzo","Scandicci","Scarperia e San Piero","Sesto Fiorentino","Signa","Vaglia","Vicchio","Vinci"],
"FM":["Altidona","Amandola","Belmonte Piceno","Campofilone","Falerone","Fermo","Francavilla d'Ete","Grottazzolina","Lapedona","Magliano di Tenna","Massa Fermana","Monsampietro Morico","Montappone","Montefalcone Appennino","Montefortino","Monte Giberto","Montegiorgio","Montegranaro","Monteleone di Fermo","Montelparo","Monte Rinaldo","Monterubbiano","Monte San Pietrangeli","Monte Urano","Monte Vidon Combatte","Monte Vidon Corrado","Montottone","Moresco","Ortezzano","Pedaso","Petritoli","Ponzano di Fermo","Porto San Giorgio","Porto Sant'Elpidio","Rapagnano","Santa Vittoria in Matenano","Sant'Elpidio a Mare","Servigliano","Smerillo","Torre San Patrizio"],
"FR":["Acquafondata","Acuto","Alatri","Alvito","Amaseno","Anagni","Aquino","Arce","Arnara","Arpino","Atina","Ausonia","Belmonte Castello","Boville Ernica","Broccostella","Campoli Appennino","Casalattico","Casalvieri","Cassino","Castelliri","Castelnuovo Parano","Castrocielo","Castro dei Volsci","Ceccano","Ceprano","Cervaro","Colfelice","Collepardo","Colle San Magno","Coreno Ausonio","Esperia","Falvaterra","Ferentino","Filettino","Fiuggi","Fontana Liri","Fontechiari","Frosinone","Fumone","Gallinaro","Giuliano di Roma","Guarcino","Isola del Liri","Monte San Giovanni Campano","Morolo","Paliano","Pastena","Patrica","Pescosolido","Picinisco","Pico","Piedimonte San Germano","Piglio","Pignataro Interamna","Pofi","Pontecorvo","Posta Fibreno","Ripi","Rocca d'Arce","Roccasecca","San Biagio Saracinisco","San Donato Val di Comino","San Giorgio a Liri","San Giovanni Incarico","Sant'Ambrogio sul Garigliano","Sant'Andrea del Garigliano","Sant'Apollinare","Sant'Elia Fiumerapido","Santopadre","Serrone","Settefrati","Sgurgola","Sora","Strangolagalli","Supino","Terelle","Torre Cajetani","Torrice","Trevi nel Lazio","Trivigliano","Vallecorsa","Vallemaio","Vallerotonda","Veroli","Vicalvi","Vico nel Lazio","Villa Latina","Villa Santa Lucia","Villa Santo Stefano","Viticuso"],
"GR":["Arcidosso","Campagnatico","Capalbio","Castel del Piano","Castell'Azzara","Castiglione della Pescaia","Cinigiano","Civitella Paganico","Follonica","Gavorrano","Grosseto","Isola del Giglio","Magliano in Toscana","Manciano","Massa Marittima","Monte Argentario","Montieri","Orbetello","Pitigliano","Roccalbegna","Roccastrada","Santa Fiora","Scansano","Scarlino","Seggiano","Semproniano","Sorano"],
"LC":["Abbadia Lariana","Airuno","Annone di Brianza","Ballabio","Barzago","Barzanò","Barzio","Bellano","Bosisio Parini","Brivio","Bulciago","Calco","Calolziocorte","Carenno","Casargo","Casatenovo","Cassago Brianza","Cassina Valsassina","Castello di Brianza","Cernusco Lombardone","Cesana Brianza","Civate","Colico","Colle Brianza","Cortenova","Costa Masnaga","Crandola Valsassina","Cremella","Cremeno","Dervio","Dolzago","Dorio","Ello","Erve","Esino Lario","Galbiate","Garbagnate Monastero","Garlate","Imbersago","Introbio","Introzzo","Lecco","Lierna","Lomagna","Malgrate","Mandello del Lario","Margno","Merate","Missaglia","Moggio","Molteno","Monte Marenzo","Montevecchia","Monticello Brianza","Morterone","Nibionno","Oggiono","Olgiate Molgora","Olginate","Oliveto Lario","Osnago","Paderno d'Adda","Pagnona","Parlasco","Pasturo","Perledo","Pescate","Premana","Primaluna","Robbiate","Rogeno","Santa Maria Hoè","Sirone","Sirtori","Sueglio","Suello","Taceno","Valgreghentino","Valmadrera","Varenna","Vendrogno","Vercurago","Verderio","Viganò"],
"LI":["Bibbona","Campiglia Marittima","Campo nell'Elba","Capoliveri","Capraia Isola","Castagneto Carducci","Cecina","Collesalvetti","Livorno","Marciana","Marciana Marina","Piombino","Porto Azzurro","Portoferraio","Rio","Rosignano Marittimo","San Vincenzo","Sassetta","Suvereto"],
"LO":["Abbadia Cerreto","Bertonico","Boffalora d'Adda","Borghetto Lodigiano","Borgo San Giovanni","Brembio","Casaletto Lodigiano","Casalmaiocco","Casalpusterlengo","Caselle Landi","Caselle Lurani","Castelnuovo Bocca d'Adda","Castiglione d'Adda","Castiraga Vidardo","Cavacurta","Cavenago d'Adda","Cervignano d'Adda","Codogno","Comazzo","Corno Giovine","Cornovecchio","Corte Palasio","Crespiatica","Fombio","Galgagnano","Graffignana","Guardamiglio","Livraga","Lodi","Lodi Vecchio","Maccastorna","Mairago","Maleo","Marudo","Massalengo","Meleti","Merlino","Montanaso Lombardo","Mulazzano","Orio Litta","Ospedaletto Lodigiano","Ossago Lodigiano","Pieve Fissiraga","Salerano sul Lambro","San Fiorano","San Martino in Strada","San Rocco al Porto","Sant'Angelo Lodigiano","Santo Stefano Lodigiano","Secugnago","Senna Lodigiana","Somaglia","Sordio","Tavazzano con Villavesco","Terranova dei Passerini","Turano Lodigiano","Valera Fratta","Villanova del Sillaro","Zelo Buon Persico"],
"LT":["Aprilia","Bassiano","Campodimele","Castelforte","Cisterna di Latina","Cori","Fondi","Formia","Gaeta","Itri","Latina","Lenola","Maenza","Minturno","Monte San Biagio","Norma","Pontinia","Ponza","Priverno","Prossedi","Roccagorga","Rocca Massima","Roccasecca dei Volsci","Sabaudia","San Felice Circeo","Santi Cosma e Damiano","Sermoneta","Sezze","Sonnino","Sperlonga","Spigno Saturnia","Terracina","Ventotene"],
"LU":["Altopascio","Bagni di Lucca","Barga","Borgo a Mozzano","Camaiore","Camporgiano","Capannori","Careggine","Castelnuovo di Garfagnana","Castiglione di Garfagnana","Coreglia Antelminelli","Fabbriche di Vergemoli","Forte dei Marmi","Fosciandora","Gallicano","Lucca","Massarosa","Minucciano","Molazzana","Montecarlo","Pescaglia","Piazza al Serchio","Pietrasanta","Pieve Fosciana","Porcari","San Romano in Garfagnana","Seravezza","Sillano Giuncugnano","Stazzema","Vagli Sotto","Viareggio","Villa Basilica","Villa Collemandina"],
"MB":["Agrate Brianza","Aicurzio","Albiate","Arcore","Barlassina","Bellusco","Bernareggio","Besana in Brianza","Biassono","Bovisio-Masciago","Briosco","Brugherio","Burago di Molgora","Camparada","Caponago","Carate Brianza","Carnate","Cavenago di Brianza","Ceriano Laghetto","Cesano Maderno","Cogliate","Concorezzo","Cornate d'Adda","Correzzana","Desio","Giussano","Lazzate","Lentate sul Seveso","Lesmo","Limbiate","Lissone","Macherio","Meda","Mezzago","Misinto","Monza","Muggiò","Nova Milanese","Ornago","Renate","Roncello","Ronco Briantino","Seregno","Seveso","Sovico","Sulbiate","Triuggio","Usmate Velate","Varedo","Vedano al Lambro","Veduggio con Colzano","Verano Brianza","Villasanta","Vimercate"],
"MC":["Apiro","Appignano","Belforte del Chienti","Bolognola","Caldarola","Camerino","Camporotondo di Fiastrone","Castelraimondo","Castelsantangelo sul Nera","Cessapalombo","Cingoli","Civitanova Marche","Colmurano","Corridonia","Esanatoglia","Fiastra","Fiuminata","Gagliole","Gualdo","Loro Piceno","Macerata","Matelica","Mogliano","Montecassiano","Monte Cavallo","Montecosaro","Montefano","Montelupone","Monte San Giusto","Monte San Martino","Morrovalle","Muccia","Penna San Giovanni","Petriolo","Pievebovigliana","Pieve Torina","Pioraco","Poggio San Vicino","Pollenza","Porto Recanati","Potenza Picena","Recanati","Ripe San Ginesio","San Ginesio","San Severino Marche","Sant'Angelo in Pontano","Sarnano","Sefro","Serrapetrona","Serravalle di Chienti","Tolentino","Treia","Urbisaglia","Ussita","Visso"],
"MI":["Abbiategrasso","Albairate","Arconate","Arese","Arluno","Assago","Baranzate","Bareggio","Basiano","Basiglio","Bellinzago Lombardo","Bernate Ticino","Besate","Binasco","Boffalora sopra Ticino","Bollate","Bresso","Bubbiano","Buccinasco","Buscate","Bussero","Busto Garolfo","Calvignasco","Cambiago","Canegrate","Carpiano","Carugate","Casarile","Casorezzo","Cassano d'Adda","Cassina de' Pecchi","Cassinetta di Lugagnano","Castano Primo","Cerro al Lambro","Cerro Maggiore","Cesano Boscone","Cesate","Cinisello Balsamo","Cisliano","Cologno Monzese","Colturano","Corbetta","Cormano","Cornaredo","Corsico","Cuggiono","Cusago","Cusano Milanino","Dairago","Dresano","Gaggiano","Garbagnate Milanese","Gessate","Gorgonzola","Grezzago","Gudo Visconti","Inveruno","Inzago","Lacchiarella","Lainate","Legnano","Liscate","Locate di Triulzi","Magenta","Magnago","Marcallo con Casone","Masate","Mediglia","Melegnano","Melzo","Mesero","Milano","Morimondo","Motta Visconti","Nerviano","Nosate","Novate Milanese","Noviglio","Opera","Ossona","Ozzero","Paderno Dugnano","Pantigliate","Parabiago","Paullo","Pero","Peschiera Borromeo","Pessano con Bornago","Pieve Emanuele","Pioltello","Pogliano Milanese","Pozzo d'Adda","Pozzuolo Martesana","Pregnana Milanese","Rescaldina","Rho","Robecchetto con Induno","Robecco sul Naviglio","Rodano","Rosate","Rozzano","San Colombano al Lambro","San Donato Milanese","San Giorgio su Legnano","San Giuliano Milanese","Santo Stefano Ticino","San Vittore Olona","San Zenone al Lambro","Sedriano","Segrate","Senago","Sesto San Giovanni","Settala","Settimo Milanese","Solaro","Trezzano Rosa","Trezzano sul Naviglio","Trezzo sull'Adda","Tribiano","Truccazzano","Turbigo","Vanzaghello","Vanzago","Vaprio d'Adda","Vermezzo con Zelo","Vernate","Vignate","Villa Cortese","Vimodrone","Vittuone","Vizzolo Predabissi","Zibido San Giacomo"],
"MN":["Acquanegra sul Chiese","Asola","Bagnolo San Vito","Bigarello","Borgo Mantovano","Borgo Virgilio","Borgofranco sul Po","Bozzolo","Canneto sull'Oglio","Casalmoro","Casaloldo","Casalromano","Castel Goffredo","Castel d'Ario","Castellucchio","Castiglione delle Stiviere","Cavriana","Ceresara","Commessaggio","Curtatone","Dosolo","Felonica","Gazoldo degli Ippoliti","Gazzuolo","Goito","Gonzaga","Guidizzolo","Magnacavallo","Mantova","Marcaria","Mariana Mantovana","Marmirolo","Medole","Moglia","Monzambano","Motteggiana","Ostiglia","Pegognaga","Pieve di Coriano","Piubega","Poggio Rusco","Pomponesco","Ponti sul Mincio","Porto Mantovano","Quingentole","Quistello","Redondesco","Rivarolo Mantovano","Rodigo","Roncoferraro","Roverbella","Sabbioneta","San Benedetto Po","San Giacomo delle Segnate","San Giorgio Bigarello","San Giovanni del Dosso","San Martino dall'Argine","Schivenoglia","Sermide e Felonica","Serravalle a Po","Solferino","Sustinente","Suzzara","Viadana","Villimpenta","Volta Mantovana"],
"MO":["Bastiglia","Bomporto","Campogalliano","Camposanto","Carpi","Castelfranco Emilia","Castelnuovo Rangone","Castelvetro di Modena","Cavezzo","Concordia sulla Secchia","Fanano","Finale Emilia","Fiorano Modenese","Fiumalbo","Formigine","Frassinoro","Guiglia","Lama Mocogno","Maranello","Marano sul Panaro","Medolla","Mirandola","Modena","Montecreto","Montefiorino","Montese","Nonantola","Novi di Modena","Palagano","Pavullo nel Frignano","Pievepelago","Polinago","Prignano sulla Secchia","Ravarino","Riolunato","San Cesario sul Panaro","San Felice sul Panaro","San Possidonio","San Prospero","Sassuolo","Savignano sul Panaro","Serramazzoni","Sestola","Soliera","Spilamberto","Vignola","Zocca"],
"MS":["Aulla","Bagnone","Carrara","Casola in Lunigiana","Comano","Filattiera","Fivizzano","Fosdinovo","Licciana Nardi","Massa","Montignoso","Mulazzo","Podenzana","Pontremoli","Tresana","Villafranca in Lunigiana","Zeri"],
"NA":["Acerra","Afragola","Agerola","Anacapri","Arzano","Bacoli","Barano d'Ischia","Boscoreale","Boscotrecase","Brusciano","Caivano","Calvizzano","Camposano","Capri","Carbonara di Nola","Cardito","Casalnuovo di Napoli","Casamarciano","Casamicciola Terme","Casandrino","Casavatore","Casola di Napoli","Casoria","Castellammare di Stabia","Castello di Cisterna","Cercola","Cicciano","Cimitile","Comiziano","Crispano","Ercolano","Forio","Frattamaggiore","Frattaminore","Giugliano in Campania","Gragnano","Grumo Nevano","Ischia","Lacco Ameno","Lettere","Liveri","Marano di Napoli","Mariglianella","Marigliano","Massa di Somma","Massa Lubrense","Melito di Napoli","Meta","Monte di Procida","Mugnano di Napoli","Napoli","Nola","Ottaviano","Palma Campania","Piano di Sorrento","Pimonte","Poggiomarino","Pollena Trocchia","Pomigliano d'Arco","Pompei","Portici","Pozzuoli","Procida","Qualiano","Quarto","Roccarainola","San Gennaro Vesuviano","San Giorgio a Cremano","San Giuseppe Vesuviano","San Paolo Bel Sito","San Sebastiano al Vesuvio","San Vitaliano","Sant'Agnello","Sant'Anastasia","Sant'Antimo","Sant'Antonio Abate","Santa Maria la Carità","Saviano","Scisciano","Serrara Fontana","Somma Vesuviana","Sorrento","Striano","Terzigno","Torre Annunziata","Torre del Greco","Trecase","Tufino","Vico Equense","Villaricca","Visciano","Volla"],
"PC":["Agazzano","Alseno","Besenzone","Bettola","Bobbio","Borgonovo Val Tidone","Cadeo","Calendasco","Caorso","Carpaneto Piacentino","Castell'Arquato","Castel San Giovanni","Castelvetro Piacentino","Cerignale","Coli","Corte Brugnatella","Cortemaggiore","Farini","Ferriere","Fiorenzuola d'Arda","Gazzola","Gossolengo","Gragnano Trebbiense","Gropparello","Lugagnano Val d'Arda","Monticelli d'Ongina","Morfasso","Ottone","Piacenza","Pianello Val Tidone","Piozzano","Podenzano","Ponte dell'Olio","Pontenure","Rivergaro","Rottofreno","San Giorgio Piacentino","San Pietro in Cerro","Sarmato","Travo","Vernasca","Vigolzone","Villanova sull'Arda","Zerba","Ziano Piacentino"],
"PD":["Abano Terme","Agna","Albignasego","Anguillara Veneta","Arquà Petrarca","Arre","Arzergrande","Bagnoli di Sopra","Baone","Barbona","Battaglia Terme","Boara Pisani","Borgoricco","Bovolenta","Brugine","Cadoneghe","Campagna Lupia","Campodarsego","Campodoro","Camposampiero","Candiana","Carceri","Carmignano di Brenta","Cartura","Casale di Scodosia","Casalserugo","Castelbaldo","Cervarese Santa Croce","Cinto Euganeo","Cittadella","Codevigo","Conselve","Correzzola","Curtarolo","Due Carrare","Este","Fontaniva","Galliera Veneta","Galzignano Terme","Gazzo","Grantorto","Granze","Legnaro","Limena","Loreggia","Lozzo Atestino","Maserà di Padova","Masi","Massanzago","Megliadino San Vitale","Merlara","Mestrino","Monselice","Montagnana","Montegrotto Terme","Noventa Padovana","Ospedaletto Euganeo","Padova","Pernumia","Piacenza d'Adige","Piazzola sul Brenta","Piombino Dese","Piove di Sacco","Polverara","Ponso","Pontelongo","Ponte San Nicolò","Pozzonovo","Rovolon","Rubano","Saccolongo","San Giorgio delle Pertiche","San Giorgio in Bosco","San Martino di Lupari","San Pietro in Gu","San Pietro Viminario","Santa Giustina in Colle","Sant'Angelo di Piove di Sacco","Sant'Elena","Sant'Urbano","Saonara","Selvazzano Dentro","Solesino","Stanghella","Teolo","Terrassa Padovana","Tombolo","Torreglia","Trebaseleghe","Tribano","Urbana","Veggiano","Vescovana","Vighizzolo d'Este","Vigodarzere","Vigonza","Villa del Conte","Villa Estense","Villafranca Padovana","Villanova di Camposampiero","Vo'"],
"PG":["Assisi","Bastia Umbra","Bettona","Bevagna","Campello sul Clitunno","Cannara","Cascia","Castel Ritaldi","Castiglione del Lago","Cerreto di Spoleto","Citerna","Città della Pieve","Città di Castello","Collazzone","Corciano","Costacciaro","Deruta","Foligno","Fossato di Vico","Fratta Todina","Gualdo Cattaneo","Gualdo Tadino","Gubbio","Lisciano Niccone","Magione","Marsciano","Massa Martana","Monte Castello di Vibio","Montefalco","Monteleone di Spoleto","Monte Santa Maria Tiberina","Montone","Nocera Umbra","Norcia","Paciano","Panicale","Passignano sul Trasimeno","Perugia","Piegaro","Pietralunga","Poggiodomo","Preci","San Giustino","Sant'Anatolia di Narco","Scheggia e Pascelupo","Scheggino","Sellano","Sigillo","Spello","Spoleto","Todi","Torgiano","Trevi","Tuoro sul Trasimeno","Umbertide","Valfabbrica","Vallo di Nera","Valtopina"],
"PI":["Bientina","Buti","Calci","Calcinaia","Capannoli","Casale Marittimo","Cascina","Castelfranco di Sotto","Castellina Marittima","Castelnuovo di Val di Cecina","Chianni","Crespina Lorenzana","Fauglia","Guardistallo","Lajatico","Montecatini Val di Cecina","Montescudaio","Monteverdi Marittimo","Montopoli in Val d'Arno","Orciano Pisano","Palaia","Peccioli","Pisa","Pomarance","Ponsacco","Pontedera","Riparbella","San Giuliano Terme","San Miniato","Santa Croce sull'Arno","Santa Luce","Santa Maria a Monte","Terricciola","Vecchiano","Vicopisano","Volterra"],
"PO":["Cantagallo","Carmignano","Montemurlo","Poggio a Caiano","Prato","Vaiano","Vernio"],
"PR":["Albareto","Bardi","Bedonia","Berceto","Bore","Borgo Val di Taro","Busseto","Calestano","Collecchio","Colorno","Compiano","Corniglio","Fidenza","Fontanellato","Fontevivo","Fornovo di Taro","Langhirano","Lesignano de' Bagni","Medesano","Montechiarugolo","Monchio delle Corti","Neviano degli Arduini","Noceto","Palanzano","Parma","Pellegrino Parmense","Polesine Zibello","Roccabianca","Sala Baganza","Salsomaggiore Terme","San Secondo Parmense","Sissa Trecasali","Solignano","Soragna","Sorbolo Mezzani","Terenzo","Tizzano Val Parma","Tornolo","Torrile","Traversetolo","Valmozzola","Varano de' Melegari","Varsi"],
"PT":["Abetone Cutigliano","Agliana","Buggiano","Chiesina Uzzanese","Lamporecchio","Larciano","Marliana","Massa e Cozzile","Monsummano Terme","Montale","Montecatini Terme","Pescia","Pieve a Nievole","Pistoia","Ponte Buggianese","Quarrata","Sambuca Pistoiese","San Marcello Piteglio","Serravalle Pistoiese","Uzzano"],
"PU":["Acqualagna","Apecchio","Auditore","Belforte all'Isauro","Borgo Pace","Cagli","Cantiano","Carpegna","Cartoceto","Colli al Metauro","Fano","Fermignano","Fossombrone","Fratte Rosa","Frontino","Frontone","Gabicce Mare","Gradara","Isola del Piano","Lunano","Macerata Feltria","Mercatello sul Metauro","Mercatino Conca","Mombaroccio","Mondavio","Mondolfo","Montecalvo in Foglia","Monte Cerignone","Montecopiolo","Monte Grimano Terme","Montelabbate","Monte Porzio","Peglio","Pergola","Pesaro","Petriano","Piandimeleto","Pietrarubbia","Piobbico","Sant'Angelo in Vado","Sant'Ippolito","Sassocorvaro Auditore","Sassofeltrio","Serra Sant'Abbondio","Tavoleto","Tavullia","Terre Roveresche","Urbania","Urbino","Vallefoglia"],
"PV":["Albaredo Arnaboldi","Albonese","Albuzzano","Arena Po","Bagnaria","Barbianello","Bascapè","Bastida Pancarana","Battuda","Belgioioso","Bereguardo","Borgarello","Borgo Priolo","Borgo San Siro","Borgoratto Mormorolo","Bornasco","Bosnasco","Brallo di Pregola","Breme","Bressana Bottarone","Broni","Calvignano","Campospinoso","Candia Lomellina","Canneto Pavese","Carbonara al Ticino","Casanova Lonati","Casatisma","Casei Gerola","Casorate Primo","Cassolnovo","Castana","Casteggio","Castelletto di Branduzzo","Castello d'Agogna","Castelnovetto","Cava Manara","Cecima","Ceranova","Cergnago","Certosa di Pavia","Cervesina","Chignolo Po","Cigognola","Cilavegna","Codevilla","Confienza","Copiano","Corana","Cornale e Bastida","Corteolona e Genzone","Corvino San Quirico","Costa de' Nobili","Cozzo","Cura Carpignano","Dorno","Ferrera Erbognone","Filighera","Fortunago","Frascarolo","Garlasco","Gambolò","Genzone","Gerenzago","Giussago","Godiasco Salice Terme","Golferenzo","Gravellona Lomellina","Gropello Cairoli","Inverno e Monteleone","Landriano","Langosco","Lardirago","Linarolo","Lirio","Lomello","Lungavilla","Magherno","Marcignago","Marzano","Mede","Menconico","Mezzana Bigli","Mezzanino","Miradolo Terme","Montalto Pavese","Montebello della Battaglia","Montecalvo Versiggia","Montescano","Montesegale","Montù Beccaria","Mornico Losana","Mortara","Nicorvo","Olevano di Lomellina","Oliva Gessi","Ottobiano","Pancarana","Parona","Pavia","Pietra de' Giorgi","Pieve Albignola","Pieve del Cairo","Pieve Porto Morone","Pinarolo Po","Pizzale","Ponte Nizza","Portalbera","Rea","Redavalle","Retorbido","Rivanazzano Terme","Robbio","Robecco Pavese","Rocca de' Giorgi","Rocca Susella","Rognano","Romagnese","Roncaro","Rosasco","Rovescala","San Cipriano Po","San Damiano al Colle","San Genesio ed Uniti","San Giorgio di Lomellina","San Martino Siccomario","Sannazzaro de' Burgondi","Santa Cristina e Bissone","Santa Giuletta","Santa Margherita di Staffora","Santa Maria della Versa","Sant'Alessio con Vialone","Sant'Angelo Lomellina","San Zenone al Po","Sartirana Lomellina","Scaldasole","Semiana","Silvano Pietra","Siziano","Sommo","Spessa","Stradella","Suardi","Torrazza Coste","Torre Beretti e Castellaro","Torre d'Arese","Torre de' Negri","Torre d'Isola","Torrevecchia Pia","Torricella Verzate","Trivolzio","Tromello","Trovo","Val di Nizza","Valeggio","Valle Lomellina","Valle Salimbene","Varzi","Velezzo Lomellina","Vellezzo Bellini","Verretto","Verrua Po","Vidigulfo","Vigevano","Villa Biscossi","Villanova d'Ardenghi","Villanterio","Vistarino","Voghera","Volpara","Zavattarello","Zeccone","Zeme","Zenevredo","Zerbo","Zerbolò","Zinasco","Travacò Siccomario"],
"RA":["Alfonsine","Bagnacavallo","Bagnara di Romagna","Brisighella","Casola Valsenio","Castel Bolognese","Cervia","Conselice","Cotignola","Faenza","Fusignano","Lugo","Massa Lombarda","Ravenna","Riolo Terme","Russi","Sant'Agata sul Santerno","Solarolo"],
"RE":["Albinea","Bagnolo in Piano","Baiso","Bibbiano","Boretto","Brescello","Cadelbosco di Sopra","Campagnola Emilia","Campegine","Canossa","Carpineti","Casalgrande","Casina","Castellarano","Castelnovo di Sotto","Castelnovo ne' Monti","Cavriago","Correggio","Fabbrico","Gattatico","Gualtieri","Guastalla","Luzzara","Montecchio Emilia","Novellara","Poviglio","Quattro Castella","Reggiolo","Reggio Emilia","Rio Saliceto","Rolo","Rubiera","San Martino in Rio","San Polo d'Enza","Sant'Ilario d'Enza","Scandiano","Toano","Vetto","Vezzano sul Crostolo","Viano","Villa Minozzo"],
"RI":["Accumoli","Amatrice","Antrodoco","Ascrea","Belmonte in Sabina","Borbona","Borgo Velino","Borgorose","Cantalice","Cantalupo in Sabina","Casaprota","Casperia","Castel di Tora","Castel Sant'Angelo","Castelnuovo di Farfa","Cittaducale","Cittareale","Collalto Sabino","Colle di Tora","Collegiove","Collevecchio","Colli sul Velino","Concerviano","Configni","Contigliano","Cottanello","Fara in Sabina","Fiamignano","Forano","Frasso Sabino","Greccio","Labro","Leonessa","Longone Sabino","Magliano Sabina","Marcetelli","Micigliano","Mompeo","Montasola","Montebuono","Monteleone Sabino","Montenero Sabino","Montopoli di Sabina","Morro Reatino","Nespolo","Orvinio","Paganico Sabino","Pescorocchiano","Petrella Salto","Poggio Bustone","Poggio Catino","Poggio Mirteto","Poggio Moiano","Poggio Nativo","Poggio San Lorenzo","Posta","Pozzaglia Sabina","Rieti","Rivodutri","Roccantica","Rocca Sinibalda","Salisano","Scandriglia","Selci","Stimigliano","Tarano","Toffia","Torri in Sabina","Torricella in Sabina","Turania","Vacone","Varco Sabino"],
"RM":["Affile","Agosta","Albano Laziale","Allumiere","Anguillara Sabazia","Anticoli Corrado","Anzio","Arcinazzo Romano","Ardea","Ariccia","Arsoli","Artena","Bellegra","Bracciano","Camerata Nuova","Campagnano di Roma","Canale Monterano","Canterano","Capena","Capranica Prenestina","Carpineto Romano","Casape","Castel Gandolfo","Castel Madama","Castelnuovo di Porto","Castel San Pietro Romano","Cave","Cerreto Laziale","Cervara di Roma","Cerveteri","Ciampino","Ciciliano","Cineto Romano","Civitavecchia","Civitella San Paolo","Colleferro","Colonna","Fiano Romano","Filacciano","Fiumicino","Fonte Nuova","Formello","Frascati","Gallicano nel Lazio","Gavignano","Genazzano","Genzano di Roma","Gerano","Gorga","Grottaferrata","Guidonia Montecelio","Jenne","Labico","Ladispoli","Lanuvio","Lariano","Licenza","Magliano Romano","Mandela","Manziana","Marano Equo","Marcellina","Marino","Mazzano Romano","Mentana","Monte Compatri","Monteflavio","Montelanico","Montelibretti","Monte Porzio Catone","Monterotondo","Montorio Romano","Moricone","Morlupo","Nazzano","Nemi","Nerola","Nettuno","Olevano Romano","Palestrina","Palombara Sabina","Percile","Pisoniano","Poli","Pomezia","Ponzano Romano","Riano","Rignano Flaminio","Riofreddo","Rocca Canterano","Rocca di Cave","Rocca di Papa","Roccagiovine","Rocca Priora","Rocca Santo Stefano","Roiate","Roma","Roviano","Sacrofano","Sambuci","San Cesareo","San Gregorio da Sassola","San Polo dei Cavalieri","Santa Marinella","Sant'Angelo Romano","Sant'Oreste","San Vito Romano","Saracinesco","Segni","Subiaco","Tivoli","Tolfa","Torrita Tiberina","Trevignano Romano","Vallepietra","Vallinfreda","Valmontone","Velletri","Vicovaro","Vivaro Romano","Zagarolo"],
"RN":["Bellaria-Igea Marina","Cattolica","Coriano","Gemmano","Misano Adriatico","Mondaino","Montefiore Conca","Montegridolfo","Montescudo-Monte Colombo","Morciano di Romagna","Novafeltria","Pennabilli","Poggio Torriana","Riccione","Rimini","Saludecio","San Clemente","San Giovanni in Marignano","San Leo","Sant'Agata Feltria","Santarcangelo di Romagna","Talamello","Verucchio"],
"RO":["Adria","Ariano nel Polesine","Arquà Polesine","Badia Polesine","Bagnolo di Po","Bergantino","Bosaro","Calto","Canaro","Canda","Castelguglielmo","Castelmassa","Castelnovo Bariano","Ceneselli","Ceregnano","Corbola","Costa di Rovigo","Crespino","Ficarolo","Fiesso Umbertiano","Frassinelle Polesine","Fratta Polesine","Gaiba","Gavello","Giacciano con Baruchella","Guarda Veneta","Lendinara","Loreo","Lusia","Melara","Occhiobello","Papozze","Pettorazza Grimani","Pincara","Polesella","Pontecchio Polesine","Porto Tolle","Porto Viro","Rosolina","Rovigo","Salara","San Bellino","San Martino di Venezze","Stienta","Taglio di Po","Trecenta","Villadose","Villamarzana","Villanova del Ghebbo","Villanova Marchesana"],
"SA":["Acerno","Agropoli","Albanella","Alfano","Altavilla Silentina","Amalfi","Angri","Aquara","Ascea","Atena Lucana","Atrani","Auletta","Baronissi","Battipaglia","Bellosguardo","Bracigliano","Buccino","Buonabitacolo","Caggiano","Calvanico","Camerota","Campagna","Campora","Cannalonga","Capaccio Paestum","Casal Velino","Casalbuono","Casaletto Spartano","Caselle in Pittari","Castel San Giorgio","Castel San Lorenzo","Castelcivita","Castellabate","Castelnuovo Cilento","Castelnuovo di Conza","Castiglione del Genovesi","Cava de' Tirreni","Celle di Bulgheria","Centola","Ceraso","Cetara","Cicerale","Colliano","Conca dei Marini","Controne","Contursi Terme","Corbara","Corleto Monforte","Cuccaro Vetere","Eboli","Felitto","Fisciano","Furore","Futani","Giffoni Sei Casali","Giffoni Valle Piana","Gioi","Giungano","Ispani","Laureana Cilento","Laurino","Laurito","Laviano","Lustra","Magliano Vetere","Maiori","Mercato San Severino","Minori","Moio della Civitella","Montano Antilia","Monte San Giacomo","Montecorice","Montecorvino Pugliano","Montecorvino Rovella","Monteforte Cilento","Montesano sulla Marcellana","Morigerati","Nocera Inferiore","Nocera Superiore","Novi Velia","Ogliastro Cilento","Olevano sul Tusciano","Oliveto Citra","Omignano","Orria","Ottati","Padula","Pagani","Palomonte","Pellezzano","Perdifumo","Perito","Pertosa","Petina","Piaggine","Pisciotta","Polla","Pollica","Pontecagnano Faiano","Positano","Postiglione","Praiano","Prignano Cilento","Ravello","Ricigliano","Roccadaspide","Roccagloriosa","Roccapiemonte","Rofrano","Romagnano al Monte","Roscigno","Rutino","Sacco","Sala Consilina","Salento","Salerno","Salvitelle","San Cipriano Picentino","San Giovanni a Piro","San Gregorio Magno","San Mango Piemonte","San Marzano sul Sarno","San Mauro Cilento","San Mauro la Bruca","San Pietro al Tanagro","San Rufo","San Valentino Torio","Santa Marina","Sant'Angelo a Fasanella","Sant'Arsenio","Sant'Egidio del Monte Albino","Santomenna","Sanza","Sapri","Sarno","Sassano","Scafati","Scala","Serramezzana","Serre","Sessa Cilento","Siano","Sicignano degli Alburni","Stella Cilento","Stio","Teggiano","Torchiara","Torraca","Torre Orsaia","Tortorella","Tramonti","Trentinara","Valle dell'Angelo","Vallo della Lucania","Valva","Vibonati","Vietri sul Mare"],
"SI":["Abbadia San Salvatore","Asciano","Buonconvento","Casole d'Elsa","Castellina in Chianti","Castelnuovo Berardenga","Castiglione d'Orcia","Cetona","Chianciano Terme","Chiusdino","Chiusi","Colle di Val d'Elsa","Gaiole in Chianti","Montalcino","Montepulciano","Monteriggioni","Monteroni d'Arbia","Monticiano","Murlo","Piancastagnaio","Pienza","Poggibonsi","Radda in Chianti","Radicofani","Radicondoli","Rapolano Terme","San Casciano dei Bagni","San Gimignano","San Quirico d'Orcia","Sarteano","Siena","Sinalunga","Sovicille","Torrita di Siena","Trequanda"],
"SO":["Albaredo per San Marco","Albosaggia","Andalo Valtellino","Aprica","Ardenno","Bema","Berbenno di Valtellina","Bianzone","Bormio","Buglio in Monte","Caiolo","Campodolcino","Caspoggio","Castello dell'Acqua","Castione Andevenno","Cedrasco","Cercino","Chiavenna","Chiesa in Valmalenco","Chiuro","Cino","Civo","Colorina","Cosio Valtellino","Dazio","Delebio","Dubino","Faedo Valtellino","Forcola","Fusine","Gerola Alta","Gordona","Grosio","Grosotto","Lanzada","Livigno","Lovero","Madesimo","Mantello","Mazzo di Valtellina","Mello","Mese","Montagna in Valtellina","Morbegno","Novate Mezzola","Pedesina","Piantedo","Piateda","Piuro","Poggiridenti","Ponte in Valtellina","Postalesio","Prata Camportaccio","Rasura","Rogolo","Samolaco","San Giacomo Filippo","Sondalo","Sondrio","Spriana","Talamona","Tartano","Teglio","Tirano","Torre di Santa Maria","Tovo di Sant'Agata","Traona","Tresivio","Val Masino","Valdidentro","Valdisotto","Valfurva","Verceia","Vervio","Villa di Chiavenna","Villa di Tirano"],
"TO":["Agliè","Airasca","Ala di Stura","Albiano d'Ivrea","Almese","Alpette","Alpignano","Andezeno","Andrate","Angrogna","Arignano","Avigliana","Azeglio","Bairo","Balangero","Baldissero Canavese","Baldissero Torinese","Balme","Banchette","Barbania","Bardonecchia","Barone Canavese","Beinasco","Bibiana","Bobbio Pellice","Bollengo","Borgaro Torinese","Borgiallo","Borgofranco d'Ivrea","Borgomasino","Borgone Susa","Bosconero","Brandizzo","Bricherasio","Brosso","Brozolo","Bruino","Brusasco","Bruzolo","Buriasco","Burolo","Busano","Bussoleno","Buttigliera Alta","Cafasse","Caluso","Cambiano","Campiglione Fenile","Candia Canavese","Candiolo","Canischio","Cantalupa","Cantoira","Caprie","Caravino","Carema","Carignano","Carmagnola","Casalborgone","Cascinette d'Ivrea","Caselette","Caselle Torinese","Castagneto Po","Castagnole Piemonte","Castellamonte","Castelnuovo Nigra","Castiglione Torinese","Cavagnolo","Cavour","Cercenasco","Ceres","Ceresole Reale","Cesana Torinese","Chialamberto","Chianocco","Chiaverano","Chieri","Chiesanuova","Chiomonte","Chiusa di San Michele","Chivasso","Ciconio","Cintano","Cinzano","Ciriè","Claviere","Coassolo Torinese","Coazze","Collegno","Colleretto Castelnuovo","Colleretto Giacosa","Condove","Corio","Cossano Canavese","Cuceglio","Cumiana","Cuorgnè","Druento","Exilles","Favria","Feletto","Fenestrelle","Fiano","Fiorano Canavese","Foglizzo","Forno Canavese","Frassinetto","Front","Frossasco","Garzigliana","Gassino Torinese","Germagnano","Giaglione","Giaveno","Givoletto","Gravere","Groscavallo","Grosso","Grugliasco","Inverso Pinasca","Isolabella","Ivrea","La Cassa","La Loggia","Lanzo Torinese","Lauriano","Leini","Lemie","Lessolo","Levone","Locana","Lombardore","Lombriasco","Loranzè","Luserna San Giovanni","Lusernetta","Lusigliè","Macello","Maglione","Mappano","Marentino","Massello","Mathi","Mattie","Mazzè","Meana di Susa","Mercenasco","Mezzenile","Mombello di Torino","Mompantero","Monastero di Lanzo","Moncalieri","Moncenisio","Montaldo Torinese","Montalenghe","Montalto Dora","Montanaro","Monteu da Po","Moriondo Torinese","Nichelino","Noasca","Nole","Nomaglio","None","Novalesa","Oglianico","Orbassano","Orio Canavese","Osasco","Osasio","Oulx","Ozegna","Palazzo Canavese","Pancalieri","Parella","Pavarolo","Pavone Canavese","Pecco","Pecetto Torinese","Perosa Argentina","Perosa Canavese","Pertusio","Pessinetto","Pianezza","Pinasca","Pinerolo","Pino Torinese","Piobesi Torinese","Piossasco","Piscina","Piverone","Poirino","Pomaretto","Pont-Canavese","Porte","Pragelato","Prali","Pralormo","Pramollo","Prarostino","Prascorsano","Pratiglione","Quagliuzzo","Quassolo","Quincinetto","Reano","Ribordone","Rivalba","Rivalta di Torino","Riva presso Chieri","Rivara","Rivarolo Canavese","Rivarossa","Rivoli","Robassomero","Rocca Canavese","Roletto","Romano Canavese","Ronco Canavese","Rondissone","Rorà","Roure","Rosta","Rubiana","Rueglio","Salassa","Salbertrand","Salerano Canavese","Salza di Pinerolo","Samone","San Benigno Canavese","San Carlo Canavese","San Colombano Belmonte","San Didero","San Francesco al Campo","Sangano","San Germano Chisone","San Gillio","San Giorgio Canavese","San Giorio di Susa","San Giusto Canavese","San Martino Canavese","San Maurizio Canavese","San Mauro Torinese","San Pietro Val Lemina","San Ponso","San Raffaele Cimena","San Sebastiano da Po","San Secondo di Pinerolo","Sant'Ambrogio di Torino","Sant'Antonino di Susa","Santena","Sauze di Cesana","Sauze d'Oulx","Scalenghe","Scarmagno","Sciolze","Sestriere","Settimo Rottaro","Settimo Torinese","Settimo Vittone","Sparone","Strambinello","Strambino","Susa","Tavagnasco","Torino","Torrazza Piemonte","Torre Canavese","Torre Pellice","Trana","Traversella","Traves","Trofarello","Usseaux","Usseglio","Vaie","Val della Torre","Valgioie","Vallo Torinese","Valperga","Valprato Soana","Varisella","Vauda Canavese","Venaus","Venaria Reale","Verolengo","Verrua Savoia","Vestignè","Vialfrè","Vidracco","Vigone","Villafranca Piemonte","Villanova Canavese","Villar Dora","Villarbasse","Villar Focchiardo","Villar Pellice","Villar Perosa","Villastellone","Vinovo","Virle Piemonte","Vische","Vistrorio","Viù","Volpiano","Volvera"],
"TR":["Acquasparta","Allerona","Alviano","Amelia","Arrone","Attigliano","Avigliano Umbro","Baschi","Calvi dell'Umbria","Castel Giorgio","Castel Viscardo","Fabro","Ferentillo","Ficulle","Giove","Guardea","Lugnano in Teverina","Montecastrilli","Montecchio","Montefranco","Montegabbione","Monteleone d'Orvieto","Narni","Orvieto","Otricoli","Parrano","Penna in Teverina","Polino","Porano","San Gemini","San Venanzo","Stroncone","Terni"],
"TV":["Altivole","Arcade","Asolo","Borso del Grappa","Breda di Piave","Caerano di San Marco","Cappella Maggiore","Carbonera","Casale sul Sile","Casier","Castelcucco","Castelfranco Veneto","Castello di Godego","Cavaso del Tomba","Cessalto","Chiarano","Cimadolmo","Cison di Valmarino","Codognè","Colle Umberto","Conegliano","Cordignano","Cornuda","Crocetta del Montello","Farra di Soligo","Follina","Fontanelle","Fonte","Fregona","Gaiarine","Giavera del Montello","Godega di Sant'Urbano","Gorgo al Monticano","Istrana","Loria","Mansuè","Mareno di Piave","Maser","Maserada sul Piave","Meduna di Livenza","Miane","Mogliano Veneto","Monastier di Treviso","Monfumo","Montebelluna","Morgano","Moriago della Battaglia","Motta di Livenza","Nervesa della Battaglia","Oderzo","Ormelle","Orsago","Paese","Pederobba","Pieve di Soligo","Ponte di Piave","Ponzano Veneto","포르데노네,Portobuffolè","Possagno","Povegliano","Preganziol","Quinto di Treviso","Refrontolo","Resana","Revine Lago","Riese Pio X","Roncade","Salgareda","San Biagio di Callalta","San Fior","San Pietro di Feletto","San Polo di Piave","Santa Lucia di Piave","San Vendemiano","San Zenone degli Ezzelini","Sarmede","Segusino","Sernaglia della Battaglia","Silea","Spresiano","Susegana","Tarzo","Trevignano","Treviso","Vazzola","Vedelago","Vidor","Villorba","Vittorio Veneto","Volpago del Montello","Zenson di Piave","Zero Branco","Portobuffolè","Povegliano"],
"VA":["Agra","Albizzate","Angera","Arcisate","Arsago Seprio","Azzate","Azzio","Barasso","Bardello con Malgesso e Bregano","Bedero Valcuvia","Besano","Besnate","Besozzo","Biandronno","Bisuschio","Bodio Lomnago","Brebbia","Bregano","Brenta","Brezzo di Bedero","Brinzio","Brissago-Valtravaglia","Brunello","Brusimpiano","Buguggiate","Busto Arsizio","Cadegliano-Viconago","Cairate","Cantello","Caravate","Cardano al Campo","Carnago","Caronno Pertusella","Caronno Varesino","Casale Litta","Casalzuigno","Casciago","Casorate Sempione","Cassano Magnago","Cassano Valcuvia","Castellanza","Castello Cabiaglio","Castelseprio","Castelveccana","Castiglione Olona","Castronno","Cavaria con Premezzo","Cazzago Brabbia","Cislago","Cittiglio","Clivio","Cocquio-Trevisago","Comabbio","Comerio","Cremenaga","Crosio della Valle","Cuasso al Monte","Cugliate-Fabiasco","Cunardo","Curiglia con Monteviasco","Cuveglio","Cuvio","Daverio","Dumenza","Duno","Fagnano Olona","Ferno","Ferrera di Varese","Gallarate","Galliate Lombardo","Gavirate","Gazzada Schianno","Gemonio","Gerenzano","Germignaga","Golasecca","Gorla Maggiore","Gorla Minore","Gornate Olona","Grantola","Inarzo","Induno Olona","Jerago con Orago","Lavena Ponte Tresa","Laveno-Mombello","Leggiuno","Lonate Ceppino","Lonate Pozzolo","Lozza","Luino","Luvinate","Maccagno con Pino e Veddasca","Malnate","Marchirolo","Marnate","Marzio","Masciago Primo","Mercallo","Mesenzana","Montegrino Valtravaglia","Monvalle","Morazzone","Mornago","Oggiona con Santo Stefano","Olgiate Olona","Origgio","Orino","Porto Ceresio","Porto Valtravaglia","Rancio Valcuvia","Ranco","Saltrio","Samarate","Saronno","Sesto Calende","Solbiate Arno","Solbiate Olona","Somma Lombardo","Sumirago","Taino","Ternate","Tradate","Travedona-Monate","Tronzano Lago Maggiore","Uboldo","Valganna","Varano Borghi","Varese","Vedano Olona","Venegono Inferiore","Venegono Superiore","Vergiate","Viggiù","Vizzola Ticino"],
"VE":["Annone Veneto","Campagna Lupia","Campolongo Maggiore","Camponogara","Caorle","Cavarzere","Ceggia","Chioggia","Cinto Caomaggiore","Cona","Concordia Sagittaria","Dolo","Eraclea","Fiesso d'Artico","Fossalta di Piave","Fossalta di Portogruaro","Fossò","Gruaro","Jesolo","Marcon","Martellago","Meolo","Mira","Mirano","Musile di Piave","Noale","Noventa di Piave","Pianiga","Portogruaro","Pramaggiore","Quarto d'Altino","Salzano","San Donà di Piave","San Michele al Tagliamento","San Stino di Livenza","Santa Maria di Sala","Scorzè","Spinea","Stra","Teglio Veneto","Torre di Mosto","Venezia","Vigonovo"],
"VI":["Agugliaro","Albettone","Alonte","Altavilla Vicentina","Altissimo","Arcugnano","Arsiero","Arzignano","Asiago","Asigliano Veneto","Barbarano Mossano","Bassano del Grappa","Bolzano Vicentino","Breganze","Brendola","Bressanvido","Brogliano","Caldogno","Caltrano","Calvene","Camisano Vicentino","Campiglia dei Berici","Carrè","Cartigliano","Cassola","Castegnero","Castelgomberto","Chiampo","Chiuppano","Cogollo del Cengio","Cornedo Vicentino","Costabissara","Creazzo","Crespadoro","Dueville","Enego","Fara Vicentino","Foza","Gallio","Gambellara","Gambugliano","Grisignano di Zocco","Grumolo delle Abbadesse","Isola Vicentina","Laghi","Lastebasse","Longare","Lonigo","Lugo di Vicenza","Malo","Marano Vicentino","Marostica","Montebello Vicentino","Montecchio Maggiore","Montecchio Precalcino","Monte di Malo","Montegalda","Montegaldella","Monteviale","Monticello Conte Otto","Montorso Vicentino","Mussolente","Nanto","Nogarole Vicentino","Nove","Noventa Vicentina","Orgiano","Pedemonte","Pianezze","Piovene Rocchette","Pojana Maggiore","Posina","Pove del Grappa","Pozzoleone","Quinto Vicentino","Recoaro Terme","Roana","Romano d'Ezzelino","Rosà","Rossano Veneto","Rotzo","Salcedo","Sandrigo","San Pietro Mussolino","Santorso","San Vito di Leguzzano","Sarcedo","Sarego","Schiavon","Schio","Solagna","Sossano","Sovizzo","Tezze sul Brenta","Thiene","Tonezza del Cimone","Torrebelvicino","Torri di Quartesolo","Trissino","Valbrenta","Valdagno","Valdastico","Valli del Pasubio","Velo d'Astico","Vicenza","Villaga","Villaverla","Zanè","Zermeghedo","Zovencedo","Zugliano"],
"VR":["Affi","Albaredo d'Adige","Angiari","Arcole","Badia Calavena","Bardolino","Belfiore","Bevilacqua","Bonavigo","Boschi Sant'Anna","Bosco Chiesanuova","Bovolone","Brentino Belluno","Brenzone sul Garda","Bussolengo","Buttapietra","Caldiero","Caprino Veronese","Casaleone","Castagnaro","Castel d'Azzano","Castelnuovo del Garda","Cavaion Veronese","Cazzano di Tramigna","Cerea","Cerro Veronese","Cologna Veneta","Colognola ai Colli","Concamarise","Costermano sul Garda","Dolcè","Erbè","Erbezzo","Ferrara di Monte Baldo","Fumane","Garda","Gazzo Veronese","Grezzana","Illasi","Isola della Scala","Isola Rizza","Lavagno","Lazise","Legnago","Malcesine","Marano di Valpolicella","Mezzane di Sotto","Minerbe","Montecchia di Crosara","Monteforte d'Alpone","Mozzecane","Negrar di Valpolicella","Nogara","Nogarole Rocca","Oppeano","Palù","Pastrengo","Pescantina","Peschiera del Garda","Povegliano Veronese","Pressana","Rivoli Veronese","Roncà","Ronco all'Adige","Roverchiara","Roveredo di Guà","Roverè Veronese","Salizzole","San Bonifacio","San Giovanni Ilarione","San Giovanni Lupatoto","Sanguinetto","San Martino Buon Albergo","San Mauro di Saline","San Pietro di Morubio","San Pietro in Cariano","San Zeno di Montagna","Sant'Ambrogio di Valpolicella","Sant'Anna d'Alfaedo","Selva di Progno","Soave","Sommacampagna","Sona","Sorgà","Terrazzo","Torri del Benaco","Tregnago","Trevenzuolo","Valeggio sul Mincio","Velo Veronese","Verona","Veronella","Vestenanova","Vigasio","Villa Bartolomea","Villafranca di Verona","Zevio","Zimella"],
"VT":["Acquapendente","Arlena di Castro","Bagnoregio","Barbarano Romano","Bassano in Teverina","Bassano Romano","Blera","Bolsena","Bomarzo","Calcata","Canepina","Canino","Capodimonte","Capranica","Caprarola","Carbognano","Castel Sant'Elia","Castiglione in Teverina","Celleno","Cellere","Civita Castellana","Civitella d'Agliano","Corchiano","Fabrica di Roma","Faleria","Farnese","Gallese","Gradoli","Graffignano","Grotte di Castro","Ischia di Castro","Latera","Lubriano","Marta","Montalto di Castro","Montefiascone","Monte Romano","Nepi","Onano","Oriolo Romano","Orte","Piansano","Proceno","Ronciglione","San Lorenzo Nuovo","Soriano nel Cimino","Sutri","Tarquinia","Tessennano","Tuscania","Valentano","Vallerano","Vasanello","Vejano","Vetralla","Vignanello","Villa San Giovanni in Tuscia","Viterbo","Vitorchiano"]
};
Object.keys(FULL).forEach(function(k){ COMUNI[k] = FULL[k].slice().sort(); });
})();


// ── Coordinate helper + distanza (per selezione comuni per raggio km) ──────
function getComuneCoordEstimate(comuneName, provCode){
  // Coordinate esatte se disponibili
  if(typeof COMUNI_COORDS !== 'undefined' && COMUNI_COORDS[comuneName]) return COMUNI_COORDS[comuneName];
  // Altrimenti usa il capoluogo di provincia come riferimento
  if(typeof PROVINCE_COORDS !== 'undefined' && PROVINCE_COORDS[provCode]) return PROVINCE_COORDS[provCode];
  return null;
}
function haversineKm(lat1,lon1,lat2,lon2){
  var R=6371;
  var dLat=(lat2-lat1)*Math.PI/180;
  var dLon=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
// Ritorna lista di {nome, prov, km} dei comuni entro maxKm dal comune sede
function getComuniWithinRadius(homeComune, homeProvCode, maxKm){
  var origin = getComuneCoordEstimate(homeComune, homeProvCode);
  if(!origin) return [];
  var result=[];
  // Per ogni provincia, se il suo capoluogo è entro maxKm+50 (margine), includi i suoi comuni
  Object.keys(COMUNI).forEach(function(pc){
    var pcoord = (typeof PROVINCE_COORDS!=='undefined') ? PROVINCE_COORDS[pc] : null;
    if(!pcoord) return;
    var provDist = haversineKm(origin[0],origin[1],pcoord[0],pcoord[1]);
    // Skip province troppo lontane (margine 60km per estensione provincia)
    if(provDist > maxKm + 60) return;
    (COMUNI[pc]||[]).forEach(function(cm){
      var ccoord = getComuneCoordEstimate(cm, pc);
      if(!ccoord) return;
      var d = haversineKm(origin[0],origin[1],ccoord[0],ccoord[1]);
      if(d <= maxKm){
        result.push({nome:cm, prov:pc, km:Math.round(d)});
      }
    });
  });
  // Ordina per distanza
  result.sort(function(a,b){return a.km-b.km;});
  return result;
}

