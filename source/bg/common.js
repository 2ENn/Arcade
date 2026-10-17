/* ---------- ส่วนกลาง: เมนู เวลา เล่นกับ AI / สองคน / ออนไลน์ ---------- */
const $=id=>document.getElementById(id);
const ls={get(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const noop=()=>{};
function myNm(){try{const u=window.Arcade&&window.Arcade.user&&window.Arcade.user();return(u&&u.username)||'';}catch(e){return'';}}
function oppTag(){const n=typeof on!=='undefined'&&on&&on.opp&&on.opp.nm;return(typeof n==='string'&&/^[a-z0-9_]{3,16}$/.test(n))?n:null;}
/* ph('ตา','') => 'ตา mint' หรือ 'ตาเพื่อน' (ใช้ชื่อบัญชีของคู่แข่งถ้ามี) */
function ph(a,b){const t=oppTag();return t?(a+' '+t+' '+b).trim():a+'เพื่อน'+b;}
const KEY=UI.key,other=c=>c==='w'?'b':'w',CN={w:'ฝ่ายขาว',b:'ฝ่ายดำ'};
const ST=Object.assign({lvl:'medium',side:'r',timed:false,mins:5,inc:0,force:1},ls.get(KEY+'.set.v1')||{});
let M=null,on=null,roomNS=null,toastT=0;
function toast(t){const e=$('toast');e.textContent=t;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>e.hidden=true,2400);}
function openModal(h){$('modalCard').innerHTML=h;$('modal').hidden=false;}
function closeModal(){$('modal').hidden=true;}
const fmt=ms=>{ms=Math.max(0,Math.ceil(ms/1000));return Math.floor(ms/60)+':'+String(ms%60).padStart(2,'0');};
const stats=()=>ls.get(KEY+'.stats.v1')||{ai:{w:0,l:0,d:0},on:{w:0,l:0,d:0}};
function bump(kind,r){const s=stats();s[kind][r]++;ls.set(KEY+'.stats.v1',s);}

/* ---------- เมนู ---------- */
const LV=[['easy','ง่าย','เดินพลาดบ่อย เหมาะฝึกมือ',1],['medium','กลาง','คิดไปข้างหน้าได้พอสมควร',2],['hard','ยาก','คิดลึก ตั้งใจเล่น',3]];
function renderMenu(){
  const sv=loadSave(),rb=$('resumeBox');
  if(sv){
    const ln=(LV.find(l=>l[0]===sv.lvl)||[])[1]||'';
    rb.innerHTML='<h2>เล่นต่อ</h2><button class="lv resume" id="bResume"><div><b>เกมที่ค้างไว้</b><small>'+(sv.mode==='ai'?'เล่นกับ AI ระดับ'+ln+' · คุณเล่น'+CN[sv.my]:'เล่นสองคนในเครื่อง')+' · ผ่านมา '+Math.ceil(sv.hist.length/2)+' ตา'+(sv.cfg.t?' · มีเวลา':'')+'</small></div><span class="go">▶</span></button><button class="linkb" id="bDrop" type="button">ทิ้งเกมที่ค้างไว้</button>';
    $('bResume').onclick=resumeGame;$('bDrop').onclick=()=>{ls.set(SAVEK,null);renderMenu();};
  }else rb.innerHTML='';
  $('mTitle').textContent=UI.name;$('mSub').textContent=UI.sub;$('mIcon').innerHTML=UI.icon;
  $('mRule').textContent=UI.rule;
  const chips=(id,items,cur,fn)=>{const el=$(id);el.innerHTML='';items.forEach(([v,t])=>{const b=document.createElement('button');b.className='chip';b.textContent=t;b.setAttribute('aria-pressed',String(String(cur)===String(v)));b.onclick=()=>{fn(v);ls.set(KEY+'.set.v1',ST);renderMenu();};el.appendChild(b);});};
  chips('cTime',[[0,'ไม่มีเวลา'],[1,'มีเวลา']],ST.timed?1:0,v=>ST.timed=!!+v);
  $('timeOpts').hidden=!ST.timed;
  chips('cMins',UI.mins.map(m=>[m,m+' นาที']),ST.mins,v=>ST.mins=+v);
  chips('cInc',[[0,'ไม่บวก'],[2,'+2 วิ'],[5,'+5 วิ']],ST.inc,v=>ST.inc=+v);
  $('ruleBox').hidden=Core.name!=='checkers';
  chips('cRule',[[1,'บังคับกิน'],[0,'ไม่บังคับกิน']],ST.force===0?0:1,v=>ST.force=+v);
  $('ruleHint').textContent=ST.force===0?'มีตัวให้กินก็เลือกเดินอย่างอื่นได้':'ถ้ามีตัวให้กิน ต้องกินก่อนเสมอ';
  chips('cSide',[['r','สุ่ม'],['w','ขาว'],['b','ดำ']],ST.side,v=>ST.side=v);
  $('lvs').innerHTML=LV.map(l=>'<button class="lv" data-lv="'+l[0]+'"><div><b>'+l[1]+'</b><small>'+l[2]+'</small></div><div class="dots">'+[1,2,3].map(i=>'<i'+(i<=l[3]?' class="on"':'')+'></i>').join('')+'</div></button>').join('');
  $('lvs').querySelectorAll('.lv').forEach(b=>b.onclick=()=>{ST.lvl=b.dataset.lv;ls.set(KEY+'.set.v1',ST);startAI();});
  const s=stats(),a=s.ai,o=s.on;
  $('mStat').textContent=(a.w+a.l+a.d?'สถิติเล่นกับ AI ชนะ '+a.w+' · แพ้ '+a.l+' · เสมอ '+a.d:'')+((o.w+o.l+o.d)?'\nสถิติกับเพื่อน ชนะ '+o.w+' · แพ้ '+o.l+' · เสมอ '+o.d:'');
  $('bHost').disabled=!roomNS;$('bJoin').disabled=!roomNS;
  $('pvpSub').textContent=roomNS?'สร้างห้องแล้วส่งรหัส 6 หลักให้เพื่อน':'เปิดจากเว็บที่ออนไลน์เพื่อเล่นกับเพื่อน (ตอนนี้ใช้ไม่ได้)';
}
function cfgNow(){return{t:ST.timed?ST.mins*60:0,inc:ST.timed?ST.inc:0,f:ST.force===0?0:1};}
const ruleTxt=c=>Core.name==='checkers'?(c&&c.f===0?'กติกา: ไม่บังคับกิน':'กติกา: บังคับกิน'):'';
function showMenu(){try{saveGame();}catch(e){}stopTick();M=null;if(window.EM)EM.enable(false);$('game').hidden=true;$('menu').hidden=false;document.documentElement.classList.add('mn');closeModal();renderMenu();}

/* ---------- แมตช์ ---------- */
function begin(o){ // o:{mode,my,cfg,lvl}
  UI.reset();
  const s0=Core.init(o.cfg.f!==0);
  M={mode:o.mode,my:o.my,lvl:o.lvl,cfg:o.cfg,states:[s0],hist:[],moves:[],over:null,busy:false,
     clock:{rem:{w:o.cfg.t*1000,b:o.cfg.t*1000},run:o.cfg.t?'w':null,since:Date.now()}};
  $('menu').hidden=true;$('game').hidden=false;document.documentElement.classList.remove('mn');closeModal();
  UI.mount($('board'));
  render();startTick();
  if(ruleTxt(M.cfg))toast(ruleTxt(M.cfg));
  if(M.mode==='ai'&&M.my==='b')aiTurn();
}
const cur=()=>M.states[M.states.length-1];
/* ---------- เซฟเกมที่ค้าง (เล่นกับ AI / สองคนในเครื่อง) ---------- */
const SAVEK=KEY+'.save.v1';
function saveGame(){
  if(!M||M.mode==='online'||M.mode==='spec')return;
  if(M.over||!M.hist.length){ls.set(SAVEK,null);return;}
  ls.set(SAVEK,{v:1,mode:M.mode,my:M.my,lvl:M.lvl,cfg:M.cfg,hist:M.hist.slice(),rem:{w:Math.round(remNow('w')),b:Math.round(remNow('b'))},fl:M.flipLocal||null,at:Date.now()});
}
function loadSave(){const v=ls.get(SAVEK);return(v&&v.v===1&&Array.isArray(v.hist)&&v.hist.length&&v.cfg&&v.rem&&(v.mode==='ai'||v.mode==='local'))?v:null;}
function resumeGame(){
  const sv=loadSave();if(!sv)return;
  let st=Core.init(sv.cfg.f!==0);const states=[st],moves=[],hist=[];
  for(const id of sv.hist){const m=Core.fromId(st,id);if(!m){ls.set(SAVEK,null);toast('เกมที่เซฟไว้ใช้ไม่ได้');renderMenu();return;}st=Core.apply(st,m);states.push(st);moves.push(m);hist.push(id);}
  if(Core.result(states)){ls.set(SAVEK,null);renderMenu();return;}
  UI.reset();
  M={mode:sv.mode,my:sv.my,lvl:sv.lvl,cfg:sv.cfg,states,hist,moves,over:null,busy:false,flipLocal:sv.fl||undefined,
     clock:{rem:{w:sv.rem.w,b:sv.rem.b},run:sv.cfg.t?st.t:null,since:Date.now()}};
  $('menu').hidden=true;$('game').hidden=false;document.documentElement.classList.remove('mn');closeModal();
  UI.mount($('board'));
  render();startTick();
  if(M.mode==='ai'&&cur().t!==M.my)aiTurn();
}
window.addEventListener('pagehide',()=>{try{saveGame();}catch(e){}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){try{saveGame();}catch(e){}}});
function remNow(c){const k=M.clock;return k.rem[c]-(k.run===c?Date.now()-k.since:0);}
function canTap(){return M&&M.mode!=='spec'&&!M.over&&!M.busy&&(M.mode==='local'||cur().t===M.my);}
const ctx={s:()=>cur(),legal:()=>Core.legal(cur()),canTap,commit:m=>doMove(m,false),modal:openModal,closeModal,redraw:()=>render(),
  turn:()=>cur().t};
