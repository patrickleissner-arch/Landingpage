/* Shared contact behavior: phone dialing on smartphones, copying elsewhere. */
(()=>{
  const ua=navigator.userAgent || '';
  const tablet=/iPad|Tablet|Android(?!.*Mobile)/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints>1);
  // Browser signals are a best-effort classification, not a telephony capability test.
  const phone=!tablet && (/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua) || navigator.userAgentData?.mobile===true);
  document.documentElement.dataset.contactDevice=phone?'phone':tablet?'tablet':'desktop';
  if(!phone){
    const status=document.createElement('span');
    status.className='contact-copy-status';status.setAttribute('role','status');
    document.body.append(status);
    let timer;
    document.querySelectorAll('a[href^="tel:"]').forEach(link=>{
      const number=link.getAttribute('href').slice(4);
      const label=number==='+491734994994'?'0173 499 4994':number;
      const button=document.createElement('button');
      button.type='button';button.className=link.className+' contact-copy';
      button.setAttribute('aria-label',`Telefonnummer ${label} kopieren`);
      button.title='Telefonnummer kopieren';
      if(link.classList.contains('dock__call')){
        const value=document.createElement('span');value.textContent=label;
        const hint=document.createElement('small');hint.textContent='Nummer kopieren';
        button.append(value,hint);
      }else button.textContent=label;
      button.addEventListener('click',async()=>{
        clearTimeout(timer);
        try{
          if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(number);
          status.textContent='Telefonnummer kopiert';
        }catch{
          const range=document.createRange();range.selectNodeContents(button.firstChild);
          const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
          status.textContent=`Bitte die markierte Telefonnummer kopieren: ${label}`;
        }
        timer=setTimeout(()=>{status.textContent=''},5000);
      });
      link.replaceWith(button);
    });
  }
  const dock=document.querySelector('.dock');if(!dock)return;
  let pending=false;
  function update(){pending=false;const shown=window.scrollY>24;document.documentElement.classList.toggle('dock-shown',shown);dock.inert=!shown;dock.setAttribute('aria-hidden',String(!shown));}
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update)}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('pageshow',update);update();
})();
