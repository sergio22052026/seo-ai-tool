const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// ── DATABASE (Postgres opzionale — se DATABASE_URL non è impostato, funziona senza) ──
let dbClient = null;
async function initDB() {
  if (!process.env.DATABASE_URL) { console.log('⚠️  DATABASE_URL non impostato — storico disabilitato.'); return; }
  try {
    const { Client } = require('pg');
    dbClient = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await dbClient.connect();
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        agent_name TEXT NOT NULL,
        agent_key_hint TEXT,
        company TEXT NOT NULL,
        website TEXT,
        industry TEXT,
        location TEXT,
        overall_score INTEGER,
        keywords_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Database connesso e pronto.');
  } catch (e) { console.error('❌ Errore DB:', e.message); dbClient = null; }
}

async function logReport(session, body, score) {
  if (!dbClient) return;
  try {
    const hint = session.apiKey ? session.apiKey.slice(0,12)+'...' : 'admin';
    await dbClient.query(
      'INSERT INTO reports (agent_name, agent_key_hint, company, website, industry, location, overall_score, keywords_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [session.agentName||'Agente', hint, body.company||'', body.website||'', body.settore||'', body.city||'', score||0, (body.selectedKeywords||[]).length]
    );
  } catch(e) { console.error('Errore log report:', e.message); }
}


const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Restituisce la chiave API giusta: quella dell'agente dalla sessione, o quella admin dall'env
function getApiKey(req) {
  const token = req.headers['x-session-token'];
  const session = token ? sessions.get(token) : null;
  if (session && session.apiKey) return session.apiKey;
  return ANTHROPIC_API_KEY; // fallback per admin o chiamate senza chiave agente
}

// Traduce gli errori Anthropic in messaggi comprensibili per l'agente
function traduciErroreAnthropic(err) {
  const msg = (err.message || err.error?.message || JSON.stringify(err)).toLowerCase();
  if (msg.includes('credit') || msg.includes('balance') || msg.includes('billing'))
    return 'Il tuo credito Anthropic è esaurito. Vai su console.anthropic.com → Billing e ricarica il tuo account.';
  if (msg.includes('invalid') && msg.includes('key') || msg.includes('authentication'))
    return 'La tua chiave API non è valida. Controlla di averla copiata correttamente da console.anthropic.com → API Keys.';
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Troppe richieste in poco tempo. Attendi qualche secondo e riprova.';
  if (msg.includes('overloaded') || msg.includes('529'))
    return 'Il servizio AI è temporaneamente sovraccarico. Riprova tra qualche secondo.';
  return 'Errore del servizio AI. Riprova tra qualche secondo.';
}
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin-super-2025';
let agentPassword = process.env.ACCESS_PASSWORD || 'agenti2025';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo2025';
const DEMO_API_KEY = process.env.DEMO_API_KEY || ANTHROPIC_API_KEY;

const sessions = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > 8 * 60 * 60 * 1000) sessions.delete(token);
  }
}, 60 * 60 * 1000);

function generateToken() { return crypto.randomBytes(32).toString('hex'); }
function isAuthenticated(req) {
  const token = req.headers['x-session-token'];
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > 8 * 60 * 60 * 1000) { sessions.delete(token); return false; }
  return true;
}
function isAdmin(req) {
  const token = req.headers['x-session-token'];
  if (!token) return false;
  const session = sessions.get(token);
  return session && session.role === 'admin' && Date.now() - session.createdAt < 8 * 60 * 60 * 1000;
}

app.post('/api/login', (req, res) => {
  const { password, apiKey, agentName } = req.body;
  if (!password || password !== agentPassword) return res.status(401).json({ error: 'Password errata' });
  if (!apiKey || !apiKey.startsWith('sk-ant-')) return res.status(401).json({ error: 'Chiave API non valida. Deve iniziare con sk-ant-' });
  const token = generateToken();
  sessions.set(token, { createdAt: Date.now(), role: 'agent', apiKey: apiKey.trim(), agentName: (agentName||'').trim()||'Agente' });
  res.json({ token, role: 'agent' });
});

