<script>
/* ===== อิโมจิ/สติกเกอร์ในเกม: ปุ่มลอย + ถาดเลือก + ข้อความลอยของทุกคน + บอทส่งสติกเกอร์กวนๆ ===== */
(function(){
'use strict';
var SHEET='data:image/webp;base64,@SHEET@';
var NAMES=['ดีใจ','ร้องไห้','ขำก๊าก','เขิน','ตกใจ','รักเลย','ง่วง','งง','โกรธ','แลบลิ้น','เหงื่อตก','เท่','ใจสลาย','ยิ้มแป้น','เมา','อายจัง'];
var TAUNT=[9,11,2,8,6,7,13,14],SAD=[1,12,10,15],WOW=[4,5,3];
var place=function(){},put=function(b,x,y){var W=innerWidth,H=innerHeight;x=Math.max(4,Math.min(W-52,x));y=Math.max(4,Math.min(H-52,y));b.style.left=x+'px';b.style.top=y+'px';b.style.right='auto';b.style.bottom='auto';};
var o={send:null,bot:false,pos:null},saved=false,PK='em.pos.v1:'+location.pathname,on=false,els=null,last=0,seen={},timers=[];
function css(){
  var s=document.createElement('style');
  s.textContent='.emi{display:inline-block;background-image:url('+SHEET+');background-repeat:no-repeat;flex:none}'+
  '#emBtn{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:65;touch-action:none;user-select:none;-webkit-user-select:none;width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:#2a3b4b;box-shadow:0 3px 10px rgba(0,0,0,.35);padding:0;display:grid;place-items:center;cursor:pointer;touch-action:manipulation}'+
  '#emBtn:active{transform:scale(.92)}#emBtn[hidden],#emTray[hidden]{display:none!important}'+
  '#emTray{position:fixed;z-index:66;background:#17222d;border:1px solid #2a3b4b;border-radius:16px;padding:8px;box-shadow:0 8px 24px rgba(0,0,0,.45);display:grid;grid-template-columns:repeat(4,56px);gap:4px}'+
  '#emTray button{width:56px;height:56px;border:0;border-radius:12px;background:transparent;padding:0;display:grid;place-items:center;cursor:pointer}'+
  '#emTray small{grid-column:1/-1;text-align:center;color:#8aa0b2;font:12px Sarabun,system-ui,sans-serif;padding:2px 0 0}'+
  '#emTray button:hover,#emTray button:focus-visible{background:rgba(255,255,255,.12);outline:none}#emTray button:active{transform:scale(.9)}'+
  '#emTray button[disabled]{opacity:.4}'+
  '#emFeed{position:fixed;z-index:80;display:flex;flex-direction:column;gap:6px;align-items:flex-end;pointer-events:none}'+
  '.emf{display:flex;flex-direction:column;align-items:center;gap:2px;animation:emPop .35s cubic-bezier(.2,1.6,.4,1) both,emOut .4s ease 2.6s forwards}'+
  '.emf span{font:700 12px/1.2 Sarabun,system-ui,sans-serif;color:#fff;background:rgba(10,16,24,.78);border-radius:99px;padding:2px 9px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
  '.emf.me span{background:rgba(255,207,90,.92);color:#2a2007}'+
  '@keyframes emPop{from{transform:scale(.2) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}@keyframes emOut{to{opacity:0;transform:translateY(-14px)}}'+
  '@media (prefers-reduced-motion:reduce){.emf{animation:emOut .4s ease 2.6s forwards}}';
  document.head.appendChild(s);
}
function sp(i,sz){var c=i%4,r=(i/4)|0;return'<i class="emi" style="width:'+sz+'px;height:'+sz+'px;background-size:'+sz*4+'px '+sz*4+'px;background-position:-'+c*sz+'px -'+r*sz+'px"></i>';}
function ui(){
  if(els)return els;
  css();
  var f=document.createElement('div');f.id='emFeed';f.setAttribute('aria-live','polite');
  var b=document.createElement('button');b.id='emBtn';b.type='button';b.hidden=!on;b.setAttribute('aria-label','ส่งอิโมจิ');b.innerHTML=sp(0,36);
  var t=document.createElement('div');t.id='emTray';t.hidden=true;t.setAttribute('role','menu');
  t.innerHTML=NAMES.map(function(n,i){return'<button type="button" data-i="'+i+'" title="'+n+'" aria-label="'+n+'">'+sp(i,48)+'</button>';}).join('')+'<small>ลากปุ่มเพื่อย้ายตำแหน่งได้</small>';
  document.body.appendChild(f);document.body.appendChild(t);document.body.appendChild(b);
  var drag=null;
  try{var sp0=JSON.parse(localStorage.getItem(PK)||'null');if(sp0){put(b,sp0.x,sp0.y);saved=true;}}catch(x){}
  b.addEventListener('pointerdown',function(e){var r=b.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,l:r.left,t:r.top,m:false};try{b.setPointerCapture(e.pointerId);}catch(x){}});
  b.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.m&&Math.hypot(dx,dy)>8)drag.m=true;if(drag.m){put(b,drag.l+dx,drag.t+dy);t.hidden=true;place();}});
  b.addEventListener('pointerup',function(){if(!drag)return;var m=drag.m;drag=null;if(m){var r=b.getBoundingClientRect();try{localStorage.setItem(PK,JSON.stringify({x:r.left,y:r.top}));saved=true;}catch(x){}return;}t.hidden=!t.hidden;if(!t.hidden)place();});
  b.addEventListener('pointercancel',function(){drag=null;});
  b.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();t.hidden=!t.hidden;if(!t.hidden)place();}});
  addEventListener('resize',function(){var r=b.getBoundingClientRect();put(b,r.left,r.top);place();});
  place=function(){
    var r=b.getBoundingClientRect(),W=innerWidth,H=innerHeight,right=Math.max(6,W-r.right);
    t.style.right=right+'px';f.style.right=right+'px';
    if(r.top>340){t.style.bottom=(H-r.top+8)+'px';t.style.top='auto';}else{t.style.top=(r.bottom+8)+'px';t.style.bottom='auto';}
    if(r.top>190){f.style.bottom=(H-r.top+8)+'px';f.style.top='auto';f.style.flexDirection='column';}else{f.style.top=(r.bottom+8)+'px';f.style.bottom='auto';f.style.flexDirection='column-reverse';}
  };
  place();
  t.onclick=function(e){var x=e.target.closest('button');if(!x||x.disabled)return;send(+x.dataset.i);};
  document.addEventListener('click',function(e){if(!t.hidden&&!t.contains(e.target)&&e.target!==b&&!b.contains(e.target))t.hidden=true;});
  return(els={feed:f,btn:b,tray:t});
}
function show(i,name,mine){
  var e=ui();place();var d=document.createElement('div');d.className='emf'+(mine?' me':'');
  d.innerHTML=sp(i,76)+'<span></span>';d.lastChild.textContent=name||'';
  e.feed.appendChild(d);while(e.feed.children.length>4)e.feed.removeChild(e.feed.firstChild);
  setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},3100);
}
function send(i){
  var now=Date.now();if(now-last<1500)return;last=now;
  var e=ui();e.tray.hidden=true;
  var btns=e.tray.querySelectorAll('button');for(var k=0;k<btns.length;k++)btns[k].disabled=true;
  setTimeout(function(){for(var k=0;k<btns.length;k++)btns[k].disabled=false;},1500);
  show(i,'คุณ',true);
  try{if(o.send)o.send({i:i,n:now});}catch(x){}
  if(o.bot&&Math.random()<.6)botLater(700+Math.random()*900);
}
function pick(a){return a[(Math.random()*a.length)|0];}
function botLater(ms,list){later(function(){show(pick(list||TAUNT),'บอท');},ms);}
function later(fn,ms){var t=setTimeout(fn,ms);timers.push(t);}
window.EM={
  init:function(c){o.send=c.send||null;o.bot=!!c.bot;if(c.pos)o.pos=c.pos;},
  enable:function(v){on=!!v;var e=ui();e.btn.hidden=!on;if(!on){e.tray.hidden=true;}else{if(!saved&&o.pos){var st=e.btn.style;st.left='auto';st.top='auto';st.right='12px';st.bottom='auto';for(var k in o.pos)st[k]=o.pos[k];}place();}},
  show:show,
  /* รับสติกเกอร์ของคนอื่นจาก presence: peers = {peerId: presence} */
  onPeers:function(peers,meId,nameFn){
    for(var id in peers){
      if(id===meId)continue;var em=peers[id]&&peers[id].em,ok=em&&typeof em.i==='number'&&em.i>=0&&em.i<16&&typeof em.n==='number';
      if(!(id in seen)){seen[id]=ok?em.n:0;continue;}
      if(!ok||seen[id]===em.n)continue;
      seen[id]=em.n;show(em.i,nameFn?nameFn(id):'',false);
    }
  },
  reset:function(){seen={};},
  /* บอท: ส่งสติกเกอร์กวนๆ แบบสุ่ม — p = โอกาส (0–1), kind = 'taunt'|'sad'|'wow' */
  botMaybe:function(p,kind){
    if(!on||Math.random()>=p)return;
    botLater(500+Math.random()*900,kind==='sad'?SAD:kind==='wow'?WOW:TAUNT);
  },
  TAUNT:TAUNT,SAD:SAD,WOW:WOW
};
})();
</script>
