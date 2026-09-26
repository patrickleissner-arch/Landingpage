/* ==========================================================================
   pages.js: Gemeinsames Verhalten der Unterseiten
   FAQ-Akkordeon und Two-Click-Consent für den HTW-Solarisator.
   Wird nur eingebunden, wenn die Seite keine eigene Version davon mitbringt.
   ========================================================================== */
(function () {
  'use strict';

  // FAQ-Akkordeon (immer nur ein Eintrag offen)
  // Häufige Fragen: Höhe springt ohne Layout-Animation, der Inhalt blendet
  // per opacity/transform ein. Die geöffnete Frage steht in der Adresse,
  // damit sich ein Link direkt auf eine Antwort teilen lässt.
  const triggers = [...document.querySelectorAll('.sp-faq-trigger')];
  const oeffne = (trigger, merken) => {
    triggers.forEach(t => { t.setAttribute('aria-expanded', 'false'); t.nextElementSibling.style.height = '0'; });
    if (!trigger) {
      if (merken) history.replaceState(null, '', location.pathname + location.search);
      return;
    }
    trigger.setAttribute('aria-expanded', 'true');
    trigger.nextElementSibling.style.height = 'auto';
    if (merken) history.replaceState(null, '', '#' + trigger.nextElementSibling.id);
  };
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      oeffne(trigger.getAttribute('aria-expanded') === 'true' ? null : trigger, true);
    });
  });
  if (location.hash) {
    const ziel = triggers.find(t => '#' + t.getAttribute('aria-controls') === location.hash);
    if (ziel) { oeffne(ziel, false); ziel.scrollIntoView({ block: 'center' }); }
  }

  // HTW-Solarisator: iframe erst nach ausdrücklichem Klick laden
  const consent = document.getElementById('solarisator-consent');
  const btn = document.getElementById('solarisator-consent-btn');
  const embed = document.getElementById('solarisator-embed');
  if (consent && btn && embed) {
    btn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://solar.htw-berlin.de/solarisator/';
      iframe.title = 'Solarisator, Unabhängigkeitsrechner der HTW Berlin';
      iframe.width = '1024';
      iframe.height = '660';
      iframe.loading = 'lazy';
      iframe.setAttribute('aria-label', 'Interaktiver PV-Unabhängigkeitsrechner der HTW Berlin');
      embed.appendChild(iframe);
      embed.hidden = false;
      consent.hidden = true;
    });
  }
})();