app.post('/api/login/demo', (req, res) => {
  const { password, agentName } = req.body;
  if (!password || password !== DEMO_PASSWORD) return res.status(401).json({ error: 'Password demo errata.' });
  if (!DEMO_API_KEY) return res.status(500).json({ error: 'Chiave demo non configurata. Contatta il responsabile.' });
  const token = generateToken();
  sessions.set(token, { createdAt: Date.now(), role: 'agent', apiKey: DEMO_API_KEY, isDemo: true, agentName: (agentName||'').trim()||'Demo' });
  res.json({ token, role: 'agent' });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Password admin errata' });
  const token = generateToken();
  sessions.set(token, { createdAt: Date.now(), role: 'admin' });
  res.json({ token, role: 'admin' });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers['x-session-token'];
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/admin/info', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  const now = Date.now();
  const active = [...sessions.values()].filter(s => s.role === 'agent' && now - s.createdAt < 8 * 60 * 60 * 1000).length;
  res.json({ agentPassword, activeSessions: active, totalSessions: sessions.size });
});

app.post('/api/admin/change-password', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Minimo 6 caratteri' });
  agentPassword = newPassword;
  for (const [token, session] of sessions.entries()) {
    if (session.role === 'agent') sessions.delete(token);
  }
  res.json({ ok: true });
});

