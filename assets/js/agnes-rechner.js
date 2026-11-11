(function(){
'use strict';
const $=id=>document.getElementById(id);
const eur=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:2});
const number=new Intl.NumberFormat('de-DE',{maximumFractionDigits:2});
let example=false;
function update(){
  const mode=$('customer').value, business=mode==='business', home=mode==='home';
  $('business-fields').hidden=!business;
  $('numeric').hidden=true;
  $('input-error').hidden=true;
  $('example-note').hidden=!example;
  $('result-title').textContent=home?'Dein Tarif entscheidet.':business?'Was verändert eine niedrigere Spitze?':'Kostenrisiko erkennen.';
  $('guidance').textContent=home?'Ohne Jahresleistungspreis lässt sich aus einer einzelnen Lastspitze keine zusätzliche Jahresgebühr ableiten. Bei zeitvariablen Tarifen können verschobene Lade- und Heizzeiten Kosten senken. Dafür brauchen wir deine Tarifzeiten und Verbrauchsdaten.':business?'Trage deine gemessene Spitze, deinen Leistungspreis und ein Prüfziel ein. Der Vergleich zeigt nur den Leistungskostenanteil.':'Ob Lastspitzen deine Rechnung erhöhen, hängt vom Tarif ab. Prüfe den Leistungspreis auf deiner Jahresrechnung. Mit Lastgang und Netzpreisblatt ermitteln wir anschließend dein konkretes Potenzial.';
  $('takeaway-title').textContent=home?'Ladezeiten, Heizen und Eigenverbrauch gemeinsam prüfen.':'Dein nächster Schritt: Daten statt Vermutungen.';
  $('takeaway-copy').textContent=home?'Wir prüfen zuerst, ob dein Tarif und die steuerbaren Verbraucher eine Verschiebung wirtschaftlich machen. Ein Speicher ist eine mögliche Maßnahme und muss zum Verbrauch passen.':'Fordere beim Netzbetreiber oder Messstellenbetreiber den Viertelstundenlastgang eines vollständigen Abrechnungsjahres an. Wir prüfen die Spitzen, geeignete Maßnahmen und deren Wirtschaftlichkeit.';
  if(!business)return;
  const ids=['peak','target','price'];
  if(ids.some(id=>$(id).value===''))return;
  if(ids.some(id=>!$(id).checkValidity()) || Number($('target').value)>Number($('peak').value)){
    $('input-error').textContent='Bitte gib gültige, nicht negative Werte ein. Die begrenzte Spitze darf nicht über der gemessenen Spitze liegen.';
    $('input-error').hidden=false;return;
  }
  if(!$('same-tariff').checked){
    $('guidance').textContent='Bestätige die Annahme gleicher Tarifklasse und gleichen Leistungspreises, um den vereinfachten Vergleich zu sehen. Ist die Tarifzuordnung unklar, prüfen wir sie mit deinem Jahresbezug und Preisblatt.';return;
  }
  const peak=Number($('peak').value),target=Number($('target').value),price=Number($('price').value),years=Number($('years').value);
  const r=AgnesModel.calculate(peak,target,price,years);
  $('numeric').hidden=false;
  $('basis').textContent=example?'Rechenbeispiel · keine individuellen Messdaten':'Modellrechnung mit deinen Eingaben · technische Machbarkeit noch offen';
  $('current').textContent=eur.format(r.current);$('limited').textContent=eur.format(r.limited);$('saving').textContent=eur.format(r.saving);
  $('bar-current').style.width=(r.current>0?100:0)+'%';$('bar-target').style.width=(r.current>0?r.limited/r.current*100:0)+'%';
  $('risk').textContent=r.saving>0?'Wenn diese Begrenzung ganzjährig gelingt, beträgt der rechnerische Unterschied '+eur.format(r.total)+(years===1?' in einem vollständigen Jahr.':' in '+years+' vollständigen Jahren.'):'Mit diesen Eingaben entsteht kein Unterschied bei den Leistungskosten.';
  $('formula').textContent='Rechenweg pro Jahr: ('+number.format(peak)+' − '+number.format(target)+') kW × '+number.format(price)+' €/kW/Jahr = '+eur.format(r.saving)+'.';
}
['customer','peak','target','price','years','same-tariff'].forEach(id=>$(id).addEventListener('input',()=>{if(['peak','target','price'].includes(id))example=false;update();}));
$('example').addEventListener('click',()=>{
  $('peak').value='100';$('target').value='70';$('price').value='100';$('same-tariff').checked=true;example=true;update();
});
update();
})();
