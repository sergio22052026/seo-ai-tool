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
    // Mod Y (rev11): colonna report_json per salvare il report COMPLETO (apribile/scaricabile dall'admin).
    await dbClient.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_json TEXT`).catch(()=>{});
    // Mod 106 (rev8): storico ACCESSI agenti (ogni accesso, nome + data/ora)
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS agent_logins (
        id SERIAL PRIMARY KEY,
        agent_name TEXT NOT NULL,
        login_type TEXT DEFAULT 'agente',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Mod D: colonna login_type aggiunta in modo non distruttivo per i DB già esistenti
    await dbClient.query(`ALTER TABLE agent_logins ADD COLUMN IF NOT EXISTS login_type TEXT DEFAULT 'agente'`).catch(()=>{});
    // Mod 8a (rev9): persistenza sessioni — sopravvivono ai riavvii del server (Render free-tier).
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);
    console.log('✅ Database connesso e pronto.');
    flushLoginQueue();
  } catch (e) { console.error('❌ Errore DB:', e.message); dbClient = null; }
}

// Mod B/C: coda accessi in RAM — se il DB non è ancora connesso (risveglio Render), gli accessi
// NON si perdono: vengono accodati e scritti appena il DB è pronto (flushLoginQueue).
const _loginQueue = [];
async function logAgentLogin(agentName, loginType) {
  const name = agentName || 'Agente';
  const type = loginType || 'agente';
  if (!dbClient) {
    _loginQueue.push({ name, type, ts: new Date() });
    console.warn('[LOGIN] accesso in coda — DB non ancora connesso (' + name + ' / ' + type + ')');
    return;
  }
  try {
    await dbClient.query('INSERT INTO agent_logins (agent_name, login_type) VALUES ($1,$2)', [name, type]);
  } catch (e) {
    _loginQueue.push({ name, type, ts: new Date() });
    console.error('[LOGIN] accesso in coda — errore scrittura: ' + e.message);
  }
}
// Mod B: svuota la coda accessi arretrati quando il DB diventa disponibile.
async function flushLoginQueue() {
  if (!dbClient || !_loginQueue.length) return;
  const pending = _loginQueue.splice(0, _loginQueue.length);
  for (const it of pending) {
    try {
      await dbClient.query('INSERT INTO agent_logins (agent_name, login_type, created_at) VALUES ($1,$2,$3)', [it.name, it.type, it.ts]);
    } catch (e) { _loginQueue.push(it); console.error('[LOGIN] flush fallito, ri-accodo: ' + e.message); }
  }
  if (pending.length) console.log('[LOGIN] coda accessi svuotata (' + pending.length + ' arretrati)');
}

async function logReport(session, body, score, fullReport) {
  if (!dbClient) return;
  try {
    const hint = session.apiKey ? session.apiKey.slice(0,12)+'...' : 'admin';
    // Mod Y (rev11): salvo anche il report completo (JSON) per poterlo riaprire/scaricare dall'admin.
    let rjson = null;
    try { rjson = fullReport ? JSON.stringify(fullReport) : null; } catch(_) { rjson = null; }
    await dbClient.query(
      'INSERT INTO reports (agent_name, agent_key_hint, company, website, industry, location, overall_score, keywords_count, report_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [session.agentName||'Agente', hint, body.company||'', body.website||'', body.settore||'', body.city||'', score||0, (body.selectedKeywords||[]).length, rjson]
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
// Mod AK (rev12): profili Senior e Account (entrambi a stime, come l'ex "agente").
// Se le env dedicate non sono impostate, ripiegano sulla password agenti esistente (retrocompatibilità).
const SENIOR_PASSWORD = process.env.SENIOR_PASSWORD || agentPassword;
const ACCOUNT_PASSWORD = process.env.ACCOUNT_PASSWORD || agentPassword;
const DEMO_PASSWORD = process.env.EXPERT_PASSWORD || process.env.DEMO_PASSWORD || 'demo2025';
const DEMO_API_KEY = process.env.EXPERT_API_KEY || process.env.DEMO_API_KEY || ANTHROPIC_API_KEY;

// ── Mod AT (rev12): integrazione Apify per dati Facebook REALI (follower, rating, recensioni) ──
const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
// normalizza un URL Facebook: rifiuta gli short-link /share/ che non contengono il nome pagina
function normalizeFbUrl(u) {
  const s = (u || '').trim();
  if (!s) return null;
  if (/facebook\.com\/share\//i.test(s)) return null; // short-link non risolvibile
  if (!/facebook\.com/i.test(s)) return null;
  return s;
}
// chiama l'Actor apify/facebook-pages-scraper e restituisce {followers, rating, reviewsCount, name} o null
async function apifyFacebookPage(pageUrl) {
  if (!APIFY_TOKEN) return null;
  const url = normalizeFbUrl(pageUrl);
  if (!url) return null;
  const endpoint = 'https://api.apify.com/v2/acts/apify~facebook-pages-scraper/run-sync-get-dataset-items?token=' + encodeURIComponent(APIFY_TOKEN);
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 60000); // 60s max per la lettura pagina
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startUrls: [{ url }], resultsLimit: 1 }),
      signal: ctrl.signal
    });
    clearTimeout(to);
    if (!r.ok) return null;
    const arr = await r.json();
    if (!Array.isArray(arr) || !arr.length) return null;
    const p = arr[0] || {};
    // i campi variano leggermente: provo le chiavi più comuni
    const followers = p.followers ?? p.followersCount ?? p.likes ?? p.fan_count ?? null;
    const rating = p.rating ?? p.pageRating ?? p.overallRating ?? null;
    const reviewsCount = p.reviewsCount ?? p.reviews_count ?? p.ratingCount ?? null;
    const name = p.name ?? p.title ?? p.pageName ?? null;
    if (followers == null && rating == null && reviewsCount == null) return null;
    return { followers, rating, reviewsCount, name, source: 'apify' };
  } catch (e) {
    clearTimeout(to);
    return null;
  }
}

// MOD BA: estrae il logo dal sito del cliente. Prova og:image / link rel=icon nell'HTML; fallback al favicon Google.
async function fetchSiteLogo(website) {
  const url = (website || '').trim();
  if (!url) return null;
  let host = '';
  try { host = new URL(url.startsWith('http') ? url : 'https://' + url).hostname; } catch (_) { return null; }
  const googleFavicon = 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(host) + '&sz=128';
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(url.startsWith('http') ? url : 'https://' + url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AnalyzerPro/1.0)' } });
    clearTimeout(to);
    if (!r.ok) return { logoUrl: googleFavicon, logoSource: 'favicon' };
    const html = await r.text();
    const pick = (re2) => { const m = html.match(re2); return m ? m[1] : null; };
    let logo = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (!logo) logo = pick(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i);
    if (!logo) logo = pick(/<img[^>]+(?:src|data-src)=["']([^"']*logo[^"']*)["']/i);
    if (logo) {
      try { logo = new URL(logo, url.startsWith('http') ? url : 'https://' + url).href; } catch (_) {}
      return { logoUrl: logo, logoSource: 'site' };
    }
    return { logoUrl: googleFavicon, logoSource: 'favicon' };
  } catch (e) {
    clearTimeout(to);
    return { logoUrl: googleFavicon, logoSource: 'favicon' };
  }
}

// MOD AX: calcola uno score 0-100 dai dati reali (follower + rating + recensioni).
function scoreFromRealData(followers, rating, reviewsCount) {
  let s = 20;
  const f = Number(followers) || 0;
  if (f >= 10000) s += 45; else if (f >= 5000) s += 38; else if (f >= 2000) s += 32;
  else if (f >= 1000) s += 26; else if (f >= 500) s += 20; else if (f >= 200) s += 14;
  else if (f >= 50) s += 8; else if (f > 0) s += 4;
  const rt = Number(rating) || 0;
  if (rt >= 4.5) s += 20; else if (rt >= 4) s += 15; else if (rt >= 3.5) s += 10; else if (rt > 0) s += 5;
  const rc = Number(reviewsCount) || 0;
  if (rc >= 500) s += 15; else if (rc >= 100) s += 11; else if (rc >= 30) s += 7; else if (rc > 0) s += 3;
  return Math.max(0, Math.min(100, Math.round(s)));
}

// MOD AX: arricchisce le card social con dati REALI Apify.
// Per profilo 'expert' elabora tutti i social; per gli altri solo Facebook.
async function enrichSocialWithApify(socialArr, profile) {
  if (!APIFY_TOKEN || !Array.isArray(socialArr)) return socialArr;
  const isExpert = (profile === 'expert');
  const tasks = [];
  for (const card of socialArr) {
    const plat = (card.platform || '').toLowerCase();
    const url = card.url;
    if (!url || url === 'null') continue;
    const isFb = plat.includes('facebook');
    // Senior/Account: solo Facebook. Expert: tutti.
    if (!isFb && !isExpert) continue;
    // Attualmente l'Actor implementato è quello Facebook; per gli altri social su Expert
    // si potranno aggiungere Actor dedicati. Per ora arricchiamo Facebook con dati reali.
    if (isFb) {
      tasks.push((async () => {
        const real = await apifyFacebookPage(url);
        if (real && real.followers != null) {
          card.followers = real.followers;
          card.present = true;
          card.active = true;
          card.verified = true;
          card.source = 'apify';
          if (real.rating != null) card.rating = real.rating;
          if (real.reviewsCount != null) card.reviewsCount = real.reviewsCount;
          card.score = scoreFromRealData(real.followers, real.rating, real.reviewsCount);
        }
      })());
    }
  }
  if (tasks.length) { try { await Promise.all(tasks); } catch (_) {} }
  return socialArr;
}



// Mod AO (rev12): validazione email — formato + dominio reale con record MX.
const dns = require('dns').promises;
async function validateEmail(email) {
  const e = (email || '').trim();
  if (!e) return { ok: true, empty: true }; // facoltativa: vuota = ok
  // formato base
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(e)) return { ok: false, reason: 'formato' };
  const domain = e.split('@')[1].toLowerCase();
  try {
    const mx = await dns.resolveMx(domain);
    if (mx && mx.length) return { ok: true, email: e };
    // fallback: alcuni domini ricevono posta via A record
    const a = await dns.resolve(domain).catch(() => null);
    if (a && a.length) return { ok: true, email: e };
    return { ok: false, reason: 'dominio' };
  } catch (err) {
    return { ok: false, reason: 'dominio' };
  }
}


const sessions = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > 8 * 60 * 60 * 1000) { sessions.delete(token); dropSession(token); }
  }
}, 60 * 60 * 1000);

// Mod 8a (rev9): persistenza sessioni su Postgres con cache RAM davanti (write-through).
// isAuthenticated/getApiKey restano SINCRONI (leggono dalla cache); all'avvio la cache viene
// idratata dal DB, così le sessioni sopravvivono ai riavvii del server.
function setSession(token, data) {
  sessions.set(token, data);
  if (dbClient) {
    dbClient.query('INSERT INTO sessions (token, data, created_at) VALUES ($1,$2,$3) ON CONFLICT (token) DO UPDATE SET data=$2, created_at=$3',
      [token, JSON.stringify(data), data.createdAt]).catch(e => console.error('persistSession:', e.message));
  }
}
function dropSession(token) {
  if (dbClient) dbClient.query('DELETE FROM sessions WHERE token=$1', [token]).catch(() => {});
}
async function hydrateSessions() {
  if (!dbClient) return;
  try {
    const cutoff = Date.now() - 8 * 60 * 60 * 1000;
    await dbClient.query('DELETE FROM sessions WHERE created_at < $1', [cutoff]); // pulizia scadute
    const r = await dbClient.query('SELECT token, data, created_at FROM sessions');
    let n = 0;
    for (const row of r.rows) {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      sessions.set(row.token, data);
      n++;
    }
    console.log('[SESSIONS] idratate ' + n + ' sessioni dal database');
  } catch (e) { console.error('hydrateSessions:', e.message); }
}

function generateToken() { return crypto.randomBytes(32).toString('hex'); }
function isAuthenticated(req) {
  const token = req.headers['x-session-token'];
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > 8 * 60 * 60 * 1000) { sessions.delete(token); dropSession(token); return false; }
  return true;
}
function isAdmin(req) {
  const token = req.headers['x-session-token'];
  if (!token) return false;
  const session = sessions.get(token);
  return session && session.role === 'admin' && Date.now() - session.createdAt < 8 * 60 * 60 * 1000;
}

app.post('/api/login', async (req, res) => {
  const { password, apiKey, agentName, profile, email } = req.body;
  // Mod AK (rev12): profilo richiesto (senior | account). Default senior per retrocompatibilità.
  const prof = (profile === 'account') ? 'account' : 'senior';
  const expected = prof === 'account' ? ACCOUNT_PASSWORD : SENIOR_PASSWORD;
  if (!password || password !== expected) return res.status(401).json({ error: 'Password errata' });
  if (!apiKey || !apiKey.startsWith('sk-ant-')) return res.status(401).json({ error: 'Chiave API non valida. Deve iniziare con sk-ant-' });
  // Mod AO (rev12): email facoltativa ma, se presente, deve essere valida (formato + dominio reale).
  const ev = await validateEmail(email);
  if (!ev.ok) return res.status(400).json({ error: ev.reason === 'formato' ? 'Email non valida: controlla il formato (es. nome@dominio.it).' : 'Email non valida: il dominio non risulta esistente o non riceve posta.' });
  const token = generateToken();
  const nm = (agentName||'').trim()||'Agente';
  setSession(token, { createdAt: Date.now(), role: 'agent', apiKey: apiKey.trim(), agentName: nm, profile: prof, email: ev.email || '' });
  logAgentLogin(nm, prof); // Mod AK: registra il profilo (senior/account)
  res.json({ token, role: 'agent', profile: prof, email: ev.email || '' });
});

app.post('/api/login/demo', async (req, res) => {
  const { password, agentName, email } = req.body;
  if (!password || password !== DEMO_PASSWORD) return res.status(401).json({ error: 'Password Expert errata.' });
  if (!DEMO_API_KEY) return res.status(500).json({ error: 'Chiave Expert non configurata. Contatta il responsabile.' });
  // Mod AO (rev12): validazione email facoltativa.
  const ev = await validateEmail(email);
  if (!ev.ok) return res.status(400).json({ error: ev.reason === 'formato' ? 'Email non valida: controlla il formato (es. nome@dominio.it).' : 'Email non valida: il dominio non risulta esistente o non riceve posta.' });
  const token = generateToken();
  setSession(token, { createdAt: Date.now(), role: 'agent', apiKey: DEMO_API_KEY, isDemo: true, agentName: (agentName||'').trim()||'Expert', profile: 'expert', email: ev.email || '' });
  logAgentLogin((agentName||'').trim()||'Expert', 'expert'); // Mod AK: ex 'premium' → 'expert'
  res.json({ token, role: 'agent', profile: 'expert', email: ev.email || '' });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Password admin errata' });
  const token = generateToken();
  setSession(token, { createdAt: Date.now(), role: 'admin' });
  res.json({ token, role: 'admin' });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers['x-session-token'];
  if (token) { sessions.delete(token); dropSession(token); }
  res.json({ ok: true });
});

// Mod AB.1 (rev11): salvataggio report dal front-end DOPO il ricalcolo dello score reale.
app.post('/api/report/save', async (req, res) => {
  const tok = req.headers['x-session-token'];
  const sess = tok ? sessions.get(tok) : null;
  if (!sess) return res.status(401).json({ error: 'Non autorizzato' });
  try {
    const { report, meta } = req.body || {};
    if (!report) return res.status(400).json({ error: 'Report mancante' });
    const score = (typeof report.overallScore === 'number') ? report.overallScore : 0;
    await logReport(sess, meta || {}, score, report);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


app.get('/api/admin/info', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  const now = Date.now();
  const TTL = 8 * 60 * 60 * 1000;
  const activeList = [...sessions.values()].filter(s => s.role === 'agent' && now - s.createdAt < TTL);
  // Mod Z (rev11): oltre al conteggio, restituisco CHI è attivo (nome, tipo, da quanto).
  const activeAgents = activeList.map(s => ({
    name: s.agentName || 'Agente',
    type: s.profile || (s.isDemo ? 'expert' : 'senior'), // Mod AK: profilo reale
    email: s.email || '',
    since: s.createdAt,
    minutes: Math.round((now - s.createdAt) / 60000)
  })).sort((a,b)=> b.since - a.since);
  res.json({ agentPassword, activeSessions: activeList.length, totalSessions: sessions.size, activeAgents });
});

app.post('/api/admin/change-password', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Minimo 6 caratteri' });
  agentPassword = newPassword;
  for (const [token, session] of sessions.entries()) {
    if (session.role === 'agent') { sessions.delete(token); dropSession(token); }
  }
  res.json({ ok: true });
});

// Verifica sito web
// Storico report da DB (solo admin)
app.get('/api/admin/reports', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  if (!dbClient) return res.json({ reports: [], dbEnabled: false });
  try {
    // Mod Y (rev11): NON restituisco report_json nella lista (pesante). Solo metadati + flag has_full.
    const r = await dbClient.query('SELECT id, agent_name, agent_key_hint, company, website, industry, location, overall_score, keywords_count, created_at, (report_json IS NOT NULL) AS has_full FROM reports ORDER BY created_at DESC LIMIT 500');
    res.json({ reports: r.rows, dbEnabled: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Mod Y (rev11): report COMPLETO singolo (per apertura/PDF dall'admin).
app.get('/api/admin/report/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  if (!dbClient) return res.status(503).json({ error: 'DB non disponibile' });
  try {
    const r = await dbClient.query('SELECT report_json FROM reports WHERE id=$1', [req.params.id]);
    if (!r.rows.length || !r.rows[0].report_json) return res.status(404).json({ error: 'Report completo non disponibile' });
    res.json({ report: JSON.parse(r.rows[0].report_json) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/reports', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  if (!dbClient) return res.json({ ok: true });
  try { await dbClient.query('DELETE FROM reports'); res.json({ ok: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// Mod 106 (rev8): storico accessi agenti
app.get('/api/admin/logins', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  if (!dbClient) return res.json({ logins: [], dbEnabled: false });
  try {
    const r = await dbClient.query('SELECT agent_name, login_type, created_at FROM agent_logins ORDER BY created_at DESC LIMIT 500');
    res.json({ logins: r.rows, dbEnabled: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/logins', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
  if (!dbClient) return res.json({ ok: true });
  try { await dbClient.query('DELETE FROM agent_logins'); res.json({ ok: true }); }
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
  const { company, website, city, comune, provincia, settore, kwCount, compCount, bizType, rilevanza, visibilita, geoAreas, geoMode, geoRadius, apiMode } = req.body;
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
    const parsedSuggest = JSON.parse(raw);
    // Mod 108: sostituisco volume/CPC stimati con dati REALI DataForSEO dove disponibili (fallback stima)
    // Mod 118: in demo con apiMode==='stima' si SALTA del tutto DataForSEO (zero consumo credito).
    try {
      if (apiMode === 'stima') {
        if (Array.isArray(parsedSuggest.suggestedKeywords)) parsedSuggest.suggestedKeywords.forEach(k => { k.dataSource = 'ai'; });
        parsedSuggest.keywordDataSource = 'ai';
        console.log('[APIMODE] suggest in modalità STIMA — DataForSEO non interrogato');
      } else if (parsedSuggest && Array.isArray(parsedSuggest.suggestedKeywords)) {
        const en = await enrichKeywordsWithRealData(parsedSuggest.suggestedKeywords);
        parsedSuggest.suggestedKeywords = en.list;
        parsedSuggest.keywordDataSource = en.realUsed ? 'dataforseo' : 'ai';
      }
    } catch (e) { /* in caso di problemi resta la stima AI */ }
    res.json(parsedSuggest);
  } catch (err) {
    res.status(500).json({ error: traduciErroreAnthropic(err) });
  }
});

// ── Serper.dev: ricerca posizione organica reale nella SERP di Google ──
const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

// ════════ Mod 108 (rev8): DataForSEO — volume/CPC/competizione REALI (Italia) ════════
// DATAFORSEO_AUTH = stringa Base64 di "login:password" (già pronta dalla dashboard DataForSEO).
const DATAFORSEO_AUTH = process.env.DATAFORSEO_AUTH || '';
const DFS_LOCATION_CODE = 2380; // Italia
const DFS_LANGUAGE_CODE = 'it';

// Mod 116 (rev8): diagnostica startup — verifica presenza/formato chiavi API senza esporre i valori.
(function logApiKeyStatus() {
  const dfsLen = DATAFORSEO_AUTH.length;
  // Una stringa Base64 di "login:password" decodificata DEVE contenere ":". Verifico senza loggare il contenuto.
  let dfsLooksValid = false;
  try { dfsLooksValid = dfsLen > 0 && Buffer.from(DATAFORSEO_AUTH, 'base64').toString('utf8').includes(':'); } catch (e) {}
  console.log('[API-KEYS] DATAFORSEO_AUTH: ' + (dfsLen ? ('presente (len=' + dfsLen + ', formato Base64 login:password ' + (dfsLooksValid ? 'OK' : 'SOSPETTO — non sembra Base64 di "login:password"') + ')') : 'ASSENTE — volume/CPC useranno sempre la stima AI'));
  console.log('[API-KEYS] SERPER_API_KEY: ' + (SERPER_API_KEY.length ? ('presente (len=' + SERPER_API_KEY.length + ')') : 'ASSENTE — posizioni SERP non verranno rilevate'));
  const _gKey = process.env.GOOGLE_API_KEY || process.env.PAGESPEED_API_KEY || '';
  console.log('[API-KEYS] GOOGLE_API_KEY (PageSpeed/CWV): ' + (_gKey.length ? ('presente (len=' + _gKey.length + ')') : 'ASSENTE — Core Web Vitals useranno valori indicativi, non misurati'));
})();

// Restituisce una mappa { keyword(lowercase): {volume, cpc, competition} } REALE per le keyword passate.
// Se la chiave manca / errore / timeout → ritorna null (il chiamante userà la stima AI come fallback).
async function fetchKeywordVolumes(keywords) {
  if (!DATAFORSEO_AUTH) { console.log('[DFS] skip — DATAFORSEO_AUTH assente'); return null; }
  const kws = [...new Set((keywords || []).map(k => (k || '').toString().trim()).filter(Boolean))].slice(0, 100);
  if (!kws.length) { console.log('[DFS] skip — nessuna keyword da interrogare'); return null; }
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Authorization': 'Basic ' + DATAFORSEO_AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ location_code: DFS_LOCATION_CODE, language_code: DFS_LANGUAGE_CODE, keywords: kws }])
    });
    clearTimeout(to);
    if (!r.ok) { console.log('[DFS] HTTP ' + r.status + ' (' + (r.status === 401 ? 'auth errata — controlla che DATAFORSEO_AUTH sia il Base64 di login:password' : r.status === 402 ? 'credito esaurito' : 'errore') + ') per ' + kws.length + ' kw'); return null; }
    const j = await r.json();
    // DataForSEO espone lo stato anche nel body: status_code 20000 = OK.
    if (j && j.status_code && j.status_code !== 20000) { console.log('[DFS] status_code ' + j.status_code + ': ' + (j.status_message || '')); }
    const task0 = (j.tasks || [])[0] || {};
    if (task0.status_code && task0.status_code !== 20000) { console.log('[DFS] task status_code ' + task0.status_code + ': ' + (task0.status_message || '')); }
    const items = (task0.result) || [];
    if (!items.length) { console.log('[DFS] nessun risultato per ' + kws.length + ' kw'); return null; }
    const map = {};
    for (const it of items) {
      const k = (it.keyword || '').toLowerCase();
      if (!k) continue;
      const comp = (it.competition || '').toString().toLowerCase();
      const compIt = comp === 'high' ? 'alta' : comp === 'medium' ? 'media' : comp === 'low' ? 'bassa' : (it.competition_index != null ? (it.competition_index >= 67 ? 'alta' : it.competition_index >= 34 ? 'media' : 'bassa') : 'media');
      map[k] = {
        volume: (it.search_volume != null ? it.search_volume : null),
        cpc: (it.cpc != null ? +Number(it.cpc).toFixed(2) : null),
        competition: compIt,
        source: 'dataforseo'
      };
    }
    const withVol = Object.keys(map).filter(k => map[k].volume != null).length;
    console.log('[DFS] OK — ' + Object.keys(map).length + '/' + kws.length + ' kw ritornate, ' + withVol + ' con volume valorizzato');
    return Object.keys(map).length ? map : null;
  } catch (e) {
    console.log('[DFS] eccezione: ' + (e && e.name === 'AbortError' ? 'timeout 12s' : (e && e.message || e)));
    return null;
  }
}

// Applica i dati reali DataForSEO a una lista di keyword [{kw, volume, cpc, competition,...}].
// Dove il dato reale esiste, sostituisce volume/cpc/competition e marca source:'dataforseo';
// altrimenti lascia la stima AI e marca source:'ai'.
async function enrichKeywordsWithRealData(kwList) {
  if (!Array.isArray(kwList) || !kwList.length) return { list: kwList, realUsed: false };
  const real = await fetchKeywordVolumes(kwList.map(k => k.kw));
  if (!real) { kwList.forEach(k => { k.dataSource = 'ai'; }); return { list: kwList, realUsed: false }; }
  let realUsed = false;
  kwList.forEach(k => {
    const hit = real[(k.kw || '').toLowerCase()];
    if (hit && hit.volume != null) {
      k.volume = hit.volume;
      if (hit.cpc != null) k.cpc = hit.cpc;
      if (hit.competition) k.competition = hit.competition;
      k.dataSource = 'dataforseo';
      realUsed = true;
    } else {
      k.dataSource = 'ai';
    }
  });
  return { list: kwList, realUsed };
}

// Mod B (rev10): Google Trends REALI via DataForSEO — serie mensile ULTIMI 12 MESI fino al mese corrente.
async function fetchGoogleTrends(keywords) {
  if (!DATAFORSEO_AUTH) { console.log('[TRENDS] skip — DATAFORSEO_AUTH assente'); return null; }
  const kws = [...new Set((keywords || []).map(k => (k || '').toString().trim()).filter(Boolean))].slice(0, 5);
  if (!kws.length) return null;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 19000);
    // finestra: ultimi 12 mesi fino a oggi
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const fmt = d => d.toISOString().slice(0, 10);
    const r = await fetch('https://api.dataforseo.com/v3/keywords_data/google_trends/explore/live', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Authorization': 'Basic ' + DATAFORSEO_AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        location_code: DFS_LOCATION_CODE, language_code: DFS_LANGUAGE_CODE,
        keywords: kws, date_from: fmt(from), date_to: fmt(now), time_range: 'past_12_months', item_types: ['google_trends_graph']
      }])
    });
    clearTimeout(to);
    if (!r.ok) { console.log('[TRENDS] HTTP ' + r.status); return null; }
    const j = await r.json();
    const result = (((j.tasks || [])[0] || {}).result) || [];
    const graph = result.find(x => x && Array.isArray(x.items)) || result[0];
    if (!graph || !Array.isArray(graph.items)) return null;
    const series = graph.items.find(it => it && (it.type === 'google_trends_graph' || Array.isArray(it.data))) || graph.items[0];
    if (!series || !Array.isArray(series.data)) return null;
    const byKw = {}; kws.forEach(k => byKw[k.toLowerCase()] = []);
    const monthsSet = [];
    for (const point of series.data) {
      const ts = point.date_from || point.timestamp;
      let label = '';
      try { const d = ts ? new Date(ts.length > 10 ? ts : ts + 'T00:00:00') : null; if (d) label = d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }); } catch (e) {}
      monthsSet.push(label);
      const vals = point.values || [];
      kws.forEach((k, i) => { byKw[k.toLowerCase()].push(typeof vals[i] === 'number' ? vals[i] : (point.value != null ? point.value : null)); });
    }
    console.log('[TRENDS] OK — ' + monthsSet.length + ' mesi, ' + kws.length + ' kw');
    return { byKw, months: monthsSet, real: true };
  } catch (e) {
    console.log('[TRENDS] eccezione: ' + (e && e.name === 'AbortError' ? 'timeout' : (e && e.message || e)));
    return null;
  }
}

// Mod 116 (rev8): segnale REALE di presenza nelle fonti AI (Google AI Overview / Perplexity).
// Questi motori attingono fortemente ai top risultati di ricerca: verifico via Serper se il dominio
// del cliente compare tra i primi risultati per alcune query → proxy di "citabilità" dalle fonti AI.
// Ritorna { aiOverview: 0-100, perplexity: 0-100, checked: n } oppure null.
async function checkAIPresenceReal(keywords, website, geo) {
  if (!SERPER_API_KEY || !website) return null;
  const tgt = normDomain(website);
  if (!tgt) return null;
  const kws = [...new Set((keywords || []).map(k => (k || '').toString().trim()).filter(Boolean))].slice(0, 6);
  if (!kws.length) return null;
  try {
    const checkOne = async (kw) => {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 6000);
        const r = await fetch('https://google.serper.dev/search', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: kw, gl: (geo && geo.gl) || 'it', hl: (geo && geo.hl) || 'it', location: (geo && geo.location) || 'Italy', num: 10 })
        });
        clearTimeout(to);
        const j = await r.json();
        const org = Array.isArray(j.organic) ? j.organic : [];
        // presente nei primi 10 (le fonti che AI Overview/Perplexity citano più spesso)
        const inTop = org.slice(0, 10).some(o => {
          const d = normDomain(o.link || o.domain || '');
          return d && (d === tgt || d.endsWith('.' + tgt) || tgt.endsWith('.' + d));
        });
        return inTop;
      } catch (e) { return null; }
    };
    const results = await Promise.all(kws.map(k => withTimeout(checkOne(k), 7000, null)));
    const valid = results.filter(v => v !== null);
    if (!valid.length) return null;
    const presentCount = valid.filter(Boolean).length;
    const pct = Math.round((presentCount / valid.length) * 100);
    // AI Overview pesa di più i top organici; Perplexity simile ma leggermente più ampio → piccola differenza
    return { aiOverview: pct, perplexity: Math.min(100, Math.round(pct * 0.95)), checked: valid.length };
  } catch (e) {
    return null;
  }
}

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
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 6000); // timeout per chiamata
  let r;
  try {
    r = await fetch('https://google.serper.dev/search', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword, gl: gl || 'it', hl: hl || 'it', location: location || 'Italy', num: 100 })
    });
  } finally { clearTimeout(to); }
  if (!r.ok) { console.log('[SERPER] HTTP ' + r.status + ' (' + (r.status === 401 || r.status === 403 ? 'API key errata/assente' : r.status === 429 ? 'rate limit / credito esaurito' : 'errore') + ') per kw "' + keyword + '"'); throw new Error('serper http ' + r.status); }
  const j = await r.json();
  const organic = Array.isArray(j.organic) ? j.organic : [];
  // Mod P (rev10): la posizione ORGANICA REALE è l'indice nell'elenco organico (1-based), NON il campo
  // item.position di Serper (che conta anche shopping/local pack/"altri luoghi" in cima → gonfia il numero).
  // Se il dominio compare più volte, prendo la posizione MIGLIORE e conto le occorrenze.
  let found = null;
  let occurrences = 0;
  for (let i = 0; i < organic.length; i++) {
    const item = organic[i];
    const d = normDomain(item.link || item.domain || '');
    if (tgt && d && (d === tgt || d.endsWith('.' + tgt) || tgt.endsWith('.' + d))) {
      occurrences++;
      if (!found) {
        found = { position: i + 1, url: item.link || '', title: item.title || '', serperPosition: item.position || null };
      }
    }
  }
  if (found) found.occurrences = occurrences;
  return found; // null se non trovato tra i risultati organici
}

// interroga Serper per tutte le keyword selezionate; resiliente ai fallimenti
// ════════ Mod 93 (rev8): Core Web Vitals REALI via Google PageSpeed Insights ════════
// Chiave Google condivisa: GOOGLE_API_KEY (preferita) con fallback PAGESPEED_API_KEY.
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.PAGESPEED_API_KEY || '';

function _cruxMetric(m) {
  if (!m) return null;
  const cat = m.category || '';
  const rating = cat === 'FAST' ? 'good' : cat === 'AVERAGE' ? 'needs-improvement' : cat === 'SLOW' ? 'poor' : 'unknown';
  return { value: (typeof m.percentile === 'number' ? m.percentile : null), rating };
}

// SOLO dati di CAMPO (CrUX, utenti reali). Se assenti => present:false. Nessuna stima.
// Mod (rev10): CrUX è sensibile alla forma ESATTA dell'URL. Provo più varianti (https+www, https nudo,
// origin con/senza www) finché una restituisce dati di campo — così "pagespeed lo trova ma il tool no" sparisce.
function _cwvUrlVariants(url) {
  let host = (url || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const bare = host.replace(/^www\./i, '');
  const variants = [
    'https://www.' + bare + '/',
    'https://' + bare + '/',
    'https://www.' + bare,
    'https://' + bare
  ];
  // dedup mantenendo l'ordine
  return [...new Set(variants)];
}
async function _cwvCall(target, strategy) {
  const api = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url='
    + encodeURIComponent(target) + '&strategy=' + strategy
    + '&category=performance&key=' + GOOGLE_API_KEY;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 18000);
  try {
    const r = await fetch(api, { signal: ctrl.signal });
    clearTimeout(to);
    if (!r.ok) return { httpError: r.status };
    const j = await r.json();
    const le = j.loadingExperience;
    const fld = le && le.metrics ? le.metrics : null;
    if (!fld) return { noField: true };
    return { le, fld };
  } catch (e) {
    clearTimeout(to);
    return { aborted: (e && e.name === 'AbortError') };
  }
}
async function fetchCWV(url, strategy) {
  if (!GOOGLE_API_KEY) return { present: false, reason: 'no_key', strategy };
  if (!url) return { present: false, reason: 'no_url', strategy };
  const variants = _cwvUrlVariants(url);
  let lastReason = 'no_field_data';
  for (const target of variants) {
    const res = await _cwvCall(target, strategy);
    if (res.httpError) { console.log('[CWV] ' + strategy + ' HTTP ' + res.httpError + (res.httpError === 403 ? ' (API non abilitata o quota)' : '') + ' su ' + target); lastReason = 'http_' + res.httpError; if (res.httpError === 403 || res.httpError === 429) break; continue; }
    if (res.aborted) { lastReason = 'timeout'; continue; }
    if (res.noField) { lastReason = 'no_field_data'; continue; }
    const le = res.le, fld = res.fld;
    const lcp = _cruxMetric(fld.LARGEST_CONTENTFUL_PAINT_MS);
    const inp = _cruxMetric(fld.INTERACTION_TO_NEXT_PAINT || fld.EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT);
    const cls = _cruxMetric(fld.CUMULATIVE_LAYOUT_SHIFT_SCORE);
    const fcp = _cruxMetric(fld.FIRST_CONTENTFUL_PAINT_MS);
    const ttfb = _cruxMetric(fld.EXPERIMENTAL_TIME_TO_FIRST_BYTE);
    if (!lcp && !inp && !cls) { lastReason = 'no_field_data'; continue; }
    const overall = le.overall_category || '';
    console.log('[CWV] ' + strategy + ' OK — dati reali CrUX (' + (overall || 'n/d') + ') su ' + target);
    return {
      present: true, strategy, source: 'crux', resolvedUrl: target,
      overall: overall === 'FAST' ? 'good' : overall === 'AVERAGE' ? 'needs-improvement' : overall === 'SLOW' ? 'poor' : 'unknown',
      metrics: {
        lcp: lcp ? { ms: lcp.value, s: lcp.value != null ? +(lcp.value / 1000).toFixed(2) : null, rating: lcp.rating } : null,
        inp: inp ? { ms: inp.value, rating: inp.rating } : null,
        cls: cls ? { value: cls.value != null ? +(cls.value / 100).toFixed(3) : null, rating: cls.rating } : null,
        fcp: fcp ? { ms: fcp.value, s: fcp.value != null ? +(fcp.value / 1000).toFixed(2) : null, rating: fcp.rating } : null,
        ttfb: ttfb ? { ms: ttfb.value, rating: ttfb.rating } : null
      }
    };
  }
  console.log('[CWV] ' + strategy + ' nessun dato di campo CrUX dopo ' + variants.length + ' varianti (motivo: ' + lastReason + ')');
  return { present: false, reason: lastReason, strategy, source: 'crux' };
}

// Mod T (rev11): accessibilità REALE via Lighthouse (categoria accessibility di PageSpeed), per il Premium.
async function fetchAccessibility(url) {
  if (!GOOGLE_API_KEY || !url) return { present: false, reason: 'no_key' };
  const variants = _cwvUrlVariants(url);
  for (const target of variants) {
    const api = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url='
      + encodeURIComponent(target) + '&strategy=mobile&category=accessibility&key=' + GOOGLE_API_KEY;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(api, { signal: ctrl.signal });
      clearTimeout(to);
      if (!r.ok) continue;
      const j = await r.json();
      const lh = j.lighthouseResult;
      const cat = lh && lh.categories && lh.categories.accessibility;
      if (!cat || cat.score == null) continue;
      const score = Math.round(cat.score * 100);
      // estraggo gli audit falliti più rilevanti (score < 1) con titolo leggibile
      const audits = lh.audits || {};
      const failed = [];
      (cat.auditRefs || []).forEach(ref => {
        const a = audits[ref.id];
        if (a && a.score != null && a.score < 1 && a.title) failed.push({ id: ref.id, title: a.title });
      });
      console.log('[A11Y] OK — score reale ' + score + ' su ' + target + ' (' + failed.length + ' audit da migliorare)');
      return { present: true, source: 'lighthouse', score, resolvedUrl: target, failed: failed.slice(0, 12) };
    } catch (e) { clearTimeout(to); }
  }
  console.log('[A11Y] nessun dato accessibility reale dopo ' + variants.length + ' varianti');
  return { present: false, reason: 'no_data' };
}

async function buildCWV(website) {
  if (!GOOGLE_API_KEY) { console.log('[CWV] skip — GOOGLE_API_KEY assente'); return { enabled: false, source: 'crux', mobile: { present: false, reason: 'no_key' }, desktop: { present: false, reason: 'no_key' } }; }
  // Mod O (rev11): tetto complessivo 60s — PageSpeed è spesso lento; diamo tempo al dato reale (Premium),
  // con fallback automatico alla stima se scade. 60s resta sotto la soglia di taglio di Render.
  const both = Promise.all([ fetchCWV(website, 'mobile'), fetchCWV(website, 'desktop') ])
    .then(([mobile, desktop]) => ({ enabled: true, source: 'crux', mobile, desktop }));
  return withTimeout(both, 60000, {
    enabled: true, source: 'crux',
    mobile: { present: false, reason: 'timeout', strategy: 'mobile' },
    desktop: { present: false, reason: 'timeout', strategy: 'desktop' }
  });
}

// ════════ Mod 95 (rev8): verifica presenza directory (Italiaonline + altre) via Serper + fetch pagina ════════
const DIRECTORY_NETWORK = [
  { name: 'PagineGialle', domain: 'paginegialle.it', network: 'Italiaonline' },
  { name: 'PagineBianche', domain: 'paginebianche.it', network: 'Italiaonline' },
  { name: 'Cylex', domain: 'cylex.it', network: 'altro' },
  { name: 'Hotfrog', domain: 'hotfrog.it', network: 'altro' }
];

// Mod 102 (rev8): utility — risolve a fallback se la promise sfora il tempo (il report non si blocca mai)
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

async function serperSiteSearch(domain, company, city) {
  if (!SERPER_API_KEY) return null;
  const base = (company || '').trim();
  const noForm = base.replace(/\b(s\.?r\.?l\.?s?|s\.?n\.?c\.?|s\.?a\.?s\.?|s\.?p\.?a\.?|srl|snc|sas|spa|ditta|impresa)\b\.?/ig, '').replace(/\s{2,}/g, ' ').trim();
  const core = noForm.split(/\s+/).slice(0, 3).join(' ');
  // Mod 102: massimo 2 varianti (precisa + larga) per non moltiplicare le chiamate di rete.
  const variants = [];
  const push = v => { v = (v || '').trim(); if (v && !variants.includes(v)) variants.push(v); };
  push('"' + noForm + '"' + (city ? ' ' + city : ''));
  push(core + (city ? ' ' + city : ''));
  const coreTokens = core.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  for (const v of variants) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch('https://google.serper.dev/search', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: 'site:' + domain + ' ' + v, gl: 'it', hl: 'it', num: 5 })
      });
      clearTimeout(to);
      const j = await r.json();
      const org = (j.organic || []);
      for (const o of org) {
        const link = (o.link || '').toLowerCase();
        if (link.indexOf(domain.toLowerCase()) === -1) continue;
        const hay = ((o.title || '') + ' ' + (o.snippet || '')).toLowerCase();
        const matched = coreTokens.length ? coreTokens.some(t => hay.indexOf(t) !== -1) : true;
        if (matched) return o;
      }
    } catch (e) { /* prova variante successiva */ }
  }
  return null;
}

async function inspectDirectoryPage(url, snippet) {
  // Mod L (rev10): marker di scheda NON presidiata/fantasma (rivendica, campi vuoti, inviti a compilare).
  const notClaimedRe = /(sei il proprietario|sei tu il proprietario|rivendica (questa|la) scheda|rivendica questa attività|questa azienda non è ancora|scheda non rivendicata|attività non rivendicata|non gestita dal titolare|inserisci gli orari|aggiungi orari|nessuna recensione|non ci sono ancora recensioni|scrivi la prima recensione|aggiungi una foto|questa pagina è generata automaticamente)/i;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' } });
    clearTimeout(to);
    if (!r.ok) throw new Error('http_' + r.status);
    const html = await r.text();
    const low = html.toLowerCase();
    const htmlLen = html.length;
    let strong = 0;
    const signals = [];
    // Mod L (rev10): segnali FORTI di scheda realmente PRESIDIATA. Criteri più rigorosi: non contano i
    // boilerplate ("scrivi una recensione") né i pulsanti contatto generati dal portale.
    if (/\d+\s*recensioni|\d+\s*recension[ei]|valutazione media|\d[.,]\d\s*(su|\/)\s*5/.test(low) && !/nessuna recensione|non ci sono ancora recensioni/.test(low)) { strong++; signals.push('recensioni-reali'); }
    if (/(class|id)="[^"]*(company|business|azienda|vetrina|profilo)[^"]*logo|logo[^"]*(azienda|company|business)|data-logo/.test(low)) { strong++; signals.push('logo'); }
    if (/galleria|gallery|photo-gallery|fotografie/.test(low) && !/aggiungi una foto|nessuna foto/.test(low)) { strong++; signals.push('foto'); }
    if (/descrizione dell'attivit|chi siamo|la nostra azienda|profilo aziendale|presentazione|servizi offerti/.test(low)) { strong++; signals.push('descrizione'); }
    if (/attivit[àa] verificat|profilo verificat|titolare verificat|gestita dal proprietario|account verificato/.test(low)) { strong += 2; signals.push('verificata'); }
    if (/(orari di apertura|aperto fino|aperto ora|lun-ven|lunedì)/.test(low) && !/inserisci gli orari|aggiungi orari/.test(low)) { strong++; signals.push('orari'); }
    const notClaimed = notClaimedRe.test(low);
    const tooThin = htmlLen < 4000;
    let stato;
    // Mod L (rev10): i marker di non-rivendica PREVALGONO sui segnali deboli.
    if (notClaimed && strong < 2) stato = 'bianca';                  // scheda fantasma / non presidiata
    else if (tooThin && strong === 0) stato = 'da_verificare';
    else if (strong >= 3 && !notClaimed) stato = 'completa';
    else if (strong >= 2 && !notClaimed) stato = 'parziale';
    else if (strong === 0) stato = notClaimed ? 'bianca' : 'da_verificare';
    else stato = 'parziale';
    return { stato, strong, signals, notClaimed, source: 'pagina' };
  } catch (e) {
    const low = (snippet || '').toLowerCase();
    if (notClaimedRe.test(low)) return { stato: 'bianca', source: 'snippet' };
    const hasReal = /\d+\s*recensioni|\d[.,]\d\s*(su|\/)\s*5/i.test(low) && !/nessuna recensione/.test(low);
    return { stato: hasReal ? 'parziale' : 'da_verificare', source: 'snippet' };
  }
}

async function verifyDirectories(company, city) {
  if (!SERPER_API_KEY || !company) return { enabled: false, reason: 'no_key_or_company', items: [] };
  // Mod 102: tutte le directory IN PARALLELO, ciascuna con fallback se sfora.
  const oneDir = async (dir) => {
    try {
      const hit = await serperSiteSearch(dir.domain, company, city);
      if (!hit) return { name: dir.name, network: dir.network, present: false, source: 'serper' };
      const insp = await inspectDirectoryPage(hit.link, hit.snippet || '');
      return { name: dir.name, network: dir.network, present: true, url: hit.link, stato: insp.stato, source: insp.source };
    } catch (e) {
      return { name: dir.name, network: dir.network, present: false, source: 'error' };
    }
  };
  const items = await Promise.all(DIRECTORY_NETWORK.map(dir =>
    withTimeout(oneDir(dir), 7000, { name: dir.name, network: dir.network, present: false, source: 'timeout' })
  ));
  return { enabled: true, items };
}

// ════════ Mod 94 (rev8): analisi scheda GBP via Google Places (fonte dichiarata) ════════
async function placesAnalyze(name, city) {
  if (!GOOGLE_API_KEY) return null;
  try {
    const findUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input='
      + encodeURIComponent(name + (city ? ' ' + city : '')) + '&inputtype=textquery&fields=place_id,name,formatted_address&language=it&key=' + GOOGLE_API_KEY;
    const fr = await fetch(findUrl); const fj = await fr.json();
    const cand = (fj.candidates || [])[0];
    if (!cand) return { found: false };
    const detUrl = 'https://maps.googleapis.com/maps/api/place/details/json?place_id=' + encodeURIComponent(cand.place_id)
      + '&fields=name,rating,user_ratings_total,formatted_address,formatted_phone_number,opening_hours,website,photos,url&language=it&key=' + GOOGLE_API_KEY;
    const dr = await fetch(detUrl); const dj = await dr.json();
    const r = dj.result || {};
    return {
      found: true, source: 'places',
      name: r.name || cand.name, rating: r.rating || null, reviews: r.user_ratings_total || 0,
      address: r.formatted_address || '', phone: r.formatted_phone_number || '',
      hoursPresent: !!(r.opening_hours && r.opening_hours.weekday_text), photosPresent: !!(r.photos && r.photos.length),
      website: r.website || '', mapsUrl: r.url || ''
    };
  } catch (e) { return { found: false, error: true }; }
}

async function buildOrganicSerp(selectedKeywords, website, geo) {
  if (!SERPER_API_KEY) return { enabled: false, reason: 'no_key', results: [] };
  const tgt = normDomain(website);
  if (!tgt) return { enabled: false, reason: 'no_website', results: [] };
  const kws = (selectedKeywords || []).map(k => k.kw).filter(Boolean).slice(0, 30);
  const results = [];
  // Fix (rev8): chiamate in PARALLELO a lotti di 5 (non più 30 in sequenza) con fallback per keyword,
  // così con molte keyword il tempo totale resta contenuto e il report non si blocca mai.
  const BATCH = 5;
  const one = async (kw) => {
    try {
      const hit = await serperPosition(kw, website, geo?.gl, geo?.hl, geo?.location);
      return { kw, position: hit ? hit.position : null, url: hit ? hit.url : '', found: !!hit, occurrences: hit ? (hit.occurrences || 1) : 0 };
    } catch (e) {
      return { kw, position: null, url: '', found: false, error: true };
    }
  };
  for (let i = 0; i < kws.length; i += BATCH) {
    const slice = kws.slice(i, i + BATCH);
    const batchRes = await Promise.all(slice.map(kw => withTimeout(one(kw), 7000, { kw, position: null, url: '', found: false, error: true })));
    results.push(...batchRes);
  }
  return { enabled: true, target: tgt, results };
}

// STEP 2: analisi completa
app.post('/api/analyze', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { company, website, city, comune, provincia, settore, bizType, rilevanza, visibilita, selectedKeywords, selectedCompetitors, companyInfo, apiMode } = req.body;
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

REGOLE DI PUNTEGGIO (IMPORTANTISSIME — i punteggi NON devono assomigliarsi tra report diversi):
- Assegna i punteggi "score" (0-100) di dimensions e dei competitor in modo SEVERO, REALISTICO e DIFFERENZIATO, valutando ogni dimensione in modo indipendente in base ai dati reali del brand.
- Evita di concentrare i voti nella fascia 35-50: usa l'INTERA scala. Un'azienda con sito debole, pochi backlink, scarsa presenza AI deve prendere voti BASSI (15-35); un'azienda forte deve prendere voti ALTI (70-90). La maggior parte delle PMI locali ha profili sbilanciati (alcune dimensioni basse, altre medie): rifletti questo, NON dare punteggi tutti simili tra loro.
- Le dimensioni della STESSA azienda devono variare tra loro (es. Autorita dominio 22, Schema markup 12, Presenza brand 48): NON appiattire tutto sullo stesso valore.
- I competitor devono avere punteggi diversi dal brand e diversi tra loro, coerenti con la loro reale forza.
- CONFRONTO EQUO (CRUCIALE): valuta l'azienda analizzata e i competitor con ESATTAMENTE LO STESSO METRO e lo stesso rigore. NON penalizzare sistematicamente l'azienda analizzata solo perché hai più dettagli su di lei. L'azienda può legittimamente risultare MIGLIORE di alcuni o tutti i competitor se i suoi dati lo giustificano: a volte sarà prima, a volte in mezzo, a volte ultima — in base ai dati reali, MAI per un pregiudizio fisso. Anche i competitor hanno debolezze concrete: assegna loro punteggi bassi dove sono effettivamente deboli. È sbagliato e poco credibile che l'azienda analizzata risulti SEMPRE la peggiore del gruppo.

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
      "trendData": [<12 interi 0-100, indice 0=Gennaio ... 11=Dicembre dello scorso anno; forma con stagionalità realistica per il settore (es. climatizzazione picco estate, riscaldamento picco inverno, gioielleria picco dicembre, infissi picchi primavera/autunno) e variazioni mensili credibili, NON una linea piatta>],
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
    "averageRating": <float 1-5 media tra le piattaforme dove il brand è presente>,
    "totalReviews": <int totale recensioni sommate>,
    "sentiment": "positivo|neutro|negativo",
    "summary": "2-3 frasi sulla reputazione online del brand in linguaggio semplice per il cliente",
    "sources": [
      { "name": "Google Maps", "present": true, "rating": <float>, "count": <int>, "url": "url diretto alle recensioni Google" },
      { "name": "<piattaforma pertinente al settore>", "present": <true|false>, "rating": <float o null>, "count": <int o null>, "url": "url profilo se presente, altrimenti vuoto" }
    ]
  },
  // ISTRUZIONE FONTI RECENSIONI (Mod 77): includi in "sources" le piattaforme di recensioni PIÙ PERTINENTI AL SETTORE del brand,
  // non solo Google. Esempi per settore: hotel/ristoranti/turismo → Google, TripAdvisor, Booking, TheFork; e-commerce/prodotti → Google, Trustpilot, Trovaprezzi;
  // servizi locali/artigiani/casa → Google, Facebook, Pagine Gialle, Houzz/ProntoPro dove sensato; medici/benessere → Google, Miodottore/Dottori; automotive → Google, AlVolante/automobile.it.
  // Per OGNI piattaforma rilevante indica "present": true con rating/count REALI se rilevabili (stima realistica di settore se non certi, segnalandolo in summary), oppure "present": false con rating/count null se il brand NON è presente (è un'opportunità da presidiare). Includi 3-5 fonti pertinenti, niente piattaforme irrilevanti per il settore.
  "accessibility": {
    "score": <0-100 stima del livello di accessibilità del sito (WCAG) per il settore/tipo di sito>,
    "summary": "2-3 frasi in linguaggio semplice per il cliente su quanto il sito è accessibile a tutti (persone con disabilità visive, motorie, anziani, ecc.)",
    "items": [
      { "criterio": "Contrasto dei colori", "stato": "good|needs-improvement|poor", "nota": "breve nota concreta per il cliente" },
      { "criterio": "Testi alternativi immagini", "stato": "good|needs-improvement|poor", "nota": "breve nota" },
      { "criterio": "Navigazione da tastiera", "stato": "good|needs-improvement|poor", "nota": "breve nota" },
      { "criterio": "Struttura dei titoli", "stato": "good|needs-improvement|poor", "nota": "breve nota" },
      { "criterio": "Etichette nei moduli", "stato": "good|needs-improvement|poor", "nota": "breve nota" },
      { "criterio": "Dimensione e leggibilità del testo", "stato": "good|needs-improvement|poor", "nota": "breve nota" }
    ]
  },
  "competitors": [
    { "name": "nome esatto", "domain": "dominio esatto", "overallScore": <0-100>, "dimensions": { "Autorita dominio": <0-100>, "Presenza brand": <0-100>, "Contenuto AI-friendly": <0-100>, "E-E-A-T": <0-100>, "Schema markup": <0-100>, "Citazioni web": <0-100> }, "strengths": "UN punto di forza SPECIFICO e concreto di questo competitor (max 12 parole, niente frasi generiche tipo 'buona presenza online')", "weaknesses": "UNA debolezza SPECIFICA e concreta sfruttabile dal cliente (max 12 parole, niente genericita)" }
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
    // Mod AQ (rev12): timeout esplicito sulla chiamata AI (115s) per evitare connessioni "appese".
    const aiCtrl = new AbortController();
    const aiTo = setTimeout(() => aiCtrl.abort(), 170000);
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': usedKey2, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 16000, messages: [{ role: 'user', content: prompt }] }),
        signal: aiCtrl.signal
      });
    } catch (fe) {
      clearTimeout(aiTo);
      if (fe.name === 'AbortError') return res.status(504).json({ error: 'Generazione troppo lunga: riprova tra qualche secondo (le tue keyword restano selezionate).' });
      throw fe;
    }
    clearTimeout(aiTo);
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
    // Mod 99 (rev8): parser robusto — se il JSON è comunque irreparabile (troncamento a metà stringa),
    // provo a tagliare all'ultimo oggetto completo e richiudere, così il report si genera lo stesso.
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e1) {
      try {
        // taglio all'ultima graffa chiusa "sicura" e richiudo strutture aperte
        let r2 = raw;
        const lastClose = Math.max(r2.lastIndexOf('}'), r2.lastIndexOf(']'));
        if (lastClose > 0) r2 = r2.substring(0, lastClose + 1);
        // bilancio eventuali stringhe aperte (numero dispari di virgolette non escapate → chiudo)
        const quotes = (r2.match(/(?<!\\)"/g) || []).length;
        if (quotes % 2 !== 0) r2 += '"';
        const ob = (r2.match(/\[/g)||[]).length - (r2.match(/\]/g)||[]).length;
        for (let i = 0; i < ob; i++) r2 += ']';
        const og = (r2.match(/\{/g)||[]).length - (r2.match(/\}/g)||[]).length;
        for (let i = 0; i < og; i++) r2 += '}';
        parsed = JSON.parse(r2);
      } catch (e2) {
        return res.status(500).json({ error: traduciErroreAnthropic(e1) });
      }
    }
    // Mod 3: posizione organica reale nella SERP (Serper.dev) — non blocca il report se fallisce
    // Mod 118: in demo modalità STIMA si salta Serper (zero consumo credito).
    if (apiMode === 'stima') {
      parsed.organicSerp = { enabled: false, reason: 'apimode_stima', results: [] };
      console.log('[APIMODE] analyze in modalità STIMA — Serper/DataForSEO non interrogati');
    } else {
      try {
        const locationFull = [comune, provincia].filter(Boolean).join(', ') || city || 'Italy';
        parsed.organicSerp = await buildOrganicSerp(selectedKeywords, website, { gl: 'it', hl: 'it', location: locationFull });
      } catch (e) {
        parsed.organicSerp = { enabled: false, reason: 'error', results: [] };
      }
    }
    // MOD AX: arricchisco i social con dati REALI Apify (Facebook per tutti i profili; tutti i social per Expert).
    try {
      const _tok = req.headers['x-session-token'];
      const _sess = _tok ? sessions.get(_tok) : null;
      const _profile = _sess ? (_sess.profile || (_sess.isDemo ? 'expert' : 'senior')) : 'senior';
      if (Array.isArray(parsed.social)) {
        await enrichSocialWithApify(parsed.social, _profile);
      }
    } catch (_) {}
    // MOD BA: recupero il logo del sito (in parallelo, non blocca il report).
    try {
      const logoRes = await Promise.race([
        fetchSiteLogo(website),
        new Promise(res => setTimeout(() => res(null), 7000))
      ]);
      if (logoRes && logoRes.logoUrl) { parsed.logoUrl = logoRes.logoUrl; parsed.logoSource = logoRes.logoSource; }
    } catch (_) {}
    // Mod 93/95/102: Core Web Vitals + verifica directory IN PARALLELO, ciascuna con tetto di tempo.
    // Mod 115: + Google Trends reali (DataForSEO), tutto in parallelo.
    const kwNames = (parsed.keywords || []).map(k => k.kw).filter(Boolean);
    const aiGeo = { gl: 'it', hl: 'it', location: ([comune, provincia].filter(Boolean).join(', ') || city || 'Italy') };
    const _stima = (apiMode === 'stima');
    const [cwvRes, dirRes, trendsRes, aiRealRes, kwRealRes, a11yRes] = await Promise.all([
      // Mod O (rev11): in modalità STIMA (agente) NON si interroga PageSpeed — il front-end mostra la stima
      // desktop/mobile. In Premium si attende il dato reale fino a 60s, con fallback automatico alla stima.
      _stima ? Promise.resolve(null) : withTimeout(buildCWV(website).catch(() => null), 60000, null),
      _stima ? Promise.resolve(null) : withTimeout(verifyDirectories(company, cityRef).catch(() => null), 10000, null),
      _stima ? Promise.resolve(null) : withTimeout(fetchGoogleTrends(kwNames).catch(() => null), 20000, null),
      _stima ? Promise.resolve(null) : withTimeout(checkAIPresenceReal(kwNames, website, aiGeo).catch(() => null), 12000, null),
      // Mod A (rev10): volumi/CPC REALI DataForSEO applicati alle keyword del report (come nel suggest).
      // Senza questo, in fase di analisi ogni keyword restava marcata 'ai' → "stima" ovunque nei risultati.
      _stima ? Promise.resolve(null) : withTimeout(enrichKeywordsWithRealData(parsed.keywords || []).catch(() => null), 12000, null),
      // Mod T (rev11): accessibilità reale Lighthouse (Premium); l'agente usa la stima dal prompt.
      _stima ? Promise.resolve(null) : withTimeout(fetchAccessibility(website).catch(() => null), 22000, null)
    ]);
    // Mod T (rev11): se il dato reale c'è (Premium) lo uso, altrimenti resta la stima del prompt (parsed.accessibility).
    if (a11yRes && a11yRes.present) parsed.accessibilityReal = a11yRes;
    // Mod AH Livello 2 (rev11): SOLO PREMIUM — misuro il CWV reale del sito di ciascun competitor (fino a 4)
    // e lo allego, così il front-end può valutarli con un criterio reale come l'azienda. Limitato e in
    // parallelo per non sforare i timeout di Render. In modalità stima (agente) NON viene eseguito.
    if (!_stima && Array.isArray(parsed.competitors) && parsed.competitors.length) {
      const targets = parsed.competitors.filter(c => c && c.domain).slice(0, 4);
      try {
        await Promise.all(targets.map(async c => {
          const url = /^https?:\/\//.test(c.domain) ? c.domain : 'https://' + c.domain;
          const cwv = await withTimeout(buildCWV(url).catch(() => null), 30000, null);
          if (cwv) {
            const m = cwv.mobile, dk = cwv.desktop;
            // fetchCWV ritorna 'overall' (good/needs-improvement/poor), non un numero → lo converto.
            const ov2num = (x) => {
              if (!x || !x.present) return null;
              return x.overall === 'good' ? 90 : x.overall === 'needs-improvement' ? 60 : x.overall === 'poor' ? 30 : null;
            };
            const cs = ov2num(m) != null ? ov2num(m) : ov2num(dk);
            if (cs != null) c.cwvRealScore = cs;
          }
        }));
      } catch (e) { console.error('[AH] CWV competitor:', e.message); }
    }
    // Mod O (rev11): in modalità STIMA non c'è dato reale → marco esplicitamente perché il front-end
    // mostri le stime desktop/mobile (estimateCWV) anziché un messaggio di "dati non disponibili".
    parsed.cwvReal = cwvRes || (_stima
      ? { enabled: false, source: 'estimate', mobile: { present: false, reason: 'apimode_stima' }, desktop: { present: false, reason: 'apimode_stima' } }
      : { enabled: !!GOOGLE_API_KEY, source: 'crux', mobile: { present: false, reason: 'timeout' }, desktop: { present: false, reason: 'timeout' } });
    parsed.directories = dirRes || { enabled: false, reason: 'timeout', items: [] };
    // Mod A (rev10): esito arricchimento volumi reali. enrichKeywordsWithRealData muta parsed.keywords in-place
    // (imposta k.volume/cpc/competition/dataSource). Qui registro solo l'aggregato e loggo per diagnosi.
    if (_stima) {
      (parsed.keywords || []).forEach(k => { k.dataSource = 'ai'; });
      parsed.keywordDataSource = 'ai';
    } else if (kwRealRes) {
      parsed.keywordDataSource = kwRealRes.realUsed ? 'dataforseo' : 'ai';
      const nReal = (parsed.keywords || []).filter(k => k.dataSource === 'dataforseo').length;
      console.log('[DFS-ANALYZE] applicato — ' + nReal + '/' + (parsed.keywords || []).length + ' keyword con volume reale');
    } else {
      // timeout o errore: lascio i valori stimati dal modello, marco come stima
      (parsed.keywords || []).forEach(k => { if (!k.dataSource) k.dataSource = 'ai'; });
      parsed.keywordDataSource = 'ai';
      console.log('[DFS-ANALYZE] non disponibile (timeout/errore) — keyword in stima');
    }
    // Mod 115: applico i trend REALI dove disponibili (una serie per keyword), altrimenti resta la stima AI
    if (trendsRes && trendsRes.byKw) {
      parsed.trendsMeta = { real: true, source: 'dataforseo', months: trendsRes.months || [] };
      (parsed.keywords || []).forEach(k => {
        const serie = trendsRes.byKw[(k.kw || '').toLowerCase()];
        if (serie && serie.length && serie.some(v => v != null)) {
          k.trendData = serie.map(v => (v == null ? 0 : v));
          k.trendSource = 'dataforseo';
        } else {
          k.trendSource = 'ai';
        }
      });
    } else {
      parsed.trendsMeta = { real: false, source: 'ai', months: [] };
      (parsed.keywords || []).forEach(k => { k.trendSource = 'ai'; });
    }
    // Mod 116 (rev8): AI Presence — dato REALE per Google AI Overview / Perplexity (via Serper),
    // STIMA per ChatGPT/Claude/Gemini. Marco ogni motore con real:true/false e calcolo DUE indici distinti.
    if (Array.isArray(parsed.aiVisibility)) {
      const realMap = aiRealRes ? { 'google ai overview': aiRealRes.aiOverview, 'perplexity': aiRealRes.perplexity } : null;
      parsed.aiVisibility.forEach(m => {
        const key = (m.source || '').toLowerCase();
        if (realMap && realMap[key] != null) {
          m.probability = realMap[key];
          m.real = true;
          m.note = 'presenza reale nelle fonti (verificata via ricerca)';
        } else {
          m.real = false;
        }
      });
      const reals = parsed.aiVisibility.filter(m => m.real);
      const ests = parsed.aiVisibility.filter(m => !m.real);
      const avg = arr => arr.length ? Math.round(arr.reduce((s, m) => s + (m.probability || 0), 0) / arr.length) : null;
      parsed.aiMeta = {
        realChecked: !!aiRealRes,
        realIndex: avg(reals),          // indice REALE (AI Overview + Perplexity)
        estIndex: avg(ests),            // indice STIMATO (ChatGPT/Claude/Gemini)
        realEngines: reals.map(m => m.source),
        estEngines: ests.map(m => m.source),
        checkedQueries: aiRealRes ? aiRealRes.checked : 0
      };
    }
    const _tok=req.headers['x-session-token'];const _sess=_tok?sessions.get(_tok):null;
    // Mod AB.1 (rev11): il salvataggio del report avviene ORA dal front-end (rotta /api/report/save) DOPO
    // il ricalcolo dello score reale, così lo storico admin mostra il punteggio corretto (non quello grezzo AI)
    // e contiene il report completo. Qui non salvo più (evita doppio salvataggio con score sbagliato).
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: traduciErroreAnthropic(err) });
  }
});

// Mod H+I (rev10): analisi scheda GBP aggiuntiva — URL obbligatorio, nome/città facoltativi.
// Se il nome manca, provo a derivarlo dall'URL della scheda Google (es. /maps/place/Nome/...).
function nameFromGoogleUrl(url) {
  if (!url) return '';
  try {
    const dec = decodeURIComponent(url);
    let m = dec.match(/\/maps\/place\/([^\/@?]+)/i);
    if (m && m[1]) return m[1].replace(/\+/g, ' ').trim();
    m = dec.match(/[?&]q=([^&]+)/i);
    if (m && m[1]) return m[1].replace(/\+/g, ' ').trim();
    return '';
  } catch (e) { return ''; }
}
app.post('/api/analyze-gbp', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { url, name, city } = req.body || {};
  const link = (url || '').trim();
  if (!link) return res.status(400).json({ error: 'URL della scheda mancante' });
  // nome: usa quello fornito, altrimenti lo deriva dall'URL
  const resolvedName = (name && name.trim()) || nameFromGoogleUrl(link);
  if (!resolvedName) return res.status(400).json({ error: 'Impossibile ricavare il nome dalla scheda: aggiungi il nome attività.' });
  // 1) prova dati REALI via Google Places
  try {
    const pl = await placesAnalyze(resolvedName, city);
    if (pl && pl.found) {
      // Mod H (rev10): punteggio GBP 0-100 dai dati reali Places (coerente con la scheda automatica):
      // rating (max 45), volume recensioni (max 30), foto (15), orari (10).
      const rating = pl.rating || 0;
      const reviews = pl.reviews || 0;
      let score = 0;
      score += Math.round((rating / 5) * 45);
      score += Math.min(30, Math.round(Math.log10(reviews + 1) * 18));
      if (pl.photosPresent) score += 15;
      if (pl.hoursPresent) score += 10;
      score = Math.max(1, Math.min(100, score));
      const active = score >= 55 && reviews > 0;
      return res.json({
        ok: true, source: 'places', url: link || pl.mapsUrl || '',
        card: {
          name: pl.name, rating: pl.rating, reviews: pl.reviews, address: pl.address,
          phone: pl.phone, hoursPresent: pl.hoursPresent, photosPresent: pl.photosPresent,
          website: pl.website, mapsUrl: pl.mapsUrl || link || '', score: score, active: active
        }
      });
    }
  } catch (e) { /* fallback sotto */ }
  // 2) fallback STIMA via AI (fonte dichiarata)
  const usedKey = getApiKey(req);
  if (!usedKey) return res.json({ ok: true, source: 'none', url: link || '', card: { name: resolvedName, note: 'Dati non disponibili: nessuna chiave Google Places né AI configurata.' } });
  try {
    const prompt = `Analizza la scheda Google Business "${resolvedName}"${city ? ' a ' + city : ''}${link ? ' (URL: ' + link + ')' : ''}.