// Verifica sito web
// Storico report da DB (solo admin)
app.get('/api/admin/reports', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  if (!dbClient) return res.json({ reports: [], dbEnabled: false });
  try {
    const r = await dbClient.query('SELECT * FROM reports ORDER BY created_at DESC LIMIT 500');
    res.json({ reports: r.rows, dbEnabled: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/reports', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  if (!dbClient) return res.json({ ok: true });
  try { await dbClient.query('DELETE FROM reports'); res.json({ ok: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/check-site', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'URL mancante' });
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8'
      }
    });
    clearTimeout(timeout);
    res.json({ ok: r.ok || r.status < 400, status: r.status });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// STEP 1: suggerimenti
app.post('/api/suggest', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { company, website, city, comune, provincia, settore, kwCount, compCount, bizType, rilevanza, visibilita, geoAreas, geoMode, geoRadius } = req.body;
  if (!company) return res.status(400).json({ error: 'company mancante' });
  const usedKey = getApiKey(req);
  if (!usedKey) return res.status(500).json({ error: 'Nessuna chiave API configurata. Effettua il logout e accedi di nuovo inserendo la tua chiave API.' });

  const n = Math.min(Math.max(parseInt(kwCount) || 5, 1), 30);
  const nc = Math.min(Math.max(parseInt(compCount) || 5, 1), 30);

  const bizDesc = {
    'b2c': 'vende direttamente a consumatori finali (B2C)',
    'b2b': 'vende ad altre aziende (B2B)',
    'both': 'vende sia a consumatori finali che ad aziende (B2C + B2B)'
  };

  const cityName = comune || city || company;
  const locationFull = [comune, provincia].filter(Boolean).join(', ') || city || company;
  const settoreDesc = settore ? `Settore di attivita: "${settore}"` : '';
  const geoLabels = {
    'comunale': 'comunale — inserisci ESATTAMENTE il comune di ' + cityName + ' nelle keyword (es. "servizio ' + cityName + '")',
    'provinciale': 'provinciale — inserisci il nome della PROVINCIA di ' + cityName + ' nelle keyword (es. "servizio provincia di [provincia di ' + cityName + ']")',
    'multiprovinciale': 'multiprovinciale — le keyword coprono la provincia di ' + cityName + ' + le province limitrofe della stessa regione + le province di confine delle regioni adiacenti a quella di ' + cityName,
    'regionale': 'regionale — inserisci il nome della REGIONE di ' + cityName + ' nelle keyword (es. "servizio [regione di ' + cityName + ']")',
    'multiregionale': 'multiregionale — le keyword coprono la regione di ' + cityName + ' + le regioni geograficamente confinanti con essa',
    'nazionale': 'nazionale — keyword generiche senza geo (il targeting geografico e solo nella campagna Google Ads)',
    'internazionale': 'internazionale — keyword in inglese o piu lingue per clientela estera'
  };

  const visLabels = (visibilita || []).map(v => geoLabels[v] || v).join(', ');
  const rilLabels = (rilevanza || []).join(', ');

  // Build geo areas string for keyword targeting
  const geoAreasList = (geoAreas && geoAreas.length > 0) ? geoAreas : [cityName];
  const geoAreasStr = geoAreasList.join(', ');
  const geoMode2 = geoMode || 'comunale';
  let geoInstruction = '';
  if(geoMode2 === 'nazionale' || geoMode2 === 'internazionale'){
    geoInstruction = 'Le keyword NON devono contenere riferimenti geografici. Sono keyword generiche cercate a livello nazionale. Il targeting geografico è solo nella campagna Google Ads.';
  } else if(geoAreas && geoAreas.length > 0){
    geoInstruction = `Le keyword DEVONO includere esplicitamente i nomi di questi comuni: ${geoAreasStr}. Distribuisci le keyword uniformemente tra i comuni. Esempio: "infissi ${geoAreasList[0]}", "porte ${geoAreasList[1]||geoAreasList[0]}", ecc.`;
  } else if(geoMode2 === 'comunale'){
    geoInstruction = `Le keyword devono includere il comune di ${cityName}.`;
  } else if(geoMode2 === 'provinciale'){
    geoInstruction = `Le keyword devono includere i principali comuni della provincia di ${provincia||cityName}.`;
  } else {
    geoInstruction = `Le keyword devono riferirsi all'area geografica di ${cityName} e dintorni.`;
  }
  
  // B2B/B2C competitor instruction
  const bizTypeInstr = bizType === 'b2b' ? 'I competitor devono essere ESCLUSIVAMENTE aziende B2B che vendono ad altre aziende, NON negozi al dettaglio o siti consumer.' :
    bizType === 'b2c' ? 'I competitor devono essere ESCLUSIVAMENTE aziende B2C che vendono a consumatori finali, NON grossisti o fornitori B2B.' :
    'I competitor possono essere sia B2B che B2C.';

  const prompt = `Sei un esperto SEO e Google Ads. Analizza il brand: "${company}" (sito: ${website}).
SEDE ESATTA: Comune di ${cityName}, Provincia di ${provincia||''}, ${locationFull}.
${settoreDesc}
TARGETING GEOGRAFICO: ${geoInstruction}
COMPETITOR: ${bizTypeInstr} Suggerisci competitor reali operanti nella regione ${locationFull.split(',').pop().trim()||'italiana'} e nelle zone limitrofe. Come minimo includi competitor regionali.
ATTENZIONE: keyword e competitor ESCLUSIVAMENTE pertinenti al settore "${settore||'indicato'}". NON suggerire keyword di altri settori.
Il brand ${bizDesc[bizType] || bizDesc['b2c']}.
Rilevanza geografica del brand: ${rilLabels}.
Visibilita da analizzare (da dove lo cercano i clienti): ${visLabels}.

REGOLE KEYWORD:
- Le keyword DEVONO riflettere la visibilita da analizzare
- Se visibilita include "comunale": inserisci il nome del comune reale del brand nelle keyword
- Se visibilita include "provinciale": inserisci il nome della provincia nelle keyword
- Se visibilita include "multiprovinciale": usa province limitrofe della stessa regione e province di confine delle regioni adiacenti
- Se visibilita include "regionale": usa il nome della regione nelle keyword
- Se visibilita include "multiregionale": usa la regione del brand e le regioni confinanti
- Se visibilita include "nazionale": keyword generiche senza geo
- Se visibilita include "internazionale": keyword in inglese o multilingua
- Mescola i livelli geo scelti in modo proporzionale tra le keyword

REGOLE COMPETITOR:
- I competitor devono corrispondere alla rilevanza geografica del brand
- Per rilevanza locale/provinciale: competitor locali della stessa zona
- Per rilevanza regionale: competitor regionali
- Per rilevanza nazionale: competitor nazionali

Rispondi SOLO con JSON valido (nessun testo, nessun markdown):
{
  "company": "nome brand",
  "industry": "settore",
  "location": "citta e regione reale del brand",
  "website": "${website}",
  "suggestedKeywords": [
    {
      "kw": "keyword con geo appropriata",
      "volume": <int mensile realistico>,
      "cpc": <float>,
      "competition": "alta|media|bassa",
      "intent": "informazionale|navigazionale|commerciale|transazionale",
      "geoLevel": "comunale|provinciale|multiprovinciale|regionale|multiregionale|nazionale|internazionale",
      "reason": "perche e rilevante in 1 frase"
    }
  ],
  "suggestedCompetitors": [
    {
      "name": "nome competitor",
      "domain": "dominio",
      "geoLevel": "locale|regionale|nazionale",
      "reason": "perche e un competitor diretto in 1 frase"
    }
  ]
}
Genera esattamente ${n} keyword e ${nc} competitor. Dati realistici.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': usedKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: traduciErroreAnthropic(data.error) });
    let raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    if (!raw.endsWith('}')) {
      const lb = raw.lastIndexOf('}');
      if (lb > 0) raw = raw.substring(0, lb + 1);
      const opens = (raw.match(/\[/g)||[]).length - (raw.match(/\]/g)||[]).length;
      for (let i = 0; i < opens; i++) raw += ']';
      const openB = (raw.match(/\{/g)||[]).length - (raw.match(/\}/g)||[]).length;
      for (let i = 0; i < openB; i++) raw += '}';
    }
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: traduciErroreAnthropic(err) });
  }
});

// ── Serper.dev: ricerca posizione organica reale nella SERP di Google ──
const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

// normalizza un dominio per il confronto (toglie protocollo, www, path)
function normDomain(u) {
  if (!u) return '';
  try {
    let s = u.toString().trim().toLowerCase();
    s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
    s = s.split('/')[0].split('?')[0];
    return s;
  } catch (e) { return ''; }
}

// interroga Serper per UNA keyword e ritorna la posizione del dominio target (o null)
async function serperPosition(keyword, targetDomain, gl, hl, location) {
  const tgt = normDomain(targetDomain);
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: keyword, gl: gl || 'it', hl: hl || 'it', location: location || 'Italy', num: 100 })
  });
  if (!r.ok) throw new Error('serper http ' + r.status);
  const j = await r.json();
  const organic = Array.isArray(j.organic) ? j.organic : [];
  let found = null;
  for (const item of organic) {
    const d = normDomain(item.link || item.domain || '');
    if (tgt && d && (d === tgt || d.endsWith('.' + tgt) || tgt.endsWith('.' + d))) {
      found = { position: item.position || null, url: item.link || '', title: item.title || '' };
      break;
    }
  }
  return found; // null se non trovato tra i risultati
}

// interroga Serper per tutte le keyword selezionate; resiliente ai fallimenti
async function buildOrganicSerp(selectedKeywords, website, geo) {
  if (!SERPER_API_KEY) return { enabled: false, reason: 'no_key', results: [] };
  const tgt = normDomain(website);
  if (!tgt) return { enabled: false, reason: 'no_website', results: [] };
  const kws = (selectedKeywords || []).map(k => k.kw).filter(Boolean).slice(0, 30);
  const results = [];
  for (const kw of kws) {
    try {
      const hit = await serperPosition(kw, website, geo?.gl, geo?.hl, geo?.location);
      results.push({ kw, position: hit ? hit.position : null, url: hit ? hit.url : '', found: !!hit });
    } catch (e) {
      results.push({ kw, position: null, url: '', found: false, error: true });
    }
  }
  return { enabled: true, target: tgt, results };
}

// STEP 2: analisi completa
app.post('/api/analyze', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { company, website, city, comune, provincia, settore, bizType, rilevanza, visibilita, selectedKeywords, selectedCompetitors, companyInfo } = req.body;
  if (!company) return res.status(400).json({ error: 'company mancante' });
  const usedKey2 = getApiKey(req);
  if (!usedKey2) return res.status(500).json({ error: 'Nessuna chiave API configurata. Effettua il logout e accedi di nuovo inserendo la tua chiave API.' });

  const kwList = selectedKeywords.map(k => `"${k.kw}" (vol ~${k.volume}/mese, CPC EUR${k.cpc}, comp: ${k.competition}, intento: ${k.intent})`).join('; ');
  const compList = selectedCompetitors.map(c => `${c.name} (${c.domain})`).join(', ');

  const cityRef = comune || city || companyInfo?.location || company;
  const locationRef = [comune, provincia].filter(Boolean).join(', ') || city || companyInfo?.location || company;
  const settoreRef = settore || companyInfo?.industry || '';
  const prompt = `Sei un esperto SEO e digital marketing. Analizza il brand: "${company}" (sito: ${website}).
SEDE ESATTA: Comune di ${cityRef}, ${locationRef}.
SETTORE: ${settoreRef} — analizza SOLO keyword e competitor pertinenti a questo settore specifico.
ATTENZIONE: NON usare keyword o competitor di altri settori o zone geografiche non correlate a ${cityRef}.
Tipo business: ${bizType}. Rilevanza: ${(rilevanza||[]).join(', ')}. Visibilita analizzata: ${(visibilita||[]).join(', ')}.
Settore: ${companyInfo?.industry||''}. Sede: ${companyInfo?.location||''}.

ISTRUZIONI RICERCA GBP E SOCIAL (OBBLIGATORIE — segui alla lettera):

REGOLA FONDAMENTALE GBP: imposta SEMPRE "present: true". Per un'azienda con sede fisica la scheda Google Business esiste praticamente sempre, anche se non verificata. Se non riesci a stimare con certezza i dati reali, fornisci stime realistiche per il settore e la zona: rating tra 4.0 e 4.6, recensioni tra 10 e 80, foto/orari presenti. Nelle note specifica se la stima è basata sul settore/zona (es. "stima basata su aziende similari nella zona"). NON usare MAI "present: false".

0. HOMEPAGE E LINK DIRETTI: prima di tutto cerca nella homepage di ${website} link diretti a Google Maps o Google Business Profile (es. maps.google.com, g.page, goo.gl/maps). Se trovi un link Maps nella homepage, la GBP ESISTE — metti "present: true" e copia l'URL trovato in gbpUrl.

1. FOOTER DEL SITO: prima di tutto analizza il footer di ${website}. Li trovi spesso: ragione sociale ufficiale completa, P.IVA, indirizzo preciso, numeri di telefono, link diretti ai profili social ufficiali. Questi dati sono piu affidabili del solo nome commerciale.

2. VARIANTI DEL NOME DA CERCARE (cercale tutte):
   - Nome esatto: "${company}"
   - Con apostrofo: es. "Giab's" se il nome e "Giabs"
   - Senza apostrofo: es. "Giabs" se il nome e "Giab's"  
   - Forma abbreviata: prime 1-2 parole del nome
   - Ragione sociale completa: es. "Rossi Mario Snc", "Carletti Serramenti Srl"
   - Con articolo: "I Serramenti Carletti", "Lo Studio Rossi"
   - In inglese/dialetto se applicabile

3. RICERCA GBP — la scheda è SEMPRE present:true:
   - Nome simile al ${company} + stessa citta/provincia = PRESENTE (usa dati reali)
   - P.IVA o indirizzo corrispondente = PRESENTE (usa dati reali)
   - Nome leggermente diverso ma stesso settore e zona = PRESENTE (segnala variante nelle note)
   - Scheda non verificata ma esistente = PRESENTE (usa dati reali)
   - Se non rintracciabile = PRESENTE comunque con stime realistiche del settore/zona (rating 4.0-4.6, recensioni 10-80) e nota "stima basata su aziende similari nella zona"

4. RICERCA SOCIAL — stessa logica permissiva:
   - Controlla PRIMA i link nel footer del sito — sono i piu affidabili
   - Cerca per nome esatto e varianti su Facebook, Instagram, LinkedIn, YouTube, TikTok
   - Pagina con pochi follower o non aggiornata = "present: true" con "active: false"

5. NOTE OBBLIGATORIE: scrivi sempre nelle note GBP come hai trovato la scheda (es. "trovato come Giab's Abbigliamento su Google Maps, 127 recensioni") o perche non l'hai trovata.

Keyword selezionate (analizza ESATTAMENTE queste): ${kwList}
Competitor selezionati (analizza ESATTAMENTE questi): ${compList}

Rispondi SOLO con JSON valido (nessun testo, nessun markdown):
{
  "company": "nome brand",
  "industry": "settore",
  "location": "citta e regione",
  "website": "${website}",
  "overallScore": <0-100>,
  "keywords": [
    {
      "kw": "keyword esatta",
      "volume": <int>,
      "cpc": <float>,
      "competition": "alta|media|bassa",
      "intent": "informazionale|navigazionale|commerciale|transazionale",
      "aiRank": "ottimo|buono|discreto|scarso",
      "trend": "crescita|stabile|calo",
      "trendData": [<12 interi 10-90 con variazioni mensili realistiche>],
      "googleTrendsUrl": "https://trends.google.it/trends/explore?q=KEYWORD_ENCODED&geo=IT"
    }
  ],
  "aiVisibility": [
    { "source": "ChatGPT", "probability": <0-100>, "note": "breve nota 5-8 parole" },
    { "source": "Perplexity", "probability": <0-100>, "note": "breve nota 5-8 parole" },
    { "source": "Google AI Overview", "probability": <0-100>, "note": "breve nota 5-8 parole" },
    { "source": "Claude", "probability": <0-100>, "note": "breve nota 5-8 parole" },
    { "source": "Gemini", "probability": <0-100>, "note": "breve nota 5-8 parole" }
  ],
  "dimensions": [
    { "name": "Autorita dominio", "score": <0-100>, "tooltip": "spiegazione breve" },
    { "name": "Presenza brand", "score": <0-100>, "tooltip": "spiegazione breve" },
    { "name": "Contenuto AI-friendly", "score": <0-100>, "tooltip": "spiegazione breve" },
    { "name": "E-E-A-T", "score": <0-100>, "tooltip": "spiegazione breve" },
    { "name": "Schema markup", "score": <0-100>, "tooltip": "spiegazione breve" },
    { "name": "Citazioni web", "score": <0-100>, "tooltip": "spiegazione breve" }
  ],
  "social": [
    { "platform": "Facebook", "present": true, "followers": <int o null>, "active": true, "score": <0-100>, "note": "breve nota", "url": "url profilo o null" },
    { "platform": "Instagram", "present": true, "followers": <int o null>, "active": true, "score": <0-100>, "note": "breve nota", "url": "url profilo o null" },
    { "platform": "LinkedIn", "present": false, "followers": null, "active": false, "score": <0-100>, "note": "breve nota", "url": "url profilo o null" },
    { "platform": "YouTube", "present": false, "followers": null, "active": false, "score": <0-100>, "note": "breve nota", "url": "url profilo o null" },
    { "platform": "TikTok", "present": false, "followers": null, "active": false, "score": <0-100>, "note": "breve nota", "url": "url profilo o null" }
  ],
  "gbp": {
    "present": true,
    "score": <0-100>,
    "rating": <float 1-5>,
    "reviews": <int>,
    "photosPresent": true,
    "hoursPresent": true,
    "postsActive": false,
    "keywordsInDescription": false,
    "gbpUrl": "https://www.google.com/maps/search/COMPANY_NAME+LOCATION",
    "notes": "analisi GBP 1-2 frasi"
  },
  "reputation": {
    "averageRating": <float 1-5 media tra tutte le piattaforme>,
    "totalReviews": <int totale recensioni sommate>,
    "sentiment": "positivo|neutro|negativo",
    "summary": "2-3 frasi sulla reputazione online del brand in linguaggio semplice per il cliente",
    "sources": [
      { "name": "Google Maps", "rating": <float>, "count": <int>, "url": "url diretto alle recensioni Google" },
      { "name": "Trustpilot", "rating": <float>, "count": <int>, "url": "url profilo Trustpilot se trovato" },
      { "name": "Facebook", "rating": <float>, "count": <int>, "url": "" }
    ]
  },
  "competitors": [
    { "name": "nome esatto", "domain": "dominio esatto", "overallScore": <0-100>, "strengths": "UN punto di forza SPECIFICO e concreto di questo competitor (max 12 parole, niente frasi generiche tipo 'buona presenza online')", "weaknesses": "UNA debolezza SPECIFICA e concreta sfruttabile dal cliente (max 12 parole, niente genericita)" }
  ],
  "quickWins": [
    { "title": "titolo semplice senza acronimi tecnici", "effort": "basso|medio", "impact": "alto|medio", "timeframe": "giorni|settimane", "description": "Spiegazione in linguaggio semplice, comprensibile da un imprenditore non esperto di digitale. Evita acronimi come SEO, GBP, CTR, CPC, SERP. Spiega cosa fare concretamente e perche porta beneficio al business in 2-3 frasi." }
  ],
  "recommendations": [
    { "priority": "alta|media|bassa", "title": "titolo chiaro senza acronimi tecnici", "body": "Spiegazione concreta in linguaggio semplice. Se usi un termine tecnico, spiegalo subito tra parentesi. Descrivi il beneficio pratico per il business in 2-3 frasi.", "type": "content|technical|authority|ai|social|local" }
  ],
  "googleAds": {
    "monthlyClicksNeeded": <numero clic mensili da Ads per compensare le keyword con aiRank "scarso" o "discreto", calcolato come somma di (volume * 0.04) per quelle keyword>,
    "monthlyCost": <costo Ads mensile EUR = somma per ogni keyword non presidiata di (volume * 0.04 * cpc)>,
    "annualCost": <monthlyCost * 12>,
    "scenarios": [
      { "level": "basso", "monthlyBudget": <30% di monthlyCost>, "monthlyClicks": <numero realistico>, "monthlyContacts": <stima clic * 0.05>, "note": "copertura minima delle keyword pi\u00f9 strategiche" },
      { "level": "medio", "monthlyBudget": <70% di monthlyCost>, "monthlyClicks": <numero realistico>, "monthlyContacts": <stima clic * 0.05>, "note": "copertura della maggior parte delle keyword non presidiate" },
      { "level": "alto", "monthlyBudget": <monthlyCost intero>, "monthlyClicks": <monthlyClicksNeeded>, "monthlyContacts": <stima clic * 0.05>, "note": "copertura totale: ogni ricerca persa viene intercettata con Ads" }
    ],
    "seoInvestmentRange": { "min": <stima realistica EUR investimento iniziale SEO+AI per il settore/zona, tipicamente 3000-8000>, "max": <stima realistica EUR investimento massimo SEO+AI>, "note": "investimento one-shot iniziale per impostare strategia SEO e AI" },
    "breakEvenMonths": <numero mesi entro cui l'investimento SEO+AI viene ripagato dal risparmio Ads, calcolato come (seoInvestmentRange.min) / monthlyCost arrotondato>,
    "commercialMessage": "frase commerciale di 2-3 righe che evidenzia il confronto tra costo Ads annuo e investimento SEO+AI one-shot, con tono diretto da agente commerciale che convince un imprenditore. Esempio: 'Compensare la visibilit\u00e0 persa con Google Ads ti costerebbe X EUR/anno. Investire una volta sola Y EUR in SEO e AI ripaga in Z mesi, e dopo continua a generare contatti gratis ogni mese.'",
    "keywordBreakdown": [
      { "kw": "<keyword>", "volume": <volume>, "cpc": <cpc>, "monthlyClicks": <volume*0.04 arrotondato>, "monthlyCost": <volume*0.04*cpc arrotondato>, "annualCost": <monthlyCost*12 arrotondato> }
    ]
  },
  "usefulLinks": [
    { "label": "Google Search Console", "url": "https://search.google.com/search-console", "icon": "ti-brand-google", "desc": "Monitora le performance di ricerca" },
    { "label": "Google Analytics", "url": "https://analytics.google.com", "icon": "ti-chart-line", "desc": "Analisi traffico sito" },
    { "label": "SEMrush", "url": "https://www.semrush.com/analytics/overview/?q=${website}", "icon": "ti-chart-bar", "desc": "Analisi SEO approfondita" },
    { "label": "Moz DA Checker", "url": "https://moz.com/domain-analysis?site=${website}", "icon": "ti-award", "desc": "Domain Authority del sito" },
    { "label": "PageSpeed", "url": "https://pagespeed.web.dev/report?url=${website}", "icon": "ti-bolt", "desc": "Velocita e performance sito" }
  ]
}
Analizza ESATTAMENTE keyword e competitor forniti. 6 quick wins, 5 raccomandazioni. Dati realistici. Per "googleAds": considera SOLO le keyword con aiRank "scarso" o "discreto" (le keyword non presidiate organicamente). Per ognuna di queste calcola clic = volume*0.04 (CTR Ads stimato 4%), costo = clic*cpc. La sezione keywordBreakdown deve contenere ESCLUSIVAMENTE queste keyword non presidiate, non tutte. Stima seoInvestmentRange realistica per il settore/zona dell'azienda. commercialMessage deve essere persuasivo da agente commerciale, max 3 righe.
QUALITA TESTI BENCHMARK: per ogni competitor, strengths e weaknesses devono essere SPECIFICI e DIVERSI tra i vari competitor — niente frasi ripetute o intercambiabili. Evita formule generiche ("buona presenza", "sito da migliorare"); cita l'aspetto concreto (es. "molte recensioni Google locali", "nessun blog ne contenuti aggiornati"). quickWins e recommendations non devono ripetere lo stesso concetto: ogni voce affronta un aspetto distinto.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': usedKey2, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: traduciErroreAnthropic(data.error) });
    let raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    if (!raw.endsWith('}')) {
      const lb = raw.lastIndexOf('}');
      if (lb > 0) raw = raw.substring(0, lb + 1);
      const opens = (raw.match(/\[/g)||[]).length - (raw.match(/\]/g)||[]).length;
      for (let i = 0; i < opens; i++) raw += ']';
      const openB = (raw.match(/\{/g)||[]).length - (raw.match(/\}/g)||[]).length;
      for (let i = 0; i < openB; i++) raw += '}';
    }
    const parsed=JSON.parse(raw);
    // Mod 3: posizione organica reale nella SERP (Serper.dev) — non blocca il report se fallisce
    try {
      const locationFull = [comune, provincia].filter(Boolean).join(', ') || city || 'Italy';
      parsed.organicSerp = await buildOrganicSerp(selectedKeywords, website, { gl: 'it', hl: 'it', location: locationFull });
    } catch (e) {
      parsed.organicSerp = { enabled: false, reason: 'error', results: [] };
    }
    const _tok=req.headers['x-session-token'];const _sess=_tok?sessions.get(_tok):null;if(_sess)logReport(_sess,req.body,parsed.overallScore||0);res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: traduciErroreAnthropic(err) });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ SEO AI Tool v4 avviato su http://localhost:${PORT}`);
  console.log(`🔑 Password agenti: ${agentPassword}`);
  console.log(`🛡️  Password admin:  ${ADMIN_PASSWORD}\n`);
  initDB();
});
