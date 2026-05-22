const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin-super-2025';
let agentPassword = process.env.ACCESS_PASSWORD || 'agenti2025';

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
  const { password } = req.body;
  if (!password || password !== agentPassword) return res.status(401).json({ error: 'Password errata' });
  const token = generateToken();
  sessions.set(token, { createdAt: Date.now(), role: 'agent' });
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
  const { company, website, kwCount, bizType, rilevanza, visibilita } = req.body;
  if (!company) return res.status(400).json({ error: 'company mancante' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key Anthropic non configurata.' });

  const n = Math.min(Math.max(parseInt(kwCount) || 5, 1), 15);

  const bizDesc = {
    'b2c': 'vende direttamente a consumatori finali (B2C)',
    'b2b': 'vende ad altre aziende (B2B)',
    'both': 'vende sia a consumatori finali che ad aziende (B2C + B2B)'
  };

  const geoLabels = {
    'comunale': 'comunale (keyword con nome del comune)',
    'provinciale': 'provinciale (keyword con nome della provincia)',
    'multiprovinciale': 'multiprovinciale (keyword che coprono province limitrofe della stessa regione e province di confine delle regioni adiacenti)',
    'regionale': 'regionale (keyword con nome della regione)',
    'multiregionale': 'multiregionale (keyword che coprono la regione del brand piu le regioni geograficamente adiacenti)',
    'nazionale': 'nazionale (keyword generiche senza geo, targeting solo in campagna)',
    'internazionale': 'internazionale (keyword in piu lingue per clientela estera)'
  };

  const visLabels = (visibilita || []).map(v => geoLabels[v] || v).join(', ');
  const rilLabels = (rilevanza || []).join(', ');

  const prompt = `Sei un esperto SEO e Google Ads. Analizza il brand: "${company}" (sito: ${website}).
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
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
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
    res.status(500).json({ error: 'Errore suggerimenti: ' + err.message });
  }
});

// STEP 2: analisi completa
app.post('/api/analyze', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { company, website, bizType, rilevanza, visibilita, selectedKeywords, selectedCompetitors, companyInfo } = req.body;
  if (!company) return res.status(400).json({ error: 'company mancante' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key Anthropic non configurata.' });

  const kwList = selectedKeywords.map(k => `"${k.kw}" (vol ~${k.volume}/mese, CPC EUR${k.cpc}, comp: ${k.competition}, intento: ${k.intent})`).join('; ');
  const compList = selectedCompetitors.map(c => `${c.name} (${c.domain})`).join(', ');

  const prompt = `Sei un esperto SEO e digital marketing. Analizza il brand: "${company}" (sito: ${website}).
Tipo business: ${bizType}. Rilevanza: ${(rilevanza||[]).join(', ')}. Visibilita analizzata: ${(visibilita||[]).join(', ')}.
Settore: ${companyInfo?.industry||''}. Sede: ${companyInfo?.location||''}.

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
    { "title": "titolo", "effort": "basso|medio", "impact": "alto|medio", "timeframe": "giorni|settimane", "description": "1-2 frasi" }
  ],
  "recommendations": [
    { "priority": "alta|media|bassa", "title": "titolo", "body": "1-2 frasi", "type": "content|technical|authority|ai|social|local" }
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
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
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
    res.status(500).json({ error: 'Errore analisi: ' + err.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ SEO AI Tool v4 avviato su http://localhost:${PORT}`);
  console.log(`🔑 Password agenti: ${agentPassword}`);
  console.log(`🛡️  Password admin:  ${ADMIN_PASSWORD}\n`);
});
