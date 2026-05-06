const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

// Clean URLs for sub-pages
app.get('/beratung-technik', (req, res) => {
  res.sendFile(path.join(__dirname, 'beratung-technik.html'));
});
app.get('/koordination-netzwerk', (req, res) => {
  res.sendFile(path.join(__dirname, 'koordination-netzwerk.html'));
});
app.get('/analyse-vorsorge', (req, res) => {
  res.sendFile(path.join(__dirname, 'analyse-vorsorge.html'));
});
app.get('/energierechner', (req, res) => {
  res.sendFile(path.join(__dirname, 'energierechner.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
