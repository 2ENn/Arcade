#!/usr/bin/env python3
"""สร้างโฟลเดอร์ arcade-site/{amath,sudoku,game24}/index.html จากไฟล์เกมต้นฉบับ + ต่อเข้ากับ platform.js"""
import os, re
H = '/home/claude'
OUT = os.path.join(H, 'arcade-site')

def rd(p): return open(os.path.join(H, p), encoding='utf8').read()
def sub(t, a, b, count=1):
    assert t.count(a) >= 1, 'ไม่พบ: ' + a[:70]
    return t.replace(a, b, count)

SHARE = "if(!client)client=(window.Arcade&&window.Arcade.client&&window.Arcade.client())||window.supabase.createClient("
SHARE_A = "if (!client) client = (window.Arcade && window.Arcade.client && window.Arcade.client()) || window.supabase.createClient("

NAVCSS = """<style id="gnavcss">
/* แถบบางสไตล์กล่องเกม: ปุ่มกลับหน้าแรก + ชื่อผู้ใช้ เท่านั้น */
#gnav{--nbg:#d9eefb;--edge:#10202c;--sh:#10202c;--ink:#10202c;--accent:#ffcf5a;--accent-ink:#2a2007;--card:#fffdf6;
position:sticky;top:0;z-index:50;flex:none;width:100%;box-sizing:border-box;background:var(--nbg);border-bottom:3px solid var(--edge);padding-top:env(safe-area-inset-top,0px);color:var(--ink);font:16px/1.4 'Sarabun',system-ui,-apple-system,'Segoe UI',sans-serif;text-align:left}
@media (prefers-color-scheme:dark){#gnav{--nbg:#12303f;--edge:#eaf0f4;--sh:#050a0e;--ink:#eaf0f4;--card:#1b2b36}}
#gnav *{box-sizing:border-box}
#gnav .gin{max-width:720px;margin:0 auto;padding:8px 16px 10px;display:flex;align-items:center;justify-content:space-between;gap:12px}
#gnav .ghome{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:4px 16px;border-radius:999px;background:var(--accent);color:var(--accent-ink);border:3px solid var(--edge);box-shadow:0 3px 0 var(--sh);font:700 17px 'Mali','Sarabun',system-ui,sans-serif;text-decoration:none;white-space:nowrap}
#gnav .ghome:active{transform:translateY(2px);box-shadow:0 1px 0 var(--sh)}
#gnav #gwho{display:flex;align-items:center;gap:8px;min-width:0}
#gnav #gwho a.gname{color:var(--ink);text-decoration:none;font:700 17px 'Mali','Sarabun',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:42vw;border-bottom:2px dashed var(--ink);padding:4px 0}
#gnav .gbtn{background:var(--card);color:var(--ink);border:3px solid var(--edge);box-shadow:0 3px 0 var(--sh);border-radius:999px;padding:4px 16px;min-height:44px;display:inline-flex;align-items:center;font:700 16px 'Mali','Sarabun',system-ui,sans-serif;text-decoration:none}
#gnav a:focus-visible,#gnav button:focus-visible{outline:3px solid #1b6dd6;outline-offset:2px}
#gnav~.ov:not(.dim),.ov:not(.dim){top:var(--gnh,0px)!important}.ov.dim{z-index:60!important}
/* เมนูและสถิติ (แผ่นเลื่อนขึ้น) */
#gmenu{--nbg:#d9eefb;--edge:#10202c;--sh:#10202c;--ink:#10202c;--muted:#52657a;--card:#fffdf6;--tint:#e9eff5;--accent:#ffcf5a;--accent-ink:#2a2007;
position:fixed;inset:0;z-index:99990;background:rgba(5,10,15,.6);display:flex;align-items:flex-end;justify-content:center;font:16px/1.45 'Sarabun',system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink)}
@media (prefers-color-scheme:dark){#gmenu{--nbg:#12303f;--edge:#eaf0f4;--sh:#050a0e;--ink:#eaf0f4;--muted:#9fb2c3;--card:#1b2b36;--tint:#24394a}}
#gmenu[hidden]{display:none}
#gmenu *{box-sizing:border-box}
#gmenu .gm-box{width:100%;max-width:520px;max-height:88vh;max-height:88dvh;overflow:auto;background:var(--nbg);border:3px solid var(--edge);border-bottom:0;border-radius:26px 26px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:14px}
@media (min-width:600px){#gmenu{align-items:center}#gmenu .gm-box{border-bottom:3px solid var(--edge);border-radius:26px;box-shadow:0 8px 0 var(--sh)}}
#gmenu .gm-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
#gmenu .gm-who{min-width:0;font:700 20px 'Mali','Sarabun',sans-serif;line-height:1.3}
#gmenu .gm-who a{color:var(--ink);text-decoration:none;border-bottom:2px dashed var(--ink)}
#gmenu .gm-who small{display:block;font:400 14px 'Sarabun',sans-serif;color:var(--muted)}
#gmenu .gm-x{flex:none;width:44px;height:44px;border-radius:50%;border:3px solid var(--edge);background:var(--card);color:var(--ink);box-shadow:0 3px 0 var(--sh);font-size:18px;cursor:pointer}
#gmenu .gm-card{background:var(--card);border:3px solid var(--edge);border-radius:20px;box-shadow:0 4px 0 var(--sh);padding:14px}
#gmenu .gm-h{font:700 18px 'Mali','Sarabun',sans-serif;margin:0 0 8px}
#gmenu .gm-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center}
#gmenu .gm-tiles div{background:var(--tint);border-radius:12px;padding:8px 4px}
#gmenu .gm-tiles b{display:block;font:700 24px/1.2 'Mali','Sarabun',sans-serif;font-variant-numeric:tabular-nums}
#gmenu .gm-tiles span{font-size:14px;color:var(--muted)}
#gmenu .gm-rows{margin-top:10px;display:flex;flex-direction:column;font-variant-numeric:tabular-nums}
#gmenu .gm-rows div{display:flex;justify-content:space-between;gap:10px;padding:7px 2px;border-top:1px solid var(--tint);font-size:15px}
#gmenu .gm-rows div span:last-child{color:var(--muted);text-align:right}
#gmenu .gm-note{margin:8px 0 0;color:var(--muted);font-size:14px}
#gmenu .gm-games{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
#gmenu .gm-games a{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;text-decoration:none;color:var(--ink);font:700 15px/1.25 'Mali','Sarabun',sans-serif;background:var(--card);border:3px solid var(--edge);border-radius:16px;box-shadow:0 3px 0 var(--sh);padding:10px 4px}
#gmenu .gm-games a img{width:48px;height:48px;border-radius:12px;background:var(--c);border:2px solid var(--edge)}
#gmenu .gm-games a[aria-current]{background:var(--c);color:#10202c;box-shadow:none;transform:translateY(3px)}
#gmenu .gm-links{display:flex;flex-wrap:wrap;gap:8px}
#gmenu .gm-links a{flex:1 1 auto;text-align:center;text-decoration:none;color:var(--ink);font:700 16px 'Mali','Sarabun',sans-serif;background:var(--card);border:3px solid var(--edge);border-radius:999px;box-shadow:0 3px 0 var(--sh);padding:6px 14px;min-height:44px;display:inline-flex;align-items:center;justify-content:center}
#gmenu .gm-links a.pri{background:var(--accent);color:var(--accent-ink)}
#gmenu a:focus-visible,#gmenu button:focus-visible,#gnav button:focus-visible{outline:3px solid #1b6dd6;outline-offset:2px}
@media (prefers-reduced-motion:no-preference){#gmenu .gm-box{animation:gmUp .18s ease-out}@keyframes gmUp{from{transform:translateY(24px);opacity:.4}}}

/* แผงเมนูในเกม: สไตล์กล่องเกมเหมือนกัน */
</style>
"""

