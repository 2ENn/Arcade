CFG={
 'sudoku':  ("function(){var m=document.getElementById('menu');return !!m&&m.hidden;}", '#bMenu', ''),
 'game24':  ("function(){var m=document.getElementById('menu');return !!m&&m.hidden;}", '#bMenu', ''),
 'amath':   ("function(){var g=document.getElementById('game');return !!g&&!g.hidden;}", '', ''),
 'chess':   ("function(){var g=document.getElementById('game');return !!g&&!g.hidden;}", '#bMenu', ''),
 'checkers':("function(){var g=document.getElementById('game');return !!g&&!g.hidden;}", '#bMenu', ''),
}
HOW={
 'sudoku':"<h3>วิธีเล่น Sudoku</h3><ol><li>ใส่เลข 1–9 ให้ครบทุกช่อง</li><li>ห้ามมีเลขซ้ำในแต่ละแถวและแต่ละหลัก</li><li>ห้ามมีเลขซ้ำในแต่ละกรอบ 3×3</li><li>ใช้ปุ่มโน้ตจดตัวเลขที่เป็นไปได้ และกดใบ้ได้เมื่อติด</li></ol>",
 'game24':"<h3>วิธีเล่นเกม 24</h3><ol><li>มีไพ่ 4 ใบ ใช้ครบทุกใบ ใบละหนึ่งครั้ง</li><li>ใช้ + − × ÷ และวงเล็บ ให้ผลลัพธ์เท่ากับ 24</li><li>แตะไพ่ แตะเครื่องหมาย แล้วแตะไพ่อีกใบเพื่อรวมกัน</li><li>ติดขัดกดใบ้ได้ แต่ผลจะไม่ติดอันดับเวลา</li></ol>",
 'chess':"<h3>วิธีเล่นหมากรุก</h3><ol><li>ขาวเดินก่อน สลับกันเดินครั้งละหนึ่งตา</li><li>แตะหมากของตัวเอง แล้วแตะช่องที่เดินได้ (จุดไฮไลต์)</li><li>เป้าหมายคือรุกฆาตคิงของอีกฝ่าย</li><li>เสมอได้เมื่อไม่มีใครรุกฆาตได้ เช่น คิงตาย (stalemate) หรือเดินซ้ำ</li></ol>",
 'checkers':"<h3>วิธีเล่นหมากฮอส</h3><ol><li>หมากเดินเฉียงไปข้างหน้าทีละช่อง</li><li>กินหมากอีกฝ่ายด้วยการข้ามไปช่องว่างด้านหลังหมากนั้น กินต่อเนื่องได้</li><li>หมากที่ไปถึงแถวสุดท้ายจะเป็นฮอส เดินได้ทั้งไปหน้าและถอยหลัง และบินได้หลายช่อง</li><li>เลือกกติกาบังคับกินหรือไม่บังคับได้ก่อนเริ่มแต่ละเกม</li></ol>",
}
GIVE={'chess':'#tRes','checkers':'#tRes'}
def actjs(game):
    if game=='amath': return ''
    import json
    a={'how':HOW[game],'hist':'stats'}
    if game in GIVE: a['give']=GIVE[game]
    return ',act:'+json.dumps(a,ensure_ascii=False)
def block(game):
    ing,menu,_=CFG[game]
    t=open('/home/claude/bgm/bgm.tpl.js',encoding='utf-8').read()
    init="<script>BGM.init({game:'%s',inGame:%s,menuBtn:'%s'%s});</script>\n"%(game,ing,menu,actjs(game))
    return t+init
