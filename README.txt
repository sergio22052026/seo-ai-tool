=============================================
  SEO AI ANALYZER — GUIDA INSTALLAZIONE
=============================================

DUE PASSWORD, DUE RUOLI
-------------------------
ADMIN_PASSWORD   → solo tua, per il pannello admin
ACCESS_PASSWORD  → per gli agenti (la puoi cambiare dal pannello admin)


=============================================
PASSO 1 — CHIAVE API ANTHROPIC
=============================================
1. Vai su https://console.anthropic.com
2. "API Keys" → "Create Key"
3. Copia la chiave (sk-ant-...)


=============================================
PASSO 2 — CARICA SU GITHUB
=============================================
1. Crea account su https://github.com
2. Clicca "+" → "New repository" → nome: seo-ai-tool → "Create"
3. Clicca "uploading an existing file"
4. Trascina TUTTI i file dentro (server.js, package.json, cartella public/)
5. "Commit changes"


=============================================
PASSO 3 — PUBBLICA SU RENDER (gratis)
=============================================
1. Vai su https://render.com, accedi con GitHub
2. "New +" → "Web Service"
3. Seleziona il repo seo-ai-tool
4. Compila:
   - Runtime:       Node
   - Build Command: npm install
   - Start Command: node server.js
5. Aggiungi queste 3 variabili in "Environment Variables":

   ANTHROPIC_API_KEY  →  sk-ant-... (la tua chiave)
   ADMIN_PASSWORD     →  (scegli una password sicura SOLO TUA)
   ACCESS_PASSWORD    →  (password iniziale per gli agenti)

6. "Create Web Service" → aspetta 2-3 minuti
7. Render ti dà il link: https://seo-ai-tool.onrender.com
   → mandalo agli agenti!


=============================================
COME FUNZIONA
=============================================

AGENTI:
- Aprono il link, inseriscono la password agenti
- Sessione valida 8 ore, poi riaccedono
- Più agenti possono usarlo contemporaneamente

ADMIN (tu):
- Dalla pagina di login, clicchi "Accesso amministratore"
- Inserisci la tua ADMIN_PASSWORD
- In cima all'app appare il pulsante "Pannello admin"
- Da lì puoi: vedere le sessioni attive e cambiare
  la password agenti in qualsiasi momento
- Quando cambi la password, tutti gli agenti vengono
  disconnessi e devono rifare il login con la nuova


=============================================
CAMBIARE LA PASSWORD AGENTI
=============================================
Metodo 1 — Pannello admin (consigliato):
  Accedi come admin → "Pannello admin" → digita la nuova
  password → "Aggiorna". Funziona subito, senza toccare Render.

Metodo 2 — Render (per cambiare la password admin):
  render.com → il tuo servizio → "Environment" →
  modifica ADMIN_PASSWORD → "Save Changes"


=============================================
COSTI
=============================================
Render free:    gratis (30s di attesa al primo accesso
                dopo inattività. $7/mese per sempre attivo)
Anthropic API:  ~€0.003 per analisi
