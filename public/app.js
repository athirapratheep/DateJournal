/* ============ helpers ============ */
const $=(s,r=document)=>r.querySelector(s);
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ICON={
 back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
 plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
 grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>',
 gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
 right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
 trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
 share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6l6.8-3.9M8.6 13.4l6.8 3.9"/></svg>',
 copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"/></svg>'
};
const COLORS=[['Slate','#5B6F8C'],['Sage','#7E9A87'],['Rose','#C58B93'],['Honey','#D2A74A'],['Plum','#6E4F6E'],['Ink','#2B2F3A'],['Sky','#8FB3C7'],['Coral','#DF7C6B']];
const RATIOS=[['auto','Match first image',null],['4:5',"4:5 portrait",.8],['1:1','1:1 square',1],['a4','A4',.7071],['9:16','9:16 story',.5625],['16:9','16:9 slide',1.7778],['4:3','4:3',1.3333]];
const inkOn=hex=>{const n=parseInt(hex.slice(1),16);return (0.299*(n>>16)+0.587*(n>>8&255)+0.114*(n&255))>165?'#20242B':'#FFFFFF'};
const fmtDate=v=>{if(!v)return '';const d=new Date(v+'T00:00:00');return isNaN(d)?'':d.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'})};

let toastTimer;
function toast(msg,sticky){
  $('.toast')?.remove();clearTimeout(toastTimer);
  const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);
  if(!sticky)toastTimer=setTimeout(()=>t.remove(),2800);
}

/* ============ storage (IndexedDB, falls back to memory) ============ */
const DB={db:null,ok:false,
  async init(){
    try{
      this.db=await new Promise((res,rej)=>{
        const r=indexedDB.open('date-journal',1);
        r.onupgradeneeded=()=>r.result.createObjectStore('books',{keyPath:'id'});
        r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
      });
      this.ok=true;
    }catch(e){this.ok=false}
  },
  all(){return this.ok?new Promise(res=>{try{const q=this.db.transaction('books').objectStore('books').getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>res([])}catch(e){res([])}}):Promise.resolve([])},
  put(b){if(!this.ok)return;try{this.db.transaction('books','readwrite').objectStore('books').put(JSON.parse(JSON.stringify(b)))}catch(e){toast("Couldn't save. Your browser storage may be full.")}},
  del(id){if(!this.ok)return;try{this.db.transaction('books','readwrite').objectStore('books').delete(id)}catch(e){}}
};
const saveTimers={};
function persist(b){clearTimeout(saveTimers[b.id]);saveTimers[b.id]=setTimeout(()=>DB.put(b),250)}

/* ============ images ============ */
async function processImage(file,maxDim=1800){
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url});
    const w=img.naturalWidth,hh=img.naturalHeight,s=Math.min(1,maxDim/Math.max(w,hh));
    const cw=Math.round(w*s),ch=Math.round(hh*s);
    const c=document.createElement('canvas');c.width=cw;c.height=ch;
    const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cw,ch);x.drawImage(img,0,0,cw,ch);
    return {src:c.toDataURL('image/jpeg',.9),ratio:cw/ch};
  }finally{URL.revokeObjectURL(url)}
}
function pickFiles(multiple){
  return new Promise(res=>{
    const i=document.createElement('input');i.type='file';i.accept='image/*';i.multiple=!!multiple;
    i.onchange=()=>res([...i.files]);i.click();
  });
}
const byName=(a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true});

/* ============ state ============ */
const app=$('#app');
let books=[];
let V=null; // active viewer

function bookRatio(b){return b.ratio||.8}
function syncRatio(b){
  if(b.auto){const p=b.pages.find(p=>p.ratio);b.ratio=p?p.ratio:null}
}
function newBook(d){
  return {id:uid(),title:d.title||'Untitled',color:d.color,cover:d.cover,auto:d.auto,ratio:d.ratio,fit:d.fit,pages:[],created:Date.now()};
}

