(()=>{
'use strict';
const SW=window.SW,{ANY,RM,DET,KEY,WKEY,BYDISPLAY,$,$$,cssv,esc,disp,stackOf,n0,mini,bar,fmt,parseAmount,parseList,S,UI,P,go,welcomeHidden,load,addProject,createProject,suggest,getInv,setInv,tick,toast,copy,cleanState,root,plan,totals,listView,rawView,dialog,fx}=SW;
const wd=el=>el.getBoundingClientRect().width;
function render(){
  const prevDlg=UI.prev?.dlg||null,dlgChanged=!!UI.dlg&&UI.dlg!==prevDlg,dlgClosed=!!prevDlg&&!UI.dlg;
  if(dlgChanged&&!prevDlg)UI._opener=UI._trigger||document.activeElement;
  const lb=$('.rawprog .bar b',root),lpct=$('.pct,.pct2',root);
  UI._raw=lb&&wd(lb.parentElement)?wd(lb)/wd(lb.parentElement):undefined;
  UI._rows=new Map;
  $$('.row[data-id] .prog b',root).forEach(b=>{const w=wd(b.parentElement);if(w)UI._rows.set(b.closest('.row').dataset.id,wd(b)/w)});
  UI._shown=lpct?parseInt(lpct.textContent,10):undefined;
  UI._miss=new Map;UI._h=new Map;UI._top=new Map;UI._rowEls=new Map;
  $$('.row[data-id],.tree[data-id]',root).forEach(el=>{const m=$('.miss',el);if(m)UI._miss.set(el.dataset.id,m.innerHTML);UI._rowEls.set(el.dataset.id,el);const r=el.getBoundingClientRect();UI._h.set(el.dataset.id,r.height);UI._top.set(el.dataset.id,r.top)});
  const p=P(),t=totals(p),pct=t.total?Math.floor(t.have/t.total*100):0,pl=plan(p),left=pl.raws.filter(r=>r.have<r.gross).length,
  opts=S.order.map(id=>`<option value="${id}"${id===S.active?' selected':''}>${esc(S.projects[id].title)}</option>`).join(''),
  tabs=[['list','Material list',t.n+' items'],['raw','Raw materials',left+' to gather']];
  if(!$('.top',root))root.innerHTML=`<header class="top"><div class="brand"><div class="logo"><img alt="" src="img/logo.png">Stackwise</div><div class="proj"><select id="projSel" aria-label="Project" data-opts="${esc(opts)}">${opts}</select><button class="btn primary" data-act="new">New project</button><button class="btn ghost" data-act="menu">Options</button></div></div><div class="tabs" role="tablist">${tabs.map(([m,l,s])=>`<button class="tab" role="tab" data-mode="${m}" aria-selected="${S.mode===m}">${l}<small>${s}</small></button>`).join('')}</div></header><div id="view"></div><div id="dlgbox"></div>`;
  else{
    const sel=$('#projSel',root);
    if(sel.dataset.opts!==opts){sel.innerHTML=opts;sel.dataset.opts=opts}
    sel.value=S.active;
    $$('.tab',root).forEach((b,i)=>{b.setAttribute('aria-selected',S.mode===tabs[i][0]);$('small',b).textContent=tabs[i][2]});
  }
  const view=$('#view',root),imgPool=new Map;
  $$('img',view).forEach(i=>{const k=i.getAttribute('src');if(!imgPool.has(k))imgPool.set(k,[]);imgPool.get(k).push(i)});
  view.innerHTML=(S.mode==='list'?`<section class="summary"><div class="pct num">${pct}%</div><div class="sumtext"><p class="num">${t.done} of ${t.n} items done &middot; ${n0(t.have)} of ${n0(t.total)} pieces collected</p>${bar(pct)}</div></section>${listView(p)}`:rawView(p,pl))+'<p class="foot"><span class="foot-copy">Recipes and textures up to 1.21.11.</span><a class="btn sm" href="https://ko-fi.com/realvaulx" target="_blank" rel="noopener"><img alt="" src="img/kofi.png">Support on Ko-fi!</a></p>';
  $$('img',view).forEach(i=>{const l=imgPool.get(i.getAttribute('src'));if(l&&l.length)i.replaceWith(l.pop())});
  $('#dlgbox',root).innerHTML=UI.dlg?dialog():'';
  syncHdr();fx();
  document.documentElement.classList.toggle('dlg-open',!!UI.dlg);
  const op=UI._opener;if(dlgClosed)UI._opener=null;
  if(UI._focus){const el=$(UI._focus);if(el){el.focus();if(el.type==='text')el.select()}UI._focus=null}
  else if(dlgChanged)$('.dlg',root)?.focus();
  else if(dlgClosed&&op&&op!==document.body&&op.isConnected)op.focus();
}
SW.render=render;
function closeDlg(){
  if(UI.dlg==='welcome'&&$('#wlcDont')?.checked){try{localStorage.setItem(WKEY,'1')}catch{}}
  const s=$('.scrim'),end=()=>{UI.dlg=null;render()};
  if(!s||RM)return end();
  if(s.classList.contains('out'))return;
  s.classList.add('out');setTimeout(end,170);
}
const rowId=el=>el.closest('[data-id]')?.dataset.id;
function craftStep(id){
  const p=P(),s=plan(p).steps.find(x=>x.id===id);if(!s||s.crafts<1)return;
  const used={};
  for(const g in s.r.g){const take=Math.min(getInv(p,g),s.crafts*s.r.g[g]);used[g]=take;setInv(p,g,getInv(p,g)-take)}
  setInv(p,id,getInv(p,id)+s.made);p.log.push({id,made:s.made,used});
}
function undoStep(i){
  const p=P(),e=p.log[i];if(!e)return;
  setInv(p,e.id,getInv(p,e.id)-e.made);
  for(const g in e.used)setInv(p,g,getInv(p,g)+e.used[g]);
  p.log.splice(i,1);
}
function pickItem(id){
  UI.addSel=id;UI.addText=disp(id);
  const q=$('#addQ'),u=$('#sug');if(q)q.value=UI.addText;if(u)u.hidden=true;
  $('#addN')?.focus();
}
function showSug(){
  const ul=$('#sug'),inp=$('#addQ');if(!ul||!inp)return;
  const r=suggest(inp.value);UI.sugIdx=r.length?0:-1;
  ul.innerHTML=r.map((x,i)=>`<li role="option" data-pick="${esc(x.id)}" aria-selected="${!i}">${mini(x.id)}<span class="nm">${esc(x.d)}</span></li>`).join('');
  ul.hidden=!r.length;inp.setAttribute('aria-expanded',!!r.length);
}
function addItem(){
  const p=P(),text=(UI.addText||'').trim();let id=UI.addSel;
  if(!id){const k=BYDISPLAY[text.toLowerCase()];if(k&&!ANY[k])id=k;else{const r=suggest(text);if(r.length)id=r[0].id}}
  if(!id)return toast('Pick an item from the suggestions');
  const raw=(UI.addNum||'').trim(),amt=raw===''?1:parseAmount(raw,stackOf(id));
  if(isNaN(amt)||amt<1)return toast('Amount must be a number like 64 or 2s+10');
  const ex=p.items.find(i=>i.id===id);
  if(ex){ex.total+=amt;toast(`${disp(id)} now ${ex.total}`)}else{p.items.unshift({id,total:amt,have:0});toast(`Added ${amt} ${disp(id)}`)}
  Object.assign(UI,{addText:'',addNum:'',addSel:null,filter:'all',q:''});
  go();$('#addQ')?.focus();
}
function createNew(){
  createProject(($('#newName')||{}).value);S.mode='list';
  Object.assign(UI,{dlg:null,filter:'all',q:'',edit:false,addText:'',addNum:'',addSel:null,_focus:'#addQ'});
  go();toast('Project created');
}
function renameProj(){
  const v=(($('#renameTxt')||{}).value||'').trim();if(!v)return;
  P().title=v;UI.dlg=null;go();toast('Renamed');
}
function doImport(){
  const txt=($('#impTxt').value||'').trim(),warn=w=>{UI.warn=w;UI._focus='#impTxt';render()};UI.draft=txt;
  if(!txt)return warn('Paste a list first.');
  if(txt[0]==='{'){
    try{
      const j=JSON.parse(txt);if(!j.stackwise||!j.S)throw 0;
      const c=cleanState(j.S);if(!c.order.length)throw 0;
      Object.assign(S,c);
      UI.dlg=null;go();toast('Backup restored');
    }catch{warn('That backup text is not valid.')}
    return;
  }
  const res=parseList(txt);
  if(!res.rows.length)return warn('No items found. Use the Litematica table or lines like "64 Oak Planks".');
  res.title||='Imported list '+(S.order.length+1);
  addProject(res);Object.assign(UI,{dlg:null,filter:'all',q:''});go();
  toast(res.rows.length+' items imported'+(res.unknown.length?` (${res.unknown.length} unknown)`:''));
}
const resetP=p=>{p.items.forEach(i=>i.have=0);p.stock={};p.prev={};p.log=[]},
rawRemaining=()=>plan(P()).raws.map(r=>[r.id,r.gross-r.have]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]),
ACTS={
  toggle:(a,p)=>{const it=p.items.find(i=>i.id===rowId(a));if(it)tick(p,it.id,it.total,a.checked);go()},
  gather:(a,p)=>{const id=rowId(a),r=plan(p).raws.find(x=>x.id===id);tick(p,id,r?r.gross:0,a.checked);go()},
  add1:(a,p)=>{const id=rowId(a);setInv(p,id,getInv(p,id)+1);go()},
  addstack:(a,p)=>{const id=rowId(a);setInv(p,id,getInv(p,id)+stackOf(id));go()},
  step:a=>{craftStep(rowId(a));go()},
  undo:a=>{undoStep(+a.closest('[data-idx]').dataset.idx);go()},
  more:a=>{
    const f=a.closest('.for'),o=f.classList.toggle('open');
    a.setAttribute('aria-expanded',o);a.textContent=o?'Show less':a.dataset.label;
    UI.open[f.dataset.mkey]=o;
  },
  import:()=>{Object.assign(UI,{dlg:'import',warn:'',draft:'',_focus:'#impTxt'});render()},
  menu:()=>{UI.dlg='menu';render()},
  welcome:()=>{UI.dlg='welcome';render()},
  new:()=>{UI.dlg='new';UI._focus='#newName';render()},
  createnew:createNew,rename:renameProj,additem:addItem,doimport:doImport,
  toggleedit:()=>{UI.edit=!UI.edit;render()},
  remove:(a,p)=>{const id=rowId(a);p.items=p.items.filter(i=>i.id!==id);delete p.prev[id];go();toast('Removed '+disp(id))},
  reset:()=>{UI.dlg='reset';render()},
  resetone:(a,p)=>{resetP(p);UI.dlg=null;go();toast('Progress reset')},
  resetall:()=>{S.order.forEach(id=>resetP(S.projects[id]));UI.dlg=null;go();toast('All lists reset')},
  close:(a,p,e)=>{if(e.target===a||a.classList.contains('btn'))closeDlg()},
  copybak:()=>copy($('#bak').value,'Backup copied'),
  askdel:()=>{UI.dlg='delete';render()},
  delproj:()=>{
    const id=S.active;S.order=S.order.filter(x=>x!==id);delete S.projects[id];
    if(S.order.length)S.active=S.order[0];else createProject('My first build');
    UI.dlg=null;go();toast('Project deleted');
  },
  copyraw:()=>copy(rawRemaining().map(([id,m])=>disp(id)+(ANY[id]?' (any wood)':'')+': '+fmt(m,stackOf(id))).join('\n')||'Nothing left to gather','Raw list copied')
};
function slideDet(d){
  const from=d.offsetHeight,opening=d._a?d._dir==='close':!d.open;
  d._a?.cancel();
  let to;
  if(opening){d.open=true;to=d.offsetHeight}
  else{d.open=false;to=d.offsetHeight;d.open=true}
  if(d.dataset.key)UI.open[d.dataset.key]=opening;
  d.style.overflow='hidden';d._dir=opening?'open':'close';
  const a=d._a=d.animate([{height:from+'px'},{height:to+'px'}],{duration:DET.dur,easing:cssv('--ease-out')||'ease-out'});
  a.onfinish=()=>{d._a=null;d.style.overflow='';if(!opening)d.open=false};
  a.oncancel=()=>{d.style.overflow=''};
}
root.addEventListener('click',e=>{
  const sm=e.target.closest('summary');
  if(sm&&!RM&&!e.target.closest('input,button,a')&&sm.parentElement.tagName==='DETAILS'&&sm.parentElement.animate){e.preventDefault();slideDet(sm.parentElement);return}
  const T=e.target,mt=T.closest('[data-mode]'),ft=T.closest('[data-filter]'),rt=T.closest('[data-rawtab]'),pk=T.closest('[data-pick]'),vt=T.closest('[data-view]');
  if(mt){S.mode=mt.dataset.mode;return go()}
  if(ft){UI.filter=ft.dataset.filter;return render()}
  if(rt){
    UI.rawTab=rt.dataset.rawtab;render();
    const an=$('#rawAnchor');
    if(an){const y=an.getBoundingClientRect().top+scrollY-(parseFloat(document.documentElement.style.getPropertyValue('--hdr'))||0)-4;if(scrollY>y)scrollTo(0,Math.max(0,y))}
    return;
  }
  if(pk)return pickItem(pk.dataset.pick);
  if(vt){UI.view=vt.dataset.view;return render()}
  const a=T.closest('[data-act]');
  if(a){UI._trigger=a;ACTS[a.dataset.act]?.(a,P(),e);UI._trigger=null}
});
root.addEventListener('toggle',e=>{const d=e.target;if(d.dataset?.key)UI.open[d.dataset.key]=d.open},true);
root.addEventListener('change',e=>{
  const a=e.target,act=a.dataset?.act;
  if(a.id==='projSel'){S.active=a.value;return go()}
  if(a.id==='sortSel'){UI.sort=a.value;return render()}
  if(act==='need'||act==='have'){
    const id=rowId(a),raw=a.value.trim(),v=act==='have'&&raw===''?0:parseAmount(raw,stackOf(id));
    if(act==='have'){if(!isNaN(v))setInv(P(),id,v)}
    else if(!isNaN(v)&&v>=1){const it=P().items.find(i=>i.id===id);if(it)it.total=v}
    go();
  }
});
root.addEventListener('input',e=>{
  const t=e.target,id=t.id;
  if(id==='q'){UI.q=t.value;const pos=t.selectionStart;render();const q=$('#q');q.focus();q.setSelectionRange(pos,pos)}
  else if(id==='impTxt')UI.draft=t.value;
  else if(id==='addQ'){UI.addText=t.value;UI.addSel=null;showSug()}
  else if(id==='addN')UI.addNum=t.value;
});
root.addEventListener('keydown',e=>{
  const a=e.target,k=e.key;
  if(a.id==='addQ'){
    const ul=$('#sug'),its=ul?[...ul.children]:[];
    if(k==='ArrowDown'||k==='ArrowUp'){
      if(!its.length||ul.hidden)return showSug();
      e.preventDefault();UI.sugIdx=(UI.sugIdx+(k==='ArrowDown'?1:-1)+its.length)%its.length;
      its.forEach((li,i)=>li.setAttribute('aria-selected',i===UI.sugIdx));its[UI.sugIdx].scrollIntoView({block:'nearest'});
    }else if(k==='Enter'){
      e.preventDefault();
      if(its.length&&!ul.hidden)pickItem(its[Math.max(0,UI.sugIdx)].dataset.pick);else $('#addN')?.focus();
    }else if(k==='Escape'&&ul)ul.hidden=true;
    return;
  }
  if(k==='Enter'){const f={addN:addItem,newName:createNew,renameTxt:renameProj}[a.id];if(f){e.preventDefault();f()}return}
  if(a.dataset?.act==='have'&&(k==='ArrowUp'||k==='ArrowDown')){
    e.preventDefault();const id=rowId(a),p=P(),key=a.id;
    setInv(p,id,getInv(p,id)+(k==='ArrowUp'?1:-1)*(e.shiftKey?stackOf(id):1));go();
    document.getElementById(key)?.focus();
  }
});
// Dialogs: Escape closes, and Tab stays inside the dialog while it is open.
document.addEventListener('keydown',e=>{
  if(!UI.dlg)return;
  if(e.key==='Escape'){closeDlg();return}
  if(e.key!=='Tab')return;
  const dlg=$('.dlg',root);if(!dlg)return;
  const f=$$('button,input,textarea,select,a[href]',dlg).filter(el=>!el.disabled&&!el.hidden&&el.getClientRects().length),ae=document.activeElement;
  if(!f.length)return;
  const first=f[0],last=f[f.length-1];
  if(!dlg.contains(ae)){e.preventDefault();first.focus()}
  else if(e.shiftKey&&(ae===first||ae===dlg)){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&ae===last){e.preventDefault();first.focus()}
});
root.addEventListener('mousedown',e=>{if(e.target.closest('.sug'))e.preventDefault()});
root.addEventListener('focusin',e=>{if(e.target.id==='addQ'&&e.target.value)showSug()});
root.addEventListener('focusout',e=>{if(e.target.id==='addQ')setTimeout(()=>{const u=$('#sug');if(u)u.hidden=true},120)});
// Another tab saved: adopt its data (this tab keeps its own project and mode).
// If you are typing or a dialog is open, the screen updates on the next action instead.
addEventListener('storage',e=>{
  if(e.key!==KEY||!e.newValue)return;
  let c;try{c=cleanState(JSON.parse(e.newValue))}catch{return}
  if(!c.order.length)return;
  const act=S.active;Object.assign(S,c);
  if(S.projects[act])S.active=act;
  const ae=document.activeElement,typing=!!ae&&root.contains(ae)&&/^(INPUT|TEXTAREA)$/.test(ae.tagName)&&ae.type!=='checkbox';
  if(!UI.dlg&&!typing)render();
});
function syncHdr(){const t=$('.top');if(t)document.documentElement.style.setProperty('--hdr',getComputedStyle(t).position==='sticky'?t.offsetHeight+10+'px':'0px')}
addEventListener('resize',syncHdr);
load();
if(!welcomeHidden())UI.dlg='welcome';
render();
})();