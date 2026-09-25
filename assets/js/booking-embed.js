/*
 * Terminbuchung (termin.html): Der Rahmen folgt der Höhe seines Inhalts.
 * Gegenstück: custom/assets/pl-embed.js im Easy!Appointments-Container
 * (/docker/patrick-termin auf dem VPS). Es kommen nur Höhen und Signale an,
 * keine Formulardaten.
 *
 * Ohne Meldung (Easy!Appointments nicht erreichbar, alte Version) bleibt die
 * feste Höhe aus subpage.css stehen – die Buchung funktioniert dann wie bisher.
 */
(function () {
  'use strict';

  var TERMIN = 'https://termin.patrickleissner.de';
  var rahmen = document.querySelector('.booking-embed iframe');
  if (!rahmen) return;

  var seitenGeladen = 0;

  function kopfHoehe() {
    var kopf = document.getElementById('site-header');
    return kopf ? kopf.offsetHeight : 0;
  }

  // Nach einem Schrittwechsel steht der Anfang des Formulars oft über dem
  // Bildschirm, weil der Besucher unten auf „Weiter“ getippt hat.
  function zumAnfang() {
    var abstand = rahmen.getBoundingClientRect().top - kopfHoehe() - 12;
    if (abstand < 0) window.scrollBy({ top: abstand, behavior: 'smooth' });
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== TERMIN || e.source !== rahmen.contentWindow) return;
    var d = e.data;
    if (!d || d.quelle !== 'pl-termin') return;

    if (d.typ === 'hoehe') {
      var h = Math.round(+d.wert);
      if (h >= 300 && h <= 8000) {
        rahmen.style.height = h + 'px';
        rahmen.style.minHeight = '0';
      }
    } else if (d.typ === 'schritt') {
      zumAnfang();
    } else if (d.typ === 'geladen') {
      // Erste Seite: nichts tun. Jede weitere (z. B. Bestätigung): nach oben.
      if (seitenGeladen++ > 0) zumAnfang();
    } else if (d.typ === 'dialog') {
      // Sichtbarer Ausschnitt des Rahmens: unter der Kopfzeile, im Bildschirm.
      var r = rahmen.getBoundingClientRect();
      var von = Math.max(kopfHoehe(), r.top);
      var bis = Math.min(window.innerHeight, r.bottom);
      rahmen.contentWindow.postMessage(
        { quelle: 'pl-website', typ: 'sichtbar', oben: Math.round(von - r.top), hoehe: Math.round(bis - von) },
        TERMIN
      );
    }
  });
})();
