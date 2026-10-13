import re,sys
sys.path.insert(0,'/home/claude/emo')
from build_emo import block
def rep(s,a,b,cnt=1):
    assert s.count(a)==cnt,(a[:70],s.count(a))
    return s.replace(a,b)
MARK=lambda blk:'<!--EMO-START-->\n'+blk+'<!--EMO-END-->\n'
def inject(s):
    blk=MARK(block())
    if '<!--EMO-START-->' in s:
        return re.sub(r'<!--EMO-START-->.*?<!--EMO-END-->\n',lambda m:blk,s,flags=re.S)
    if '</head>' in s: return rep(s,'</head>',blk+'</head>')
    return rep(s,'<div id="app">',blk+'<div id="app">')
# ---------- sudoku & game24 ----------
for g in ('sudoku','game24'):
    p=f'/home/claude/{g}.html';s=open(p).read()
    s=inject(s)
    if 'EM.onPeers' not in s:
        s=rep(s,"  me.peers={};ch.peers.forEach(p=>{me.peers[p.peer]=p.presence||{};if(p.presence&&p.presence.rs)me.rs[p.peer]=1;});",
                "  me.peers={};ch.peers.forEach(p=>{me.peers[p.peer]=p.presence||{};if(p.presence&&p.presence.rs)me.rs[p.peer]=1;});\n  if(window.EM)EM.onPeers(me.peers,me.meId,id=>nameOf(me,id));")
        s=rep(s,"  specClose();\n}","  specClose();\n  if(window.EM)EM.enable(false);\n}")
        s=rep(s,"  openModal('<h2>กำลังสร้างห้อง…</h2>","  emOn();\n  openModal('<h2>กำลังสร้างห้อง…</h2>")
        s=rep(s,"  openModal('<h2>กำลังเข้าห้อง…</h2>","  emOn();\n  openModal('<h2>กำลังเข้าห้อง…</h2>")
        s=rep(s,"function mpHost(max,info,extra){","function emOn(){if(!window.EM)return;EM.reset();EM.init({send:em=>pres({em}),bot:false});EM.enable(true);}\nfunction mpHost(max,info,extra){")
    open(p,'w').write(s)
# ---------- amath ----------
p='/home/claude/amath.html';s=open(p).read()
s=inject(s)
if 'EM.onPeers' not in s:
    s=rep(s,"    showScreen('game');\n    requestAnimationFrame(function () {\n      refresh(); fitView(false);",
"""    showScreen('game');
    if (window.EM) { EM.reset(); EM.init({ send: function (em) { if (online && online.room) online.room.presence({ em: em }).catch(noop); }, bot: !online }); EM.enable(true); }
    requestAnimationFrame(function () {
      refresh(); fitView(false);""")
    s=rep(s,"  function goMenu() {\n    onlineLeave();","  function goMenu() {\n    if (window.EM) EM.enable(false);\n    onlineLeave();")
    s=rep(s,"    const me = ps.find(function (p) { return p.isMe; }); if (me) on.meId = me.peer;\n",
"""    const me = ps.find(function (p) { return p.isMe; }); if (me) on.meId = me.peer;
    emPeers(on, ch);
""")
    s=rep(s,"    if (me) on.meId = me.peer;\n    if (!host) {","    if (me) on.meId = me.peer;\n    emPeers(on, ch);\n    if (!host) {")
    s=rep(s,"  function hostOnPeers(on, ch, saved) {","""  function emPeers(on, ch) {
    if (!window.EM) return;
    const m = {}; ch.peers.forEach(function (p) { m[p.peer] = p.presence || {}; });
    EM.onPeers(m, on.meId, function (id) { return (m[id] && m[id].nm) || 'เพื่อน'; });
  }
  function hostOnPeers(on, ch, saved) {""")
    s=rep(s,"    if (h.type === 'place' && state.last) focusCells(state.last.cells);\n    if (state.over) setTimeout(showEnd, 700);",
"""    if (h.type === 'place' && state.last) focusCells(state.last.cells);
    if (window.EM && !state.over) EM.botMaybe(h.type === 'place' && h.score >= 30 ? 0.5 : h.type === 'place' ? 0.1 : 0.2, h.type === 'pass' ? 'sad' : 'taunt');
    if (state.over) setTimeout(showEnd, 700);""")
    s=rep(s,"    const stats = online ? null : recordResult();\n","    const stats = online ? null : recordResult();\n    if (window.EM && !online && !isSpec()) EM.botMaybe(1, f.winner === 0 ? 'sad' : 'taunt');\n")
open(p,'w').write(s)
# ---------- chess/checkers ----------
p='/home/claude/bg/build.py';s=open(p).read()
if '@EMO@' not in s:
    s=rep(s,"</style>\n</head>","</style>\n@EMO@</head>")
    s=rep(s,".replace('@COMMON@',rd('common.js'))",".replace('@COMMON@',rd('common.js')).replace('@EMO@',EMO)")
    s=rep(s,"rd=lambda n:open(os.path.join(D,n),encoding='utf8').read()\n","rd=lambda n:open(os.path.join(D,n),encoding='utf8').read()\nimport sys;sys.path.insert(0,'/home/claude/emo')\nfrom build_emo import block\nEMO=block()\n")
    open(p,'w').write(s)
p='/home/claude/bg/common.js';s=open(p).read()
if 'EM.onPeers' not in s:
    s=rep(s,"  me.peers={};ch.peers.forEach(p=>{me.peers[p.peer]=p.presence||{};});\n  let host=null;",
"  me.peers={};ch.peers.forEach(p=>{me.peers[p.peer]=p.presence||{};});\n  if(window.EM)EM.onPeers(me.peers,me.meId,id=>{const p=me.peers[id]||{};return p.nm||(me.pl.indexOf(id)>=0?'ผู้เล่น':'คนดู');});\n  let host=null;")
    s=rep(s,"function showMenu(){try{saveGame();}catch(e){}stopTick();M=null;","function showMenu(){try{saveGame();}catch(e){}stopTick();M=null;if(window.EM)EM.enable(false);")
    s=rep(s,"function render(){\n","function emSync(){\n  if(!window.EM||!M||M._em===M.mode)return;M._em=M.mode;\n  EM.reset();EM.init({send:(M.mode==='online'||M.mode==='spec')?em=>pres({em}):null,bot:M.mode==='ai'});EM.enable(M.mode!=='local');\n}\nfunction render(){\n  emSync();\n")
    s=rep(s,"  render();saveGame();\n  if(M.mode==='ai'&&cur().t!==M.my)aiTurn();\n}\nfunction aiTurn(){","  render();saveGame();\n  if(M.mode==='ai'&&mover!==M.my)EM.botMaybe(0.1);\n  if(M.mode==='ai'&&cur().t!==M.my)aiTurn();\n}\nfunction aiTurn(){")
open(p,'w').write(s)
print('applied')
