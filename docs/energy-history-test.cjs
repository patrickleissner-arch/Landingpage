const assert=require('node:assert/strict');
const fs=require('node:fs');
const model=require('../energiekosten-entwicklung/model.js');
const data=model.validate(JSON.parse(fs.readFileSync(__dirname+'/../energiekosten-entwicklung/data.json','utf8')));
for(const key of ['electricity','oil','gas','lpg'])for(const n of [12,36,0]){
 const v=model.view(data,key,n);assert.equal(v.points.length,n||data.series[key].months.length);
 for(const p of v.points)assert.ok(Math.abs(p.change-(p.index-100))<1e-10);
 assert.equal(v.change,model.view(data,key,0).change);
 assert.equal(v.monthChange,model.view(data,key,0).monthChange);
 assert.equal(v.peak.index,Math.max(...v.points.map(r=>r.index)));
 assert.equal(model.view(data,key,0).first.month,'2020-01');
}
assert.ok(Math.abs(model.view(data,'electricity',0).change-17.8)<1e-8);
assert.ok(Math.abs(model.view(data,'oil',0).change-223)<1e-8);
assert.ok(Math.abs(model.view(data,'gas',0).change-86.3)<1e-8);
assert.ok(Math.abs(model.view(data,'lpg',0).change-110.4)<1e-8);
const bad=structuredClone(data);bad.series.gas.months.splice(2,1);assert.throws(()=>model.validate(bad));
assert.throws(()=>model.validate({}));assert.throws(()=>model.view(data,'autogas',12));
console.log('PASS: fixed 2020 annual baseline across all fuels and windows, complete history, peak and monthly change.');