/* ============ covers ============ */
function coverHTML(b){
  return `<div class="cover ${b.cover?'has-img':''}" style="--cv:${b.color};--cink:${inkOn(b.color)}">${b.cover?`<img src="${b.cover}" alt="" draggable="false">`:''}<div class="cover-title"><span>${h(b.title||'Untitled')}</span></div><div class="spine"></div></div>`;
}

/* ============ sheets ============ */
function sheet(html,cls=''){
  const ov=document.createElement('div');ov.className='overlay';
  ov.innerHTML=`<div class="sheet ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(ov);
  const el=ov.firstElementChild;
  const close=()=>{document.removeEventListener('keydown',onKey);ov.remove()};
  const onKey=e=>{if(e.key==='Escape')close()};
  document.addEventListener('keydown',onKey);
  ov.addEventListener('pointerdown',e=>{if(e.target===ov)close()});
  return {el,close};
}

/* ============ shelf ============ */
function renderShelf(){
  V=null;
  const total=books.reduce((n,b)=>n+b.pages.length,0);
  app.innerHTML=`<div class="shelf">
    <header class="shelf-head"><h1>Date journal</h1>
    <p class="sub">${books.length?`${books.length} ${books.length===1?'book':'books'} · ${total} ${total===1?'page':'pages'}`:'Make a book, then add the pages you designed in Canva.'}</p></header>
    <div class="books">
      ${books.map(b=>`<button class="bk" data-id="${b.id}" aria-label="Open ${h(b.title)}"><span class="bk-cover" style="aspect-ratio:${bookRatio(b)}">${coverHTML(b)}</span><span class="bk-count">${b.pages.length} ${b.pages.length===1?'page':'pages'}</span></button>`).join('')}
      <button class="newbook" data-new>${ICON.plus}<span>New book</span></button>
    </div></div>`;
  app.onclick=e=>{
    const bk=e.target.closest('.bk');if(bk){openBook(bk.dataset.id);return}
    if(e.target.closest('[data-new]'))bookSheet(null);
  };
}

/* ============ book create / edit sheet ============ */
function bookSheet(book){
  const isNew=!book;
  const d=isNew?{title:'',color:COLORS[0][1],cover:null,auto:true,ratio:null,fit:'contain'}
               :{title:book.title,color:book.color,cover:book.cover,auto:book.auto,ratio:book.ratio,fit:book.fit};
  const s=sheet('');
  let armed=false;
  const ratioOn=r=>r[0]==='auto'?d.auto:(!d.auto&&d.ratio&&Math.abs(d.ratio-r[2])<.005);
  const draw=(keepFocus)=>{
    const focus=keepFocus&&document.activeElement===$('#f-title',s.el);
    const pr=d.ratio||.8;
    s.el.innerHTML=`
      <div class="sheet-head"><h2>${isNew?'New book':'Book settings'}</h2><button class="iconbtn" data-a="close" aria-label="Close">${ICON.x}</button></div>
      <div class="preview-row">
        <div class="pv" style="width:${pr>=1?120:96}px;aspect-ratio:${pr}">${coverHTML(d)}</div>
        <div style="flex:1"><label class="lab" for="f-title">Title</label><input id="f-title" type="text" maxlength="60" value="${h(d.title)}" placeholder="Summer dates"></div>
      </div>
      <div class="field"><span class="lab">Cover colour</span><div class="swatches" role="radiogroup" aria-label="Cover colour">
        ${COLORS.map(([n,c])=>`<button class="sw" role="radio" aria-checked="${d.color===c}" aria-label="${n}" data-color="${c}" style="background:${c}"></button>`).join('')}</div></div>
      <div class="field"><span class="lab">Cover image (optional)</span><div class="row">
        <button class="btn" data-a="cover">Choose image</button>${d.cover?'<button class="btn ghost" data-a="nocover">Remove image</button>':''}</div></div>
      <div class="field"><span class="lab">Page size</span><div class="ratios" role="radiogroup" aria-label="Page size">
        ${RATIOS.map(r=>`<button class="chip" role="radio" aria-checked="${!!ratioOn(r)}" data-r="${r[0]}"><i style="width:${Math.round(clamp((r[2]||.8)*20,11,34))}px"></i>${r[1]}</button>`).join('')}</div>
        <p class="hint">Pick the size you export from Canva. “Match first image” copies the shape of the first page you add.</p></div>
      <div class="field"><span class="lab">Images on the page</span><div class="seg" role="radiogroup" aria-label="Image fit">
        <button role="radio" aria-checked="${d.fit==='contain'}" data-fit="contain">Show whole design</button>
        <button role="radio" aria-checked="${d.fit==='cover'}" data-fit="cover">Fill the page</button></div></div>
      <div class="sheet-foot">${isNew?'':`<button class="btn danger ${armed?'armed':''}" data-a="del">${armed?'Tap again to delete':'Delete book'}</button>`}<span class="sp"></span>
        <button class="btn primary" data-a="save">${isNew?'Create book':'Save changes'}</button></div>`;
    if(focus){const i=$('#f-title',s.el);i.focus();i.setSelectionRange(i.value.length,i.value.length)}
  };
  draw();
  if(isNew)setTimeout(()=>$('#f-title',s.el)?.focus(),50);
  s.el.addEventListener('input',e=>{
    if(e.target.id==='f-title'){d.title=e.target.value;const pv=$('.pv',s.el);pv.innerHTML=coverHTML(d)}
  });
  s.el.addEventListener('click',async e=>{
    const t=e.target.closest('button');if(!t)return;
    if(t.dataset.color){d.color=t.dataset.color;draw();return}
    if(t.dataset.fit){d.fit=t.dataset.fit;draw();return}
    if(t.dataset.r){const r=RATIOS.find(x=>x[0]===t.dataset.r);d.auto=r[0]==='auto';d.ratio=d.auto?(book?(book.pages.find(p=>p.ratio)?.ratio||null):null):r[2];draw();return}
    const a=t.dataset.a;
    if(a==='close')s.close();
    if(a==='cover'){
      const f=(await pickFiles(false))[0];if(!f)return;
      try{d.cover=(await processImage(f,1000)).src;draw()}catch(err){toast("That image couldn't be read. Try a PNG or JPG.")}
    }
    if(a==='nocover'){d.cover=null;draw()}
    if(a==='del'){
      if(!armed){armed=true;draw();return}
      DB.del(book.id);books=books.filter(b=>b.id!==book.id);s.close();renderShelf();toast('Book deleted');
    }
    if(a==='save'){
      d.title=($('#f-title',s.el).value||'').trim()||'Untitled';
      if(isNew){const b=newBook(d);books.push(b);DB.put(b);s.close();openBook(b.id)}
      else{
        Object.assign(book,{title:d.title,color:d.color,cover:d.cover,auto:d.auto,ratio:d.ratio,fit:d.fit});
        syncRatio(book);persist(book);s.close();
        if(V&&V.book===book){$('.bar-title').textContent=book.title;buildLeaves();layoutStage();paint(true)}
      }
    }
  });
}

/* ============ book viewer ============ */
function openBook(id){
  const book=books.find(b=>b.id===id);if(!book)return;
  renderBookView(book,false);
}
function renderBookView(book,readonly){
  app.onclick=null;
  app.innerHTML=`<div class="bookview">
    <header class="bar">
      <button class="iconbtn" data-a="back" aria-label="${readonly?'Go to Date journal':'Back to shelf'}">${ICON.back}</button>
      <div class="bar-title">${h(book.title)}</div>
      <div class="bar-actions">${readonly?'':`
        <button class="btn ghost" data-a="add" aria-label="Add pages">${ICON.plus}<span class="lbl">Add pages</span></button>
        <button class="btn ghost" data-a="pages" aria-label="All pages">${ICON.grid}<span class="lbl">Pages</span></button>
        <button class="iconbtn" data-a="share" aria-label="Share this book">${ICON.share}</button>
        <button class="iconbtn" data-a="settings" aria-label="Book settings">${ICON.gear}</button>`}
      </div>
    </header>
    <main class="stage-wrap"><div class="stage" tabindex="0" aria-label="Book. Swipe, drag, or use arrow keys to turn pages."></div></main>
    <footer class="meta"><div class="meta-text"></div><div class="counter"></div></footer>
    ${readonly?'<div class="shared-badge">Shared with you — view only · <a href="/">Make your own</a></div>':''}
  </div>`;
  V={book,p:0,L:1,W:0,raf:0,drag:null,leaves:[],idx:-1,wheelLock:0,readonly};
  const stage=$('.stage');V.stage=stage;
  buildLeaves();layoutStage();paint(true);

  $('.bar').onclick=e=>{
    const t=e.target.closest('button');if(!t)return;
    if(t.dataset.a==='back'){readonly?(location.href='/'):renderShelf();return}
    if(readonly)return;
    if(t.dataset.a==='add')addPages();
    if(t.dataset.a==='pages')openOverview();
    if(t.dataset.a==='share')shareBook(book);
    if(t.dataset.a==='settings')bookSheet(book);
  };
  $('.meta').onclick=e=>{
    if(readonly)return;
    const t=e.target.closest('button');if(!t)return;
    if(t.dataset.a==='add')addPages();
    if(t.dataset.a==='edit')editDetails(V.idx-1);
  };

  stage.addEventListener('pointerdown',e=>{
    if(e.button>0)return;cancelAnimationFrame(V.raf);
    const now=performance.now();
    V.drag={x0:e.clientX,p0:V.p,lx:e.clientX,lt:now,v:0,moved:false};
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove',e=>{
    const d=V.drag;if(!d)return;
    const dx=e.clientX-d.x0;if(Math.abs(dx)>4)d.moved=true;
    const span=V.W*.85,now=performance.now(),dt=now-d.lt;
    if(dt>0){d.v=.8*d.v+.2*(-(e.clientX-d.lx)/span/dt)}
    d.lx=e.clientX;d.lt=now;
    let np=d.p0-dx/span;
    // Soft resistance past the front/back cover — a little give instead of
    // a hard stop, so it doesn't feel like hitting a wall.
    if(np<0)np*=.35;else if(np>V.L-1)np=(V.L-1)+(np-(V.L-1))*.35;
    V.p=clamp(np,-.18,V.L-1+.18);paint();
  });
  const end=e=>{
    const d=V.drag;if(!d)return;V.drag=null;
    if(!d.moved){
      const r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,base=Math.round(V.p);
      goTo(x>.6?base+1:x<.4?base-1:base);return;
    }
    const base=Math.round(d.p0),moved=V.p-d.p0;
    let t=base;
    if(moved>.22||d.v>.0007)t=base+1;else if(moved<-.22||d.v<-.0007)t=base-1;
    goTo(t,{velocity:d.v*1000});
  };
  stage.addEventListener('pointerup',end);
  stage.addEventListener('pointercancel',end);
  stage.addEventListener('wheel',e=>{
    if(Math.abs(e.deltaX)<Math.abs(e.deltaY)||Math.abs(e.deltaX)<30)return;
    e.preventDefault();
    const now=performance.now();if(now<V.wheelLock)return;V.wheelLock=now+450;
    goTo(Math.round(V.p)+(e.deltaX>0?1:-1));
  },{passive:false});
}
document.addEventListener('keydown',e=>{
  if(!V||document.querySelector('.overlay'))return;
  if(/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
  if(e.key==='ArrowRight')goTo(Math.round(V.p)+1);
  if(e.key==='ArrowLeft')goTo(Math.round(V.p)-1);
});
window.addEventListener('resize',()=>{if(V)layoutStage()});

function layoutStage(){
  const wrap=$('.stage-wrap');if(!wrap)return;
  const r=bookRatio(V.book),cs=getComputedStyle(wrap);
  const aw=wrap.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
  const ah=wrap.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)-6;
  const w=Math.max(80,Math.min(aw,ah*r));
  V.W=w;V.stage.style.width=w+'px';V.stage.style.height=(w/r)+'px';
  // A closer, width-relative vanishing point makes the turning page visibly
  // foreshorten and bow instead of just shrinking flat like a sliding card.
  V.stage.style.setProperty('--persp',Math.round(clamp(w*1.55,780,2000))+'px');
}

function buildLeaves(){
  const b=V.book;V.L=b.pages.length+1;V.p=clamp(V.p,0,V.L-1);
  V.stage.innerHTML='<div class="stage-shadow"></div>';
  V.leaves=[];
  for(let i=0;i<V.L;i++){
    const el=document.createElement('div');el.className='leaf';
    el.innerHTML='<div class="front"></div><div class="back"><div class="shade"></div></div>';
    V.stage.appendChild(el);
    V.leaves.push({el,front:el.firstChild,back:el.lastChild,ready:false,shade:null,bshade:el.lastChild.firstChild});
  }
  V.idx=-1;
}
function leafContent(i){
  const b=V.book;
  if(i===0)return coverHTML(b);
  const pg=b.pages[i-1];
  return `<div class="pg" style="--fit:${b.fit}">${pg.src?`<img src="${pg.src}" alt="Page ${i}${pg.date?', '+fmtDate(pg.date):''}" draggable="false" decoding="async">`:'<div class="blank"></div>'}</div>`;
}
function ensure(i){
  const l=V.leaves[i];if(!l||l.ready)return;
  l.front.innerHTML=leafContent(i)+'<div class="shade"></div>';
  l.shade=l.front.lastChild;l.ready=true;
}
function paint(force){
  const p=V.p,L=V.L,fl=Math.floor(p);
  V.leaves.forEach((l,i)=>{
    const f=clamp(p-i,0,1);
    const near=i>=fl-1&&i<=fl+2;
    if(!near||f>=1){l.el.style.display='none';return}
    ensure(i);
    l.el.style.display='block';
    l.el.style.zIndex=L-i;
    l.el.style.transform=f>0?`rotateY(${-180*f}deg)`:'none';
    l.el.style.opacity=f<.6?1:Math.max(0,1-(f-.6)/.4);
    l.el.style.setProperty('--f',f);
    l.el.style.setProperty('--lift',f>0&&f<1?Math.sin(f*Math.PI).toFixed(3):0);
    const back=f>.5;
    l.front.style.display=back?'none':'block';
    l.back.style.display=back?'block':'none';
    const prevF=i>0?clamp(p-(i-1),0,1):0;
    const under=(prevF>0&&prevF<1)?.42*(1-prevF):0;
    const own=f>0?Math.sin(Math.min(f,.5)*Math.PI)*.42:0;
    if(l.shade)l.shade.style.opacity=Math.max(under,own);
    l.bshade.style.opacity=f>.5?(1-f)*.36:0;
  });
  const idx=Math.round(p);
  if(idx!==V.idx||force){V.idx=idx;updateMeta()}
}
function goTo(t,opts={}){
  t=clamp(Math.round(t),0,V.L-1);cancelAnimationFrame(V.raf);
  if(reduceMotion||opts.instant){V.p=t;V.vel=0;paint();return}
  const target=t;let vel=opts.velocity||0,last=performance.now();
  // Critically-damped spring: carries the drag's exit velocity straight into
  // the settle, so a flick keeps its momentum instead of restarting on a
  // fixed timing curve — the thing that made this read as a slide, not paper.
  const k=210,c=27.5;
  const step=now=>{
    const dt=Math.min(32,now-last)/1000;last=now;
    const x=V.p-target,accel=(-k*x-c*vel);
    vel+=accel*dt;V.p+=vel*dt;paint();
    if(Math.abs(V.p-target)>.0015||Math.abs(vel)>.02){V.raf=requestAnimationFrame(step)}
    else{V.p=target;V.vel=0;paint()}
  };
  V.raf=requestAnimationFrame(step);
}
function updateMeta(){
  const b=V.book,i=V.idx,m=$('.meta-text'),c=$('.counter');if(!m)return;
  const ro=V.readonly;
  if(b.pages.length===0){
    m.innerHTML=`<div class="meta-date">This book is empty</div>${ro?'':`<div class="meta-empty">Upload the pages you made in Canva. They'll be added in file-name order.</div><p style="margin:10px 0 0"><button class="btn primary" data-a="add">${ICON.plus}Add pages</button></p>`}`;
    c.textContent='';return;
  }
  if(i===0){
    m.innerHTML=`<div class="meta-date">${h(b.title)}</div><div class="meta-empty">${b.pages.length} ${b.pages.length===1?'page':'pages'}. Swipe to open.</div>`;
    c.textContent='Cover';return;
  }
  const pg=b.pages[i-1];
  if(ro){
    m.innerHTML=(pg.date||pg.note)
      ?`${pg.date?`<div class="meta-date">${h(fmtDate(pg.date))}</div>`:''}${pg.note?`<div class="meta-note">${h(pg.note)}</div>`:''}`
      :`<div class="meta-empty">No date or note added.</div>`;
  }else{
    m.innerHTML=(pg.date||pg.note)
      ?`${pg.date?`<div class="meta-date">${h(fmtDate(pg.date))}</div>`:''}${pg.note?`<div class="meta-note">${h(pg.note)}</div>`:''}<button class="link" data-a="edit">Edit details</button>`
      :`<div class="meta-empty">No date or note yet.</div><button class="link" data-a="edit">Add date and note</button>`;
  }
  c.textContent=`${i} / ${b.pages.length}`;
}

/* ============ add pages ============ */
async function addPages(){
  const files=await pickFiles(true);if(!files.length)return;
  files.sort(byName);
  const b=V.book;let ok=0,bad=0;
  toast(`Adding ${files.length} ${files.length===1?'page':'pages'}…`,true);
  const firstNew=b.pages.length+1;
  for(const f of files){
    try{const r=await processImage(f);b.pages.push({id:uid(),src:r.src,ratio:r.ratio,date:'',note:''});ok++}
    catch(e){bad++}
  }
  syncRatio(b);persist(b);
  buildLeaves();layoutStage();
  if(ok){goTo(firstNew)}else paint(true);
  toast(bad?`Added ${ok}. ${bad} couldn't be read (use PNG or JPG).`:`Added ${ok} ${ok===1?'page':'pages'}`);
  paint(true);
}