Rispondi SOLO con JSON valido, senza testo attorno:
{"name":"<nome>","rating":<float 1-5 o null>,"reviews":<int o null>,"address":"<indirizzo o vuoto>","hoursPresent":<true|false>,"photosPresent":<true|false>,"score":<int 0-100 qualità scheda>,"active":<true|false>,"note":"<1 frase: stato e cosa migliorare>"}
Per "score" valuta completezza scheda, numero/qualità recensioni, rating, foto e orari (0-100). "active"=true se la scheda è presidiata e aggiornata.
Se non hai certezza dei numeri, fornisci stime realistiche per il settore/zona (NON inventare precisione). I dati sono STIME.`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': usedKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: traduciErroreAnthropic(data.error) });
    let raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const card = JSON.parse(raw);
    return res.json({ ok: true, source: 'ai', url: link || '', card });
  } catch (err) {
    return res.status(500).json({ error: traduciErroreAnthropic(err) });
  }
});

// Mod 100 (rev8): stima volume/CPC (+competizione/intento) per una keyword manuale, via AI, coerente con le suggerite.
app.post('/api/keyword-data', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { keyword, settore, city } = req.body || {};
  const kw = (keyword || '').trim();
  if (!kw) return res.status(400).json({ error: 'keyword mancante' });
  const usedKey = getApiKey(req);
  if (!usedKey) return res.status(500).json({ error: 'Nessuna chiave API configurata.' });
  // Mod 108: prima provo i dati REALI DataForSEO; se ci sono, li uso (intento via euristica).
  try {
    const real = await fetchKeywordVolumes([kw]);
    const hit = real && real[kw.toLowerCase()];
    if (hit && hit.volume != null) {
      const low = kw.toLowerCase();
      const intent = /(prezzo|preventivo|acquist|compr|offerta|sconto|vendita)/.test(low) ? 'transazionale'
        : /(come|cosa|perch|guida|significato)/.test(low) ? 'informazionale'
        : /(migliore|miglior|vicino|recension)/.test(low) ? 'commerciale' : 'commerciale';
      return res.json({
        ok: true, source: 'dataforseo', kw: kw,
        volume: hit.volume, cpc: (hit.cpc != null ? hit.cpc : 0),
        competition: hit.competition || 'media', intent
      });
    }
  } catch (e) { /* fallback AI sotto */ }
  try {
    const prompt = `Sei un esperto SEO/SEM per il mercato italiano. Stima i dati della keyword "${kw}"${settore ? ' nel settore ' + settore : ''}${city ? ' per la zona di ' + city : ''}.