PROFILE_BODY = r'''
<style>
:root{--bg:#d9eefb;--surface:#fffdf6;--surface2:#e9eff5;--line:#c5d2de;--edge:#10202c;--sh:#10202c;--ink:#13202c;--muted:#52657a;--accent:#ffcf5a;--accent-ink:#2a2007;--good:#1f7a45;--f-ui:'Sarabun',system-ui,-apple-system,'Segoe UI',sans-serif;--f-head:'Mali','Sarabun',system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#12303f;--surface:#1b2b36;--surface2:#24394a;--line:#2f4658;--edge:#eaf0f4;--sh:#050a0e;--ink:#eaf0f4;--muted:#9fb2c3;--good:#7bd88f;color-scheme:dark}}
*{box-sizing:border-box}[hidden]{display:none!important}
html,body{margin:0}body{background:var(--bg);color:var(--ink);font-family:var(--f-ui);font-size:15px;line-height:1.5;min-height:100vh}
a{color:inherit}
.pw{max-width:720px;margin:0 auto;padding:20px 16px 48px;display:flex;flex-direction:column;gap:20px}
.who{display:flex;align-items:center;gap:14px}
.av{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#2f9e6a,#2a9cc2);display:grid;place-items:center;font:800 28px var(--f-head);color:#fff;flex:none;text-transform:uppercase}
.who h1{margin:0;font:800 26px var(--f-head);letter-spacing:-.01em;overflow-wrap:anywhere}
.who p{margin:0;color:var(--muted);font-size:14px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px}
.tile{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 8px;text-align:center}
.tile b{display:block;font:800 26px var(--f-head);font-variant-numeric:tabular-nums}
.tile span{font-size:12.5px;color:var(--muted)}
h2{font:800 20px var(--f-head);margin:0 0 10px}
.gp{background:var(--surface);border:1px solid var(--line);border-top:4px solid var(--c);border-radius:16px;padding:16px;margin-bottom:12px}
.gh{display:flex;align-items:center;gap:12px;margin-bottom:8px}
.gh img{width:44px;height:44px;border-radius:12px;flex:none}
.gh b{font:800 18px var(--f-head);display:block}
.gh small{color:var(--muted)}
.gh a.go{margin-left:auto;color:var(--c);font-weight:700;text-decoration:none;white-space:nowrap}
.gh a.go:hover{text-decoration:underline}
.sc{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
th,td{padding:8px 6px;text-align:right;border-bottom:1px solid var(--line);white-space:nowrap}
th:first-child,td:first-child{text-align:left}
th{font-size:12px;color:var(--muted);font-weight:500}
tr:last-child td{border-bottom:0}
.bar{display:inline-block;vertical-align:middle;width:56px;height:8px;border-radius:99px;background:var(--surface2);overflow:hidden;margin-left:6px}
.bar i{display:block;height:100%;background:var(--c);border-radius:99px}
.none{color:var(--muted);margin:0}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px;text-align:center}
.btn.out{border:1px solid var(--line);background:var(--surface2);color:var(--ink);font:700 14px var(--f-ui);cursor:pointer;padding:9px 14px;flex:none}
.btn{display:inline-block;background:var(--accent);color:var(--accent-ink);border-radius:12px;padding:11px 18px;font-weight:700;text-decoration:none}
.sub{color:var(--muted);margin:0 0 12px}
.err{color:#ff917c;text-align:center}
.tile{border:3px solid var(--edge);border-radius:18px;box-shadow:0 4px 0 var(--sh)}
.gp{border:3px solid var(--edge);border-top:3px solid var(--edge);border-radius:22px;box-shadow:0 5px 0 var(--sh);padding:16px}
.gh img{border:3px solid var(--edge);background:var(--c);border-radius:14px;padding:2px}
.gh a.go{color:#10202c;background:var(--c);border:3px solid var(--edge);border-radius:999px;padding:3px 18px;min-height:40px;display:inline-flex;align-items:center;font-family:var(--f-head)}
.gh a.go:hover{text-decoration:none}
.av{border:3px solid var(--edge);box-shadow:0 4px 0 var(--sh);font-family:var(--f-head)}
.panel{border:3px solid var(--edge);border-radius:22px;box-shadow:0 5px 0 var(--sh)}
.btn{border:3px solid var(--edge);box-shadow:0 4px 0 var(--sh);font-family:var(--f-head);font-weight:700}
.btn.out{background:var(--surface);color:var(--ink);border:3px solid var(--edge);box-shadow:0 3px 0 var(--sh);font-family:var(--f-head);min-height:44px}
body{font-size:16px}
</style>
<main class="pw" id="pw">
  <div id="guest" class="panel" hidden><h2>โปรไฟล์ของฉัน</h2><p class="sub">เข้าสู่ระบบเพื่อดูสถิติของตัวเอง</p><a class="btn" href="../#login">เข้าสู่ระบบ</a></div>
  <div id="load" class="sub" style="text-align:center">กำลังโหลด…</div>
  <div id="err" class="err" hidden></div>
  <section id="prof" hidden>
    <div class="who"><div class="av" id="av"></div><div style="flex:1;min-width:0"><h1 id="nm"></h1><p id="who"></p></div><button type="button" class="btn out" id="pOut" hidden>ออกจากระบบ</button></div>
    <div class="tiles" style="margin-top:16px"><div class="tile"><b id="tRank">–</b><span>อันดับรวม</span></div><div class="tile"><b id="tPts">0</b><span>แต้มรวม</span></div><div class="tile"><b id="tWins">0</b><span>ชนะ</span></div><div class="tile"><b id="tPlays">0</b><span>เล่นทั้งหมด</span></div><div class="tile"><b id="tRate">–</b><span>อัตราชนะ</span></div></div>
    <h2 style="margin-top:22px">ผลงานแต่ละเกม</h2>
    <div id="games"></div>
  </section>
</main>
<script>
(function(){
'use strict';
var $=function(i){return document.getElementById(i);};
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
var LVL={easy:'ง่าย',medium:'กลาง',hard:'ยาก',expert:'โหด',online:'แข่งกับเพื่อน'},AIL={easy:'สู้ AI ง่าย',medium:'สู้ AI กลาง',hard:'สู้ AI ยาก',online:'แข่งกับเพื่อน'};
var G=[
 {k:'amath',n:'A-Math',c:'#2f9e6a',cats:['easy','medium','hard','online'],lbl:AIL,stat:'score',href:'../amath/'},
 {k:'sudoku',n:'Sudoku',c:'#2a9cc2',cats:['easy','medium','hard','expert','online'],lbl:LVL,stat:'time',href:'../sudoku/'},
 {k:'game24',n:'เกม 24',c:'#ffcf5a',cats:['easy','medium','hard','expert','online'],lbl:LVL,stat:'time',href:'../game24/'},
 {k:'chess',n:'หมากรุก',c:'#c89b6a',cats:['easy','medium','hard','online'],lbl:AIL,stat:'none',href:'../chess/'},
 {k:'checkers',n:'หมากฮอส',c:'#3f9a7c',cats:['easy','medium','hard','online'],lbl:AIL,stat:'none',href:'../checkers/'}
];
function fmtTime(t){t=+t;if(t>=60){var m=Math.floor(t/60),s=Math.round(t-m*60);if(s===60){m++;s=0;}return m+':'+(s<10?'0':'')+s+' น.';}return t.toFixed(1)+' วิ';}
function pct(w,p){return p?Math.round(100*w/p):0;}
function render(name,rows,ov,isMe){
  document.title=(isMe?'โปรไฟล์ของฉัน':'โปรไฟล์ '+name)+' — Taoob Arcade';
  $('pOut').hidden=!isMe;$('av').textContent=name.charAt(0);$('nm').textContent=name;$('who').textContent=isMe?'โปรไฟล์ของคุณ':'ผู้เล่นใน Taoob Arcade';
  var list=ov.filter(function(r){return r.plays>0;}).sort(function(a,b){return b.points-a.points||b.wins-a.wins||(a.username<b.username?-1:1);});
  var i=list.findIndex(function(r){return r.username===name;}),me=ov.filter(function(r){return r.username===name;})[0]||{points:0,wins:0,plays:0};
  $('tRank').textContent=i>=0?'#'+(i+1):'–';$('tPts').textContent=me.points||0;$('tWins').textContent=me.wins||0;$('tPlays').textContent=me.plays||0;$('tRate').textContent=me.plays?pct(me.wins,me.plays)+'%':'–';
  $('games').innerHTML=G.map(function(g){
    var rs=rows.filter(function(r){return r.game===g.k&&r.plays>0;}),w=0,p=0,pt=0;
    rs.forEach(function(r){w+=r.wins;p+=r.plays;pt+=r.points;});
    var head='<div class="gh"><img src="../icons/'+g.k+'.png" alt=""><div><b>'+g.n+'</b><small>'+(p?'ชนะ '+w+' จาก '+p+' ครั้ง · '+pt+' แต้ม':'ยังไม่เคยเล่น')+'</small></div>'+(isMe?'<a class="go" href="'+g.href+'">เล่น →</a>':'')+'</div>';
    var body='';
    if(rs.length){
      var th='<tr><th>ระดับ</th><th>เล่น</th><th>ชนะ</th><th>อัตราชนะ</th>'+(g.stat==='none'?'':'<th>'+(g.stat==='time'?'เร็วสุด':'คะแนนสูงสุด')+'</th>')+'</tr>';
      var trs=g.cats.map(function(c){
        var r=rs.filter(function(x){return x.cat===c;})[0];if(!r)return'';
        var pc=pct(r.wins,r.plays),extra=g.stat==='time'?(r.best_time!=null?fmtTime(r.best_time):'–'):g.stat==='score'?(r.best_score!=null?r.best_score:'–'):null;
        return'<tr><td>'+g.lbl[c]+'</td><td>'+r.plays+'</td><td>'+r.wins+'</td><td>'+pc+'%<span class="bar"><i style="width:'+pc+'%"></i></span></td>'+(extra===null?'':'<td>'+extra+'</td>')+'</tr>';
      }).join('');
      body='<div class="sc"><table><thead>'+th+'</thead><tbody>'+trs+'</tbody></table></div>';
    }
    return'<div class="gp" style="--c:'+g.c+'">'+head+body+'</div>';
  }).join('');
  $('load').hidden=true;$('prof').hidden=false;
}
var tok=0;
function load(){
  var my=++tok,q=(location.search.match(/[?&]u=([^&]*)/)||[])[1],target=q?decodeURIComponent(q):null;
  $('prof').hidden=true;$('guest').hidden=true;$('err').hidden=true;$('load').hidden=false;
  Arcade.ready.then(function(){
    if(my!==tok)return;
    var me=Arcade.user();target=target?Arcade.normName(target):(me&&me.username);
    if(!target){$('load').hidden=true;$('guest').hidden=false;return;}
    var isMe=!!(me&&me.username===target);
    Promise.all([Arcade.userRows(target),Arcade.overall()]).then(function(r){
      if(my!==tok)return;
      var known=r[1].some(function(x){return x.username===target;});
      if(!known){$('load').hidden=true;$('err').hidden=false;$('err').textContent='ไม่พบผู้เล่นชื่อ '+target;return;}
      render(target,r[0],r[1],isMe);
    },function(){if(my!==tok)return;$('load').hidden=true;$('err').hidden=false;$('err').textContent='โหลดสถิติไม่ได้ ตรวจว่าออนไลน์อยู่และรัน schema.sql แล้ว';});
  });
}
$('pOut').onclick=function(){Arcade.logout();};
Arcade.onChange(function(){load();});
})();
</script>
'''

