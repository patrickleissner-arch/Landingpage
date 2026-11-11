const assert=require('node:assert/strict');
const {calculate}=require('../assets/js/agnes-model.js');
assert.deepEqual(calculate(100,70,100,1),{current:10000,limited:7000,saving:3000,total:3000,years:1});
assert.equal(calculate(100,70,100,5).total,15000);
assert.equal(calculate(100,100,100,3).saving,0);
assert.equal(calculate(0,0,100,1).saving,0);
assert.equal(calculate(100,70,0,1).saving,0);
assert.equal(calculate(10.5,8,70.2,1).saving,175.5);
for(const args of [[100,101,100,1],[-1,0,100,1],[100,-1,100,1],[100,70,-1,1],[NaN,0,1,1],[100,70,Infinity,1],[100,70,100,2],[1000001,0,100,1]]){
  assert.throws(()=>calculate(...args),RangeError);
}
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../agnes-rechner.html'),'utf8');
const els={};
for(const match of html.matchAll(/id="([^"]+)"/g)){
  els[match[1]]={value:'',checked:false,hidden:false,textContent:'',style:{},events:{},checkValidity(){return Number.isFinite(Number(this.value)) && Number(this.value)>=0;},addEventListener(event,fn){this.events[event]=fn;}};
}
els.customer.value='unknown';els.years.value='1';
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/agnes-rechner.js'),'utf8'),{document:{getElementById:id=>els[id]},Intl,AgnesModel:{calculate}});
assert.equal(els.numeric.hidden,true);
els.customer.value='business';els.customer.events.input();
assert.equal(els['business-fields'].hidden,false);assert.equal(els.numeric.hidden,true);
els.example.events.click();
assert.equal(els.numeric.hidden,false);assert.match(els.saving.textContent,/3\.000/);
els.target.value='101';els.target.events.input();assert.equal(els.numeric.hidden,true);assert.equal(els['input-error'].hidden,false);
els.target.value='70';els['same-tariff'].checked=false;els['same-tariff'].events.input();assert.equal(els.numeric.hidden,true);
els['same-tariff'].checked=true;els.target.value='';els.target.events.input();assert.equal(els.numeric.hidden,true);
els.example.events.click();els.customer.value='home';els.customer.events.input();assert.equal(els.numeric.hidden,true);assert.equal(els['business-fields'].hidden,true);
assert.doesNotMatch(html,/id="cd-d"|discount-a|three-r128/);
console.log('PASS: annual and multi-year arithmetic, zero/decimal values, invalid inputs, missing data, tariff confirmation, example and household switching.');