Rispondi SOLO con JSON valido, senza testo né markdown attorno:
{"kw":"${kw}","volume":<int volume di ricerca mensile realistico in Italia>,"cpc":<float CPC medio EUR>,"competition":"bassa|media|alta","intent":"informazionale|commerciale|transazionale|navigazionale"}
Fornisci stime realistiche e coerenti col mercato italiano (NON inventare precisione spuria). Volume mensile plausibile per la zona/settore indicati.`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': usedKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 300, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: traduciErroreAnthropic(data.error) });
    let raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const obj = JSON.parse(raw);
    return res.json({
      ok: true, source: 'ai',
      kw: kw,
      volume: (typeof obj.volume === 'number' ? obj.volume : parseInt(obj.volume) || 0),
      cpc: (typeof obj.cpc === 'number' ? obj.cpc : parseFloat(obj.cpc) || 0),
      competition: obj.competition || 'media',
      intent: obj.intent || 'commerciale'
    });
  } catch (err) {
    return res.status(500).json({ error: traduciErroreAnthropic(err) });
  }
});

// Mod 109 (rev8): analisi di una pagina social aggiuntiva del cliente (piattaforma + URL), stima AI.
// ── MOD BI: sezione Ads standalone (CPC + volume). Reale su Expert (DataForSEO), stima su Senior/Account. ──
app.post('/api/quick-ads', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { keywords, settore, city } = req.body || {};
  if (!Array.isArray(keywords) || !keywords.length) return res.status(400).json({ error: 'keyword mancanti' });
  const usedKey = getApiKey(req);
  if (!usedKey) return res.status(500).json({ error: 'Nessuna chiave API configurata.' });
  const _tok = req.headers['x-session-token'];
  const _sess = _tok ? sessions.get(_tok) : null;
  const isExpert = _sess && (_sess.profile === 'expert' || _sess.isDemo);
  try {
    const kwLine = keywords.map(k => (typeof k === 'string' ? k : (k.kw || k.keyword))).filter(Boolean).slice(0, 20);
    const prompt = `Sei un esperto Google Ads per il mercato italiano. Per ognuna di queste keyword${settore ? ' (settore: ' + settore + ')' : ''}${city ? ' (zona: ' + city + ')' : ''} stima volume di ricerca mensile e CPC realistici:
