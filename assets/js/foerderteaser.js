/* Vorschau-Kachel zum Förderrechner: Tage bis zum nächsten Stichtag der
   KfW-Heizungsförderung 458 (01.02. und 01.08., erstmals 01.02.2027). */
(() => {
  const el = document.querySelector('[data-foerder-countdown]');
  if (!el) return;
  const jetzt = new Date();
  let tag = new Date(2027, 1, 1);
  while (tag <= jetzt) tag = new Date(tag.getFullYear() + (tag.getMonth() === 7 ? 1 : 0), tag.getMonth() === 7 ? 1 : 7, 1);
  const tage = Math.floor((tag - jetzt) / 864e5);
  const datum = tag.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  el.textContent = `Noch ${tage} Tage bis zur nächsten Absenkung am ${datum}.`;
})();
