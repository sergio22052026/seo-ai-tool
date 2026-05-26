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
    const r = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    clearTimeout(timeout);
    res.json({ ok: r.ok || r.status < 400, status: r.status });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// STEP 1: suggerimenti
app.post('/api/suggest', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { company, website, city, comune, provincia, settore, kwCount, bizType, rilevanza, visibilita, geoAreas, geoMode, geoRadius } = req.body;
  if (!company) return res.status(400).json({ error: 'company mancante' });
  const usedKey = getApiKey(req);
  if (!usedKey) return res.status(500).json({ error: 'Nessuna chiave API configurata. Effettua il logout e accedi di nuovo inserendo la tua chiave API.' });

  const n = Math.min(Math.max(parseInt(kwCount) || 5, 1), 15);

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
Genera esattamente ${Math.min(n * 2, 30)} keyword e 10 competitor. Dati realistici.`;

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

ISTRUZIONI RICERCA GBP E SOCIAL (segui scrupolosamente):
1. FOOTER DEL SITO: analizza sempre il footer di ${website} dove spesso compaiono ragione sociale ufficiale, P.IVA, indirizzo, link social ufficiali. Usa questi dati per trovare la presenza digitale corretta.
2. VARIANTI DEL NOME: cerca GBP e profili social con varianti del nome (apostrofi es. "Giab's", abbreviazioni, forma estesa, ragione sociale completa). Non dichiarare "assente" se hai trovato una variante simile.
3. RICERCA GBP: cerca su Google Maps con: nome esatto, varianti nome, ragione sociale da footer, indirizzo esatto. Se trovi risultati simili al nome considera "present: true" e segnalo nelle note.
4. RICERCA SOCIAL: cerca su Facebook, Instagram, LinkedIn per nome esatto E varianti. Controlla i link nel footer del sito — spesso puntano direttamente ai profili ufficiali.
5. Se non sei certo della presenza, scrivi nelle note la variante trovata (es. "trovato come Giab's su Google Maps").

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
  "competitors": [
    { "name": "nome esatto", "domain": "dominio esatto", "overallScore": <0-100>, "strengths": "punto di forza", "weaknesses": "punto debole" }
  ],
  "quickWins": [
    { "title": "titolo semplice senza acronimi tecnici", "effort": "basso|medio", "impact": "alto|medio", "timeframe": "giorni|settimane", "description": "Spiegazione in linguaggio semplice, comprensibile da un imprenditore non esperto di digitale. Evita acronimi come SEO, GBP, CTR, CPC, SERP. Spiega cosa fare concretamente e perche porta beneficio al business in 2-3 frasi." }
  ],
  "recommendations": [
    { "priority": "alta|media|bassa", "title": "titolo chiaro senza acronimi tecnici", "body": "Spiegazione concreta in linguaggio semplice. Se usi un termine tecnico, spiegalo subito tra parentesi. Descrivi il beneficio pratico per il business in 2-3 frasi.", "type": "content|technical|authority|ai|social|local" }
  ],
  "usefulLinks": [
    { "label": "Google Search Console", "url": "https://search.google.com/search-console", "icon": "ti-brand-google", "desc": "Monitora le performance di ricerca" },
    { "label": "Google Analytics", "url": "https://analytics.google.com", "icon": "ti-chart-line", "desc": "Analisi traffico sito" },
    { "label": "SEMrush", "url": "https://www.semrush.com/analytics/overview/?q=${website}", "icon": "ti-chart-bar", "desc": "Analisi SEO approfondita" },
    { "label": "Moz DA Checker", "url": "https://moz.com/domain-analysis?site=${website}", "icon": "ti-award", "desc": "Domain Authority del sito" },
    { "label": "PageSpeed", "url": "https://pagespeed.web.dev/report?url=${website}", "icon": "ti-bolt", "desc": "Velocita e performance sito" }
  ]
}
Analizza ESATTAMENTE keyword e competitor forniti. 4 quick wins, 5 raccomandazioni. Dati realistici.`;

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
    const parsed=JSON.parse(raw);const _tok=req.headers['x-session-token'];const _sess=_tok?sessions.get(_tok):null;if(_sess)logReport(_sess,req.body,parsed.overallScore||0);res.json(parsed);
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