def NAV(cur):
    L = [('../', 'หน้าแรก', ''), ('../#games', 'เกม', ''), ('../#ranking', 'อันดับ', ''), ('../amath/', 'A-Math', 'amath'), ('../sudoku/', 'Sudoku', 'sudoku'), ('../game24/', 'เกม 24', 'game24'), ('../chess/', 'หมากรุก', 'chess'), ('../checkers/', 'หมากฮอส', 'checkers')]
    links = ''.join('<a href="%s"%s>%s</a>' % (h, ' aria-current="page"' if k == cur else '', n) for h, n, k in L)
    extra = ''
    if cur in ('sudoku', 'game24'):
        extra = '<style>#toast{top:calc(var(--gnh,0px) + 10px)!important;z-index:70!important}</style>'
    elif cur == 'amath':
        extra = '<style>#toast.top{top:calc(var(--gnh,0px) + 8px)!important}</style>'
    home = '<a class="ghome" href="../" aria-label="กลับหน้าแรก"><span aria-hidden="true">←</span>หน้าแรก</a>'
    return NAVCSS + extra + ('<div id="gnav" role="banner" data-game="%s"><div class="gin">' % cur + home +
        '<div id="gwho"><button type="button" class="gbtn" id="gmBtn" aria-haspopup="dialog">เมนู</button></div></div></div>\n')