function emSync(){
  if(!window.EM||!M||M._em===M.mode)return;M._em=M.mode;
  EM.reset();EM.init({send:(M.mode==='online'||M.mode==='spec')?em=>pres({em}):null,bot:M.mode==='ai'});EM.enable(M.mode!=='local');
}
function render(){
  emSync();
  if(!M)return;
  const s=cur(),bottom=(M.mode==='local'||M.mode==='spec')?(M.flipLocal||'w'):M.my,flip=bottom==='b';
  UI.draw({s,flip,last:M.moves.length?UI.lastSqs(M.moves[M.moves.length-1]):[],canTap:canTap(),turn:s.t,over:!!M.over,my:M.my,mode:M.mode,legal:(M.over||M.mode==='spec')?[]:Core.legal(s)});
  const top=other(bottom),info=UI.cap(s);
  const who=c=>M.mode==='local'?CN[c]:M.mode==='spec'?specName(c):(c===M.my?'คุณ':M.mode==='ai'?'AI':(oppTag()||'เพื่อน'));
  $('plTop').innerHTML='<span class="dot '+top+'"></span><span>'+who(top)+' <small>('+CN[top]+')</small></span><span class="cap">'+info[top]+'</span>';
  $('plBot').innerHTML='<span class="dot '+bottom+'"></span><span>'+who(bottom)+' <small>('+CN[bottom]+')</small></span><span class="cap">'+info[bottom]+'</span>';
  $('clkTop').dataset.c=top;$('clkBot').dataset.c=bottom;
  $('clkTop').hidden=$('clkBot').hidden=!M.cfg.t;
  let st='',warn=false;
  if(M.over)st=M.over.text;
  else if(M.busy)st='AI กำลังคิด…';
  else{st=(M.mode==='local'?'ตา'+CN[s.t]:M.mode==='spec'?'ตา '+specName(s.t):(s.t===M.my?'ตาของคุณ':M.mode==='ai'?'ตา AI':ph('ตา','')));const x=UI.statusExtra(s);if(x){st+=' · '+x;warn=true;}}
  $('status').textContent=st;$('status').classList.toggle('warn',warn);
  $('tUndo').hidden=!(M.mode!=='online'&&!M.cfg.t);$('tUndo').disabled=M.hist.length===0;
  $('tFlip').hidden=!(M.mode==='local'||M.mode==='spec');$('tUndo').hidden=$('tUndo').hidden||M.mode==='spec';
  $('tRes').textContent=M.mode==='local'?'จบเกม/เสมอ':'ยอมแพ้';$('tRes').disabled=!!M.over;$('tRes').hidden=M.mode==='spec';updEye();
  tick();
}
function doMove(m,remote){
  if(!M||M.over)return;
  const mover=cur().t,now=Date.now();
  if(M.cfg.t){const k=M.clock;k.rem[mover]=remNow(mover)+M.cfg.inc*1000;k.run=other(mover);k.since=now;}
  M.states.push(Core.apply(cur(),m));M.hist.push(m.id);M.moves.push(m);
  UI.reset();
  if(M.mode==='online'&&!remote)pres({h:M.hist.join(' '),ck:[Math.round(M.clock.rem.w),Math.round(M.clock.rem.b)]});
  const res=Core.result(M.states);
  if(res){finish(res.w,res.why);return;}
  render();saveGame();
  if(M.mode==='ai'&&mover!==M.my)EM.botMaybe(0.1);
  if(M.mode==='ai'&&cur().t!==M.my)aiTurn();
}
function aiTurn(){
  const me=M;M.busy=true;render();
  const t0=Date.now();
  setTimeout(()=>{
    if(M!==me||me.over)return;
    const ac=other(me.my);let ms=1200;if(me.cfg.t)ms=Math.max(150,Math.min(1200,remNow(ac)/40));
    let mv;try{mv=Core.ai(me.states,me.lvl,ms);}catch(e){console.error(e);const l=Core.legal(cur());mv=l[0];}
    const wait=Math.max(0,350-(Date.now()-t0));
    setTimeout(()=>{if(M!==me||me.over)return;me.busy=false;doMove(mv,false);},wait);
  },60);
}
function startAI(){
  let my=ST.side==='r'?(Math.random()<.5?'w':'b'):ST.side;
  begin({mode:'ai',my,lvl:ST.lvl,cfg:cfgNow()});
}
function startLocal(){begin({mode:'local',my:'w',cfg:cfgNow()});}
function finish(w,why){
  if(!M||M.over)return;
  const me=M;
  me.clock.run=null;
  let title,kind;
  if(w===null){title='เสมอ';kind='d';}
  else if(me.mode==='local'){title=CN[w]+'ชนะ';kind=null;}
  else if(w===me.my){title='คุณชนะ!';kind='w';}else{title=me.mode==='ai'?'AIชนะ':ph('','ชนะ');kind='l';}
  me.over={w,why,text:title+' · '+why};
  if(me.mode!=='online')ls.set(SAVEK,null);
  if(kind&&me.mode==='ai')bump('ai',kind);
  if(kind&&me.mode==='online')bump('on',kind);
  if(window.Arcade&&Arcade.report&&me.mode!=='local'){try{Arcade.report({game:KEY,cat:me.mode==='online'?'online':me.lvl,won:kind==='w',points:kind==='w'?(me.mode==='online'?5:({easy:1,medium:2,hard:4})[me.lvl]||0):0});}catch(e){}}
  render();
  setTimeout(()=>{if(M!==me)return;showResult(title,why,kind);},kind==='w'?650:450);
}
function showResultAgain(t,w,k){if(M&&M.over)showResult(t,w,k);}
function showResult(title,why,kind){
  const me=M,online=me.mode==='online',host=online&&on&&on.role==='host';
  let btns;
  if(online)btns=(host?'<button class="btn" id="mAgain">เล่นอีกรอบ (สลับสี)</button>':'<button class="btn" id="mAgain" disabled>รอเจ้าของห้องเริ่มรอบใหม่</button>');
  else btns='<button class="btn" id="mAgain">เล่นอีกครั้ง</button>';
  openModal('<h2>'+title+'</h2><p class="sub">'+why+' · '+Math.ceil(me.hist.length/2)+' ตา</p><div class="row">'+btns+'</div><div class="row"><button class="btn alt" id="mView">ดูกระดาน</button><button class="btn alt" id="mMenu">'+(online?'ออกจากห้อง':'เมนู')+'</button></div>');
  $('mView').onclick=closeModal;
  $('mMenu').onclick=()=>{if(online)confirmBox('ออกจากห้อง?','เกมนี้จบแล้ว ออกจากห้องกลับเมนู','ออกจากห้อง',()=>{leaveOnline();showMenu();},()=>showResultAgain(title,why,kind),'อยู่ต่อ');else showMenu();};
  if(!online)$('mAgain').onclick=()=>{if(me.mode==='ai')startAI();else startLocal();};
  else if(host)$('mAgain').onclick=()=>{if(!on||(on.goneAt&&!on.opp)){toast('เพื่อนไม่อยู่ในห้องแล้ว');return;}hostStart(true);};
}
/* ---------- นาฬิกา ---------- */
let tickT=0,flagT=0;
function startTick(){stopTick();tickT=setInterval(tick,200);}
function stopTick(){clearInterval(tickT);tickT=0;clearTimeout(flagT);}
function tick(){
  if(!M)return;
  if(M.cfg.t){
    ['clkTop','clkBot'].forEach(id=>{const el=$(id),c=el.dataset.c;if(!c)return;const r=remNow(c);el.textContent=fmt(r);
      el.classList.toggle('run',M.clock.run===c&&!M.over);el.classList.toggle('low',r<=15000&&r>0&&M.clock.run===c&&!M.over);});
    if(!M.over&&M.clock.run&&M.mode!=='spec'){
      const c=M.clock.run;
      if(remNow(c)<=0){
        if(M.mode!=='online')finish(other(c),CN[c]+'หมดเวลา');
        else if(c===M.my){pres({fin:'flag'});finish(other(c),'คุณหมดเวลา');}
        else if(!flagT){const me=M;flagT=setTimeout(()=>{flagT=0;if(M===me&&!me.over&&me.clock.run===c&&remNow(c)<=0)finish(other(c),ph('','หมดเวลา'));},3000);}
      }
    }
  }
  if(on&&M&&M.mode==='online'&&!M.over&&on.goneAt&&Date.now()-on.goneAt>30000){finish(M.my,ph('','หลุดจากห้อง'));}
}
/* ---------- ปุ่ม ---------- */
$('bMenu').onclick=()=>{if(M)askExit();};
$('tFlip').onclick=()=>{M.flipLocal=(M.flipLocal==='b'?'w':'b');render();};
$('tUndo').onclick=()=>{
  if(!M||!M.hist.length||M.cfg.t)return;
  if(M.over)M.over=null,closeModal();
  const n=M.mode==='ai'?(cur().t===M.my?2:1):1;
  for(let i=0;i<n&&M.hist.length;i++){M.states.pop();M.hist.pop();M.moves.pop();}
  M.busy=false;UI.reset();render();saveGame();
  if(M.mode==='ai'&&cur().t!==M.my)aiTurn();
};
$('tRes').onclick=()=>{
  if(!M||M.over)return;
  if(M.mode==='local'){openModal('<h2>จบเกม</h2><p class="sub">เลือกผลของเกมนี้</p><div class="row"><button class="btn alt" id="rW">ขาวชนะ</button><button class="btn alt" id="rB">ดำชนะ</button></div><div class="row"><button class="btn alt" id="rD">เสมอ</button><button class="btn" id="rX">เล่นต่อ</button></div>');
    $('rW').onclick=()=>{closeModal();finish('w','ตกลงกัน');};$('rB').onclick=()=>{closeModal();finish('b','ตกลงกัน');};$('rD').onclick=()=>{closeModal();finish(null,'ตกลงเสมอ');};$('rX').onclick=closeModal;return;}
  openModal('<h2>ยอมแพ้?</h2><p class="sub">จะนับเป็นแพ้ในเกมนี้</p><div class="row"><button class="btn" id="yY">ยอมแพ้</button><button class="btn alt" id="yN">เล่นต่อ</button></div>');
  $('yN').onclick=closeModal;
  $('yY').onclick=()=>{closeModal();if(M.mode==='online')pres({fin:'resign'});finish(other(M.my),'คุณยอมแพ้');};
};
$('board').addEventListener('click',e=>{
  const el=e.target.closest('.sq');if(!el||!M)return;
  UI.tap(+el.dataset.i,ctx);
});

