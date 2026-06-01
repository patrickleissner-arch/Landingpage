require('dotenv').config();
const express    = require('express');
const path       = require('path');
const nodemailer = require('nodemailer');
const crypto     = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

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
const SUBJECT_LABELS = {
  pv:    'Photovoltaikanlage',
  wp:    'Wärmepumpe',
  both:  'PV + Wärmepumpe',
  other: 'Sonstiges',
};

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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
  const WINDOW = 10 * 60 * 1000;
  const MAX    = 3;
  const hits   = (rateLimitMap.get(ip) || []).filter(t => now - t < WINDOW);
  if (hits.length >= MAX) {
    return res.status(429).json({ ok: false, error: 'Zu viele Anfragen. Bitte warten Sie einige Minuten.' });
  }
  hits.push(now);
  rateLimitMap.set(ip, hits);

  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Pflichtfelder fehlen.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Ungültige E-Mail-Adresse.' });
  }

  // Double Opt-in: Submission zwischenspeichern und Bestätigungs-E-Mail senden
  const token = crypto.randomUUID();
  pendingMap.set(token, {
    payload:   { name, email, phone, subject, message },
    expiresAt: now + 24 * 60 * 60 * 1000,
  });

  const confirmUrl = `https://patrickleissner.de/api/confirm?token=${token}`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    `"Patrick Leißner Energieberatung" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: 'Bitte bestätigen Sie Ihre Anfrage – Patrick Leißner Energieberatung',
      text: `Hallo ${name},\n\nvielen Dank für Ihre Anfrage. Bitte bestätigen Sie diese durch Klick auf den folgenden Link:\n\n${confirmUrl}\n\nDer Link ist 24 Stunden gültig. Danach werden alle eingegebenen Daten automatisch gelöscht.\n\nRechtsgrundlage der Verarbeitung: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung). Verantwortlicher: Patrick Leißner, p@patrickleissner.de.\n\nFalls Sie keine Anfrage gestellt haben, ignorieren Sie diese E-Mail bitte – es wurden keine Daten weitergegeben.\n\nMit freundlichen Grüßen\nPatrick Leißner`,
      html: `
        <div style="font-family:sans-serif;font-size:15px;color:#222;max-width:600px;line-height:1.6">
          <p>Hallo ${name},</p>
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
    console.error('Mail error:', err.message);
    pendingMap.delete(token);
    res.status(500).json({ ok: false, error: 'E-Mail konnte nicht gesendet werden.' });
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

  const { name, email, phone, subject, message } = entry.payload;
  pendingMap.delete(token);

  const subjectLabel = SUBJECT_LABELS[subject] || subject || 'Allgemein';
  const safeMessage  = String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    `"Kontaktformular patrickleissner.de" <${process.env.SMTP_USER}>`,
      replyTo: `"${name}" <${email}>`,
      to:      process.env.MAIL_TO || 'p@patrickleissner.de',
      subject: `Bestätigte Anfrage: ${subjectLabel} – ${name}`,
      text:    `Name: ${name}\nE-Mail: ${email}\nTelefon: ${phone || '–'}\nBetreff: ${subjectLabel}\n\n${message}`,
      html: `
        <table style="font-family:sans-serif;font-size:15px;color:#222;max-width:600px">
          <tr><td><strong>Name:</strong></td><td>${name}</td></tr>
          <tr><td><strong>E-Mail:</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td><strong>Telefon:</strong></td><td>${phone || '–'}</td></tr>
          <tr><td><strong>Betreff:</strong></td><td>${subjectLabel}</td></tr>
        </table>
        <hr style="margin:20px 0">
        <p style="font-family:sans-serif;font-size:15px;white-space:pre-wrap">${safeMessage}</p>
      `,
    });
    res.redirect('/?confirmed=true');
  } catch (err) {
    console.error('Confirm mail error:', err.message);
    res.redirect('/?confirmed=error');
  }
});

// ── Clean URLs ───────────────────────────────────────────────────
app.get('/beratung-technik',    (req, res) => res.sendFile(path.join(__dirname, 'beratung-technik.html')));
app.get('/koordination-netzwerk', (req, res) => res.sendFile(path.join(__dirname, 'koordination-netzwerk.html')));
app.get('/analyse-vorsorge',    (req, res) => res.sendFile(path.join(__dirname, 'analyse-vorsorge.html')));
app.get('/energierechner',      (req, res) => res.sendFile(path.join(__dirname, 'energierechner.html')));
app.get('/solarisator',          (req, res) => res.sendFile(path.join(__dirname, 'solarisator.html')));
app.get('/waermepumpe-heizlast', (req, res) => res.sendFile(path.join(__dirname, 'waermepumpe-heizlast.html')));
app.get('/mieterstrom',          (req, res) => res.sendFile(path.join(__dirname, 'mieterstrom.html')));
app.get('/impressum',            (req, res) => res.sendFile(path.join(__dirname, 'impressum.html')));
app.get('/datenschutz',         (req, res) => res.sendFile(path.join(__dirname, 'datenschutz.html')));
app.get('/termin',              (req, res) => res.sendFile(path.join(__dirname, 'termin.html')));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