ACCT_JS = '''<script>
(function(){
  var nv=document.getElementById('gnav');function sh(){if(nv)document.documentElement.style.setProperty('--gnh',nv.offsetHeight+'px');}sh();addEventListener('resize',sh);(function(){var l=nv&&nv.querySelector('.glinks'),a=l&&l.querySelector('[aria-current]');if(a)l.scrollLeft=Math.max(0,a.offsetLeft-(l.clientWidth-a.offsetWidth)/2);})();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(sh);
  /* กันออกจากแมตช์โดยไม่ตั้งใจ: คลิกลิงก์ในแถบเมนูแล้วถามก่อน (แต่ละเกมกำหนด window.__leaveGuard) */
  function ask(g,go){
    var d=document.createElement('div');d.id='gleave';
    d.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(5,10,16,.72);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Sarabun,system-ui,sans-serif';
    d.innerHTML='<div role="alertdialog" aria-modal="true" style="background:#1e2d3b;color:#eaf0f4;border:1px solid #2a3b4b;border-radius:16px;padding:22px;max-width:360px;width:100%;display:flex;flex-direction:column;gap:12px"><b style="font-size:20px">ออกจากหน้านี้?</b><span style="color:#b6c6d3"></span><div style="display:flex;gap:8px"><button type="button" data-y style="flex:1;padding:10px;border-radius:10px;border:0;background:#ffcf5a;color:#2a2007;font:700 15px inherit;cursor:pointer">ออก</button><button type="button" data-n style="flex:1;padding:10px;border-radius:10px;border:1px solid #2a3b4b;background:#2a3b4b;color:#eaf0f4;font:700 15px inherit;cursor:pointer">อยู่ต่อ</button></div></div>';
    d.querySelector('span').textContent=g.msg||'';
    document.body.appendChild(d);
    var n=d.querySelector('[data-n]');n.focus();
    function close(){d.remove();}
    n.onclick=close;d.onclick=function(e){if(e.target===d)close();};
    d.querySelector('[data-y]').onclick=function(){close();try{if(window.__leaveNow)window.__leaveNow();}catch(e){}go();};
    d.onkeydown=function(e){if(e.key==='Escape')close();};
  }
  function guard(){try{return window.__leaveGuard?window.__leaveGuard():null;}catch(e){return null;}}
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('#gnav a[href],#gmenu a[href],.gm-embed a[href]'),o=e.target.closest&&e.target.closest('#gOut');
    if(!a&&!o)return;if(a&&(e.ctrlKey||e.metaKey||e.shiftKey||a.target==='_blank'))return;
    var g=guard();if(!g)return;
    e.preventDefault();e.stopImmediatePropagation();
    ask(g,function(){if(a)location.href=a.href;else if(window.Arcade)Arcade.logout();});
  },true);
  addEventListener('beforeunload',function(e){var g=guard();if(g&&!g.soft){e.preventDefault();e.returnValue='';}});
  var el=document.getElementById('gwho');if(!el||!window.Arcade)return;
  var f=document.createElement('link');f.rel='stylesheet';f.href='https://fonts.googleapis.com/css2?family=Mali:wght@500;700&family=Sarabun:wght@400;700&display=swap';document.head.appendChild(f);
  var cur=(nv&&nv.getAttribute('data-game'))||'';
  var GM=[['game24','เกม 24','#ffcf5a'],['sudoku','Sudoku','#2a9cc2'],['amath','A-Math','#2f9e6a'],['checkers','หมากฮอส','#3f9a7c'],['chess','หมากรุก','#c89b6a']];
  var LV={easy:'ง่าย',medium:'กลาง',hard:'ยาก',expert:'โหด',online:'แข่งกับเพื่อน'},AIL={easy:'สู้ AI ง่าย',medium:'สู้ AI กลาง',hard:'สู้ AI ยาก',online:'แข่งกับเพื่อน'};
  var AI={chess:1,checkers:1,amath:1},STAT={amath:'score',sudoku:'time',game24:'time'},ORDER=['easy','medium','hard','expert','online'];
  function esc(x){return String(x).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function fmtT(t){t=+t;if(t>=60){var m=Math.floor(t/60),s=Math.round(t-m*60);if(s===60){m++;s=0;}return m+':'+(s<10?'0':'')+s+' น.';}return t.toFixed(1)+' วิ';}
  var gg='';GM.forEach(function(g){gg+='<a href="../'+g[0]+'/" style="--c:'+g[2]+'"'+(g[0]===cur?' aria-current="page"':'')+'><img src="../icons/'+g[0]+'.png" alt="">'+g[1]+'</a>';});
  var BODY='<div class="gm-who gmWho"></div><div class="gmStats"></div><div class="gm-card"><div class="gm-h">เล่นเกมอื่น</div><div class="gm-games">'+gg+'</div></div><div class="gm-links"><a class="pri" href="../">หน้าแรก</a><a href="../#ranking">ตารางอันดับ</a><a href="../profile/">โปรไฟล์ของฉัน</a></div>';
  var box=document.createElement('div');box.id='gmenu';box.hidden=true;
  box.innerHTML='<div class="gm-box" role="dialog" aria-modal="true" aria-label="เมนู"><div class="gm-top"><span class="gm-h" style="margin:0">เมนู</span><button type="button" class="gm-x" id="gmX" aria-label="ปิดเมนู">✕</button></div>'+BODY+'</div>';
  document.body.appendChild(box);
  var opener=null;
  function closeM(){box.hidden=true;if(opener&&opener.focus)try{opener.focus();}catch(e){}}
  function openM(){opener=document.activeElement;box.hidden=false;paint(box);box.querySelector('#gmX').focus();}
  window.__gmenuOpen=openM;
  box.querySelector('#gmX').onclick=closeM;
  box.addEventListener('mousedown',function(e){if(e.target===box)closeM();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!box.hidden&&!document.getElementById('gleave'))closeM();});
  el.addEventListener('click',function(e){if(e.target.closest('#gmBtn'))openM();});
  var tok=0,U=null;
  function paint(root){
    var who=root.querySelector('.gmWho'),st=root.querySelector('.gmStats'),my=++tok;
    if(!U){
      who.innerHTML='ยังไม่ได้เข้าสู่ระบบ<small>เล่นได้ แต่ผลจะไม่ติดอันดับ</small>';
      st.innerHTML='<div class="gm-card"><div class="gm-h">สถิติของฉัน</div><p class="gm-note" style="margin:0 0 10px">เข้าสู่ระบบเพื่อเก็บสถิติและติดอันดับ</p><div class="gm-links"><a class="pri" href="../#login">เข้าสู่ระบบ</a></div></div>';
      return;
    }
    who.innerHTML='สวัสดี <a href="../profile/">'+esc(U.username)+'</a><small>แตะชื่อเพื่อดูสถิติทั้งหมด</small>';
    st.innerHTML='<div class="gm-card"><div class="gm-h">สถิติของฉัน</div><p class="gm-note" style="margin:0">กำลังโหลด…</p></div>';
    Promise.all([Arcade.userRows(U.username),Arcade.overall()]).then(function(r){
      if(my!==tok||!U)return;
      var rows=r[0],ov=r[1].filter(function(x){return x.plays>0;}).sort(function(a,b){return b.points-a.points||b.wins-a.wins||(a.username<b.username?-1:1);});
      var i=ov.findIndex(function(x){return x.username===U.username;}),me=ov[i]||{points:0,wins:0,plays:0};
      var line='อันดับรวม '+(i>=0?'#'+(i+1):'–')+' · '+(me.points||0)+' แต้ม';
      var gname='';GM.forEach(function(g){if(g[0]===cur)gname=g[1];});
      var h;
      if(gname){
        var rs=rows.filter(function(x){return x.game===cur&&x.plays>0;}),w=0,p=0;rs.forEach(function(x){w+=x.wins;p+=x.plays;});
        h='<div class="gm-card"><div class="gm-h">สถิติของฉัน: '+esc(gname)+'</div>';
        if(!p)h+='<p class="gm-note" style="margin:0">ยังไม่เคยเล่นเกมนี้ ลองเล่นรอบแรกได้เลย</p>';
        else{
          h+='<div class="gm-tiles"><div><b>'+w+'</b><span>ชนะ</span></div><div><b>'+p+'</b><span>เล่น</span></div><div><b>'+Math.round(100*w/p)+'%</b><span>อัตราชนะ</span></div></div><div class="gm-rows">';
          var lbl=AI[cur]?AIL:LV;
          ORDER.forEach(function(c){var x=rs.filter(function(y){return y.cat===c;})[0];if(!x)return;
            var ex=STAT[cur]==='time'&&c!=='online'?(x.best_time!=null?'เร็วสุด '+fmtT(x.best_time):''):STAT[cur]==='score'&&x.best_score!=null?'สูงสุด '+x.best_score:'';
            h+='<div><span>'+(lbl[c]||c)+'</span><span>ชนะ '+x.wins+'/'+x.plays+(ex?' · '+ex:'')+'</span></div>';});
          h+='</div>';
        }
        h+='<p class="gm-note">'+line+'</p></div>';
      }else{
        h='<div class="gm-card"><div class="gm-h">ภาพรวมของฉัน</div><div class="gm-tiles"><div><b>'+(i>=0?'#'+(i+1):'–')+'</b><span>อันดับรวม</span></div><div><b>'+(me.points||0)+'</b><span>แต้ม</span></div><div><b>'+(me.wins||0)+'</b><span>ชนะ</span></div></div></div>';
      }
      st.innerHTML=h;
    },function(){if(my===tok)st.innerHTML='<div class="gm-card"><div class="gm-h">สถิติของฉัน</div><p class="gm-note" style="margin:0">โหลดสถิติไม่ได้ ลองใหม่อีกครั้ง</p></div>';});
  }
  Arcade.onChange(function(u){U=u;if(!box.hidden)paint(box);});
})();
</script>
'''
PLAT = '<script src="../platform.js"></script>\n'

