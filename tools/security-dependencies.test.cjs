const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const nodemailer=require('nodemailer');
const {gzipSync}=require('node:zlib');
test('patched parser handles JSON, forms and compressed input without losing service',async()=>{
 const app=express();app.use(express.json({limit:'32kb'}));app.use(express.urlencoded({extended:false,limit:'32kb'}));app.post('/',(req,res)=>res.json(req.body));app.use((err,req,res,next)=>res.status(400).json({error:'invalid input'}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const url='http://127.0.0.1:'+server.address().port;
 try{
  const json=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({value:42})});assert.deepEqual(await json.json(),{value:42});
  const form=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'name=Test'});assert.deepEqual(await form.json(),{name:'Test'});
  const gzip=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Content-Encoding':'gzip'},body:gzipSync('{"value":42}')});assert.deepEqual(await gzip.json(),{value:42});
  const bad=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Content-Encoding':'gzip'},body:Buffer.concat([gzipSync('{}'),Buffer.from('trailing invalid bytes')])});assert.equal(bad.status,400);
  const alive=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(alive.status,200);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('updated mailer generates a message locally without sending mail',async()=>{
 const transport=nodemailer.createTransport({streamTransport:true,buffer:true});const info=await transport.sendMail({from:'test@example.invalid',to:'recipient@example.invalid',subject:'Local smoke test',text:'No network delivery.'});assert.match(info.message.toString(),/Subject: Local smoke test/);assert.deepEqual(info.envelope.to,['recipient@example.invalid']);
});