/* ---------- ออนไลน์ ---------- */
const SUPA={url:'https://suzjjwaamfsekokiukhj.supabase.co',key:'sb_publishable_TxqJlQHRp_PdAnUUVRzVyQ_J56oGHHq',lib:'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'};
function loadLib(src){
  return new Promise((resolve,reject)=>{
    if(window.supabase&&window.supabase.createClient){resolve();return;}
    const sc=document.createElement('script');sc.src=src;sc.async=true;
    sc.onload=()=>resolve();sc.onerror=()=>reject(new Error('load'));document.head.appendChild(sc);
    setTimeout(()=>reject(new Error('timeout')),8000);
  });
}
function supabaseNS(){
  let client=null;
  let myCid=ls.get(KEY+'.cid.v1');
  if(!myCid){myCid='c'+Math.random().toString(36).slice(2,10);ls.set(KEY+'.cid.v1',myCid);}
  return{join(name){
    return loadLib(SUPA.lib).then(()=>{
      if(!client)client=(window.Arcade&&window.Arcade.client&&window.Arcade.client())||window.supabase.createClient(SUPA.url,SUPA.key,{auth:{persistSession:false,autoRefreshToken:false},realtime:{params:{eventsPerSecond:20}}});
      return new Promise((resolve,reject)=>{
        const myId='u'+Math.random().toString(36).slice(2,10);
        const ch=client.channel(KEY+'-'+name,{config:{presence:{key:myId}}});
        let mine={},handlers=[],settled=false,left=false;
        const track=()=>{try{const r=ch.track({p:mine,cid:myCid});if(r&&r.catch)r.catch(noop);}catch(e){}};
        const list=()=>{
          const st=ch.presenceState(),out=[];
          Object.keys(st).forEach(k=>{const m=st[k]&&st[k][st[k].length-1];if(!m)return;
            out.push({peer:k,by:m.cid||k,isMe:k===myId,sameTab:k===myId,presence:(k===myId?mine:m.p)||{}});});
          return out;
        };
        const notify=()=>{if(left)return;const ps=list();handlers.slice().forEach(h=>{try{h({peers:ps});}catch(e){if(window.console)console.error(e);}});};
        ch.on('presence',{event:'sync'},notify);
        const room={
          presence(patch){
            if(left)return Promise.reject({code:'invalid_argument'});
            const m=Object.assign({},mine);
            Object.keys(patch).forEach(k=>{if(patch[k]===null||patch[k]===undefined)delete m[k];else m[k]=patch[k];});
            mine=m;track();notify();return Promise.resolve();
          },
          onPeers(h){handlers.push(h);setTimeout(()=>{if(handlers.indexOf(h)>=0){try{h({peers:list()});}catch(e){}}},0);return()=>{handlers=handlers.filter(x=>x!==h);};},
          leave(){left=true;handlers=[];try{ch.untrack();client.removeChannel(ch);}catch(e){}return Promise.resolve();}
        };
        ch.subscribe(status=>{
          if(status==='SUBSCRIBED'){track();if(!settled){settled=true;resolve(room);}}
          else if((status==='CHANNEL_ERROR'||status==='TIMED_OUT')&&!settled){settled=true;try{client.removeChannel(ch);}catch(e){}reject({code:'upstream_error'});}
        });
        setTimeout(()=>{if(!settled){settled=true;try{client.removeChannel(ch);}catch(e){}reject({code:'upstream_error'});}},10000);
      });
    });
  }};
}
function initRoom(){
  const done=r=>{roomNS=r||null;if(!M)renderMenu();};
  try{
    if(window.claude&&typeof window.claude.use==='function')Promise.resolve(window.claude.use('room')).then(done,()=>done(null));
    else if(/^https?:$/.test(location.protocol))done(supabaseNS());
    else done(null);
  }catch(e){done(null);}
}
const roomName=c=>KEY.slice(0,2)+'-'+c;
const genCode=()=>String(100000+Math.floor(Math.random()*900000));
const MAXSP=5;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function pres(patch){if(on&&on.room)on.room.presence(patch).catch(noop);}
function emLobby(){if(!window.EM)return;EM.reset();EM.init({send:em=>pres({em}),bot:false});EM.enable(true);}
function leaveOnline(){
  if(!on)return;const o=on;on=null;if(window.EM)EM.enable(false);
  try{if(o.unsub)o.unsub();}catch(e){}
  clearTimeout(o.joinTimer);clearTimeout(o.fullTimer);
  try{if(o.room)o.room.leave();}catch(e){}
}
const okNm=n=>(typeof n==='string'&&/^[a-z0-9_]{3,16}$/.test(n))?n:null;
const nmOf=(me,id,fb)=>okNm((me.peers[id]||{}).nm)||fb;
const isPl=me=>me.pl.indexOf(me.meId)>=0,isSp=me=>me.sp.indexOf(me.meId)>=0;
function newOn(role,code,want,extra){return Object.assign({role,code,want,jt:Date.now(),rid:0,pl:[],sp:[],st:0,peers:{},meId:null,room:null,opp:null,oppPeer:null,over:false,goneAt:0,started:false,cw:null,cfgp:[0,0],hostPeer:null},extra||{});}
function hostPub(me){pres({role:'host',code:me.code,want:me.want,nm:myNm(),jt:me.jt,pl:me.pl,sp:me.sp,st:me.st,rid:me.rid,cw:me.cw,cfg:me.cfgp});}