def wrap_headless(src, theme, cur):
    head = '''<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="%s">
<style>body{margin:0;display:flex;flex-direction:column}#app{flex:1 1 0;min-height:0;height:auto!important;width:100%%;box-sizing:border-box}</style>
%s''' % (theme, PLAT)
    out = head + src.rstrip() + '\n'
    i = out.index('<div id="app">')
    out = out[:i] + '</head>\n<body>\n' + NAV(cur) + out[i:]
    return out + ACCT_JS + '</body>\n</html>\n'

# ---------- Sudoku ----------
s = rd('sudoku.html')
s = sub(s, '<div class="hero">', '<div class="hero">')
s = sub(s, "if(!client)client=window.supabase.createClient(", SHARE)
# ชนะเดี่ยว
s = sub(s, "  cells.forEach((c,i)=>{c.el.classList.add('win')",
        "  if(window.Arcade)Arcade.report({game:'sudoku',cat:S.level,won:true,time:S.hints?null:S.time,points:S.hints?0:({easy:1,medium:2,hard:4,expert:8})[S.level]});\n  cells.forEach((c,i)=>{c.el.classList.add('win')")
# ออนไลน์: จบแมตช์ / ออกกลางคัน
s = sub(s, "if(res==='win')st.w++;else st.l++;ls.set('sudoku.pvp.v1',st);",
        "if(res==='win')st.w++;else st.l++;ls.set('sudoku.pvp.v1',st);\n  if(window.Arcade)Arcade.report({game:'sudoku',cat:'online',won:res==='win',points:res==='win'?5:0});")
