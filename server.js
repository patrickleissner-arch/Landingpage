require('dotenv').config();
const express  = require('express');
const path     = require('path');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Contact form ─────────────────────────────────────────────────
const SUBJECT_LABELS = {
  pv:    'Photovoltaikanlage',
  wp:    'Wärmepumpe',
  both:  'PV + Wärmepumpe',
  other: 'Sonstiges',
};

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Pflichtfelder fehlen.' });
  }

  // Rudimentary email validation to block obvious injections
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Ungültige E-Mail-Adresse.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subjectLabel = SUBJECT_LABELS[subject] || subject || 'Allgemein';
    const safeMessage  = String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');

    await transporter.sendMail({
      from:    `"Kontaktformular patrickleissner.de" <${process.env.SMTP_USER}>`,
      replyTo: `"${name}" <${email}>`,
      to:      process.env.MAIL_TO || 'info@pin-co.de',
      subject: `Anfrage: ${subjectLabel} – ${name}`,
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

    res.json({ ok: true });
  } catch (err) {
    console.error('Mail error:', err.message);
    res.status(500).json({ ok: false, error: 'E-Mail konnte nicht gesendet werden.' });
  }
});

// ── Clean URLs ───────────────────────────────────────────────────
app.get('/beratung-technik',    (req, res) => res.sendFile(path.join(__dirname, 'beratung-technik.html')));
app.get('/koordination-netzwerk', (req, res) => res.sendFile(path.join(__dirname, 'koordination-netzwerk.html')));
app.get('/analyse-vorsorge',    (req, res) => res.sendFile(path.join(__dirname, 'analyse-vorsorge.html')));
app.get('/energierechner',      (req, res) => res.sendFile(path.join(__dirname, 'energierechner.html')));
app.get('/solarisator',         (req, res) => res.sendFile(path.join(__dirname, 'solarisator.html')));
app.get('/impressum',           (req, res) => res.sendFile(path.join(__dirname, 'impressum.html')));
app.get('/datenschutz',         (req, res) => res.sendFile(path.join(__dirname, 'datenschutz.html')));
app.get('/termin',              (req, res) => res.sendFile(path.join(__dirname, 'termin.html')));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