/* กล่องยืนยัน: ok = ทำต่อ, no = กลับไปหน้าเดิม */
function confirmBox(title,msg,okLabel,onOk,onNo,noLabel){
  openModal('<h2>'+title+'</h2><p class="sub">'+msg+'</p><div class="row"><button class="btn" id="cbY">'+okLabel+'</button><button class="btn alt" id="cbN">'+(noLabel||'ยกเลิก')+'</button></div>');
  $('cbN').onclick=()=>{if(onNo)onNo();else closeModal();};
  $('cbY').onclick=()=>{closeModal();onOk();};
}
/* ออกจากแมตช์/ห้อง — ถามก่อนเสมอ */
function askExit(){
  if(!M)return;
  const back=()=>closeModal();
  if(M.mode==='online'&&!M.over){
    confirmBox('ออกจากแมตช์?','การออกระหว่างเล่นนับว่ายอมแพ้','ออกจากแมตช์',()=>{bump('on','l');pres({fin:'resign'});const o=on;setTimeout(()=>{if(on===o)leaveOnline();},400);M=null;showMenu();},back,'เล่นต่อ');
  }else if(M.mode==='spec'){
    confirmBox('เลิกดูแมตช์นี้?','คุณจะออกจากห้องนี้ กลับเข้าได้ด้วยรหัสห้องเดิม','ออกจากห้อง',()=>{leaveOnline();M=null;showMenu();},back,'ดูต่อ');
  }else if(M.mode==='online'){
    confirmBox('ออกจากห้อง?','เกมนี้จบแล้ว ออกจากห้องกลับเมนู','ออกจากห้อง',()=>{leaveOnline();showMenu();},back,'อยู่ต่อ');
  }else if(!M.over&&M.hist.length){
    confirmBox('กลับเมนู?','เกมนี้จะถูกเซฟไว้ เล่นต่อได้จากเมนู','กลับเมนู',()=>showMenu(),back,'เล่นต่อ');
  }else showMenu();
}
window.__leaveGuard=()=>{
  if(on&&(on.started||on.st||on.role==='host'))return{msg:M&&M.mode==='online'&&!M.over?'การออกระหว่างเล่นนับว่ายอมแพ้':'คุณจะออกจากห้องนี้'};
  if(M&&!M.over&&M.mode!=='online'&&M.mode!=='spec'&&M.hist.length)return{msg:'เกมนี้จะถูกเซฟไว้ เล่นต่อได้จากเมนู',soft:true};
  if(M&&M.mode==='spec')return{msg:'คุณจะเลิกดูแมตช์นี้'};
  return null;
};
window.__leaveNow=()=>{try{if(M&&M.mode==='online'&&!M.over){bump('on','l');pres({fin:'resign'});}saveGame();}catch(e){}};

