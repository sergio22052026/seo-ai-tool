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

app.post('/api/analyze', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { company, lang, kwCount } = req.body;
  if (!company) return res.status(400).json({ error: 'company mancante' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key Anthropic non configurata.' });

  const n = parseInt(kwCount) || 5;

  const prompt = `Sei un esperto SEO, Google Ads e digital marketing. Analizza il brand/sito: "${company}" nella lingua "${lang || 'it'}".
Rispondi SOLO con JSON valido (nessun testo, nessun markdown):
{
  "company": "nome brand",
  "industry": "settore",
  "website": "url sito",
  "overallScore": <0-100>,
  "keywords": [
    { "kw": "keyword", "volume": <int>, "cpc": <float>, "competition": "alta|media|bassa", "intent": "informazionale|navigazionale|commerciale|transazionale", "aiRank": "ottimo|buono|discreto|scarso", "trend": "crescita|stabile|calo", "trendData": [<12 interi 0-100 che simulano il trend mensile ultimi 12 mesi>] }
  ],
  "aiVisibility": [
    { "source": "ChatGPT", "probability": <0-100> },
    { "source": "Perplexity", "probability": <0-100> },
    { "source": "Google AI Overview", "probability": <0-100> },
    { "source": "Claude", "probability": <0-100> },
    { "source": "Gemini", "probability": <0-100> }
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
    { "platform": "Facebook", "present": true|false, "followers": <int o null>, "active": true|false, "score": <0-100>, "note": "breve nota" },
    { "platform": "Instagram", "present": true|false, "followers": <int o null>, "active": true|false, "score": <0-100>, "note": "breve nota" },
    { "platform": "LinkedIn", "present": true|false, "followers": <int o null>, "active": true|false, "score": <0-100>, "note": "breve nota" },
    { "platform": "YouTube", "present": true|false, "followers": <int o null>, "active": true|false, "score": <0-100>, "note": "breve nota" },
    { "platform": "TikTok", "present": true|false, "followers": <int o null>, "active": true|false, "score": <0-100>, "note": "breve nota" }
  ],
  "gbp": {
    "present": true|false,
    "score": <0-100>,
    "rating": <float 1-5 o null>,
    "reviews": <int o null>,
    "photosPresent": true|false,
    "hoursPresent": true|false,
    "postsActive": true|false,
    "keywordsInDescription": true|false,
    "notes": "breve analisi GBP"
  },
  "competitors": [
    { "name": "nome competitor", "domain": "dominio", "overallScore": <0-100>, "strengths": "punto di forza principale", "weaknesses": "punto debole principale" }
  ],
  "quickWins": [
    { "title": "titolo azione", "effort": "basso|medio", "impact": "alto|medio", "timeframe": "giorni|settimane", "description": "spiegazione 1-2 frasi" }
  ],
  "recommendations": [
    { "priority": "alta|media|bassa", "title": "titolo", "body": "spiegazione 1-2 frasi", "type": "content|technical|authority|ai|social|local" }
  ]
}
Genera esattamente ${n} keyword pertinenti, 3 competitor realistici, 4 quick wins, 5 raccomandazioni. Dati realistici basati su ciò che sai del brand.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: 'Errore analisi: ' + err.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ SEO AI Tool v2 avviato su http://localhost:${PORT}`);
  console.log(`🔑 Password agenti: ${agentPassword}`);
  console.log(`🛡️  Password admin:  ${ADMIN_PASSWORD}\n`);
});
