(()=>{if(!['localhost','127.0.0.1'].includes(location.hostname))return;
const form=document.getElementById('lead-gate-form');if(form){const note=document.createElement('p');note.textContent='Der E-Mail-Versand ist in dieser Vorschau nicht verfügbar. Deine Berechnung kannst du hier ansehen; für eine Beratung nutze die Terminbuchung.';form.before(note);form.hidden=true;}
})();
