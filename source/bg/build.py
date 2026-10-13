import os,re
D=os.path.dirname(os.path.abspath(__file__))
rd=lambda n:open(os.path.join(D,n),encoding='utf8').read()
import sys;sys.path.insert(0,'/home/claude/emo')
from build_emo import block
EMO=block()
HTML='''<!doctype html>
<html lang="th" class="mn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="@THEME@">
<title>@TITLE@</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Sarabun:wght@400;500;700&display=swap">
<style>
@COMMONCSS@
@GAMECSS@
</style>
@EMO@</head>
<body>
<div id="app">
  <main id="menu" class="scr">
    <div class="hero"><div id="mIcon"></div><div><h1 id="mTitle"></h1><p class="sub" id="mSub"></p></div></div>
    <p class="rule" id="mRule"></p>
    <div id="resumeBox"></div>

    <h2>เวลา</h2>
    <div class="chips" id="cTime"></div>
    <div id="timeOpts">
      <div class="lbl">เวลาต่อฝ่าย</div><div class="chips" id="cMins"></div>
      <div class="lbl">บวกเวลาต่อตา</div><div class="chips" id="cInc"></div>
    </div>

    <h2>เล่นกับ AI</h2>
    <div class="lbl" style="margin-top:0">คุณเล่นเป็น</div><div class="chips" id="cSide"></div>
    <div id="lvs"></div>

    <h2>เล่นกับเพื่อน</h2>
    <p class="sub" id="pvpSub"></p>
    <div class="row"><button class="btn" id="bHost">สร้างห้อง</button><button class="btn alt" id="bJoin">เข้าห้อง</button></div>
    <div class="row"><button class="btn alt" id="bLocal">เล่นสองคนในเครื่องเดียว</button></div>
    <p class="stat" id="mStat" style="white-space:pre-line"></p>
  </main>

  <section id="game" class="scr" hidden>
    <div class="gbar"><button class="btn alt" id="bMenu">เมนู</button><div id="status"></div><button class="eye" id="eye" type="button" hidden></button></div>
    <div class="pl" style="order:0"><div class="who" id="plTop"></div><div class="clk" id="clkTop"></div></div>
    <div id="bw"><div id="board"></div></div>
    <div class="pl"><div class="who" id="plBot"></div><div class="clk" id="clkBot"></div></div>
    <div class="tools"><button class="btn alt" id="tUndo">ย้อนกลับ</button><button class="btn alt" id="tFlip">หมุนกระดาน</button><button class="btn alt" id="tRes">ยอมแพ้</button></div>
  </section>
</div>
<div class="ov" id="modal" hidden><div class="card" id="modalCard"></div></div>
<div id="toast" hidden></div>
<script>
/*==CORE-START==*/
@CORE@
/*==CORE-END==*/
@UI@
@COMMON@
</script>
</body>
</html>
'''
for key,title,theme in [('chess','หมากรุก — Taoob','#8a5a2b'),('checkers','หมากฮอส — Taoob','#2f6b57')]:
    core=rd(key+'-core.js').split('if(typeof module')[0]
    out=HTML.replace('@THEME@',theme).replace('@TITLE@',title).replace('@COMMONCSS@',rd('common.css')).replace('@GAMECSS@',rd(key+'.css')).replace('@CORE@',core).replace('@UI@',rd(key+'-ui.js')).replace('@COMMON@',rd('common.js')).replace('@EMO@',EMO)
    open(os.path.join(D,'..',key+'.html'),'w',encoding='utf8').write(out)
    print(key,len(out))
