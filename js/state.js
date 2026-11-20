(()=>{
'use strict';
const SW=window.SW={};
const{SW_ITEMS:ITEMS,SW_REC:REC}=window,
ICONS=new Set(window.SW_ICONS),STILL=new Set(window.SW_STILL),
RM=matchMedia('(prefers-reduced-motion: reduce)').matches,
VIEW={dur:680,from:.5},MISS={out:140,change:120,low:.25,h:200},FLIP={dur:220,delay:0},GHOST={dur:170,delay:0},DET={dur:300},
ANY={any_planks:1,any_wood_slab:1,any_log:1},
ANYTIP='Any wood: Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove, Cherry, Pale Oak, Crimson or Warped',
ACT={smelt:'Smelt',strip:'Strip with axe'},KEY='stackwise.v1',WKEY='stackwise.welcome',
SAVEFAIL='Could not save to this browser. Your progress will be lost when you close the page. Copy a backup from Options.',BYDISPLAY={};
for(const k in ITEMS){BYDISPLAY[ITEMS[k][0].toLowerCase()]=k;BYDISPLAY[k.replace(/_/g,' ')]=k}
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],
cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
ESC={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'},
esc=s=>String(s).replace(/[&<>"']/g,c=>ESC[c]),
disp=id=>ITEMS[id]?ITEMS[id][0]:id.replace(/^x:/,''),
dn=id=>esc(disp(id)),
stackOf=id=>ITEMS[id]?ITEMS[id][1]:64,
n0=n=>Number(n).toLocaleString('en'),
pic=id=>RM&&STILL.has(id)?`icons/still/${id}.png`:ICONS.has(id)?`icons/${id}.png`:null,
mini=id=>pic(id)?`<img alt="" decoding="sync" src="${pic(id)}">`:'',
icon=id=>`<div class="slot">${pic(id)?`<img alt="" decoding="sync" src="${pic(id)}">`:'<span>?</span>'}</div>`,
nm=id=>`<span class="nt">${dn(id)}</span>${ANY[id]?`<span class="tag" title="${ANYTIP}">any wood</span>`:''}`,
chip=(id,n,c='')=>`<span class="chip${c}">${mini(id)}${n0(n)} ${dn(id)}</span>`,
verb=id=>REC[id]?.n?ACT[REC[id].n]:'Craft',
bar=(pct,label)=>`<div class="bar" role="progressbar"${label?` aria-label="${label}"`:''} aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><b style="--w:${pct/100}"></b></div>`,
empty=(msg,title,top)=>`<div class="empty"${top?' style="margin-top:12px"':''}>${title?`<strong>${title}</strong>`:''}${msg}</div>`,
fmt=(n,k)=>{if(k<=1||n<k)return''+n;const s=n/k|0,r=n%k;return s+(s===1?' stack':' stacks')+(r?' + '+r:'')+` (${n})`},
parseAmount=(t,k)=>{t=String(t).trim().toLowerCase().replace(/stacks?/g,'s');const m=t.match(/^(\d+)\s*s\s*\+?\s*(\d+)?$/);return m?+m[1]*k+ +(m[2]||0):/^\d+$/.test(t)?+t:NaN};
function parseList(text){
  const out={title:(text.match(/Material List for placement\s+'([^']+)'/i)||[])[1]?.trim()||'',rows:[],unknown:[]},map=new Map(),
  add=(name,total,avail)=>{
    name=name.trim();if(!name||!(total>0))return;
    const l=name.toLowerCase(),key=BYDISPLAY[l]||BYDISPLAY[l.replace(/_/g,' ')],id=key||'x:'+name;
    if(!key&&!out.unknown.includes(name))out.unknown.push(name);
    const r=map.get(id)||{id,total:0,avail:0};r.total+=total;r.avail+=avail||0;map.set(id,r);
  };
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();if(!line||/^\+[-+]+\+$/.test(line))continue;
    if(line.includes('|')){
      const c=line.split('|').map(x=>x.trim()).filter((x,i,a)=>!(x===''&&(i===0||i===a.length-1)));
      if(c.length>=2&&/^\d+$/.test(c[1]))add(c[0],+c[1],c.length>=4&&/^\d+$/.test(c[3])?+c[3]:0);
      continue;
    }
    const m=line.match(/^(\d+)\s*[x×]?\s+(.+)$/i);
    if(m)add(m[2],+m[1]);
    else{const k=line.match(/^(.+?)\s*[:,\t]\s*[x×]?(\d+)$/i)||line.match(/^([A-Za-z' ]+?)\s+[x×]?(\d+)$/i);if(k)add(k[1],+k[2])}
  }
  out.rows=[...map.values()];
  return out;
}
let S={active:null,order:[],projects:{},mode:'list'},UI={filter:'all',sort:'list',q:'',view:'tree',rawTab:'gather',dlg:null,open:{}},saveFailed=false;
const num=(v,min)=>Number.isFinite(v)&&v>=min;
// Rebuilds a state object from untrusted data (localStorage, backups, other tabs).
// Anything malformed is dropped instead of breaking the app.
function cleanState(j){
  const pr=j&&typeof j.projects==='object'&&j.projects||{},projects=Object.create(null),order=[],
  obj=o=>o&&typeof o==='object'&&!Array.isArray(o)?Object.entries(o):[],
  cnt=([k,v])=>[k,Math.floor(+v)];
  for(const id of Array.isArray(j&&j.order)?j.order:Object.keys(pr)){
    const x=pr[id];
    if(typeof id!=='string'||projects[id]||!x||typeof x!=='object'||!Array.isArray(x.items))continue;
    const seen=new Set;
    projects[id]={
      id,
      title:typeof x.title==='string'&&x.title.trim()||'Untitled build',
      items:x.items.filter(i=>i&&typeof i.id==='string'&&i.id&&num(+i.total,1)&&!seen.has(i.id)&&seen.add(i.id)).map(i=>({id:i.id,total:Math.floor(+i.total),have:num(+i.have,0)?Math.floor(+i.have):0})),
      stock:Object.fromEntries(obj(x.stock).map(cnt).filter(e=>e[1]>0)),
      prev:Object.fromEntries(obj(x.prev).map(cnt).filter(e=>e[1]>0)),
      log:(Array.isArray(x.log)?x.log:[]).filter(e=>e&&typeof e.id==='string'&&num(+e.made,1)).map(e=>({id:e.id,made:Math.floor(+e.made),used:Object.fromEntries(obj(e.used).map(cnt).filter(u=>u[1]>0))}))
    };
    order.push(id);
  }
  return{order,projects,active:projects[j&&j.active]?j.active:order[0]};
}
const P=()=>S.projects[S.active],
save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));saveFailed=false}catch{if(!saveFailed){saveFailed=true;toast(SAVEFAIL,6000)}}},
go=()=>{save();SW.render()},
fixP=p=>{p.stock||={};p.log||=[];p.prev||={}},
uid=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
eqi=(a,b)=>a.toLowerCase()===b.toLowerCase(),
welcomeHidden=()=>{try{return localStorage.getItem(WKEY)==='1'}catch{return false}};
function mk(title,items){const id=uid();S.order.push(id);S.active=id;return S.projects[id]={id,title,items,stock:{},prev:{},log:[]}}
function load(){
  let raw=null;
  try{
    raw=localStorage.getItem(KEY);
    const j=JSON.parse(raw||'null'),c=cleanState(j);
    if(c.order.length){Object.assign(S,c);if(j.mode==='raw')S.mode='raw'}
  }catch{}
  if(raw&&!S.order.length){try{localStorage.setItem(KEY+'.bak',raw)}catch{}}
  if(!S.order.length)createProject('My first build');
}
function addProject(p,first){
  const title=p.title||'Untitled build',exist=first?0:S.order.map(i=>S.projects[i]).find(x=>eqi(x.title,title));
  if(exist){
    const old=Object.fromEntries(exist.items.map(i=>[i.id,i]));
    exist.items=p.rows.map(r=>({id:r.id,total:r.total,have:old[r.id]?old[r.id].have:Math.min(r.total,r.avail)}));
    fixP(exist);S.active=exist.id;return exist;
  }
  return mk(title,p.rows.map(r=>({id:r.id,total:r.total,have:Math.min(r.total,r.avail)})));
}
function createProject(title){
  title=(title||'').trim()||'Untitled build';
  let t=title,n=2;while(S.order.some(i=>eqi(S.projects[i].title,t)))t=`${title} (${n++})`;
  return mk(t,[]);
}
const ALLITEMS=Object.keys(ITEMS).filter(k=>!ANY[k]&&k!=='air').map(k=>({id:k,d:ITEMS[k][0],l:ITEMS[k][0].toLowerCase()}));
function suggest(q){
  q=q.trim().toLowerCase();if(!q)return[];
  const tk=q.split(/\s+/),rank=x=>(x.l===q?0:x.l.startsWith(q)?1:x.l.split(' ').some(w=>w.startsWith(tk[0]))?2:3)*1000+x.l.length;
  return ALLITEMS.filter(x=>tk.every(t=>x.l.includes(t))).sort((a,b)=>rank(a)-rank(b)).slice(0,80);
}
const getInv=(p,id)=>{const it=p.items.find(i=>i.id===id);return it?it.have:p.stock[id]||0},
// Any manual change to an amount also forgets the value saved by a tick (see tick).
setInv=(p,id,v)=>{v=Math.max(0,Math.floor(v));if(p.prev)delete p.prev[id];const it=p.items.find(i=>i.id===id);if(it)it.have=v;else if(v>0)p.stock[id]=v;else delete p.stock[id]},
// Ticking sets the amount to the target and remembers what was there, so unticking brings it back.
tick=(p,id,target,on)=>{
  const cur=getInv(p,id),was=p.prev[id];
  if(on){setInv(p,id,Math.max(cur,target));if(cur>0&&cur<target)p.prev[id]=cur}
  else setInv(p,id,was>0&&was<target?was:0);
};
const toast=(m,ms=1800)=>{const t=document.createElement('div');t.className='toast';t.textContent=m;if(ms!==1800)t.style.animationDelay='0s,'+(ms-250)/1000+'s';document.body.appendChild(t);setTimeout(()=>t.remove(),ms)};
function copy(text,ok){
  const fb=()=>{const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast(ok)}catch{toast('Select the text and copy it')}ta.remove()};
  try{navigator.clipboard.writeText(text).then(()=>toast(ok),fb)}catch{fb()}
}
const root=$('#app');
Object.assign(SW,{ITEMS,REC,ANY,ANYTIP,ACT,RM,VIEW,MISS,FLIP,GHOST,DET,KEY,WKEY,BYDISPLAY,$,$$,cssv,esc,disp,dn,stackOf,n0,pic,mini,icon,nm,chip,verb,bar,empty,fmt,parseAmount,parseList,S,UI,P,save,go,fixP,eqi,welcomeHidden,mk,load,addProject,createProject,suggest,getInv,setInv,tick,toast,copy,cleanState,root});
})();
