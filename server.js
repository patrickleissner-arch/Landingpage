const path       = require('path');
// .env liegt eine Ebene über __dirname, AUSSERHALB des von Hostingers
// Auto-Deploy synchronisierten Ordners – sonst überschreibt/löscht der
// rsync bei jedem Push die Datei wieder (siehe deploy-env.yml).
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express    = require('express');
const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const https      = require('https');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// Hostinger liefert Requests über einen internen Reverse-Proxy/CDN aus –
// ohne trust proxy würde req.ip sonst dessen Adresse statt der echten
// Besucher-IP liefern und das Rate-Limiting würde alle Besucher gemeinsam treffen.
app.set('trust proxy', true);

// Nur öffentliche Dateien ausliefern. Die Seite läuft unter Express, nicht
// Apache – die Sperren in .htaccess greifen hier nicht. Ohne diese Prüfung
// lieferte express.static das ganze Repo aus: server.js, CLAUDE.md, docs/,
// .github/ und node_modules/. Geprüft wird der dekodierte, normalisierte Pfad,
// damit /server%2Ejs oder //server.js nicht vorbeikommen.
const OEFFENTLICHE_ENDUNGEN = new Set([
  '.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico',
  '.ttf', '.woff', '.woff2', '.mp4', '.webm', '.pdf', '.xml', '.txt', '.webmanifest',
]);
const INTERNE_PFADE = /^\/(?:server\.js$|node_modules(?:\/|$)|docs(?:\/|$))|\/\.(?!well-known\/)/i;

app.use((req, res, next) => {
  let pfad;
  try { pfad = path.posix.normalize(decodeURIComponent(req.path)); }
  catch { return res.status(400).end(); }
  const endung = path.posix.extname(pfad).toLowerCase();
  if (INTERNE_PFADE.test(pfad) || (endung && !OEFFENTLICHE_ENDUNGEN.has(endung))) {
    return res.status(404).end();
  }
  next();
});

// ── Saubere URLs ─────────────────────────────────────────────────
// Kanonisch ist die Form ohne Schrägstrich am Ende – so stehen die URLs in
// sitemap.xml und in den canonical-Tags. Diese Weiche steht vor
// express.static: Das leitete jeden Ordner auf „/…/“ um, und die
// Platzhalter-Ordner aus der Apache-Zeit (termin/index.html usw.) leiteten
// per Meta-Refresh weiter – zwei Umwege auf jedem Klick zu „Termin buchen“.
const SEITEN = {
  '/beratung-technik':      'beratung-technik.html',
  '/koordination-netzwerk': 'koordination-netzwerk.html',
  '/unabhaengigkeit':       'unabhaengigkeit.html',
  '/nutzen':                'nutzen.html',
  '/heizkosten':            'heizkosten.html',
  '/waermepumpe-heizlast':  'waermepumpe-heizlast.html',
  '/mieterstrom':           'mieterstrom.html',
  '/impressum':             'impressum.html',
  '/datenschutz':           'datenschutz.html',
  '/termin':                'termin.html',
  '/spotpreis':             'spotpreis.html',
};
const UMZUEGE = {
  // Versicherung wird ueber diese Website nicht mehr vermarktet (25.09.2026).
  // Die .html-Variante muss mit: Ohne sie liefert die Auffangroute unter der
  // alten Adresse stillschweigend die Startseite aus - fuer Suchmaschinen ein
  // zweiter Inhalt unter einer Adresse, die es nicht mehr geben soll.
  '/analyse-vorsorge':      '/',
  '/analyse-vorsorge.html': '/',
  '/solarisator':         '/unabhaengigkeit',
  '/energierechner':      '/nutzen',
  '/waermepumpe-rechner': '/heizkosten',
};

