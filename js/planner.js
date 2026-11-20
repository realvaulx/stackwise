(()=>{
'use strict';
const SW=window.SW,{REC,dn}=SW;
function roundMap(m){
  const e=Object.entries(m),f=e.map(([k,v])=>{const fl=Math.floor(v+1e-9);return[k,fl,v-fl]});
  let rem=Math.round(e.reduce((a,x)=>a+x[1],0))-f.reduce((a,x)=>a+x[1],0);
  f.sort((a,b)=>b[2]-a[2]);
  for(let i=0;i<f.length&&rem>0;i++,rem--)f[i][1]++;
  return f.filter(x=>x[1]>0).map(x=>[x[0],x[1]]).sort((a,b)=>b[1]-a[1]);
}
const dc={},depth=id=>id in dc?dc[id]:dc[id]=REC[id]?1+Math.max(0,...Object.keys(REC[id].g).map(depth)):0;
function plan(p){
  const inv={};p.items.forEach(i=>inv[i.id]=i.have);
  const have=id=>id in inv?inv[id]:p.stock[id]||0,seen=new Set,post=[],
  visit=id=>{if(seen.has(id))return;seen.add(id);for(const g in REC[id]?.g)visit(g);post.push(id)};
  p.items.forEach(i=>visit(i.id));
  const dem={},use={},steps=[],raws=[];
  p.items.forEach(i=>dem[i.id]={g:i.total,by:{[i.id]:i.total}});
  for(const id of post.reverse()){
    const d=dem[id];if(!d||d.g<=0)continue;
    const hv=have(id),net=Math.max(0,d.g-hv),r=REC[id];
    if(!r){raws.push({id,gross:d.g,have:hv,use:use[id]||{}});continue}
    const crafts=Math.ceil(net/r.o);
    steps.push({id,gross:d.g,have:hv,net,crafts,made:crafts*r.o,r,by:d.by,depth:depth(id)});
    if(crafts>0)for(const g in r.g){
      const amt=crafts*r.g[g],t=dem[g]||(dem[g]={g:0,by:{}}),uc=(use[g]||={})[id]||={};
      t.g+=amt;
      for(const k in d.by){const part=amt*d.by[k]/d.g;t.by[k]=(t.by[k]||0)+part;uc[k]=(uc[k]||0)+part}
    }
  }
  return{steps,raws};
}
function treeNode(id,q,l){
  const r=REC[id];if(!r||l>8)return{id,q,leaf:1};
  const c=Math.ceil(q/r.o);
  return{id,q,crafts:c,r,kids:Object.keys(r.g).map(g=>treeNode(g,c*r.g[g],l+1))};
}
const reachC=new Map,
reaches=(a,b)=>{
  const k=a+'>'+b;if(reachC.has(k))return reachC.get(k);
  reachC.set(k,false);
  const r=a!==b&&!!REC[a]&&Object.keys(REC[a].g).some(g=>g===b||reaches(g,b));
  reachC.set(k,r);return r;
},
viaOf=(to,from)=>{
  const g=REC[to]?.g;if(!g||from in g)return'';
  const chains=Object.keys(g).filter(x=>reaches(x,from)).map(k=>{
    const c=[k];let cur=k;
    while(!(from in REC[cur].g)){cur=Object.keys(REC[cur].g).find(x=>reaches(x,from));c.push(cur)}
    return c.reverse().map(dn).join(' &rarr; ');
  });
  return chains.length?` (${chains.join(', ')})`:'';
};
Object.assign(SW,{roundMap,plan,treeNode,viaOf});
})();
