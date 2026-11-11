const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../assets/js/foerderlogik.js'),'utf8');
const context={module:{exports:{}},Date,Number,Set};
vm.runInNewContext(source,context);
const L=context.module.exports;
const date=s=>new Date(s+'T12:00:00');
const owner=(income=70000,kind=false)=>({selbst:true,einkommen:income,kind});
const rental={selbst:false};
const calc=(extra={},when='2026-10-09')=>L.rechne({kosten:28000,einheiten:[owner()],heizung:{art:'oel',laeuft:true},voraussetzungen:true,...extra},date(when));
test('Einfamilienhaus: Grundförderung und Klimabonus',()=>assert.equal(calc().zuschuss,12880));
test('Einkommensgrenzen ohne Kind: 30k / 40k / 50k inkl. Cent darüber',()=>{
 for(const [e,b] of [[30000,40],[30000.01,30],[40000,30],[40000.01,10],[50000,10],[50000.01,0]]){
  const r=calc({einheiten:[owner(e)],heizung:{art:'andere'}});assert.equal(r.einheiten[0].eink,b);
 }
});
test('Familiengrenzen 40k / 50k / 60k und Wechsel ohne Einkommensmutation',()=>{
 const e=owner(55000,false); assert.equal(calc({einheiten:[e]}).satz,46); e.kind=true;
 assert.equal(calc({einheiten:[e]}).satz,56); assert.equal(e.einkommen,55000);
 for(const [e,b] of [[40000,40],[40000.01,30],[50000,30],[50000.01,10],[60000,10],[60000.01,0]]) assert.equal(calc({einheiten:[owner(e,true)],heizung:{art:'andere'}}).einheiten[0].eink,b);
});
test('Deckel: 80% bei niedrigem Einkommen, sonst 70%',()=>{
 assert.equal(calc({einheiten:[owner(30000)]}).zuschuss,22400);
 assert.equal(calc({einheiten:[owner(40000)]}).zuschuss,19600);
 assert.equal(calc({einheiten:[owner(40000,true)]}).satz,80);
});
test('Vermietung bekommt keine persönlichen Boni und benötigt keine Heizungsangabe',()=>{
 const r=calc({einheiten:[rental],heizung:{}});assert.equal(r.zuschuss,8400);assert.equal(r.offen.length,0);
});
test('KfW-Beispiel: 41000€ / zwei WE / ein Selbstnutzer ohne Einkommensbonus',()=>{
 const r=calc({kosten:41000,einheiten:[owner(),rental]});assert.equal(r.zuschuss,15580);assert.equal(r.jeEinheit,20500);assert.equal(r.hoechst,43000);
});
test('Gebäudestaffel 1 / 2 / 6 / 7 / 10 Einheiten',()=>{
 for(const [n,cap] of [[1,28000],[2,43000],[6,103000],[7,111000],[10,135000]]) assert.equal(L.hoechstbetrag(n,0),cap);
});
test('Antragsstichtage einschließlich Jahreswechsel',()=>{
 for(const [d,k,c] of [['2027-01-31',16,28000],['2027-02-01',12,27250],['2027-07-31',12,27250],['2027-08-01',8,26500],['2028-01-01',8,26500],['2028-02-01',4,25750],['2028-08-01',0,25000]]){const r=calc({},d);assert.equal(r.kgbSatz,k);assert.equal(r.hoechst,c);}
});
test('Kosten oberhalb des Höchstbetrags und unveränderter Szenarienbetrag',()=>{
 const a=L.naechsteAbsenkung({kosten:35000,einheiten:[owner()],heizung:{art:'oel',laeuft:true},voraussetzungen:true},date('2026-10-09'));
 assert.equal(a.jetzt.zuschuss,12880);assert.equal(a.dann.zuschuss,11445);assert.equal(a.verlust,1435);assert.equal(a.dann.kosten,35000);
});
test('Gas genau 20 Jahre: vor/am/nach Stichtag und fehlendes Datum',()=>{
 for(const [start,bonus] of [['2006-10-08',16],['2006-10-09',16],['2006-10-10',0]])assert.equal(calc({heizung:{art:'gas',laeuft:true,inbetriebnahme:start}}).einheiten[0].kgb,bonus);
 assert.equal(calc({heizung:{art:'gas',laeuft:true,baujahr:2006}}).kgbHeizung,null);
 assert.equal(calc({heizung:{art:'gas',laeuft:true,inbetriebnahme:'2027-01-01'}}).kgbHeizung,null);
});
test('Heizungsdefekt entfernt nur den Klimabonus',()=>{const r=calc({einheiten:[owner(30000)],heizung:{art:'oel',laeuft:false}});assert.equal(r.satz,70);});
test('Mindestinvestition und Ausschluss',()=>{
 for(const k of [0,299])assert.equal(calc({kosten:k}).zuschuss,0);
 assert.equal(calc({kosten:300}).zuschuss,138);assert.equal(calc({voraussetzungen:false}).zuschuss,0);
 assert.equal(calc({kosten:Infinity}).zuschuss,0);
});
test('Leere Eingaben verursachen keinen erfundenen Einkommensbonus',()=>{
 const r=calc({einheiten:[owner(null,null)],heizung:{}});assert.equal(r.satz,30);assert.ok(r.offen.includes('einkommen'));
});
test('KfW-Beispiel 7 WE mit drei selbstnutzenden Haushalten',()=>{
 const r=calc({kosten:111000,einheiten:[owner(70000),rental,rental,rental,owner(50000,true),rental,owner(30000)]});
 assert.equal(r.einheiten[0].satz,46);assert.equal(r.einheiten[4].satz,70);assert.equal(r.einheiten[6].satz,80);
 assert.ok(Math.abs(r.zuschuss-(33300+111000/7*1.06))<0.001);
});
