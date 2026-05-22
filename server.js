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

// STEP 1: suggerimenti keyword e competitor
app.post('/api/suggest', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { company, lang, kwCount, businessType, geoType } = req.body;
  if (!company) return res.status(400).json({ error: 'company mancante' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key Anthropic non configurata.' });

  const n = Math.min(Math.max(parseInt(kwCount) || 5, 1), 15);

  // Istruzioni tipo business
  const bizInstructions = {
    'b2c-locale':    'Business B2C locale. I competitor devono essere locali, nella stessa città/zona.',
    'b2c-regionale': 'Business B2C regionale. I competitor devono essere regionali.',
    'b2b-regionale': 'Business B2B regionale/pluriregionale. I competitor devono essere aziende B2B della stessa area.',
    'b2b-nazionale': 'Business B2B nazionale. I competitor devono essere nazionali.'
  };

  // Istruzioni geolocalizzazione keyword dettagliate
  const geoInstructions = {
    'comunale': `Le keyword DEVONO contenere esplicitamente il nome del COMUNE dove opera il brand (es. "ristorante Ancona", "idraulico Jesi"). Sono keyword per chi cerca quel servizio specificando il comune. Volume tipicamente basso ma conversione alta.`,
    'provinciale': `Le keyword DEVONO contenere esplicitamente il nome della PROVINCIA o città capoluogo di provincia (es. "ristorante provincia Ancona", "hotel Ancona"). Includono anche i comuni limitrofi della stessa provincia.`,
    'multiprovinciale': `Le keyword coprono la provincia del brand PIÙ le province limitrofe della STESSA REGIONE e le province di confine delle REGIONI ADIACENTI. Esempio: brand ad Ancona → keyword che includono "Ancona", "Macerata", "Pesaro", "Fermo" (stessa regione Marche) e le province di confine come "Perugia" (Umbria), "Teramo" (Abruzzo), "Rimini" (Emilia-Romagna). Usa combinazioni come "servizi Ancona Macerata" o nomi delle singole province.`,
    'regionale': `Le keyword DEVONO contenere il nome della REGIONE dove opera il brand (es. "ristorante Marche", "hotel costa adriatica marchigiana"). Per chi cerca a livello regionale senza specificare città.`,
    'multiregionale': `Le keyword coprono la REGIONE del brand PIÙ le REGIONI GEOGRAFICAMENTE ADIACENTI. Esempio: brand nelle Marche → keyword che coprono Marche + Umbria + Abruzzo + Emilia-Romagna + Lazio (regioni confinanti). Usa riferimenti geografici macroregionali (es. "centro Italia", "adriatico", "appennino centrale") o i nomi delle singole regioni adiacenti.`,
    'nazionale': `Le keyword NON contengono riferimenti geografici. Sono keyword generiche cercate a livello nazionale (es. "ristorante pesce fresco", "hotel 4 stelle"). Il targeting geografico è solo nella campagna Google Ads, non nella keyword stessa.`,
    'internazionale': `Le keyword sono in più lingue o senza geo, per intercettare ricerche dall'estero (es. "seafood restaurant Italy", "hotel marche italy"). Utile per brand con clientela turistica internazionale.`
  };

  const bizCtx = bizInstructions[businessType] || bizInstructions['b2c-locale'];
  const geoCtx = geoInstructions[geoType] || geoInstructions['comunale'];

  const prompt = `Sei un esperto SEO e Google Ads. Analizza il brand: "${company}" (lingua: ${lang||'it'}).

TIPO DI BUSINESS: ${bizCtx}
GEOLOCALIZZAZIONE KEYWORD: ${geoCtx}
IMPORTANTE: Non usare mai città o aree geografiche non pertinenti al brand analizzato. Identifica prima dove opera il brand, poi applica la geo corretta.

Rispondi SOLO con JSON valido (nessun testo, nessun markdown):
{
  "company": "nome brand",
  "industry": "settore",
  "location": "città/zona reale del brand",
  "website": "url sito se noto",
  "suggestedKeywords": [
    {
      "kw": "keyword con geo applicata correttamente",
      "volume": <int mensile realistico per quella geo>,
      "cpc": <float>,
      "competition": "alta|media|bassa",
      "intent": "informazionale|navigazionale|commerciale|transazionale",
      "geoLevel": "${geoType}",
      "reason": "perché è rilevante in 1 frase breve"
    }
  ],
  "suggestedCompetitors": [
    {
      "name": "nome competitor",
      "domain": "dominio",
      "reason": "perché è un competitor diretto in 1 frase"
    }
  ]
}
Genera esattamente ${n * 2} keyword suggerite (il doppio di quelle richieste, max 30) e esattamente 10 competitor suggeriti. Dati realistici basati su ciò che sai del brand.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    let raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    // Se il JSON è troncato, prova a ripararlo
    if (!raw.endsWith('}')) {
      const lastBrace = raw.lastIndexOf('}');
      if (lastBrace > 0) raw = raw.substring(0, lastBrace + 1);
      // Chiudi array e oggetto se aperti
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
  const { company, lang, businessType, geoType, selectedKeywords, selectedCompetitors, companyInfo } = req.body;
  if (!company) return res.status(400).json({ error: 'company mancante' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key Anthropic non configurata.' });

  const kwList = selectedKeywords.map(k => `"${k.kw}" (vol. ~${k.volume}/mese, CPC €${k.cpc}, comp: ${k.competition}, intento: ${k.intent})`).join('; ');
  const compList = selectedCompetitors.map(c => `${c.name} (${c.domain})`).join(', ');

  const bizMap = { 'b2c-locale':'B2C locale', 'b2c-regionale':'B2C regionale', 'b2b-regionale':'B2B regionale/pluriregionale', 'b2b-nazionale':'B2B nazionale' };
  const geoMap = { 'comunale':'geo comunale', 'provinciale':'geo provinciale', 'multiprovinciale':'geo multiprovinciale', 'regionale':'geo regionale', 'multiregionale':'geo multiregionale', 'nazionale':'nazionale senza geo', 'internazionale':'internazionale' };

  const prompt = `Sei un esperto SEO e digital marketing. Analizza il brand: "${company}".
Tipo business: ${bizMap[businessType]||businessType}. Geo keyword: ${geoMap[geoType]||geoType}. Lingua: ${lang||'it'}.
Settore: ${companyInfo?.industry||''}. Sede: ${companyInfo?.location||''}. Sito: ${companyInfo?.website||''}.

Keyword selezionate (analizza ESATTAMENTE queste): ${kwList}
Competitor selezionati (analizza ESATTAMENTE questi): ${compList}

Rispondi SOLO con JSON valido (nessun testo, nessun markdown):
{
  "company": "nome brand",
  "industry": "settore",
  "location": "città/zona",
  "website": "url sito",
  "overallScore": <0-100>,
  "keywords": [
    { "kw": "keyword esatta", "volume": <int>, "cpc": <float>, "competition": "alta|media|bassa", "intent": "informazionale|navigazionale|commerciale|transazionale", "aiRank": "ottimo|buono|discreto|scarso", "trend": "crescita|stabile|calo", "trendData": [<12 interi 10-90 con variazioni mensili realistiche>] }
  ],
  "aiVisibility": [
    { "source": "ChatGPT", "probability": <0-100>, "note": "breve nota 5-8 parole" },
    { "source": "Perplexity", "probability": <0-100>, "note": "breve nota 5-8 parole" },
    { "source": "Google AI Overview", "probability": <0-100>, "note": "breve nota 5-8 parole" },
    { "source": "Claude", "probability": <0-100>, "note": "breve nota 5-8 parole" },
    { "source": "Gemini", "probability": <0-100>, "note": "breve nota 5-8 parole" }
  ],
  "dimensions": [
    { "name": "Autorità dominio", "score": <0-100>, "tooltip": "spiegazione breve" },
    { "name": "Presenza brand", "score": <0-100>, "tooltip": "spiegazione breve" },
    { "name": "Contenuto AI-friendly", "score": <0-100>, "tooltip": "spiegazione breve" },
    { "name": "E-E-A-T", "score": <0-100>, "tooltip": "spiegazione breve" },
    { "name": "Schema markup", "score": <0-100>, "tooltip": "spiegazione breve" },
    { "name": "Citazioni web", "score": <0-100>, "tooltip": "spiegazione breve" }
  ],
  "social": [
    { "platform": "Facebook", "present": true, "followers": <int o null>, "active": true, "score": <0-100>, "note": "breve nota" },
    { "platform": "Instagram", "present": true, "followers": <int o null>, "active": true, "score": <0-100>, "note": "breve nota" },
    { "platform": "LinkedIn", "present": false, "followers": null, "active": false, "score": <0-100>, "note": "breve nota" },
    { "platform": "YouTube", "present": false, "followers": null, "active": false, "score": <0-100>, "note": "breve nota" },
    { "platform": "TikTok", "present": false, "followers": null, "active": false, "score": <0-100>, "note": "breve nota" }
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
  ]
}
Analizza ESATTAMENTE le keyword e competitor forniti. 4 quick wins, 5 raccomandazioni. Dati realistici.`;

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
      const lastBrace = raw.lastIndexOf('}');
      if (lastBrace > 0) raw = raw.substring(0, lastBrace + 1);
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
  console.log(`\n✅ SEO AI Tool v3 avviato su http://localhost:${PORT}`);
  console.log(`🔑 Password agenti: ${agentPassword}`);
  console.log(`🛡️  Password admin:  ${ADMIN_PASSWORD}\n`);
});
