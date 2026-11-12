const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const source=read('server.js');
const redirects=vm.runInNewContext('('+source.match(/const UMZUEGE = (\{[\s\S]*?\n\});/)[1]+')');
const handlerSource=source.slice(source.indexOf("app.use((req, res, next) => {",source.indexOf('const HTML_KANON')),source.indexOf('app.use(express.static'));
let handler;
vm.runInNewContext(handlerSource,{app:{use:fn=>handler=fn},UMZUEGE:redirects,HTML_KANON:{},SEITEN:{},ORDNER_SEITEN:{},path});
for(const method of ['GET','HEAD']){
  for(const url of ['/agnes-rechner','/agnes-rechner/','/AGNES-RECHNER','/agnes-rechner.html','/agnes-rechner/index.html']){
    let result;handler({method,path:url,url:url+'?quelle=test'},{redirect:(code,to)=>result={code,to}},()=>assert.fail('Old route was not redirected'));
    assert.deepEqual(result,{code:301,to:'/agnes-kostenrechner?quelle=test'});
  }
}
assert.doesNotMatch(read('index.html'),/href="\/agnes-rechner"/);
assert.doesNotMatch(read('agnes-kostenrechner/index.html'),/href="\/agnes-rechner"/);
assert.doesNotMatch(read('sitemap.xml'),/<loc>https:\/\/patrickleissner.de\/agnes-rechner<\/loc>/);
assert.match(read('agnes-rechner.html'),/content="0;url=\/agnes-kostenrechner"/);
console.log('PASS: old calculator URLs redirect permanently, preserve query parameters, and internal links use the new calculator.');
