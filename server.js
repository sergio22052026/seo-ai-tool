const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Password admin (solo per te) — cambiabile solo via variabile d'ambiente su Render
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin-super-2025';

// Password agenti — parte da quella d'ambiente, poi modificabile dall'admin via pannello
let agentPassword = process.env.ACCESS_PASSWORD || 'agenti2025';

// Sessioni in memoria — supporta utenti multipli simultanei
// Ogni token è indipendente, scade dopo 8 ore
const sessions = new Map();

// Pulizia automatica sessioni scadute ogni ora
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > 8 * 60 * 60 * 1000) sessions.delete(token);
  }
}, 60 * 60 * 1000);

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isAuthenticated(req) {
  const token = req.headers['x-session-token'];
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > 8 * 60 * 60 * 1000) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function isAdmin(req) {
  const token = req.headers['x-session-token'];
  if (!token) return false;
  const session = sessions.get(token);
  return session && session.role === 'admin' && Date.now() - session.createdAt < 8 * 60 * 60 * 1000;
}

// ── LOGIN agenti ──────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== agentPassword) {
    return res.status(401).json({ error: 'Password errata' });
  }
  const token = generateToken();
  sessions.set(token, { createdAt: Date.now(), role: 'agent' });
  res.json({ token, role: 'agent' });
});

// ── LOGIN admin ───────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Password admin errata' });
  }
  const token = generateToken();
  sessions.set(token, { createdAt: Date.now(), role: 'admin' });
  res.json({ token, role: 'admin' });
});

// ── LOGOUT ────────────────────────────────────────────────────
app.post('/api/logout', (req, res) => {
  const token = req.headers['x-session-token'];
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

// ── INFO ADMIN (utenti attivi, password corrente) ─────────────
app.get('/api/admin/info', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  const now = Date.now();
  const active = [...sessions.values()].filter(s =>
    s.role === 'agent' && now - s.createdAt < 8 * 60 * 60 * 1000
  ).length;
  res.json({
    agentPassword,
    activeSessions: active,
    totalSessions: sessions.size
  });
});

// ── CAMBIA PASSWORD AGENTI ────────────────────────────────────
app.post('/api/admin/change-password', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'La password deve essere di almeno 6 caratteri' });
  }
  agentPassword = newPassword;
  // Invalida tutte le sessioni agenti esistenti
  for (const [token, session] of sessions.entries()) {
    if (session.role === 'agent') sessions.delete(token);
  }
  res.json({ ok: true, message: 'Password aggiornata. Sessioni agenti invalidate.' });
});

// ── ANALISI SEO (protetta agenti + admin) ────────────────────
app.post('/api/analyze', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { company, lang } = req.body;
  if (!company) return res.status(400).json({ error: 'company mancante' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key Anthropic non configurata.' });

  const prompt = `Sei un esperto SEO e Google Ads. Analizza il brand/sito: "${company}" nella lingua "${lang || 'it'}".
Rispondi SOLO con un oggetto JSON valido (nessun testo prima o dopo, nessun markdown):
{
  "company": "nome pulito del brand",
  "industry": "settore",
  "overallScore": <0-100 intero>,
  "keywords": [
    { "kw": "keyword", "volume": <int mensile realistico>, "cpc": <float es 1.20>, "competition": "alta|media|bassa", "intent": "informazionale|navigazionale|commerciale|transazionale", "aiRank": "ottimo|buono|discreto|scarso", "trend": "crescita|stabile|calo" }
  ],
  "aiVisibility": [
    { "source": "ChatGPT", "probability": <0-100> },
    { "source": "Perplexity", "probability": <0-100> },
    { "source": "Google AI Overview", "probability": <0-100> },
    { "source": "Claude", "probability": <0-100> },
    { "source": "Gemini", "probability": <0-100> }
  ],
  "dimensions": [
    { "name": "Autorità dominio", "score": <0-100> },
    { "name": "Presenza brand", "score": <0-100> },
    { "name": "Contenuto AI-friendly", "score": <0-100> },
    { "name": "E-E-A-T", "score": <0-100> },
    { "name": "Schema markup", "score": <0-100> },
    { "name": "Citazioni web", "score": <0-100> }
  ],
  "recommendations": [
    { "priority": "alta|media|bassa", "title": "titolo breve", "body": "spiegazione 1-2 frasi", "type": "content|technical|authority|ai" }
  ]
}
Esattamente 5 keyword pertinenti, 5 raccomandazioni, dati realistici.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
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
  console.log(`\n✅ SEO AI Tool avviato su http://localhost:${PORT}`);
  console.log(`🔑 Password agenti: ${agentPassword}`);
  console.log(`🛡️  Password admin:  ${ADMIN_PASSWORD}\n`);
});
