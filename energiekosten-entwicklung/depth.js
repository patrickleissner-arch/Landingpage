(()=>{
 'use strict';
 const intro=document.querySelector('.history-intro'),stack=document.querySelector('.energy-stack');
 if(!intro||!stack)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 const disabled=()=>reduced.matches||document.documentElement.classList.contains('motion-paused');
 let frame=0,x=0,y=0;
 function reset(){cancelAnimationFrame(frame);frame=0;stack.style.removeProperty('--energy-rx');stack.style.removeProperty('--energy-ry');}
 intro.addEventListener('pointermove',event=>{
  if(disabled()||!fine.matches)return;
  const rect=intro.getBoundingClientRect();x=(event.clientX-rect.left)/rect.width-.5;y=(event.clientY-rect.top)/rect.height-.5;
  if(!frame)frame=requestAnimationFrame(()=>{frame=0;stack.style.setProperty('--energy-rx',(-y*8).toFixed(2)+'deg');stack.style.setProperty('--energy-ry',(x*8).toFixed(2)+'deg');});
 },{passive:true});
 intro.addEventListener('pointerleave',reset);
 const targets=[...document.querySelectorAll('.history-panel,.history-close')];
 let observer;
 function sync(){
  reset();observer?.disconnect();targets.forEach(el=>el.classList.remove('energy-arrive'));
  if(disabled()||!('IntersectionObserver' in window))return;
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('energy-arrive');observer.unobserve(entry.target);}}),{threshold:.12});
  targets.forEach(el=>observer.observe(el));
 }
 addEventListener('motion:change',sync);reduced.addEventListener('change',sync);fine.addEventListener('change',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});sync();
})();