/* ============ page details ============ */
function editDetails(pi){
  const b=V.book,pg=b.pages[pi];if(!pg)return;
  const s=sheet(`
    <div class="sheet-head"><h2>Page ${pi+1}</h2><button class="iconbtn" data-a="close" aria-label="Close">${ICON.x}</button></div>
    <div class="field"><label for="d-date">Date</label><input id="d-date" type="date" value="${h(pg.date)}"></div>
    <div class="field"><label for="d-note">Note</label><textarea id="d-note" maxlength="500" placeholder="Where you went, what you'd order again…">${h(pg.note)}</textarea></div>
    <div class="sheet-foot"><button class="btn" data-a="replace">Replace design</button><span class="sp"></span><button class="btn primary" data-a="save">Save</button></div>`);
  s.el.addEventListener('click',async e=>{
    const t=e.target.closest('button');if(!t)return;
    const a=t.dataset.a;
    if(a==='close')s.close();
    if(a==='save'){pg.date=$('#d-date',s.el).value;pg.note=$('#d-note',s.el).value.trim();persist(b);s.close();updateMeta();V.leaves[pi+1].ready=false;paint(true)}
    if(a==='replace'){
      const f=(await pickFiles(false))[0];if(!f)return;
      try{const r=await processImage(f);pg.src=r.src;pg.ratio=r.ratio;syncRatio(b);persist(b);s.close();layoutStage();V.leaves.forEach(l=>l.ready=false);paint(true);toast('Design replaced')}
      catch(err){toast("That image couldn't be read. Try a PNG or JPG.")}
    }
  });
}