// Ordner mit eigener index.html (Ratgeber) einmal beim Start einlesen –
// neue Artikel kommen mit dem nächsten Deploy und damit dem nächsten Start.
function ordnerSeitenFinden(ordner, basis = '') {
  const gefunden = {};
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('.') || ['node_modules', 'assets', 'docs'].includes(e.name)) continue;
    const rel  = basis + '/' + e.name;
    const voll = path.join(ordner, e.name);
    if (fs.existsSync(path.join(voll, 'index.html'))) gefunden[rel.toLowerCase()] = path.join(voll, 'index.html');
    Object.assign(gefunden, ordnerSeitenFinden(voll, rel));
  }
  return gefunden;
}
const ORDNER_SEITEN = ordnerSeitenFinden(__dirname);

app.use((req, res, next) => {
  if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path === '/') return next();
  const query = req.url.slice(req.path.length);
  const kanon = req.path.replace(/\/+$/, '').toLowerCase();

  if (UMZUEGE[kanon]) return res.redirect(301, UMZUEGE[kanon] + query);

  const datei = SEITEN[kanon] ? path.join(__dirname, SEITEN[kanon]) : ORDNER_SEITEN[kanon];
  if (!datei) return next();
  if (req.path !== kanon) return res.redirect(301, kanon + query);
  res.sendFile(datei);
});

app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── In-Memory Stores ─────────────────────────────────────────────
const rateLimitMap = new Map(); // ip → [timestamps]
const pendingMap   = new Map(); // token → { payload, expiresAt }

const RATE_WINDOW = 10 * 60 * 1000; // Zeitfenster des Rate-Limits (10 Min)

// Abgelaufene Pending-Einträge und verwaiste Rate-Limit-Einträge alle 30 min bereinigen.
// Die IP-Zeitstempel werden beim Lesen zwar gefiltert, der Map-Eintrag selbst blieb aber
// bis zum Serverneustart bestehen — eine IP ist ein personenbezogenes Datum und soll
// nicht ohne Zweck liegen bleiben.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of pendingMap) {
    if (v.expiresAt < now) pendingMap.delete(k);
  }
  for (const [ip, hits] of rateLimitMap) {
    const fresh = hits.filter(t => now - t < RATE_WINDOW);
    if (fresh.length) rateLimitMap.set(ip, fresh);
    else rateLimitMap.delete(ip);
  }
}, 30 * 60 * 1000);

// ── Contact form ─────────────────────────────────────────────────
const THEMEN_LABELS = {
  pv:           'Photovoltaikanlage',
  wp:           'Wärmepumpe',
  sonstiges:    'Sonstiges',
};

function createTransporter() {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port,
    secure: port === 465, // Port 465 verlangt implizites TLS, 587/25 nutzen STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// ── Eigenes Vertriebstool (CRM) über n8n ─────────────────────────
// Website-Themen auf die Interessen-Schreibweise des CRM abbilden. Aus
// EasyAppointments kommt "Photovoltaik" – zwei Schreibweisen desselben
// Themas würden den Interessenfilter in der Leadliste auseinanderreißen.
const CRM_INTERESSEN = {
  pv:        'Photovoltaik',
  wp:        'Wärmepumpe',
  speicher:  'Batteriespeicher',
  sonstiges: 'Sonstiges',
};

const crmInteressen = (werte) =>
  (werte || []).map(w => CRM_INTERESSEN[w]).filter(Boolean);

// Die Einwilligung zur persoenlichen Kontaktaufnahme muss nachweisbar sein
// (Art. 7 Abs. 1 DSGVO). Sie wandert deshalb in den Verlaufseintrag des Leads:
// Der ist unveraenderlich und traegt einen Zeitstempel. Bisher stand sie nur in
// der Benachrichtigungsmail und war damit nicht belastbar dokumentiert.
const mitEinwilligung = (text, zugestimmt) =>
  [String(text || '').trim(),
   `Einwilligung zur persönlichen Kontaktaufnahme: ${zugestimmt ? 'ja' : 'nein'}`]
    .filter(Boolean).join('\n');

// Legt Kontakt, Lead und Verlaufseintrag im eigenen CRM an. Wirft nie:
// Ein Ausfall des CRM darf weder die Bestätigung des Besuchers noch die
// Benachrichtigung an MAIL_TO verhindern. Fehler landen sichtbar im Log.
function crmLead(payload) {
  const url   = process.env.CRM_WEBHOOK_URL;
  const token = process.env.CRM_WEBHOOK_TOKEN;

  if (!url || !token) {
    console.error('CRM NICHT ANGELEGT – CRM_WEBHOOK_URL oder CRM_WEBHOOK_TOKEN fehlt in der .env. Anfrage von:', payload.email);
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let ziel;
    try { ziel = new URL(url); }
    catch { console.error('CRM_WEBHOOK_URL ist keine gültige Adresse:', url); return resolve(false); }

    const body = JSON.stringify(payload);
    const req  = https.request({
      hostname: ziel.hostname,
      port:     ziel.port || 443,
      path:     ziel.pathname + ziel.search,
      method:   'POST',
      headers: {
        'Content-Type':    'application/json',
        'Content-Length':  Buffer.byteLength(body),
        'X-Website-Token': token,
      },
      timeout: 10000,
    }, (res) => {
      let text = '';
      res.on('data', c => text += c);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          console.error('CRM NICHT ANGELEGT – Webhook antwortete', res.statusCode, text.slice(0, 200), '| Anfrage von:', payload.email);
          return resolve(false);
        }
        resolve(true);
      });
    });

    req.on('timeout', () => req.destroy(new Error('Zeitüberschreitung nach 10 s')));
    req.on('error', (err) => {
      console.error('CRM NICHT ANGELEGT – Webhook nicht erreichbar:', err.message, '| Anfrage von:', payload.email);
      resolve(false);
    });
    req.write(body);
    req.end();
  });
}