s = sub(s, "st.l++;ls.set('sudoku.pvp.v1',st);\n    if(on)",
        "st.l++;ls.set('sudoku.pvp.v1',st);\n    if(window.Arcade)Arcade.report({game:'sudoku',cat:'online',won:false});\n    if(on)") if "st.l++;ls.set('sudoku.pvp.v1',st);\n    if(on)" in s else s
sudoku = wrap_headless(s, '#17708f', 'sudoku')

# ---------- เกม 24 ----------
g = rd('game24.html')
g = sub(g, '<div class="hero">', '<div class="hero">')
g = sub(g, "if(!client)client=window.supabase.createClient(", SHARE)
g = sub(g, "    const st=ls.get(SK)||{};st.solved=(st.solved||0)+1;",
        "    if(window.Arcade)Arcade.report({game:'game24',cat:G.level,won:true,time:G.hints?null:t,points:G.hints?0:({easy:1,medium:2,hard:4,expert:8})[G.level]});\n    const st=ls.get(SK)||{};st.solved=(st.solved||0)+1;")
g = sub(g, "function recordPvp(win){const st=ls.get(PK)||{w:0,l:0};if(win)st.w++;else st.l++;ls.set(PK,st);}",
        "function recordPvp(win){const st=ls.get(PK)||{w:0,l:0};if(win)st.w++;else st.l++;ls.set(PK,st);\n  if(window.Arcade)Arcade.report({game:'game24',cat:'online',won:!!win,points:win?5:0});}")