/* ============ share ============ */
const MAX_SHARE_BYTES=19*1024*1024;
async function shareBook(book){
  const s=sheet(`
    <div class="sheet-head"><h2>Share this book</h2><button class="iconbtn" data-a="close" aria-label="Close">${ICON.x}</button></div>
    <p class="hint" style="margin-top:0">Anyone with the link can view "${h(book.title)}", page by page, just like you do here. They can't edit it, and it won't update after you keep adding — it's a snapshot as of right now.</p>
    <div class="sheet-foot"><span class="sp"></span><button class="btn primary" data-a="go">Create link</button></div>`);
  s.el.addEventListener('click',async e=>{
    const t=e.target.closest('button');if(!t)return;
    const a=t.dataset.a;
    if(a==='close'){s.close();return}
    if(a==='go'){
      t.disabled=true;const label=t.textContent;t.textContent='Creating link…';
      const payload={title:book.title,color:book.color,cover:book.cover,auto:book.auto,ratio:book.ratio,fit:book.fit,
        pages:book.pages.map(p=>({src:p.src,ratio:p.ratio,date:p.date,note:p.note}))};
      const bytes=new Blob([JSON.stringify(payload)]).size;
      if(bytes>MAX_SHARE_BYTES){
        toast("This book's images are too large to share in one link. Try a book with fewer pages, or smaller Canva exports.");
        t.disabled=false;t.textContent=label;return;
      }
      try{
        const r=await fetch('/api/share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const data=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(data.error||"Couldn't create the link. Try again in a moment.");
        const url=`${location.origin}/view/${data.id}`;
        s.el.innerHTML=`
          <div class="sheet-head"><h2>Link ready</h2><button class="iconbtn" data-a="close" aria-label="Close">${ICON.x}</button></div>
          <div class="field"><label for="share-url">Anyone with this link can view it</label>
            <input id="share-url" type="text" readonly value="${h(url)}"></div>
          <div class="sheet-foot"><span class="sp"></span><button class="btn primary" data-a="copy">${ICON.copy}Copy link</button></div>`;
        const input=$('#share-url',s.el);input.addEventListener('click',()=>input.select());
      }catch(err){
        toast(err.message||"Couldn't create the link. Try again in a moment.");
        t.disabled=false;t.textContent=label;
      }
    }
    if(a==='copy'){
      const input=$('#share-url',s.el);
      try{await navigator.clipboard.writeText(input.value);toast('Link copied')}
      catch(err){input.select();toast('Press ⌘/Ctrl+C to copy')}
    }
  });
}

/* ============ pages overview ============ */
function openOverview(){
  const b=V.book,s=sheet('','wide');let armed=null;
  const draw=()=>{
    const r=bookRatio(b);
    s.el.innerHTML=`<div class="sheet-head"><h2>Pages</h2><button class="btn" data-a="blank">Add blank page</button><button class="iconbtn" data-a="close" aria-label="Close">${ICON.x}</button></div>
    <div class="grid">
      <div class="th"><button class="th-pic ${V.idx===0?'cur':''}" data-a="go" data-i="0" style="aspect-ratio:${r}" aria-label="Go to cover">${coverHTML(b)}</button><div class="th-tools"><span class="n">Cover</span></div></div>
      ${b.pages.map((pg,k)=>`<div class="th"><button class="th-pic ${V.idx===k+1?'cur':''}" data-a="go" data-i="${k+1}" style="aspect-ratio:${r};--fit:${b.fit}" aria-label="Go to page ${k+1}">${pg.src?`<img src="${pg.src}" alt="" draggable="false">`:''}</button>
        <div class="th-tools"><span class="n">${k+1}</span>
          <button data-a="mv" data-k="${k}" data-d="-1" aria-label="Move page ${k+1} earlier" ${k===0?'disabled style="opacity:.35"':''}>${ICON.left}</button>
          <button data-a="mv" data-k="${k}" data-d="1" aria-label="Move page ${k+1} later" ${k===b.pages.length-1?'disabled style="opacity:.35"':''}>${ICON.right}</button>
          <button data-a="rm" data-k="${k}" class="${armed===pg.id?'armed':''}" aria-label="Delete page ${k+1}">${armed===pg.id?'Delete?':ICON.trash}</button></div></div>`).join('')}
    </div>${b.pages.length?'':'<p class="hint">No pages yet. Close this and choose Add pages.</p>'}`;
  };
  const changed=()=>{persist(b);buildLeaves();paint(true);draw()};
  draw();
  s.el.addEventListener('click',e=>{
    const t=e.target.closest('button');if(!t||t.disabled)return;
    const a=t.dataset.a,k=+t.dataset.k;
    if(a==='close')s.close();
    if(a==='go'){s.close();goTo(+t.dataset.i)}
    if(a==='blank'){b.pages.push({id:uid(),src:null,ratio:null,date:'',note:''});armed=null;changed()}
    if(a==='mv'){const j=k+ +t.dataset.d;[b.pages[k],b.pages[j]]=[b.pages[j],b.pages[k]];syncRatio(b);armed=null;changed();layoutStage()}
    if(a==='rm'){
      const pg=b.pages[k];
      if(armed!==pg.id){armed=pg.id;draw();return}
      b.pages.splice(k,1);armed=null;syncRatio(b);changed();layoutStage();
    }
  });
}

/* ============ shared (read-only) view ============ */
async function loadSharedBook(id){
  app.innerHTML=`<div class="shelf"><header class="shelf-head"><h1>Date journal</h1><p class="sub">Loading the shared book…</p></header></div>`;
  let res;
  try{res=await fetch(`/api/share/${encodeURIComponent(id)}`)}
  catch(e){
    app.innerHTML=`<div class="shelf"><header class="shelf-head"><h1>Couldn't load this book</h1><p class="sub">Check your connection and try reloading the page.</p></header></div>`;
    return;
  }
  if(res.status===404){
    app.innerHTML=`<div class="shelf"><header class="shelf-head"><h1>Link not found</h1><p class="sub">This journal link doesn't exist anymore, or was typed wrong.</p></header><p style="margin-top:24px"><a class="link" href="/">Go to Date journal</a></p></div>`;
    return;
  }
  if(!res.ok){
    const data=await res.json().catch(()=>({}));
    app.innerHTML=`<div class="shelf"><header class="shelf-head"><h1>Couldn't load this book</h1><p class="sub">${h(data.error||'Something went wrong. Try again in a moment.')}</p></header></div>`;
    return;
  }
  const book=await res.json().catch(()=>null);
  if(!book||!Array.isArray(book.pages)){
    app.innerHTML=`<div class="shelf"><header class="shelf-head"><h1>Couldn't load this book</h1><p class="sub">The data for this link looked unexpected.</p></header></div>`;
    return;
  }
  renderBookView(book,true);
}

/* ============ start ============ */
(async function init(){
  const shared=location.pathname.match(/^\/view\/([A-Za-z0-9_-]+)\/?$/);
  if(shared){await loadSharedBook(shared[1]);return}
  await DB.init();
  books=(await DB.all()).sort((a,b)=>a.created-b.created);
  renderShelf();
  if(!DB.ok)toast("Saving isn't available here, so books will disappear when you close this page.");
})();
