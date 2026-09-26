/* ==========================================================================
   pages.js: Gemeinsames Verhalten der Unterseiten
   FAQ-Akkordeon und Two-Click-Consent für den HTW-Solarisator.
   Wird nur eingebunden, wenn die Seite keine eigene Version davon mitbringt.
   ========================================================================== */
(function () {
  'use strict';

  // FAQ-Akkordeon (immer nur ein Eintrag offen)
  const triggers = document.querySelectorAll('.sp-faq-trigger');
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const panel = trigger.nextElementSibling;
      triggers.forEach(t => { t.setAttribute('aria-expanded', 'false'); t.nextElementSibling.style.height = '0'; });
      if (!isExpanded) {
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.height = panel.querySelector('.sp-faq-panel-inner').offsetHeight + 'px';
      }
    });
  });

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