game24 = wrap_headless(g, '#13201e', 'game24')

# ---------- A-Math ----------
a = rd('amath.html')
a = sub(a, '</head>', PLAT + '</head>')
a = sub(a, '<body>', '<body>\n' + NAV('amath'))
a = sub(a, '</head>', '<style>body{display:flex;flex-direction:column}#app{flex:1 1 0;min-height:0;height:auto!important;width:100%;box-sizing:border-box}</style></head>')
a = sub(a, "if (!client) client = window.supabase.createClient(", SHARE_A)
a = sub(a, "    const stats = online ? null : recordResult();",
        "    const stats = online ? null : recordResult();\n"
        "    (function () {\n"
        "      if (!window.Arcade) return;\n"
        "      const key = (online ? online.code : 's') + ':' + state.history.length + ':' + f.scores.join(',');\n"
        "      if (window.__amReported === key) return; window.__amReported = key;\n"
        "      const won = f.winner === 0, usedHint = state.hint && state.hint.used > 0;\n"
        "      Arcade.report({ game: 'amath', cat: online ? 'online' : level, won: won, score: f.scores[0], points: won ? (online ? 5 : (usedHint ? 0 : ({ easy: 2, medium: 4, hard: 8 })[level] || 0)) : 0 });\n"
        "    })();")