${kwLine.map((k, i) => (i + 1) + '. ' + k).join('\n')}
Rispondi SOLO con JSON valido, nessun testo attorno:
{"items":[{"kw":"<keyword>","volume":<int o null>,"cpc":<float o null>,"competition":"<alta|media|bassa>"}]}
I valori sono stime di mercato realistiche per zona e settore.`;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': usedKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    if (data.error) return res.status(500).json({ error: traduciErroreAnthropic(data.error) });
    let raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    let items = Array.isArray(parsed.items) ? parsed.items : [];
    items = items.map(it => ({ ...it, source: 'stima' }));
    // Expert: provo i dati reali DataForSEO dove disponibili.
    if (isExpert && typeof enrichKeywordsWithRealData === 'function') {
      try {
        const base = items.map(it => ({ kw: it.kw, volume: it.volume, cpc: it.cpc, competition: it.competition }));
        const real = await withTimeout(enrichKeywordsWithRealData(base).catch(() => null), 20000, null);
        const realArr = real && Array.isArray(real.keywords) ? real.keywords : (Array.isArray(real) ? real : null);
        if (realArr) {
          items = items.map(it => {
            const m = realArr.find(rr => (rr.kw || '').toLowerCase() === (it.kw || '').toLowerCase());
            if (m && m.volume != null && m.realUsed !== false) return { ...it, volume: m.volume, cpc: m.cpc != null ? m.cpc : it.cpc, source: 'reale' };
            return it;
          });
        }
      } catch (_) {}
    }
    res.json({ ok: true, items, profile: isExpert ? 'expert' : 'agent' });
  } catch (err) {
    return res.status(500).json({ error: traduciErroreAnthropic(err) });
  }
});

// ── MOD BL: sezione Stima SEO standalone (posizione organica + punteggio SEO + traffico stimato). ──
app.post('/api/quick-seo', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { website, keywords, settore, city } = req.body || {};
  if (!website) return res.status(400).json({ error: 'sito mancante' });
  const usedKey = getApiKey(req);
  if (!usedKey) return res.status(500).json({ error: 'Nessuna chiave API configurata.' });
  const _tok = req.headers['x-session-token'];
  const _sess = _tok ? sessions.get(_tok) : null;
  const isExpert = _sess && (_sess.profile === 'expert' || _sess.isDemo);
  try {
    const kwLine = (Array.isArray(keywords) ? keywords : []).map(k => (typeof k === 'string' ? k : (k.kw || k.keyword))).filter(Boolean).slice(0, 15);
    const prompt = `Sei un esperto SEO per il mercato italiano. Analizza il sito "${website}"${settore ? ' (settore: ' + settore + ')' : ''}${city ? ' (zona: ' + city + ')' : ''}.
