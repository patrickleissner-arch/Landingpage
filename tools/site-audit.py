"""Read-only sitemap, markup, link and resource audit. No forms submitted."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit,unquote
from urllib.request import Request,urlopen,build_opener,HTTPRedirectHandler
from urllib.error import HTTPError
from concurrent.futures import ThreadPoolExecutor
import json,re,sys,time,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]; origin='https://patrickleissner.de'
base=sys.argv[1] if len(sys.argv)>1 else 'files'
class Doc(HTMLParser):
 def __init__(self,text):
  super().__init__();self.title='';self.h1=[];self.meta={};self.canonical=[];self.ids=[];self.links=[];self.assets=[];self.images=[];self.schemas=[];self.lang=None;self.tag='';self.script=None;self.feed(text)
 def handle_starttag(self,t,a):
  a=dict(a);self.tag=t
  if 'id' in a:self.ids.append(a['id'])
  if t=='html':self.lang=a.get('lang')
  if t=='meta':self.meta[a.get('name',a.get('property',''))]=a.get('content','')
  if t=='h1':self.h1.append('')
  if t=='a' and a.get('href'):self.links.append(a['href'])
  if t=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
  if t=='link' and a.get('rel') in ['stylesheet','preload','icon'] and a.get('href'):self.assets.append(a['href'])
  if t in ['script','img','source','video','iframe'] and a.get('src'):self.assets.append(a['src'])
  if t=='img':self.images.append(a)
  if t=='script' and a.get('type')=='application/ld+json':self.script=''
 def handle_data(self,d):
  if self.tag=='title' and not self.title:self.title+=d
  if self.tag=='h1' and self.h1:self.h1[-1]+=d
  if self.script is not None:self.script+=d
 def handle_endtag(self,t):
  if t=='script' and self.script is not None:self.schemas.append(self.script);self.script=None
  self.tag=''
def filepath(path):
 path=unquote(path).strip('/');f=root/path if path else root/'index.html'
 if path and not Path(path).suffix and (root/(path+'.html')).exists():return root/(path+'.html')
 if f.is_dir():f=f/'index.html'
 elif not f.suffix:f=Path(str(f)+'.html')
 return f
def fetch(url):
 start=time.time()
 try:
  with urlopen(Request(url,headers={'User-Agent':'PL-Website-QA/1.0'}),timeout=30) as r:return {'status':r.status,'url':r.url,'headers':dict(r.headers),'body':r.read(),'ms':round((time.time()-start)*1000)}
 except HTTPError as e:return {'status':e.code,'url':e.url,'headers':dict(e.headers),'body':e.read(),'ms':round((time.time()-start)*1000)}
 except Exception as e:return {'status':0,'error':str(e),'body':b'','headers':{}}
if base=='files':xml=(root/'sitemap.xml').read_bytes()
else:xml=fetch(base+'/sitemap.xml')['body']
sitemapurls=[x.text for x in ET.fromstring(xml).iter() if x.tag.endswith('}loc')]
urls=list(dict.fromkeys(sitemapurls+[origin+'/impressum',origin+'/datenschutz']))
pages={};issues=[];warnings=[];assets=set();links=set();externals=set();titles={};descs={}
def load(url):
 path=urlsplit(url).path
 if base=='files':return url,{'status':200,'body':filepath(path).read_bytes(),'headers':{}}
 return url,fetch(base+path)
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(load,urls))
for url,r in results:
 path=urlsplit(url).path; text=r['body'].decode('utf-8','replace');d=Doc(text);pages[path]=d
 if r['status']!=200:issues.append([path,'status',r['status']])
 if d.lang!='de':issues.append([path,'language',d.lang])
 if len(d.h1)!=1:issues.append([path,'H1 count',len(d.h1)])
 if not d.title:issues.append([path,'missing title'])
 if not d.meta.get('description'):issues.append([path,'missing description'])
 if d.canonical!=[url]:issues.append([path,'canonical',d.canonical])
 if 'noindex' in d.meta.get('robots','') and url in sitemapurls:issues.append([path,'noindex in sitemap'])
 for key,target in [(d.title,titles),(d.meta.get('description'),descs)]:target.setdefault(key,[]).append(path)
 if len(d.title)>65:warnings.append([path,'long title',len(d.title)])
 if len(d.meta.get('description',''))>165:warnings.append([path,'long description',len(d.meta['description'])])
 if len(d.ids)!=len(set(d.ids)):issues.append([path,'duplicate ids'])
 for schema in d.schemas:
  try:json.loads(schema)
  except Exception:issues.append([path,'invalid JSON-LD'])
 for img in d.images:
  if 'alt' not in img:issues.append([path,'missing alt',img.get('src')])
  if not img.get('width') or not img.get('height'):warnings.append([path,'image dimensions missing',img.get('src')])
 for v in d.assets:
  u=urljoin(url,v);host=urlsplit(u).hostname
  if host=='patrickleissner.de':assets.add(u)
  elif not v.startswith('data:'):externals.add(u)
 for v in d.links:
  u=urljoin(url,v)
  if urlsplit(u).hostname=='patrickleissner.de':links.add((path,u))
for name,values in [('title',titles),('description',descs)]:
 for text,paths in values.items():
  if len(paths)>1:issues.append(['duplicate '+name,paths])
for src,u in links:
 p=urlsplit(u);file=filepath(p.path)
 if base=='files' and not file.exists():issues.append([src,'broken link',u])
 if p.fragment and p.path in pages and unquote(p.fragment) not in pages[p.path].ids:warnings.append([src,'missing anchor (possibly JS)',u])
if base=='files':
 for u in assets:
  if not filepath(urlsplit(u).path).exists():issues.append(['missing asset',u])
 # Include all local CSS url() and module references encountered by audited pages.
 for u in list(assets):
  f=filepath(urlsplit(u).path)
  if f.suffix=='.css' and f.exists():
   for ref in re.findall(r'url\([\s\"\']*([^\)\"\']+)',f.read_text(encoding='utf-8')):
    if unquote(ref).startswith(('data:','#','https:')):continue
    target=urljoin(u,ref.strip());assets.add(target)
    if not filepath(urlsplit(target).path).exists():issues.append(['missing CSS asset',target])
else:
 targets=sorted(assets|{u.split('#')[0] for _,u in links})
 def check(u):return u,fetch(base+urlsplit(u).path+('?' +urlsplit(u).query if urlsplit(u).query else ''))
 with ThreadPoolExecutor(max_workers=4) as pool:
  for u,r in pool.map(check,targets):
   if r['status']!=200:issues.append(['HTTP link/asset',u,r['status']])
report={'mode':base,'checkedAt':'2026-10-10','pages':len(pages),'uniqueInternalAssets':len(assets),'internalLinks':len(links),'issues':issues,'warnings':warnings,'externalEmbeddedResources':sorted(externals),'pageDetails':[{'path':p,'title':d.title,'description':d.meta.get('description'),'schemaCount':len(d.schemas)} for p,d in pages.items()]}
out=root/'docs/cool-website/builds/foerderrechner'/('audit-local.json' if base=='files' else 'audit-live.json')
out.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='pageDetails'},ensure_ascii=False,indent=2))
