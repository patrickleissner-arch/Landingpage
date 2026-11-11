import * as T from 'three';
// Schematic architecture, not an hourly simulation. All figures come from PVModel.
(()=>{
 const host=document.getElementById('up-scene');if(!host)return;
 const caption=document.getElementById('up-scene-caption'),pause=document.getElementById('up-pause');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let night=false,angle=0,targetAngle=0,paused=reduced.matches,visible=true,raf=0,renderer,failed=false;
 let state=window.UnabhaengigkeitState||{battKwh:9,kWp:8.8,car:false,heatpump:false,pvYield:8580};
 function fallback(){caption.textContent='Statische Illustration. Die Jahresberechnung bleibt vollständig bedienbar.';pause.disabled=true;pause.textContent='Statische Ansicht';document.querySelectorAll('[data-up-time],[data-up-view]').forEach(b=>b.disabled=true);}
 if(new URLSearchParams(location.search).get('ansicht')==='statisch'){fallback();return;}
 try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{fallback();return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,80);camera.position.set(8,7,10);camera.lookAt(0,.5,0);
 const world=new T.Group();scene.add(world);
 const ambient=new T.HemisphereLight(0xe7f4df,0x294b3b,2.5);scene.add(ambient);
 const sun=new T.DirectionalLight(0xffedc4,4);sun.position.set(-3,8,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-7;sun.shadow.camera.right=7;sun.shadow.camera.top=7;sun.shadow.camera.bottom=-7;sun.shadow.bias=-.001;scene.add(sun);
 const fill=new T.DirectionalLight(0x93b5d3,2);fill.position.set(5,3,-5);scene.add(fill);
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.65,...extra});
 const cream=mat(0xe8e4cc),dark=mat(0x16362f),roof=mat(0x3c4c45,{metalness:.35}),glass=mat(0x183f49,{metalness:.8,roughness:.22}),gold=mat(0xd0ab3b,{metalness:.5,roughness:.3}),silver=mat(0x819289,{metalness:.65}),solar=mat(0x102f44,{metalness:.65,roughness:.25}),wood=mat(0x80694a);
 const box=(w,h,d,m,x,y,z,parent=world)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 box(7.3,.18,5.3,mat(0x496153),0,-.2,0);box(7.45,.055,5.45,dark,0,-.31,0);
 const grid=new T.GridHelper(7,28,0x94a78a,0x69816b);grid.position.y=-.103;grid.scale.z=.73;grid.material.transparent=true;grid.material.opacity=.18;world.add(grid);
 // One precisely framed pavilion: glazing, mullions, slatted side, raised roof, modular PV array.
 const house=new T.Group();world.add(house);house.position.set(-.65,0,-.4);
 box(3.15,1.5,2.35,cream,0,.7,0,house);box(3.38,.12,2.6,roof,0,1.53,0,house);box(3.3,.1,2.48,dark,0,-.015,0,house);
 box(2.55,1.15,.045,glass,-.1,.7,1.188,house);
 const windows=[];
 const warm=mat(0xe8cd7e,{emissive:0xeac568,emissiveIntensity:.05});
 windows.push(box(2.3,.88,.02,warm,-.1,.71,1.213,house));
 // Horizontal interior silhouettes and dividing columns preserve architectural scale.
 box(2.5,.07,.04,dark,-.1,.35,1.23,house);
 for(let i=0;i<4;i++)box(.05,1.2,.075,dark,-1.25+i*.79,.72,1.24,house);
 box(1.25,.85,.045,glass,1.59,.77,-.25,house).rotation.y=Math.PI/2;
 for(let i=0;i<11;i++)box(.065,1.42,.14,wood,-1.6,.73,-1.02+i*.2,house);
 box(1.2,.065,.65,cream,-.6,.01,1.52,house);box(.95,.045,.45,cream,-.6,-.05,1.98,house);
 const panels=new T.Group();house.add(panels);panels.position.set(0,1.69,0);panels.rotation.x=.08;
 const panelMeshes=[];
 for(let row=0;row<4;row++)for(let col=0;col<5;col++){
  const group=new T.Group();panels.add(group);group.position.set(-1.19+col*.595,0,-.83+row*.55);
  box(.55,.045,.5,silver,0,0,0,group);box(.51,.014,.46,solar,0,.031,0,group);
  for(let k=1;k<3;k++)box(.004,.004,.46,silver,-.255+k*.17,.041,0,group);
  box(.51,.004,.004,silver,0,.042,0,group);panelMeshes.push(group);
 }
 // Battery cabinet, indicator, vent slots and plinth.
 const battery=new T.Group();world.add(battery);battery.position.set(2.03,0,.43);
 box(.85,.07,.68,dark,0,0,0,battery);box(.69,1.27,.52,cream,0,.68,0,battery);box(.7,.11,.54,silver,0,1.35,0,battery);
 box(.48,.42,.022,dark,0,.97,.274,battery);const bars=[];
 for(let i=0;i<4;i++)bars.push(box(.32,.055,.023,gold,0,.83+i*.09,.29,battery));
 for(let i=0;i<5;i++)box(.41,.012,.024,silver,0,.3+i*.053,.276,battery);
 const hp=new T.Group();world.add(hp);hp.position.set(-2.64,0,-.45);box(.65,.72,.52,cream,0,.37,0,hp);
 const fan=new T.Mesh(new T.CylinderGeometry(.22,.22,.025,32),dark);fan.rotation.x=Math.PI/2;fan.position.set(0,.4,.28);hp.add(fan);
 for(let i=0;i<7;i++)box(.56,.018,.027,silver,0,.17+i*.063,.3,hp);
 const car=new T.Group();world.add(car);car.position.set(.6,0,1.9);
 box(1.62,.26,.64,cream,0,.32,0,car);box(.91,.29,.54,glass,-.06,.57,0,car);box(.94,.04,.57,cream,-.06,.73,0,car);
 for(const x of [-.52,.52])for(const z of [-.34,.34]){const wheel=new T.Mesh(new T.CylinderGeometry(.18,.18,.12,20),dark);wheel.rotation.x=Math.PI/2;wheel.position.set(x,.18,z);car.add(wheel);}
 box(.07,.09,.43,gold,.82,.37,0,car);
 // A restrained grid-connection terminal at the rear edge of the site.
 const network=new T.Group();world.add(network);network.position.set(2.8,0,-1.65);box(.28,.92,.22,silver,0,.46,0,network);box(.62,.4,.42,dark,0,1,0,network);box(.39,.035,.04,gold,0,1,.23,network);
 const points=[];
 function line(coords,color){const curve=new T.CatmullRomCurve3(coords.map(p=>new T.Vector3(...p)),false,'catmullrom',.2);const material=new T.MeshBasicMaterial({color,transparent:true,opacity:.35});world.add(new T.Mesh(new T.TubeGeometry(curve,40,.018,6,false),material));const dots=[];for(let i=0;i<4;i++){const dot=new T.Mesh(new T.SphereGeometry(.047,8,8),new T.MeshBasicMaterial({color}));world.add(dot);dots.push(dot);}const item={curve,dots,material};points.push(item);return item;}
 const toBattery=line([[-.6,.05,1.3],[.8,.06,1.2],[1.6,.06,.9],[2.02,.15,.7]],0xe7bf52);
 const toGrid=line([[-.65,.08,1.25],[1,.06,1.1],[2.62,.05,-.5],[2.8,.09,-1.5]],0xc6dacc);
 const pvToHouse=line([[-.7,1.88,.8],[-1.15,1.72,1.04],[-1.37,.65,1.1],[-.65,.12,1.25]],0xe7bf52);
 // Schematic labels are DOM text so they remain crisp and readable.
 const label=document.createElement('span');label.className='up-scene-label';label.style.cssText='position:absolute;left:20px;top:18px;z-index:3;font:10px Outfit,sans-serif;color:#bdcbb5;letter-spacing:.08em;pointer-events:none';host.append(label);
 function labels(){label.textContent=(state.kWp>0?state.kWp.toLocaleString('de-DE',{maximumFractionDigits:1})+' kWp PV':'OHNE PV')+'  /  '+(state.battKwh>0?state.battKwh.toLocaleString('de-DE')+' kWh SPEICHER':'OHNE SPEICHER');caption.textContent=state.kWp<=0?'Ohne Solaranlage gibt es in diesem Modell keinen eigenen Solarstrom.':night?(state.battKwh>0?'Am Abend kann gespeicherter Solarstrom dein Haus versorgen. Ist er aufgebraucht, ergänzt das Netz.':'Ohne Speicher kommt der Strom am Abend aus dem Netz.'):state.battKwh>0?'Tagsüber versorgt Solarstrom das Haus. Überschüsse können den Speicher laden oder ins Netz fließen.':'Tagsüber nutzt das Haus Solarstrom direkt. Überschüsse werden ins Netz eingespeist.';}
 function sync(){battery.visible=state.battKwh>0;car.visible=!!state.car;hp.visible=!!state.heatpump;panels.visible=state.kWp>0;panelMeshes.forEach((p,i)=>p.visible=i<Math.max(1,Math.min(20,Math.round(state.kWp/.44))));warm.emissiveIntensity=night?1.4:.04;ambient.intensity=night?1.15:2.5;sun.intensity=night?.45:4;fill.intensity=night?3:2;sun.color.set(night?0xa4bfd8:0xffedc4);labels();drawOnce();}
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(8,7,10).multiplyScalar(w/h<1.6?1.12:.93);camera.lookAt(0,.5,0);camera.updateProjectionMatrix();drawOnce();}
 function active(){return !failed&&visible&&!document.hidden&&!paused&&!document.documentElement.classList.contains('motion-paused');}
 function render(t){const move=active();angle+=(targetAngle-angle)*(move?.06:1);world.rotation.y=angle;const time=t/1000;
  points.forEach((p,j)=>{let show=(j===0?state.battKwh>0&&state.kWp>0:j===2?!night&&state.kWp>0:true);p.material.opacity=show?.35:.07;p.dots.forEach((dot,i)=>{dot.visible=show;const reverse=night||state.kWp<=0;let v=((move?time*.16:0)+i/4)%1;if(reverse)v=1-v;dot.position.copy(p.curve.getPointAt(v));});});
  renderer.render(scene,camera);
 }
 function loop(t){raf=0;render(t);if(active())raf=requestAnimationFrame(loop);}
 function drawOnce(){if(failed)return;render(performance.now());if(active()&&!raf)raf=requestAnimationFrame(loop);}
 function stopOrStart(){if(!active()&&raf){cancelAnimationFrame(raf);raf=0;}drawOnce();}
 pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'Animation fortsetzen':'Animation pausieren';
 pause.addEventListener('click',()=>{paused=!paused;pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'Animation fortsetzen':'Animation pausieren';stopOrStart();});
 document.querySelectorAll('[data-up-time]').forEach(b=>b.addEventListener('click',()=>{night=b.dataset.upTime==='night';document.querySelectorAll('[data-up-time]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));sync();}));
 document.querySelectorAll('[data-up-view]').forEach(b=>b.addEventListener('click',()=>{targetAngle=Math.max(-.65,Math.min(.65,targetAngle+Number(b.dataset.upView)*.22));drawOnce();}));
 host.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||paused||reduced.matches)return;const r=host.getBoundingClientRect();targetAngle=((e.clientX-r.left)/r.width-.5)*.35;drawOnce();});
 host.addEventListener('pointerleave',()=>{targetAngle=0;drawOnce();});
 addEventListener('up:update',e=>{state=e.detail;sync();});addEventListener('motion:change',stopOrStart);document.addEventListener('visibilitychange',stopOrStart);reduced.addEventListener('change',()=>{paused=reduced.matches;pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'Animation fortsetzen':'Animation pausieren';stopOrStart();});
 new ResizeObserver(resize).observe(host);new IntersectionObserver(e=>{visible=e[0].isIntersecting;stopOrStart();}).observe(host);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;cancelAnimationFrame(raf);raf=0;host.classList.remove('is-ready');renderer.domElement.hidden=true;label.hidden=true;pause.disabled=true;document.querySelectorAll('[data-up-time],[data-up-view]').forEach(b=>b.disabled=true);caption.textContent='Statische Illustration. Die Jahresberechnung bleibt vollständig bedienbar.';});
 resize();sync();host.classList.add('is-ready');
})();