Stima in sintesi lo stato SEO. Per le keyword indicate stima la posizione organica probabile su Google.
Keyword: ${kwLine.join(', ') || '(generiche di settore)'}
Rispondi SOLO con JSON valido, nessun testo attorno:
{"seoScore":<0-100>,"onpage":<0-100>,"tecnico":<0-100>,"autorita":<0-100>,"trafficoOrganico":<int stima visite organiche/mese>,"positions":[{"kw":"<keyword>","pos":<int posizione 1-100 o null se oltre 100>}]}
I valori sono stime realistiche di mercato.`;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': usedKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    if (data.error) return res.status(500).json({ error: traduciErroreAnthropic(data.error) });
    let raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    let positions = Array.isArray(parsed.positions) ? parsed.positions.map(p => ({ ...p, source: 'stima' })) : [];
    // Expert: posizione organica REALE via Serper dove disponibile.
    if (isExpert && typeof buildOrganicSerp === 'function' && kwLine.length) {
      try {
        const loc = [city].filter(Boolean).join(', ') || 'Italy';
        const realSerp = await withTimeout(buildOrganicSerp(kwLine.map(k => ({ kw: k })), website, { gl: 'it', hl: 'it', location: loc }).catch(() => null), 20000, null);
        if (realSerp && Array.isArray(realSerp.results)) {
          positions = positions.map(p => {
            const m = realSerp.results.find(rr => (rr.kw || '').toLowerCase() === (p.kw || '').toLowerCase());
            if (m && m.position != null) return { kw: p.kw, pos: m.position, source: 'reale' };
            return p;
          });
        }
      } catch (_) {}
    }
    res.json({ ok: true, profile: isExpert ? 'expert' : 'agent',
      seoScore: parsed.seoScore, onpage: parsed.onpage, tecnico: parsed.tecnico, autorita: parsed.autorita,
      trafficoOrganico: parsed.trafficoOrganico, positions });
  } catch (err) {
    return res.status(500).json({ error: traduciErroreAnthropic(err) });
  }
});

app.post('/api/analyze-social', async (req, res) => {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Non autenticato' });
  const { platform, url, settore, city } = req.body || {};
  const plat = (platform || '').trim();
  const link = (url || '').trim();
  if (!plat || !link) return res.status(400).json({ error: 'piattaforma o URL mancante' });
  const usedKey = getApiKey(req);
  if (!usedKey) return res.status(500).json({ error: 'Nessuna chiave API configurata.' });

  // Mod AT: per Facebook, provo prima a leggere i dati REALI via Apify.
  let realData = null;
  if (/facebook/i.test(plat)) {
    realData = await apifyFacebookPage(link);
  }

  try {
    const prompt = `Sei un analista di social media per PMI italiane. Analizza la pagina ${plat} all'URL "${link}"${settore ? ' (settore: ' + settore + ')' : ''}${city ? ' (zona: ' + city + ')' : ''}.