app.post('/api/contact', async (req, res) => {
  // Honeypot: Bots füllen dieses Feld aus, echte Nutzer nicht
  if (req.body.hp_website) {
    return res.status(400).json({ ok: false, error: 'Bot detected.' });
  }

  // Rate-Limiting: max. 3 Anfragen pro IP in 10 Minuten
  const ip     = req.ip;
  const now    = Date.now();
  const MAX    = 3;
  const hits   = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_WINDOW);
  if (hits.length >= MAX) {
    return res.status(429).json({ ok: false, error: 'Zu viele Anfragen. Bitte warten Sie einige Minuten.' });
  }
  hits.push(now);
  rateLimitMap.set(ip, hits);

  const { vorname, nachname, email, phone, strasse, plz, ort, message, consentKontakt } = req.body;

  // Nur bekannte Themen zulassen. Das ist zugleich der Schutz, der frueher als
  // Guard vor dem CRM stand: Versicherung wird ueber diese Website nicht mehr
  // angeboten (seit 25.09.2026). Jemand mit einer zwischengespeicherten Seite
  // koennte das alte Thema sonst weiterhin absenden, und es landete in einem
  // System, das es nach Paragraf 34d GewO nie beruehren darf. Unbekannte Themen
  // werden verworfen, statt weitergereicht.
  const themen = Array.isArray(req.body.themen)
    ? req.body.themen.filter(t => Object.prototype.hasOwnProperty.call(THEMEN_LABELS, t))
    : [];

  if (!vorname || !nachname || !email || !phone || !themen.length) {
    return res.status(400).json({ ok: false, error: 'Pflichtfelder fehlen.' });
  }

  // Adresse nur bei Energie-Themen Pflicht (Standorteinschätzung) –
  // bei reinem „Sonstiges" bleibt sie optional (Datenminimierung)
  const needsAddress = themen.includes('pv') || themen.includes('wp');
  if (needsAddress && (!strasse || !plz || !ort)) {
    return res.status(400).json({ ok: false, error: 'Pflichtfelder fehlen.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Ungültige E-Mail-Adresse.' });
  }

  // Double Opt-in: Submission zwischenspeichern und Bestätigungs-E-Mail senden
  const token = crypto.randomUUID();
  pendingMap.set(token, {
    payload: {
      vorname, nachname, email, phone, strasse, plz, ort, themen, message,
      consentKontakt: consentKontakt === true || consentKontakt === 'true',
      // Einmal je Absendevorgang, nicht je Versuch: schuetzt im CRM gegen
      // doppelte Verlaufseintraege, falls die Bestaetigung mehrfach anklickt wird.
      requestId: crypto.randomUUID(),
    },
    expiresAt: now + 24 * 60 * 60 * 1000,
  });

  const confirmUrl = `https://patrickleissner.de/api/confirm?token=${token}`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    `"Patrick Leißner Energieberatung" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: 'Bitte bestätigen Sie Ihre Anfrage – Patrick Leißner Energieberatung',
      text: `Hallo ${vorname},\n\nvielen Dank für Ihre Anfrage. Bitte bestätigen Sie diese durch Klick auf den folgenden Link:\n\n${confirmUrl}\n\nDer Link ist 24 Stunden gültig. Danach werden alle eingegebenen Daten automatisch gelöscht.\n\nRechtsgrundlage der Verarbeitung: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung). Verantwortlicher: Patrick Leißner, p@patrickleissner.de.\n\nFalls Sie keine Anfrage gestellt haben, ignorieren Sie diese E-Mail bitte – es wurden keine Daten weitergegeben.\n\nMit freundlichen Grüßen\nPatrick Leißner`,
      html: `
        <div style="font-family:sans-serif;font-size:15px;color:#222;max-width:600px;line-height:1.6">
          <p>Hallo ${vorname},</p>
          <p>vielen Dank für Ihre Anfrage. Bitte bestätigen Sie diese durch Klick auf den folgenden Button:</p>
          <p style="margin:24px 0">
            <a href="${confirmUrl}"
               style="background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
              Anfrage jetzt bestätigen
            </a>
          </p>
          <p style="color:#666;font-size:13px">Der Link ist <strong>24 Stunden gültig</strong>. Danach werden alle eingegebenen Daten automatisch gelöscht.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
          <p style="color:#888;font-size:12px">
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Verantwortlicher: Patrick Leißner, p@patrickleissner.de.<br>
            Falls Sie keine Anfrage gestellt haben, ignorieren Sie diese E-Mail – es wurden keine Daten weitergegeben.
          </p>
        </div>
      `,
    });

    res.json({ ok: true, status: 'pending' });
  } catch (err) {
    console.error('Mail error:', err.code, err.message);
    pendingMap.delete(token);
    res.status(500).json({ ok: false, error: 'E-Mail konnte nicht gesendet werden.', code: err.code || null, message: err.message || null });
  }
});

// ── Double Opt-in Bestätigung ────────────────────────────────────
app.get('/api/confirm', async (req, res) => {
  const { token } = req.query;
  const entry = token && pendingMap.get(token);

  if (!entry || entry.expiresAt < Date.now()) {
    pendingMap.delete(token);
    return res.redirect('/?confirmed=expired');
  }

  const { vorname, nachname, email, phone, strasse, plz, ort, themen, message, consentKontakt, requestId } = entry.payload;
  pendingMap.delete(token);

  const name         = `${vorname} ${nachname}`;
  const themenLabels = (themen || []).map(t => THEMEN_LABELS[t] || t);
  const themenText   = themenLabels.join(', ') || 'Allgemein';
  const safeMessage  = String(message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const phoneText    = phone || '–';
  const addressText  = (strasse || plz || ort) ? `${strasse || '–'}, ${plz || ''} ${ort || ''}`.trim() : '–';

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    `"Kontaktformular patrickleissner.de" <${process.env.SMTP_USER}>`,
      replyTo: `"${name}" <${email}>`,
      to:      process.env.MAIL_TO || 'p@patrickleissner.de',
      subject: `Bestätigte Anfrage: ${themenText} – ${name}`,
      text:    `Name: ${name}\nE-Mail: ${email}\nTelefon: ${phoneText}\nAdresse: ${addressText}\nThemen: ${themenText}\n\n${message || '(keine Nachricht)'}`,
      html: `
        <table style="font-family:sans-serif;font-size:15px;color:#222;max-width:600px">
          <tr><td><strong>Name:</strong></td><td>${name}</td></tr>
          <tr><td><strong>E-Mail:</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td><strong>Telefon:</strong></td><td>${phoneText}</td></tr>
          <tr><td><strong>Adresse:</strong></td><td>${addressText}</td></tr>
          <tr><td><strong>Themen:</strong></td><td>${themenText}</td></tr>
        </table>
        <hr style="margin:20px 0">
        <p style="font-family:sans-serif;font-size:15px;white-space:pre-wrap">${safeMessage || '(keine Nachricht)'}</p>
      `,
    });

    {
      // Eigenes Vertriebstool. Schlaegt es fehl, bleibt die Benachrichtigung an
      // MAIL_TO oben das Sicherheitsnetz - die Anfrage geht nicht verloren.
      await crmLead({
        quelle:     'kontaktformular',
        vorname, nachname, email, phone,
        strasse, plz, ort,
        interessen: crmInteressen(themen),
        nachricht:  mitEinwilligung(message, consentKontakt),
        request_id: requestId || token,
      });
    }

    res.redirect('/?confirmed=true');
  } catch (err) {
    console.error('Confirm mail error:', err.message);
    res.redirect('/?confirmed=error');
  }
});

// ── Lead-Gate (Energierechner nutzen.html) ───────────────────────
app.post('/api/lead', async (req, res) => {
  if (req.body.hp_website) return res.status(400).json({ ok: false, error: 'Bot detected.' });

  const ip = req.ip, now = Date.now(), MAX = 3;
  const hits = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_WINDOW);
  if (hits.length >= MAX) return res.status(429).json({ ok: false, error: 'Zu viele Anfragen.' });
  hits.push(now); rateLimitMap.set(ip, hits);

  const { vorname, nachname, email, phone, plz, rechnerdaten, interesse, consentAnalyse, consentKontakt } = req.body;

  if (!vorname || !nachname || !email || !plz || !consentAnalyse) {
    return res.status(400).json({ ok: false, error: 'Pflichtfelder fehlen.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Ungültige E-Mail-Adresse.' });
  }

  const token = crypto.randomUUID();
  pendingMap.set(token, {
    payload: {
      vorname, nachname, email,
      phone: String(phone || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      plz:   String(plz).replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      rechnerdaten,
      interesse: Array.isArray(interesse) ? interesse : [],
      consentKontakt: consentKontakt === true || consentKontakt === 'true',
      requestId: crypto.randomUUID(),
    },
    expiresAt: now + 24 * 60 * 60 * 1000,
  });

  const confirmUrl = `https://patrickleissner.de/api/lead-confirm?token=${token}`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    `"Patrick Leißner Energieberatung" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: 'Bitte bestätige deine E-Mail – Patrick Leißner Energieberatung',
      text: `Hallo ${vorname},\n\nbitte bestätige deine E-Mail-Adresse durch Klick auf diesen Link:\n\n${confirmUrl}\n\nDer Link ist 24 Stunden gültig. Danach werden alle eingegebenen Daten automatisch gelöscht.\n\nRechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Falls du keine Anfrage gestellt hast, ignoriere diese E-Mail.\n\nPatrick Leißner`,
      html: `<div style="font-family:sans-serif;font-size:15px;color:#222;max-width:600px;line-height:1.6">
        <p>Hallo ${vorname},</p>
        <p>bitte bestätige deine E-Mail-Adresse, damit wir dir deine unverbindliche Analyse zusenden können:</p>
        <p style="margin:24px 0"><a href="${confirmUrl}" style="background:#2E4F3C;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">E-Mail bestätigen</a></p>
        <p style="color:#666;font-size:13px">Der Link ist <strong>24 Stunden gültig</strong>. Danach werden alle Daten automatisch gelöscht.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="color:#888;font-size:12px">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Falls du keine Anfrage gestellt hast, ignoriere diese E-Mail – es wurden keine Daten weitergegeben.</p>
      </div>`,
    });
    res.json({ ok: true, status: 'pending' });
  } catch (err) {
    console.error('Lead DOI error:', err.message);
    pendingMap.delete(token);
    res.status(500).json({ ok: false, error: 'E-Mail konnte nicht gesendet werden.' });
  }
});

