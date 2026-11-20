(()=>{
'use strict';
const SW=window.SW,{REC,esc,disp,dn,stackOf,n0,mini,icon,nm,chip,verb,bar,empty,fmt,S,UI,P,roundMap,plan,treeNode,viaOf}=SW;
function totals(p){let done=0,have=0,total=0;for(const i of p.items){have+=Math.min(i.have,i.total);total+=i.total;if(i.have>=i.total)done++}return{done,have,total,n:p.items.length}}
const haveCtl=(st,have,key)=>`<div class="have"><label for="h-${key}">Have</label><input id="h-${key}" class="num" data-act="have" inputmode="numeric" autocomplete="off" value="${have}" title="Type a number, or 2s+10 for 2 stacks + 10">${st>1?`<button class="btn" data-act="addstack" title="Add one stack">+${st}</button>`:''}<button class="btn" data-act="add1" title="Add one">+1</button></div>`,
needCtl=r=>`<div class="have"><label for="n-${r.idx}">Need</label><input id="n-${r.idx}" class="num" data-act="need" inputmode="numeric" autocomplete="off" value="${r.total}" title="Type a number, or 2s+10 for 2 stacks + 10"><button class="btn danger" data-act="remove" title="Remove from list">Remove</button></div>`,
addBar=()=>`<div class="addbar"><div class="addfield"><input id="addQ" type="text" placeholder="Add an item, e.g. Oak Planks" value="${esc(UI.addText||'')}" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="sug" aria-label="Item to add"><ul class="sug" id="sug" role="listbox" hidden></ul></div><input id="addN" type="text" placeholder="Amount, e.g. 138 or 2s+10" value="${esc(UI.addNum||'')}" autocomplete="off" inputmode="text" aria-label="Amount"><button class="btn primary" data-act="additem">Add</button></div>`,
rowH=(id,have,total,act,vb,word,name,ctl,extra='')=>{
  const done=have>=total;
  return`<li class="row${done?' done':have>0?' partial':''}" data-id="${esc(id)}"><input class="check" type="checkbox" data-act="${act}" aria-label="Mark ${dn(id)} as ${vb}"${done?' checked':''}>${icon(id)}<div class="info"><div class="name">${name}</div><div class="qty num">Need <strong>${fmt(total,stackOf(id))}</strong><span class="miss${done?' ok':''}"${done?' aria-hidden="true"':''}><span class="dot"> &middot; </span>${word} ${fmt(done?total:total-have,stackOf(id))}</span></div></div>${ctl}${extra}<div class="prog"><b style="width:${Math.min(100,Math.round(have/total*100))}%"></b></div></li>`;
};
function listView(p){
  if(!p.items.length)return addBar()+empty('Search for a block above and add how many you need. To bring in a Litematica material list instead, use New project, then Import.','Start your list',1);
  let rows=p.items.map((i,idx)=>({idx,...i}));
  const q=UI.q.trim().toLowerCase();
  if(q)rows=rows.filter(r=>disp(r.id).toLowerCase().includes(q));
  if(UI.filter==='todo')rows=rows.filter(r=>r.have<r.total);
  if(UI.filter==='done')rows=rows.filter(r=>r.have>=r.total);
  if(UI.sort==='az')rows.sort((a,b)=>disp(a.id).localeCompare(disp(b.id)));
  if(UI.sort==='needed')rows.sort((a,b)=>b.total-a.total);
  const tools=addBar()+`<div class="tools"><input class="search" id="q" type="search" placeholder="Search in list" value="${esc(UI.q)}" aria-label="Search items"><div class="seg" role="group" aria-label="Filter">${[['all','All'],['todo','To do'],['done','Done']].map(([f,l])=>`<button data-filter="${f}" aria-pressed="${UI.filter===f}">${l}</button>`).join('')}</div><select id="sortSel" aria-label="Sort">${[['list','List order'],['az','A to Z'],['needed','Most needed']].map(([v,l])=>`<option value="${v}"${UI.sort===v?' selected':''}>${l}</option>`).join('')}</select><button class="btn${UI.edit?' primary':''}" data-act="toggleedit">${UI.edit?'Done editing':'Edit list'}</button></div>`;
  return tools+(rows.length?`<ul class="list">${rows.map(r=>rowH(r.id,r.have,r.total,'toggle','done','missing',`<span class="nt">${dn(r.id)}</span>`,UI.edit?needCtl(r):haveCtl(stackOf(r.id),r.have,'l'+r.idx))).join('')}</ul>`:empty('No items match this filter.','Nothing here'));
}
function usesHtml(r){
  const ids=Object.keys(r.use);
  if(!ids.length)return'<div class="uses"><small class="qty">Listed directly in the material list.</small></div>';
  const cons=ids.map(c=>[c,Math.round(Object.values(r.use[c]).reduce((a,b)=>a+b,0)),r.use[c]]).sort((a,b)=>b[1]-a[1]),
  direct=Math.max(0,Math.round(r.gross-cons.reduce((a,x)=>a+x[1],0))),k='u:'+r.id;
  return`<details class="uses"${UI.open[k]?' open':''} data-key="${esc(k)}"><summary>Used for</summary><ul>${direct>0?`<li><span></span><span><b>Listed directly</b> &middot; ${n0(direct)}</span></li>`:''}${cons.map(([c,q,m])=>{
    const t=roundMap(m),one=t.length===1&&t[0][0]===c,f=x=>dn(x[0])+' ('+n0(x[1])+')',
    head=t.slice(0,6).map(f),rest=t.slice(6).map(f),mk='m:u:'+r.id+':'+c,op=!!UI.open[mk]&&rest.length>0,
    names=one?'':`<small class="for${op?' open':''}" data-mkey="${esc(mk)}" style="margin-top:0">for ${head.join(', ')}${rest.length?` <button class="more" type="button" data-act="more" data-label="+${rest.length} more" aria-expanded="${op}">${op?'Show less':'+'+rest.length+' more'}</button><div class="fold"><div>${rest.join(', ')}</div></div>`:''}</small>`;
    return`<li>${mini(c)}<span><b>${nm(c)}</b> &middot; ${n0(q)} <span class="act">(${verb(c).toLowerCase()})</span></span>${names}</li>`;
  }).join('')}</ul></details>`;
}
function rawView(p,pl){
  if(!p.items.length)return empty('Add items in the Material list tab to see the raw materials you need.','No items yet',1);
  const base=plan({items:p.items.map(i=>({id:i.id,total:i.total,have:0})),stock:{}});
  if(!pl.raws.length&&!pl.steps.some(s=>s.crafts>0)&&!p.log.length)return empty('Nothing left to gather or craft for this build.','Everything is checked');
  const todo=pl.steps.filter(s=>s.crafts>0),gLeft=pl.raws.filter(r=>r.have<r.gross).length,rem=r=>Math.max(0,r.gross-r.have),
  raws=[...pl.raws].sort((a,b)=>{const ra=rem(a),rb=rem(b);return(ra===0)-(rb===0)||rb-ra||b.gross-a.gross}),
  gTot=base.raws.reduce((a,r)=>a+r.gross,0),gHave=Math.max(0,gTot-pl.raws.reduce((a,r)=>a+rem(r),0)),
  gPct=gTot?Math.floor(gHave/gTot*100):100,gDone=Math.max(0,base.raws.length-gLeft),
  cTot=base.steps.filter(s=>s.crafts>0).length,cDone=Math.max(0,cTot-todo.length),cPct=cTot?Math.floor(cDone/cTot*100):100,
  gt=UI.rawTab==='gather',bp=gt?gPct:cPct;
  let h=`<details class="note" data-key="note"${UI.open.note?' open':''}><summary>How this works</summary>This tab shows the raw materials you still need for your unfinished items, based on what you already have. The best way to use this is adding the amounts you already have to the <b>Material list</b>, and this list will update accordingly. <p>Ticking a crafting step adds its result to the <b>Material list</b> automatically.</p></details>`+
  `<div class="rawprog"><div class="pct2 num">${bp}%</div><div class="sumtext"><p class="num">${gt?`${gDone} of ${base.raws.length} raw materials gathered &middot; ${n0(gHave)} of ${n0(gTot)} pieces`:`${cDone} of ${cTot} items crafted`}</p>${bar(bp,gt?'Raw materials gathered':'Items crafted')}</div></div>`+
  `<div id="rawAnchor"></div><div class="subbar"><div class="seg wide" role="group" aria-label="Raw materials section"><button data-rawtab="gather" aria-pressed="${gt}">Gather<small>${gLeft} left</small></button><button data-rawtab="craft" aria-pressed="${!gt}">Craft<small>${todo.length} to do</small></button></div></div>`;
  if(gt)h+=`<div class="h2">Gather<span class="grow"><button class="btn sm" data-act="copyraw">Copy list</button></span></div>`+(raws.length?`<ul class="list">${raws.map((r,k)=>rowH(r.id,r.have,r.gross,'gather','gathered','still',nm(r.id),haveCtl(stackOf(r.id),r.have,'r'+k),usesHtml(r))).join('')}</ul>`:empty('Nothing to gather.'));
  else{
    h+=`<div class="h2">Craft<span class="grow"><div class="seg sm" role="group" aria-label="Crafting view">${[['tree','Per item'],['steps','Steps']].map(([v,l])=>`<button data-view="${v}" aria-pressed="${UI.view===v}">${l}</button>`).join('')}</div></span></div>`;
    if(UI.view==='tree')h+=treeView(p);
    else{
      if(!todo.length)h+=empty('No crafting left.');
      const st={};todo.forEach(s=>(st[s.depth]||=[]).push(s));
      Object.entries(st).forEach(([d,l])=>{h+=`<div class="stage">Stage ${d}${d==1?' &middot; made straight from raw materials':''}</div><ul class="list">${l.sort((a,b)=>disp(a.id).localeCompare(disp(b.id))).map(stepRow).join('')}</ul>`});
    }
    if(p.log.length)h+=`<div class="h2">Crafted</div><ul class="list">${p.log.map(logRow).join('')}</ul>`;
  }
  return h;
}
function logRow(e,i){
  const u=Object.entries(e.used).filter(x=>x[1]>0).map(([g,c])=>chip(g,c)).join('');
  return`<li class="row craft done" data-idx="${i}"><input class="check" type="checkbox" checked data-act="undo" aria-label="Undo crafting ${dn(e.id)}">${icon(e.id)}<div class="info"><div class="name">${nm(e.id)}</div><div class="qty num">Made ${n0(e.made)}${u?' from':''}</div>${u?`<div class="chips">${u}</div>`:''}</div></li>`;
}
function stepRow(s){
  const v=verb(s.id),tg=roundMap(s.by).filter(x=>x[0]!==s.id),parts=[],extra=s.made-s.net;
  if(Math.round(s.by[s.id]||0)>0)parts.push('the list');
  tg.forEach(x=>parts.push(dn(x[0])+viaOf(x[0],s.id)));
  const head=parts.slice(0,4),rest=parts.slice(4),mkey='m:'+s.id,op=!!UI.open[mkey]&&rest.length>0,
  forH=parts.length?`<div class="for${op?' open':''}" data-mkey="${esc(mkey)}">For ${head.join(', ')}${rest.length?` <button class="more" type="button" data-act="more" data-label="+${rest.length} more" aria-expanded="${op}">${op?'Show less':'+'+rest.length+' more'}</button><div class="fold"><div>${rest.join(', ')}</div></div>`:''}</div>`:'';
  return`<li class="row craft" data-id="${esc(s.id)}"><input class="check" type="checkbox" data-act="step" aria-label="Mark ${dn(s.id)} as crafted">${icon(s.id)}<div class="info"><div class="name">${nm(s.id)}${s.r.n?`<span class="tag">${v.toLowerCase()}</span>`:''}</div><div class="qty num">${v} <strong>${n0(s.crafts)}&times;</strong>${s.r.o>1?` &middot; makes ${fmt(s.made,stackOf(s.id))}${extra?` (${extra} spare)`:''}`:''}</div><div class="chips">${Object.entries(s.r.g).map(([g,c])=>chip(g,c*s.crafts)).join('')}<span class="arrow">&rarr;</span>${chip(s.id,s.made,' out')}</div>${forH}</div></li>`;
}
function treeView(p){
  const all=p.items.filter(i=>REC[i.id]);
  if(!all.length)return empty('Nothing in your list needs crafting.');
  const chk=(i,d)=>`<input class="check" type="checkbox" data-act="toggle" aria-label="Mark ${dn(i.id)} as done"${d?' checked':''}>`,
  hd=i=>`${mini(i.id)}<span class="name"><span class="nt">${dn(i.id)}</span></span>`;
  return[...all.filter(i=>i.have<i.total),...all.filter(i=>i.have>=i.total)].map(i=>{
    if(i.have>=i.total)return`<div class="tree done" data-id="${esc(i.id)}"><div class="sum">${chk(i,1)}${hd(i)}<span class="qty">done</span></div></div>`;
    const k='t:'+i.id;
    return`<details class="tree" data-id="${esc(i.id)}" data-key="${esc(k)}"${UI.open[k]?' open':''}><summary>${chk(i)}${hd(i)}<span class="qty">${n0(i.total-i.have)} missing</span></summary><ul class="tr">${treeHtml(treeNode(i.id,i.total-i.have,0))}</ul></details>`;
  }).join('')+'<p class="qty">Each tree is worked out on its own, so shared leftovers are not counted here. The Steps view is the combined plan.</p>';
}
const treeHtml=n=>`<li>${mini(n.id)}<b>${n0(n.q)}</b> ${nm(n.id)} <span class="act">${n.leaf?'raw':verb(n.id).toLowerCase()+' '+n0(n.crafts)+'&times;'}</span></li>`+(n.kids?`<ul>${n.kids.map(treeHtml).join('')}</ul>`:'');
const dlgW=(label,body)=>`<div class="scrim" data-act="close"><div class="dlg" role="dialog" aria-modal="true" aria-label="${label}" tabindex="-1">${body}</div></div>`,
btn=(act,label,c='')=>`<button class="btn${c&&' '+c}" data-act="${act}">${label}</button>`,
acts=h=>`<div class="acts">${h}</div>`;
function dialog(){
  const p=P(),d=UI.dlg;
  if(d==='welcome')return dlgW('Welcome',`<h3>Welcome to <b>Stackwise</b></h3><p>Stackwise keeps track of the materials for your Minecraft builds. Everything is shown in stacks, so you always know how much is left to gather.</p><h4>1. Make a list</h4><p>Press <b>New project</b>, search for a block, type how many you need and tap <b>Add</b>. Have a Litematica material list? Choose <b>Import a Litematica list</b> when creating a project, or <b>Import</b> in Project options, then paste the list text.</p><h4>2. Log what you already have</h4><p>In the Material list, enter how many you already have in each item's <b>Have</b> field, or use the <b>+1</b> and <b>+64</b> buttons to add to it. You can write amounts in stacks too: <code>2s+10</code> meaning 2 stacks + 10. When you reach the desired amount, the item checks itself. Or if you already have everything, tick the box to mark it complete without entering the amount in Have.</p><h4>3. Raw materials do the maths</h4><p>The <b>Raw materials</b> tab shows the materials needed to craft your list, plus any items you can gather directly. In Craft, follow the steps to make those items. Mark a step as done to add its result to your Material list and count it toward your progress.</p><h4>4. Your progress is saved</h4><p>It stays in this browser. Open <b>Options</b> to make a backup if you want to move it somewhere else.</p><div class="welcome-footer"><div class="welcome-dismiss"><input class="check" type="checkbox" id="wlcDont"><label for="wlcDont">Don't show this again</label></div>${acts(btn('close','Start building!','primary'))}</div>`);
  if(d==='import')return dlgW('Import list',`<h3>Import a material list</h3><p>Paste a Litematica material list (the .txt table), a plain list like <code>64 Oak Planks</code>, or a backup copied from Project options. A list with an existing title updates it and keeps your progress.</p><textarea id="impTxt" placeholder="+-------------------------+-------+---------+-----------+&#10;| Item | Total | Missing | Available |" spellcheck="false">${esc(UI.draft||'')}</textarea>${UI.warn?`<div class="warnbox">${UI.warn}</div>`:''}${acts(btn('close','Cancel')+btn('doimport','Import','primary'))}`);
  if(d==='new')return dlgW('New project',`<h3>New project</h3><p>Start with an empty list and add the blocks you need.</p><div class="field"><label for="newName">Project name</label><input id="newName" type="text" maxlength="60" placeholder="e.g. Mega farm" autocomplete="off"></div>${acts(btn('import','Import a Litematica list')+btn('close','Cancel')+btn('createnew','Create project','primary'))}`);
  if(d==='menu')return dlgW('Project options',`<h3>Project options</h3><div class="field"><label for="renameTxt">Project name</label><div class="inline"><input id="renameTxt" type="text" maxlength="60" value="${esc(p.title)}" autocomplete="off">${btn('rename','Rename')}</div></div>${acts(btn('welcome','How to use')+btn('import','Import a list')+btn('reset','Reset progress')+btn('askdel','Delete project','danger'))}<h4>Backup</h4><p>Progress saves in this browser only. Copy the backup text to keep it somewhere safe, and paste it into Import a list to restore everything.</p><textarea id="bak" readonly spellcheck="false">${esc(JSON.stringify({stackwise:1,S:{active:S.active,order:S.order,projects:S.projects}}))}</textarea>${acts(btn('close','Close')+btn('copybak','Copy backup','primary'))}`);
  if(d==='reset')return dlgW('Reset progress',`<h3>Reset progress</h3><p>Sets every <b>Have</b> back to 0 and clears the raw materials stock and the crafting log. The lists themselves stay.</p><p><b>${esc(p.title)}</b> has progress on ${p.items.filter(i=>i.have>0).length} of ${p.items.length} items.</p>${acts(btn('close','Cancel')+btn('resetall','Reset all lists','danger')+btn('resetone','Reset this list','danger'))}`);
  if(d==='delete')return dlgW('Delete project',`<h3>Delete project</h3><p>This permanently deletes <b>${esc(p.title)}</b>, including its list, progress and crafting log. This can't be undone.</p>${acts(btn('close','Cancel')+btn('delproj','Delete project','danger'))}`);
  return'';
}
Object.assign(SW,{totals,listView,rawView,dialog});
})();