a = sub(a, '</body>', ACCT_JS + '</body>')


# ---------- หมากรุก / หมากฮอส ----------
BGX = """<style>body{display:flex;flex-direction:column}#app{flex:1 1 0;min-height:0;height:auto!important;width:100%%;box-sizing:border-box}html{--bsz:clamp(220px,min(100vw - 24px,560px,100dvh - 262px - var(--gnh,0px)),560px)}#modal.ov{top:0!important;z-index:60}#toast{z-index:70}</style>"""
def wrap_bg(key):
    h = rd('%s.html' % key)
    h = sub(h, '</head>', PLAT + BGX + '</head>')
    h = sub(h, '<div id="app">', NAV(key) + '<div id="app">')
    h = sub(h, '</body>', ACCT_JS + '</body>')
    return h
chess = wrap_bg('chess')
checkers = wrap_bg('checkers')

for _d in ('chess','checkers'):
    os.makedirs(os.path.join(OUT, _d), exist_ok=True)
open(os.path.join(OUT, 'chess', 'index.html'), 'w', encoding='utf8').write(chess)
open(os.path.join(OUT, 'checkers', 'index.html'), 'w', encoding='utf8').write(checkers)
os.makedirs(os.path.join(OUT, 'sudoku'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'game24'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'amath'), exist_ok=True)
open(os.path.join(OUT, 'sudoku', 'index.html'), 'w', encoding='utf8').write(sudoku)
open(os.path.join(OUT, 'game24', 'index.html'), 'w', encoding='utf8').write(game24)
open(os.path.join(OUT, 'amath', 'index.html'), 'w', encoding='utf8').write(a)
print('สร้างเสร็จ')

# ---------- หน้าโปรไฟล์ ----------
os.makedirs(os.path.join(OUT, 'profile'), exist_ok=True)
prof = ('<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="theme-color" content="#0f1720">\n<title>โปรไฟล์ — Taoob Arcade</title>\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Sarabun:wght@400;500;700&display=swap">\n'
        '</head>\n<body>\n' + NAV('profile') + '<script src="../platform.js"></script>\n' + PROFILE_BODY + ACCT_JS + '</body>\n</html>\n')
open(os.path.join(OUT, 'profile', 'index.html'), 'w', encoding='utf8').write(prof)