app.get('/api/lead-confirm', async (req, res) => {
  const { token } = req.query;
  const entry = token && pendingMap.get(token);

  if (!entry || entry.expiresAt < Date.now()) {
    pendingMap.delete(token);
    return res.redirect('/nutzen?confirmed=expired');
  }

  const { vorname, nachname, email, phone, plz, rechnerdaten, interesse, consentKontakt, requestId } = entry.payload;
  pendingMap.delete(token);
  const name = `${vorname} ${nachname}`;

  const safe = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const r     = rechnerdaten || {};
  const heute = safe(r.heute || '–');
  const neu   = safe(r.neu   || '–');
  const delta = safe(r.delta || '–');
  const bil20 = safe(r.bil20 || '–');
  const narr  = safe(r.narr  || '');
  const fuel  = safe(r.fuel  || '–');
  const DISCLAIMER = 'Unverbindliche Schätzung ohne Gewähr, basierend auf deinen Angaben und Durchschnittswerten. Keine zugesicherte Ersparnis.';

  // (a) Analyse-Mail an Nutzer über den eigenen Mailserver
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    `"Patrick Leißner Energieberatung" <${process.env.SMTP_USER}>`,
      replyTo: process.env.SMTP_USER,
      to:      email,
      subject: 'Deine unverbindliche Ersteinschätzung – Patrick Leißner Energieberatung',
      html:    `<!DOCTYPE html><html lang="de"><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
<div style="background:#2E4F3C;padding:28px 32px;border-radius:12px 12px 0 0">
  <p style="color:#D0AB3B;font-weight:800;font-size:1.1rem;margin:0">Patrick Leißner · Energieberatung</p>
  <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:0.85rem">Deine unverbindliche Ersteinschätzung</p>
</div>
<div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none">
  <p>Hallo ${safe(vorname)},</p>
  <p>hier ist deine unverbindliche Ersteinschätzung auf Basis deiner Angaben.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    <tr>
      <td style="background:#f3f4f6;padding:16px;text-align:center;border-radius:8px 0 0 8px">
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:6px">Heute gibst du weg</div>
        <div style="font-size:1.8rem;font-weight:800;color:#1a1a1a">${heute}</div>
        <div style="font-size:0.75rem;color:#6b7280;margin-top:4px">pro Monat</div>
      </td>
      <td style="background:#2E4F3C;padding:16px;text-align:center;border-radius:0 8px 8px 0">
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.6);margin-bottom:6px">Stattdessen in dein Eigentum</div>
        <div style="font-size:1.8rem;font-weight:800;color:#D0AB3B">${neu}</div>
        <div style="font-size:0.75rem;color:rgba(255,255,255,.6);margin-top:4px">pro Monat</div>
      </td>
    </tr>
  </table>
  <div style="background:#fef9e7;border-radius:8px;padding:14px 18px;margin-bottom:20px;text-align:center">
    <span style="font-size:1rem;font-weight:800;color:#2E4F3C">${delta}</span>
    &nbsp;·&nbsp;
    <span style="color:#6b7280;font-size:0.85rem">In 20 Jahren schätzungsweise <strong style="color:#2E4F3C">${bil20}</strong> weniger ans Netz</span>
  </div>
  <p style="color:#4b5563;font-size:0.9rem;line-height:1.7;border-left:3px solid #2E4F3C;padding-left:14px;margin:0 0 20px">${narr}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:0.78rem;color:#9ca3af;line-height:1.6;margin:0">${DISCLAIMER}</p>
</div>
<div style="background:#f3f4f6;padding:18px 32px;border-radius:0 0 12px 12px;text-align:center">
  <p style="font-weight:800;color:#2E4F3C;margin:0 0 4px">Patrick Leißner</p>
  <p style="font-size:0.8rem;color:#6b7280;margin:0">patrickleissner.de &nbsp;·&nbsp; <a href="https://patrickleissner.de/termin" style="color:#2E4F3C">Termin buchen</a></p>
</div>
</body></html>`,
    });
  } catch (err) {
    console.error('Lead analyse-mail error:', err.message);
  }

  // (b) Benachrichtigung an MAIL_TO via SMTP
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    `"Lead patrickleissner.de" <${process.env.SMTP_USER}>`,
      replyTo: `"${safe(name)}" <${email}>`,
      to:      process.env.MAIL_TO || 'p@patrickleissner.de',
      subject: `Neuer bestätigter Lead: ${safe(name)} – Energierechner`,
      html: `<table style="font-family:sans-serif;font-size:15px;color:#222;max-width:600px">
        <tr><td><strong>Name:</strong></td><td>${safe(name)}</td></tr>
        <tr><td><strong>E-Mail:</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td><strong>Telefon:</strong></td><td>${phone || '–'}</td></tr>
        <tr><td><strong>PLZ:</strong></td><td>${plz}</td></tr>
        <tr><td><strong>Heizung:</strong></td><td>${fuel}</td></tr>
        <tr><td><strong>Heute/Neu:</strong></td><td>${heute} → ${neu}/Monat</td></tr>
        <tr><td><strong>20-J.-Vorteil:</strong></td><td>${bil20}</td></tr>
        <tr><td><strong>Kontakt-Consent:</strong></td><td>${consentKontakt ? 'Ja' : 'Nein'}</td></tr>
      </table>`,
    });
  } catch (err) {
    console.error('Lead notify error:', err.message);
  }

  // Eigenes Vertriebstool. Bei einem Fehler bleibt die Benachrichtigung oben.
  await crmLead({
    quelle:     'energierechner',
    vorname, nachname, email, phone,
    strasse:    '', plz, ort: '',
    interessen: crmInteressen(interesse),
    nachricht:  mitEinwilligung(r.narr, consentKontakt),
    request_id: requestId || token,
  });

  res.redirect('/nutzen?confirmed=true');
});

