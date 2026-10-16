const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/../agnes-rechner.html','utf8');
function run(now='2026-10-16T12:00:00+02:00'){
 const els={};
 const make=()=>({value:'',textContent:'',style:{},hidden:false,events:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(t,f){this.events[t]=f;},querySelector(q){return this.children[q]??=(make());},children:{},checkValidity(){const n=Number(this.value);return Number.isFinite(n)&&n>=Number(this.min??0)&&n<=Number(this.max??Infinity);}});
 for(const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){const el=els[match[1]]=make();for(const a of ['value','min','max']){const r=match[0].match(new RegExp(a+'="([^"]+)"'));if(r)el[a]=r[1];}}
 els.yrs.value='5';
 const other={};
 const FakeDate=class extends Date{constructor(...a){super(...(a.length?a:[now]));}};
 const context={document:{hidden:false,getElementById(id){assert(els[id],'Missing '+id);return els[id];},querySelector(s){return other[s]??=make();},body:make()},window:{matchMedia(){return {matches:true};}},Intl,Date:FakeDate,performance:{now(){return 0;}},setInterval(){},cancelAnimationFrame(){},requestAnimationFrame(){}};
 vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
 return {els,other};
}
let {els:e}=run();
assert.match(e.rb.textContent,/10.000/);assert.match(e.rd.textContent,/50.000/);
e.mwh.value='4000';e.mwh.events.input();assert.match(e.rb.textContent,/10.000/);
e.kw.value='250';e.kw.events.input();assert.match(e.rb.textContent,/2.500/);assert.match(e.rd.textContent,/12.500/);
e['a-sp'].value='0';e['a-sp'].events.input();assert.match(e.rb.textContent,/^0/);
e.kw.value='-1';e.kw.events.input();assert.equal(e['input-error'].hidden,false);assert.equal(e.rb.textContent,'—');
e.kw.value='1000';e.kw.events.input();e['seg-i'].events.click();assert.equal(e.rb.textContent,'—');assert.equal(e.stage.hidden,true);assert.equal(e['home-advice'].hidden,false);assert.equal(e['comparison-results'].hidden,true);assert.equal(e['comparison-settings'].hidden,true);assert.match(e.explain.textContent,/Heimspeicher/);
e['seg-s'].events.click();assert.equal(e.stage.hidden,false);assert.equal(e['home-advice'].hidden,true);assert.equal(e['comparison-results'].hidden,false);assert.equal(e['comparison-settings'].hidden,false);
e.mwh.value='';e.mwh.events.input();assert.equal(e['input-error'].hidden,false);
let expired=run('2027-01-02T00:00:00+01:00');assert.match(expired.other['.cd-title'].textContent,/erreicht/);assert.equal(expired.els['cd-d'].textContent,'00');
console.log('PASS: baseline, consumption independence, capacity sensitivity, zero tariff, invalid and empty inputs, segment switching, deadline expiration, no-WebGL fallback.');
