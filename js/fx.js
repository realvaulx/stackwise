(()=>{
'use strict';
const SW=window.SW,{RM,VIEW,MISS,FLIP,GHOST,$,$$,cssv,S,UI,P,root}=SW;
function animNum(el,from,to){
  if(RM||from===to){el.textContent=to+'%';return}
  const run=el._run=(el._run||0)+1,t0=performance.now(),dur=(parseFloat(cssv('--anim'))||.7)*1000;
  el.getAnimations?.().forEach(a=>a.cancel());
  el.textContent=from+'%';
  const step=now=>{
    if(!el.isConnected||el._run!==run)return;
    const k=Math.min(1,(now-t0)/dur),e=k<.5?4*k**3:1-(-2*k+2)**3/2;
    el.textContent=Math.round(from+(to-from)*e)+'%';
    if(k<1)requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const anim=(el,kf,dur,easing='ease')=>{if(!RM&&el.animate)return el.animate(kf,{duration:dur,easing})};
function fx(){
  const pv=UI.prev||{},oldMiss=UI._miss||new Map,oldH=UI._h||new Map,oldTop=UI._top||new Map,ease=cssv('--ease-out')||'ease-out',
  ectx=[S.active,S.mode,UI.filter,UI.sort].join('|'),pctx=ectx+'|'+UI.q+'|'+UI.edit,same=pv.pctx===pctx&&!!pv.keys,
  rawSw=pv.rawTab!==undefined&&pv.rawTab!==UI.rawTab,sw=rawSw||(pv.view!==undefined&&pv.view!==UI.view);
  root.classList.toggle('dlgin',!!UI.dlg&&UI.dlg!==pv.dlg);
  if(pv.ectx!==ectx)anim($('#view',root),[{opacity:VIEW.from},{opacity:1}],VIEW.dur,ease);
  if(sw){const seg=$(rawSw?'.subbar .seg':'.h2 .seg',root);if(seg)$$('button',seg).forEach(b=>{b.getAnimations?.().forEach(a=>a.cancel());anim(b,[{opacity:.55},{opacity:1}],220,ease)})}
  const rows=$$('.row[data-id],.tree[data-id]',root),keys=new Set,done=new Set;
  rows.forEach(el=>{const k=pctx+'|'+el.dataset.id;keys.add(k);if(el.classList.contains('done'))done.add(k)});
  const flip=(el,dy,hold,lift)=>{
    if(RM||!el.animate)return;
    if(lift){el.style.zIndex=2;el.style.pointerEvents='none';if(getComputedStyle(el).position==='static')el.style.position='relative'}
    const a=el.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:FLIP.dur,delay:hold?FLIP.delay:0,easing:cssv('--ease-out')||'ease-out',fill:'backwards'});
    if(lift)a.onfinish=a.oncancel=()=>{el.style.zIndex='';el.style.position='';el.style.pointerEvents=''};
  },
  hold=same&&S.mode==='raw'&&rows.some(el=>{const k=pctx+'|'+el.dataset.id;return pv.keys.has(k)&&done.has(k)!==pv.done.has(k)}),
  ghosts=rows=>{
    if(RM)return;
    const old=UI._rowEls||new Map,place=new Map(rows.map(el=>[el.dataset.id,el]));
    let lst=$('ul.list',root);
    old.forEach((g,id)=>{
      if(place.has(id))return;
      const carried=g.classList.contains('ghost'),it=P().items.find(i=>i.id===id);
      if(!carried&&!it)return;
      if(!lst){const em=$('.empty',root);if(!em)return;lst=document.createElement('ul');lst.className='list';em.before(lst)}
      let ref=null;
      for(let n=g.nextElementSibling;n&&!ref;n=n.nextElementSibling)ref=place.get(n.dataset.id)||null;
      if(ref&&ref.parentNode===lst)lst.insertBefore(g,ref);else lst.appendChild(g);
      place.set(id,g);
      const c=$('.check',g);
      if(carried){g.classList.remove('tickin','untick');c?.classList.remove('ticked','unticked');return}
      const done=it.have>=it.total,m=$('.miss',g),pb=$('.prog b',g),gap=parseFloat(getComputedStyle(lst).rowGap)||0;
      g.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
      g.classList.add('ghost');g.classList.toggle('done',done);g.classList.remove('partial');
      if(c)c.checked=done;
      if(m)m.classList.toggle('ok',done);
      if(pb)pb.style.width=done?'100%':'0%';
      g.style.pointerEvents='none';g.style.overflow='hidden';
      g.classList.add(done?'tickin':'untick');c?.classList.add(done?'ticked':'unticked');
      const h=g.getBoundingClientRect().height,
      a=g.animate([{height:h+'px'},{height:'0px',opacity:0,paddingTop:'0px',paddingBottom:'0px',borderTopWidth:'0px',borderBottomWidth:'0px',marginBottom:-gap+'px'}],{duration:GHOST.dur,delay:GHOST.delay,easing:cssv('--ease-out')||'ease-out',fill:'both'});
      a.onfinish=()=>g.remove();
      setTimeout(()=>g.remove(),GHOST.delay+GHOST.dur+200);
    });
  };
  if(same){
    rows.forEach(el=>{
      const id=el.dataset.id,k=pctx+'|'+id;
      if(!pv.keys.has(k)){if(sw)anim(el,[{opacity:VIEW.from},{opacity:1}],VIEW.dur,ease);else el.classList.add('drop');return}
      const c=$('.check',el),bd=done.has(k)&&!pv.done.has(k),bt=!done.has(k)&&pv.done.has(k);
      if(bd){el.classList.add('tickin');c?.classList.add('ticked')}
      else if(bt){el.classList.add('untick');c?.classList.add('unticked')}
      if(RM)return;
      const ot=oldTop.get(id);
      if(S.mode==='raw'&&!sw&&ot!==undefined){const dy=ot-el.getBoundingClientRect().top;if(Math.abs(dy)>1)flip(el,dy,hold,bd||bt)}
      const ms=$('.miss',el),old=oldMiss.get(id),oh=oldH.get(id),nh=el.getBoundingClientRect().height,hc=(bd||bt)&&oh!==undefined&&Math.abs(oh-nh)>1;
      if(hc)anim(el,[{height:oh+'px',overflow:'hidden'},{height:nh+'px',overflow:'hidden'}],MISS.h,cssv('--ease-smooth')||'ease-in-out');
      if(bd&&ms&&old){
        const t=ms.innerHTML;
        ms.innerHTML=old;ms.style.visibility='visible';
        ms.animate([{opacity:1},{opacity:0}],{duration:MISS.out,easing:'ease'}).onfinish=()=>{ms.style.visibility='';ms.innerHTML=t};
      }else if(ms){
        if(bt)anim(ms,[{opacity:0},{opacity:1}],MISS.out);
        else if(old!==undefined&&old!==ms.innerHTML)anim(ms,[{opacity:MISS.low},{opacity:1}],MISS.change,'ease-out');
      }
    });
    const logs=$$('[data-idx]',root);
    if(logs.length>pv.logN){
      const lr=logs[logs.length-1],le=P().log[logs.length-1],lt=le?oldTop.get(le.id):undefined;
      if(!RM&&!sw&&S.mode==='raw'&&lt!==undefined){
        lr.classList.add('tickin');$('.check',lr)?.classList.add('ticked');
        const dy=lt-lr.getBoundingClientRect().top;if(Math.abs(dy)>1)flip(lr,dy,false,true);
      }else lr.classList.add('drop','tickin');
    }
    if(S.mode==='list'&&!sw)ghosts(rows);
  }
  const bdur=(parseFloat(cssv('--anim'))||.5)*1000,bease=cssv('--ease-smooth')||'ease-in-out';
  let mainW=pv.mainW;
  $$('.bar b,.prog b',root).forEach(el=>{
    if(RM||!el.animate)return;
    const slide=(from,to)=>anim(el,[{width:from*100+'%'},{width:to*100+'%'}],bdur,bease);
    if(!el.closest('.bar')){
      const id=el.closest('[data-id]').dataset.id,from=UI._rows.get(id),to=(parseFloat(el.style.width)||0)/100;
      if(same&&!sw&&pv.keys.has(pctx+'|'+id)&&from!==undefined&&from!==to)slide(from,to);
      return;
    }
    const to=parseFloat(el.style.getPropertyValue('--w'))||0,from=rawSw&&UI._raw!==undefined?UI._raw:pv.mainW??0;
    mainW=to;
    if(from!==to){el.getAnimations?.().forEach(a=>a.cancel());slide(from,to)}
  });
  const pe=$('.pct,.pct2',root);let shown=pv.shown;
  if(pe){shown=parseInt(pe.textContent,10)||0;animNum(pe,UI._shown??pv.shown??0,shown)}
  const sp=$('.rawprog .sumtext p',root),rawText=sp?sp.textContent:'';
  if(rawSw&&sp&&pv.rawText!==undefined&&pv.rawText!==rawText){sp.getAnimations?.().forEach(a=>a.cancel());anim(sp,[{opacity:0,filter:'blur(3px)'},{opacity:1,filter:'blur(0)'}],400,ease)}
  UI.prev={ectx,pctx,dlg:UI.dlg,keys,done,logN:$$('[data-idx]',root).length,mainW,shown,rawText,rawTab:UI.rawTab,view:UI.view};
}
Object.assign(SW,{fx});
})();