// ── Spotpreis (EPEX SPOT Day-Ahead via Fraunhofer ISE Energy-Charts API) ──
// Kein API-Key nötig, kostenlos, öffentlich. Serverseitiger Proxy vermeidet
// Drittanbieter-Anfragen direkt aus dem Browser des Besuchers.
let spotCache = { data: null, expiresAt: 0 };

app.get('/api/spotprice', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (spotCache.data && Date.now() < spotCache.expiresAt) {
    return res.json(spotCache.data);
  }

  try {
    const raw = await new Promise((resolve, reject) => {
      const url = 'https://api.energy-charts.info/price?bzn=DE-LU';
      https.get(url, { headers: { 'Accept': 'application/json' } }, (r) => {
        let buf = '';
        r.on('data', c => buf += c);
        r.on('end', () => {
          if (r.statusCode !== 200) return reject(new Error(`API ${r.statusCode}`));
          try { resolve(JSON.parse(buf)); } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });

    const prices = (raw.unix_seconds || []).map((ts, i) => {
      const priceCtKwh = (raw.price[i] ?? 0) / 10; // EUR/MWh → ct/kWh
      const d = new Date(ts * 1000);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      return { ts, label: `${hh}:${mm}`, priceCtKwh: +priceCtKwh.toFixed(2), negative: priceCtKwh < 0 };
    });

    const payload = { source: 'Fraunhofer ISE Energy-Charts (EPEX SPOT DE-LU)', updated: new Date().toISOString(), prices };
    spotCache = { data: payload, expiresAt: Date.now() + 60 * 60 * 1000 }; // 60 min TTL
    res.json(payload);
  } catch (err) {
    console.error('Spotprice API error:', err.message);
    res.status(503).json({ error: 'Preisdaten momentan nicht verfügbar.', detail: err.message });
  }
});

// Unbekannte Pfade → Startseite (Verhalten wie bisher)
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