/* ---------- ล็อบบี้ ---------- */
function renderLobby(me){
  if(on!==me||me.st||me.started)return;
  const host=me.role==='host',hid=host?me.meId:me.hostPeer;
  const li=(id,fb,tag)=>'<li><span>'+esc(nmOf(me,id,fb))+(id===me.meId?' (คุณ)':'')+'</span>'+(tag?'<em>'+tag+'</em>':'')+'</li>';
  const pls=me.pl.map((id,i)=>li(id,'ผู้เล่น '+(i+1),id===hid?'เจ้าของห้อง':'')).join('')+(me.pl.length<2?'<li class="empty"><span>ว่าง — รอผู้เล่น</span></li>':'');
  const sps=me.sp.map((id,i)=>li(id,'คนดู '+(i+1),id===hid?'เจ้าของห้อง':'')).join('')||'<li class="empty"><span>ยังไม่มีคนดู</span></li>';
  const full=me.pl.length>=2;
  openModal('<h2>'+(host?'ห้องของคุณ':'อยู่ในห้องแล้ว')+'</h2><div class="code">'+me.code+'</div>'+
    '<p class="sub" style="text-align:center">'+(host?'ให้เพื่อนกด "เข้าห้อง" แล้วใส่รหัสนี้ (เข้าเล่นหรือเข้าดูได้)':'รอเจ้าของห้องกดเริ่มเกม…')+'</p>'+
    (host?'<div class="lbl">คุณเป็น</div><div class="chips" id="cWant"><button class="chip" data-w="p" aria-pressed="'+(me.want==='p')+'">ผู้เล่น</button><button class="chip" data-w="s" aria-pressed="'+(me.want==='s')+'">คนดู</button></div>':'<p class="sub" style="text-align:center">คุณเข้ามาเป็น <b>'+(me.want==='p'?'ผู้เล่น':'คนดู')+'</b></p>')+
    '<p class="sub" style="margin-top:10px"><b>ผู้เล่น '+me.pl.length+'/2</b></p><ul class="plist">'+pls+'</ul>'+
    '<p class="sub" style="margin-top:10px"><b>คนดู '+me.sp.length+'/'+MAXSP+'</b></p><ul class="plist">'+sps+'</ul>'+
    '<div class="row">'+(host?'<button class="btn" id="mStart"'+(full?'':' disabled')+'>'+(full?'เริ่มเกม':'รอผู้เล่นให้ครบ 2 คน')+'</button>':'')+'<button class="btn alt" id="mX">'+(host?'ปิดห้อง':'ออก')+'</button></div>');
  const leave=()=>{
    const others=me.pl.length+me.sp.length>1;
    if(host&&others)confirmBox('ปิดห้อง?','คนที่อยู่ในห้องจะหลุดออก',"ปิดห้อง",()=>{leaveOnline();},()=>renderLobby(me),'อยู่ต่อ');
    else{closeModal();leaveOnline();}
  };
  $('mX').onclick=leave;
  if(host){
    document.querySelectorAll('#cWant .chip').forEach(b=>b.onclick=()=>setWant(b.dataset.w));
    $('mStart').onclick=()=>hostStart(false);
  }
}
function setWant(w){
  const me=on;if(!me||me.role!=='host'||me.st)return;
  if(w==='p'&&me.pl.length>=2&&me.pl.indexOf(me.meId)<0){toast('ที่นั่งผู้เล่นเต็มแล้ว (2 คน)');return;}
  if(w==='s'&&me.sp.length>=MAXSP&&me.sp.indexOf(me.meId)<0){toast('ที่นั่งคนดูเต็มแล้ว (สูงสุด '+MAXSP+' คน)');return;}
  me.want=w;rosterHost(me);hostPub(me);renderLobby(me);
}
/* เจ้าของห้องจัดรายชื่อ: ผู้เล่นสูงสุด 2, คนดูสูงสุด MAXSP */
function rosterHost(me){
  const before=JSON.stringify([me.pl,me.sp]);
  const alive=id=>id===me.meId||!!me.peers[id];
  let pl=me.st?me.pl.slice():me.pl.filter(alive),sp=me.sp.filter(alive);
  if(!me.st){
    if(me.want==='p'){sp=sp.filter(x=>x!==me.meId);if(pl.indexOf(me.meId)<0&&pl.length<2)pl.unshift(me.meId);}
    else{pl=pl.filter(x=>x!==me.meId);if(sp.indexOf(me.meId)<0&&sp.length<MAXSP)sp.unshift(me.meId);}
  }
  Object.keys(me.peers).filter(id=>id!==me.meId&&me.peers[id].role==='guest'&&me.peers[id].code===me.code)
    .sort((a,b)=>((me.peers[a].jt||0)-(me.peers[b].jt||0))||(a<b?-1:1))
    .forEach(id=>{
      if(pl.indexOf(id)>=0||sp.indexOf(id)>=0)return;
      if(me.peers[id].want==='p'){if(!me.st&&pl.length<2)pl.push(id);}
      else if(sp.length<MAXSP)sp.push(id);
    });
  me.pl=pl;me.sp=sp;
  if(JSON.stringify([pl,sp])!==before)hostPub(me);
}
function hostOpen(){
  if(!roomNS||on)return;
  const code=genCode(),cfg=cfgNow();
  const me=on=newOn('host',code,'p',{cfgp:[cfg.t,cfg.inc,cfg.f]});
  openModal('<h2>กำลังสร้างห้อง…</h2><div class="spin"></div>');
  roomNS.join(roomName(code)).then(room=>{
    if(on!==me){room.leave();return;}
    me.room=room;me.unsub=room.onPeers(ch=>roomPeers(me,ch),noop);emLobby();
    hostPub(me);renderLobby(me);
  },()=>{if(on===me){closeModal();leaveOnline();toast('เชื่อมต่อห้องไม่สำเร็จ ลองอีกครั้ง');}});
}
function hostStart(rematch){
  const me=on;if(!me||me.role!=='host')return;
  if(me.pl.length<2||me.pl.some(id=>id!==me.meId&&!me.peers[id])){toast('ผู้เล่นไม่ครบ');return;}
  me.rid++;
  let cw;
  if(rematch&&me.cw)cw=me.pl.find(id=>id!==me.cw);
  else if(me.pl.indexOf(me.meId)>=0&&ST.side!=='r')cw=ST.side==='w'?me.meId:me.pl.find(id=>id!==me.meId);
  else cw=me.pl[Math.random()<.5?0:1];
  me.cw=cw;me.st=1;me.started=true;me.over=false;
  const cfg=cfgNow();me.cfgp=[cfg.t,cfg.inc,cfg.f];
  hostPub(me);
  if(isPl(me)){
    begin({mode:'online',my:cw===me.meId?'w':'b',cfg});M.rid=me.rid;
    pres({r:me.rid,h:'',ck:null,fin:null});
  }else beginSpec(me);
  updEye();syncPeer();
}
function askJoin(){
  openModal('<h2>เข้าห้อง</h2><p class="sub">ใส่รหัสห้อง 6 หลักจากเพื่อน แล้วเลือกว่าจะเข้าเล่นหรือเข้าดู</p><input class="cin" id="cin" inputmode="numeric" maxlength="6" placeholder="000000" autocomplete="off"><div class="row"><button class="btn" id="mGoP">เข้าเล่น</button><button class="btn alt" id="mGoS">เข้าดู</button></div><div class="row"><button class="btn alt" id="mX">ยกเลิก</button></div>');
  const inp=$('cin');inp.focus();
  inp.oninput=()=>{inp.value=inp.value.replace(/\D/g,'').slice(0,6);};
  const go=w=>{if(inp.value.length===6)guestOpen(inp.value,w);else toast('ใส่รหัสให้ครบ 6 หลัก');};
  $('mGoP').onclick=()=>go('p');$('mGoS').onclick=()=>go('s');inp.onkeydown=e=>{if(e.key==='Enter')go('p');};
  $('mX').onclick=closeModal;
}
function guestFail(me,msg){if(on!==me)return;closeModal();leaveOnline();M=null;showMenu();toast(msg);}
function guestOpen(code,want){
  if(!roomNS||on)return;
  const me=on=newOn('guest',code,want||'p');
  openModal('<h2>กำลังเข้าห้อง…</h2><div class="spin"></div>');
  roomNS.join(roomName(code)).then(room=>{
    if(on!==me){room.leave();return;}
    me.room=room;me.unsub=room.onPeers(ch=>roomPeers(me,ch),noop);emLobby();
    pres({role:'guest',code,want:me.want,jt:me.jt,nm:myNm(),r:0});
    me.joinTimer=setTimeout(()=>{if(on===me&&!me.started&&!me.hostPeer)guestFail(me,'ไม่พบห้องนี้ ตรวจรหัสอีกครั้ง');},9000);
  },()=>guestFail(me,'เชื่อมต่อไม่สำเร็จ ลองอีกครั้ง'));
}
function roomPeers(me,ch){
  if(on!==me)return;
  const mine=ch.peers.find(p=>p.isMe);if(mine)me.meId=mine.peer;
  me.peers={};ch.peers.forEach(p=>{me.peers[p.peer]=p.presence||{};});
  if(window.EM)EM.onPeers(me.peers,me.meId,id=>{const p=me.peers[id]||{};return p.nm||(me.pl.indexOf(id)>=0?'ผู้เล่น':'คนดู');});
  let host=null;
  if(me.role==='host'){if(me.meId)rosterHost(me);}
  else{
    const hp=Object.keys(me.peers).find(id=>id!==me.meId&&me.peers[id].role==='host'&&me.peers[id].code===me.code);
    if(hp){host=me.peers[hp];me.hostPeer=hp;me.pl=host.pl||[];me.sp=host.sp||[];me.st=host.st||0;me.cw=host.cw||null;if(host.cfg)me.cfgp=host.cfg;}
  }
  if(isPl(me)){
    const oid=me.pl.find(id=>id!==me.meId);me.oppPeer=oid;
    const op=oid&&me.peers[oid];
    if(op){me.opp=op;me.goneAt=0;}else{me.opp=null;if(me.started&&!me.goneAt)me.goneAt=Date.now();}
  }
  if(me.role==='guest'&&host){
    if(!isPl(me)&&!isSp(me)){
      if(!me.fullTimer)me.fullTimer=setTimeout(()=>{me.fullTimer=0;if(on===me&&!isPl(me)&&!isSp(me))guestFail(me,me.want==='p'?(me.st?'เกมเริ่มไปแล้ว เข้าเล่นไม่ได้ ลองเข้าดูแทน':'ที่นั่งผู้เล่นเต็มแล้ว (2 คน)'):'ที่นั่งคนดูเต็มแล้ว (สูงสุด '+MAXSP+' คน)');},2500);
    }else{clearTimeout(me.joinTimer);clearTimeout(me.fullTimer);me.fullTimer=0;}
    if(me.st&&host.rid>me.rid&&(isPl(me)||isSp(me))){
      me.rid=host.rid;me.started=true;
      if(isPl(me)){
        begin({mode:'online',my:host.cw===me.meId?'w':'b',cfg:{t:host.cfg[0],inc:host.cfg[1],f:host.cfg[2]}});M.rid=me.rid;
        pres({r:me.rid,h:'',ck:null,fin:null});
      }else beginSpec(me);
    }
  }
  if(!me.started){if(!me.st&&(isPl(me)||isSp(me)||me.role==='host'))renderLobby(me);}
  else if(M){if(M.mode==='online')syncPeer();else if(M.mode==='spec')syncSpec();}
  updEye();
}
/* ไอคอนคนดูบนแถบเกม */
function updEye(){
  const el=$('eye');if(!el)return;
  const n=on&&on.sp?on.sp.length:0;
  el.textContent=n?'👁 '+n:'';el.hidden=!n||!M||M.mode==='ai'||M.mode==='local';
}
$('eye').onclick=()=>{
  if(!on||!on.sp.length)return;
  openModal('<h2>คนดู '+on.sp.length+'/'+MAXSP+'</h2><ul class="plist">'+on.sp.map((id,i)=>'<li><span>'+esc(nmOf(on,id,'คนดู '+(i+1)))+(id===on.meId?' (คุณ)':'')+'</span></li>').join('')+'</ul><div class="row"><button class="btn alt" id="mOk">ปิด</button></div>');
  $('mOk').onclick=closeModal;
};
/* ---------- ผู้เล่น: รับสถานะจากฝ่ายตรงข้าม ---------- */
function syncPeer(){
  if(!on||!M||M.mode!=='online'||M.rid!==on.rid)return;
  const o=on.opp;if(!o||o.r!==on.rid)return;
  const arr=o.h?String(o.h).split(' ').filter(Boolean):[];
  if(arr.length>M.hist.length&&!M.over){
    for(let i=0;i<M.hist.length;i++)if(arr[i]!==M.hist[i])return; // ข้อมูลไม่ตรง
    for(let i=M.hist.length;i<arr.length;i++){
      const m=Core.fromId(cur(),arr[i]);if(!m)return;
      M.pendingCk=true;
      if(o.ck&&i===arr.length-1&&M.cfg.t){const k=M.clock;doMove(m,true);k.rem.w=o.ck[0];k.rem.b=o.ck[1];k.since=Date.now();}
      else doMove(m,true);
      M.pendingCk=false;
      if(M.over)break;
    }
  }
  if(o.fin&&!M.over){finish(M.my,o.fin==='resign'?ph('','ยอมแพ้'):ph('','หมดเวลา'));}
}
/* ---------- คนดู ---------- */
const specName=c=>{const me=on;if(!me)return CN[c];const id=c==='w'?me.cw:me.pl.find(x=>x!==me.cw);return nmOf(me,id,CN[c]);};
function beginSpec(me){
  UI.reset();
  const cfg={t:me.cfgp[0]||0,inc:me.cfgp[1]||0,f:me.cfgp[2]};
  M={mode:'spec',my:'w',lvl:null,cfg,states:[Core.init(cfg.f!==0)],hist:[],moves:[],over:null,busy:false,rid:me.rid,
     clock:{rem:{w:cfg.t*1000,b:cfg.t*1000},run:cfg.t?'w':null,since:Date.now()}};
  $('menu').hidden=true;$('game').hidden=false;document.documentElement.classList.remove('mn');closeModal();
  UI.mount($('board'));
  render();startTick();syncSpec();
}
function specMove(m){
  const k=M.clock;
  M.states.push(Core.apply(cur(),m));M.hist.push(m.id);M.moves.push(m);
  if(M.cfg.t){k.run=cur().t;k.since=Date.now();}
  UI.reset();
}
function syncSpec(){
  if(!on||!M||M.mode!=='spec'||M.rid!==on.rid||M.over)return;
  let best=null;
  on.pl.forEach(id=>{const p=on.peers[id];if(!p||p.r!==on.rid)return;
    const a=p.h?String(p.h).split(' ').filter(Boolean):[];
    if(!best||a.length>best.a.length)best={id,p,a};});
  if(best){
    const arr=best.a;let ok=true;
    for(let i=0;i<M.hist.length;i++)if(arr[i]!==M.hist[i]){ok=false;break;}
    if(ok&&arr.length>M.hist.length){
      for(let i=M.hist.length;i<arr.length;i++){
        const m=Core.fromId(cur(),arr[i]);if(!m)break;
        specMove(m);
        const res=Core.result(M.states);
        if(res){finishSpec(res.w,res.why);return;}
      }
      if(best.p.ck&&M.cfg.t){const k=M.clock;k.rem.w=best.p.ck[0];k.rem.b=best.p.ck[1];k.since=Date.now();}
      render();
    }
  }
  for(const id of on.pl){
    const p=on.peers[id];
    if(p&&p.r===on.rid&&p.fin){
      const lose=id===on.cw?'w':'b';
      finishSpec(other(lose),specName(lose)+(p.fin==='resign'?' ยอมแพ้':' หมดเวลา'));return;
    }
  }
}
function finishSpec(w,why){
  if(!M||M.over)return;
  const me=M;me.clock.run=null;
  const title=w===null?'เสมอ':specName(w)+' ชนะ';
  me.over={w,why,text:title+' · '+why};
  render();
  const host=on&&on.role==='host';
  setTimeout(()=>{if(M!==me)return;
    openModal('<h2>'+title+'</h2><p class="sub">'+why+' · '+Math.ceil(me.hist.length/2)+' ตา</p>'+(host?'<div class="row"><button class="btn" id="mAgain">เริ่มรอบใหม่ (สลับสี)</button></div>':'<p class="sub">รอเจ้าของห้องเริ่มรอบใหม่ หรือออกจากห้องได้เลย</p>')+'<div class="row"><button class="btn alt" id="mView">ดูกระดาน</button><button class="btn alt" id="mMenu">ออกจากห้อง</button></div>');
    $('mView').onclick=closeModal;
    $('mMenu').onclick=()=>confirmBox('ออกจากห้อง?','คุณจะออกจากห้องนี้','ออกจากห้อง',()=>{leaveOnline();M=null;showMenu();},()=>closeModal(),'อยู่ต่อ');
    if(host)$('mAgain').onclick=()=>hostStart(true);
  },450);
}
$('bLocal').onclick=startLocal;
$('bHost').onclick=hostOpen;$('bJoin').onclick=askJoin;
renderMenu();initRoom();
UI.mount($('board'));
window.__bg={get M(){return M},get on(){return on},Core,ctx,ST};