Rispondi SOLO con JSON valido, senza testo né markdown attorno:
{"platform":"${plat}","followers":<int stima follower o null>,"score":<int 0-100 qualità presenza>,"active":<true|false>,"note":"<1 frase: stato e cosa migliorare, max 14 parole>"}
I dati sono STIME realistiche su benchmark di settore (NON inventare precisione). Se non puoi stimare i follower, usa null.`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': usedKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 400, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: traduciErroreAnthropic(data.error) });
    let raw = data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const card = JSON.parse(raw);

    // Mod AT: se ho i dati reali da Apify, SOVRASCRIVO i follower stimati con quelli veri.
    if (realData && realData.followers != null) {
      card.followers = realData.followers;
      card.verified = true;            // dato reale verificato
      card.source = 'apify';
      if (realData.rating != null) card.rating = realData.rating;
      if (realData.reviewsCount != null) card.reviewsCount = realData.reviewsCount;
      card.active = true;
      card.note = 'Dati reali verificati dalla pagina.';
      return res.json({ ok: true, source: 'apify', verified: true, url: link, card });
    }
    return res.json({ ok: true, source: 'ai', verified: false, url: link, card });
  } catch (err) {
    // Mod AT: se la stima AI fallisce ma ho comunque i dati reali, li restituisco lo stesso.
    if (realData && realData.followers != null) {
      return res.json({ ok: true, source: 'apify', verified: true, url: link, card: {
        platform: plat, followers: realData.followers, rating: realData.rating ?? null,
        reviewsCount: realData.reviewsCount ?? null, score: null, active: true, verified: true,
        note: 'Dati reali verificati dalla pagina.'
      }});
    }
    return res.status(500).json({ error: traduciErroreAnthropic(err) });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ SEO AI Tool v4 avviato su http://localhost:${PORT}`);
  console.log(`🔑 Password agenti: ${agentPassword}`);
  console.log(`🛡️  Password admin:  ${ADMIN_PASSWORD}\n`);
  initDB().then(() => hydrateSessions());
});
