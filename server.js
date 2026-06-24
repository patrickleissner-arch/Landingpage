const path       = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express    = require('express');
const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const https      = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

// Hostinger liefert Requests über einen internen Reverse-Proxy/CDN aus –
// ohne trust proxy würde req.ip sonst dessen Adresse statt der echten
// Besucher-IP liefern und das Rate-Limiting würde alle Besucher gemeinsam treffen.
app.set('trust proxy', true);

app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── In-Memory Stores ─────────────────────────────────────────────
const rateLimitMap = new Map(); // ip → [timestamps]
const pendingMap   = new Map(); // token → { payload, expiresAt }

// Abgelaufene Pending-Einträge alle 30 min bereinigen
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of pendingMap) {
    if (v.expiresAt < now) pendingMap.delete(k);
  }
}, 30 * 60 * 1000);

// ── Contact form ─────────────────────────────────────────────────
const THEMEN_LABELS = {
  pv:           'Photovoltaikanlage',
  wp:           'Wärmepumpe',
  versicherung: 'Versicherungscheck',
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

function brevoPost(apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.brevo.com',
      path: apiPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function brevoTrackEvent(email, eventName, eventProperties) {
  const res = await brevoPost('/v3/events', {
    event_name: eventName,
    identifiers: { email_id: email },
    event_properties: eventProperties,
  });
  if (res.status >= 400) {
    throw new Error(`${res.status} ${res.body}`);
  }
}

// Legt einen Kontakt an/merged ihn und gibt zuverlässig die numerische
// Brevo-Kontakt-ID zurück (auch wenn der Kontakt schon existiert).
async function brevoUpsertContact(email, attributes) {
  try {
    const body = { email, attributes, updateEnabled: true, forceMerge: true, getId: true };
    const res = await brevoPost('/v3/contacts', body);
    if (res.status >= 400) {
      console.error('Brevo contact upsert error:', res.status, res.body);
      return null;
    }
    return JSON.parse(res.body).id || null;
  } catch (err) {
    console.error('Brevo contact upsert error:', err.message);
    return null;
  }
}

// Legt einen Deal in der konfigurierten Vertriebspipeline an (Art. 6 Abs. 1
// lit. b DSGVO – digitale Variante der bisherigen Anfragebearbeitung).
async function brevoCreateDeal(name, contactId) {
  if (!process.env.BREVO_PIPELINE_ID || !process.env.BREVO_DEAL_STAGE_ID) return;
  try {
    const res = await brevoPost('/v3/crm/deals', {
      name,
      attributes: {
        pipeline:   process.env.BREVO_PIPELINE_ID,
        deal_stage: process.env.BREVO_DEAL_STAGE_ID,
      },
      linkedContactsIds: contactId ? [contactId] : [],
    });
    if (res.status >= 400) {
      console.error('Brevo deal creation error:', res.status, res.body);
    }
  } catch (err) {
    console.error('Brevo deal creation error:', err.message);
  }
}

app.post('/api/contact', async (req, res) => {
  // Honeypot: Bots füllen dieses Feld aus, echte Nutzer nicht
  if (req.body.hp_website) {
    return res.status(400).json({ ok: false, error: 'Bot detected.' });
  }

  // Rate-Limiting: max. 3 Anfragen pro IP in 10 Minuten
  const ip     = req.ip;
  const now    = Date.now();
  const WINDOW = 10 * 60 * 1000;
  const MAX    = 3;
  const hits   = (rateLimitMap.get(ip) || []).filter(t => now - t < WINDOW);
  if (hits.length >= MAX) {
    return res.status(429).json({ ok: false, error: 'Zu viele Anfragen. Bitte warten Sie einige Minuten.' });
  }
  hits.push(now);
  rateLimitMap.set(ip, hits);

  const { vorname, nachname, email, phone, strasse, plz, ort, themen, message, consentKontakt } = req.body;

  if (!vorname || !nachname || !email || !phone || !Array.isArray(themen) || !themen.length) {
    return res.status(400).json({ ok: false, error: 'Pflichtfelder fehlen.' });
  }

  // Adresse nur bei Energie-Themen Pflicht (Standorteinschätzung) –
  // bei reinem Versicherungscheck/Sonstiges bleibt sie optional (Datenminimierung)
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

  const { vorname, nachname, email, phone, strasse, plz, ort, themen, message, consentKontakt } = entry.payload;
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

    // Versicherungsbezogene Anfragen dürfen Brevo nie berühren (§ 34d GewO –
    // Patrick handelt Versicherung persönlich, getrennt von der UG/Energie-CRM).
    // Sobald "versicherung" unter den Themen ist, wird die GESAMTE Anfrage
    // ausschließlich per E-Mail an MAIL_TO bearbeitet (siehe oben) – kein
    // Kontakt, kein Deal, keine Liste, kein Event, auch nicht für ggf.
    // gleichzeitig ausgewählte Energie-Themen.
    if (!themen.includes('versicherung')) {
      // Basis-Kontakt + Deal: immer, unabhängig von consentKontakt (Art. 6 Abs. 1 lit. b)
      const contactId = await brevoUpsertContact(
        email,
        { VORNAME: vorname, NACHNAME: nachname, SMS: phone, STRASSE: strasse, PLZ: plz, STADT: ort, THEMEN: themenText }
      );
      await brevoCreateDeal(`${themenText}: ${name}`, contactId);

      // Event immer (consentKontakt als Property) – die Automation in Brevo
      // entscheidet anhand dieser Property, ob Liste/Welcome-Mail ausgelöst werden.
      try {
        await brevoTrackEvent(email, 'kontakt_bestaetigt', { themen: themenText, plz, ort, consentKontakt });
      } catch (err) {
        console.error('Brevo event error (contact form):', err.message);
      }
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

  const ip = req.ip, now = Date.now(), WINDOW = 10 * 60 * 1000, MAX = 3;
  const hits = (rateLimitMap.get(ip) || []).filter(t => now - t < WINDOW);
  if (hits.length >= MAX) return res.status(429).json({ ok: false, error: 'Zu viele Anfragen.' });
  hits.push(now); rateLimitMap.set(ip, hits);

  const { vorname, nachname, email, phone, plz, rechnerdaten, consentAnalyse, consentKontakt } = req.body;

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
      consentKontakt: consentKontakt === true || consentKontakt === 'true',
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

  const { vorname, nachname, email, phone, plz, rechnerdaten, consentKontakt } = entry.payload;
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

  // (a) Analyse-Mail an Nutzer via Brevo
  try {
    const senderEmail = process.env.BREVO_SENDER || 'info@patrickleissner.de';
    await brevoPost('/v3/smtp/email', {
      sender:      { name: 'Patrick Leißner', email: senderEmail },
      replyTo:     { name: 'Patrick Leißner', email: senderEmail },
      to:          [{ email, name }],
      subject:     'Deine unverbindliche Ersteinschätzung – Patrick Leißner Energieberatung',
      htmlContent: `<!DOCTYPE html><html lang="de"><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
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

  // Basis-Kontakt + Deal: immer, unabhängig von consentKontakt (Art. 6 Abs. 1 lit. b)
  const contactId = await brevoUpsertContact(
    email,
    { VORNAME: safe(vorname), NACHNAME: safe(nachname), SMS: safe(phone) || undefined, PLZ: plz }
  );
  await brevoCreateDeal(`Energierechner: ${safe(name)} (${plz})`, contactId);

  // Event immer (consentKontakt als Property) – die Automation in Brevo
  // entscheidet anhand dieser Property, ob Liste/Welcome-Mail ausgelöst werden.
  try {
    await brevoTrackEvent(email, 'energierechner_bestaetigt', { plz, heizung: r.fuel || '', consentKontakt });
  } catch (err) {
    console.error('Brevo event error:', err.message);
  }

  res.redirect('/nutzen?confirmed=true');
});

// ── Clean URLs ───────────────────────────────────────────────────
app.get('/beratung-technik',    (req, res) => res.sendFile(path.join(__dirname, 'beratung-technik.html')));
app.get('/koordination-netzwerk', (req, res) => res.sendFile(path.join(__dirname, 'koordination-netzwerk.html')));
app.get('/analyse-vorsorge',    (req, res) => res.sendFile(path.join(__dirname, 'analyse-vorsorge.html')));
app.get('/unabhaengigkeit',      (req, res) => res.sendFile(path.join(__dirname, 'unabhaengigkeit.html')));
app.get('/nutzen',               (req, res) => res.sendFile(path.join(__dirname, 'nutzen.html')));
app.get('/heizkosten',           (req, res) => res.sendFile(path.join(__dirname, 'heizkosten.html')));
app.get('/solarisator',          (req, res) => res.redirect(301, '/unabhaengigkeit'));
app.get('/energierechner',       (req, res) => res.redirect(301, '/nutzen'));
app.get('/waermepumpe-rechner',  (req, res) => res.redirect(301, '/heizkosten'));
app.get('/waermepumpe-heizlast', (req, res) => res.sendFile(path.join(__dirname, 'waermepumpe-heizlast.html')));
app.get('/mieterstrom',          (req, res) => res.sendFile(path.join(__dirname, 'mieterstrom.html')));
app.get('/impressum',            (req, res) => res.sendFile(path.join(__dirname, 'impressum.html')));
app.get('/datenschutz',         (req, res) => res.sendFile(path.join(__dirname, 'datenschutz.html')));
app.get('/termin',              (req, res) => res.sendFile(path.join(__dirname, 'termin.html')));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
