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
#gnav{--line:#2a3b4b;--ink:#eaf0f4;--muted:#8aa0b2;--accent:#ffcf5a;--accent-ink:#2a2007;--surface2:#1e2d3b;
position:sticky;top:0;z-index:50;flex:none;width:100%;box-sizing:border-box;background:rgba(15,23,32,.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line);padding-top:env(safe-area-inset-top,0px);color:var(--ink);font:15px/1.5 'Sarabun',system-ui,-apple-system,'Segoe UI',sans-serif;text-align:left}
#gnav *{box-sizing:border-box}
#gnav .gin{max-width:720px;margin:0 auto;padding:10px 16px 0;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 12px}
#gnav .glogo{order:1;text-decoration:none;color:var(--ink);font-family:'Bricolage Grotesque','Arial Rounded MT Bold','Trebuchet MS',sans-serif;font-weight:800;font-size:24px;letter-spacing:-.01em;display:flex;align-items:center;gap:10px}
#gnav .glogo i{display:grid;grid-template-columns:1fr 1fr;gap:3px;width:26px;height:26px}
#gnav .glogo i b{border-radius:4px;display:block}
#gnav .glogo i b:nth-child(1){background:#2f9e6a}#gnav .glogo i b:nth-child(2){background:#2a9cc2}#gnav .glogo i b:nth-child(3){background:#ffcf5a}#gnav .glogo i b:nth-child(4){background:#f3eee1}
#gnav #gwho{order:2;display:flex;align-items:center;gap:8px;min-width:0}
#gnav #gwho a.gname{color:var(--ink);text-decoration:none;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:40vw;border-bottom:1px dashed var(--muted)}
#gnav #gwho span{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:40vw}
#gnav .gbtn{background:var(--accent);color:var(--accent-ink);border-radius:10px;padding:7px 12px;font:700 14px 'Sarabun',system-ui,sans-serif;text-decoration:none;border:0;cursor:pointer;display:inline-block}
#gnav .gbtn.alt{background:var(--surface2);color:var(--ink);border:1px solid var(--line)}
#gnav .glinks{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;width:100%;order:3;margin:0 -8px;padding:0 8px}
#gnav .glinks::-webkit-scrollbar{display:none}
#gnav .glinks a{flex:none;text-decoration:none;color:var(--muted);padding:9px 12px;font-weight:700;border-bottom:3px solid transparent;white-space:nowrap}
#gnav .glinks a:hover{color:var(--ink)}
#gnav .glinks a[aria-current]{color:var(--ink);border-bottom-color:var(--accent)}
#gnav a:focus-visible,#gnav button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
@media (min-width:640px){#gnav .gin{max-width:1080px;flex-wrap:nowrap;padding-bottom:0}#gnav .glinks{order:2;width:auto;margin:0;padding:0;flex:1;justify-content:center}#gnav #gwho{order:3}#gnav .glinks a{padding:15px 9px}}
#gnav~.ov:not(.dim),.ov:not(.dim){top:var(--gnh,0px)!important}.ov.dim{z-index:60!important}
</style>
"""

PROFILE_BODY = r'''
<style>
:root{--bg:#0f1720;--surface:#17222d;--surface2:#1e2d3b;--line:#2a3b4b;--ink:#eaf0f4;--muted:#8aa0b2;--accent:#ffcf5a;--accent-ink:#2a2007;--good:#7bd88f;--f-ui:'Sarabun',system-ui,-apple-system,'Segoe UI',sans-serif;--f-head:'Bricolage Grotesque','Arial Rounded MT Bold','Trebuchet MS',sans-serif;color-scheme:dark}
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
    return NAVCSS + extra + ('<div id="gnav" role="banner"><div class="gin"><a class="glogo" href="../" aria-label="Taoob Arcade หน้าแรก"><i><b></b><b></b><b></b><b></b></i>Taoob Arcade</a>'
        '<div id="gwho"><a class="gbtn" href="../#login">เข้าสู่ระบบ</a></div>'
        '<nav class="glinks" aria-label="เมนูหลัก">' + links + '</nav></div></div>\n')

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
    var a=e.target.closest&&e.target.closest('#gnav a[href]'),o=e.target.closest&&e.target.closest('#gOut');
    if(!a&&!o)return;if(a&&(e.ctrlKey||e.metaKey||e.shiftKey||a.target==='_blank'))return;
    var g=guard();if(!g)return;
    e.preventDefault();e.stopImmediatePropagation();
    ask(g,function(){if(a)location.href=a.href;else if(window.Arcade)Arcade.logout();});
  },true);
  addEventListener('beforeunload',function(e){var g=guard();if(g&&!g.soft){e.preventDefault();e.returnValue='';}});
  var el=document.getElementById('gwho');if(!el||!window.Arcade)return;
  var f=document.createElement('link');f.rel='stylesheet';f.href='https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Sarabun:wght@400;700&display=swap';document.head.appendChild(f);
  Arcade.onChange(function(u){
    if(!u){el.innerHTML='<a class="gbtn" href="../#login">เข้าสู่ระบบ</a>';return;}
    el.innerHTML='<a class="gname" href="../profile/" title="ดูโปรไฟล์/สถิติของฉัน"></a>';
    el.firstChild.textContent=u.username;
  });
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
