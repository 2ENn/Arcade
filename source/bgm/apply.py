import re,sys
sys.path.insert(0,'/home/claude/bgm')
from build_bgm import block
S,E='<!--BGM-START-->\n','<!--BGM-END-->\n'
for g in ('sudoku','game24','amath'):
    p=f'/home/claude/{g}.html';s=open(p,encoding='utf-8').read()
    blk=S+block(g)+E
    if S in s:
        s=re.sub(re.escape(S)+r'.*?'+re.escape(E),lambda m:blk,s,flags=re.S)
    elif '</head>' in s:
        s=s.replace('</head>',blk+'</head>',1)
    else:
        assert s.count('<div id="app">')==1
        s=s.replace('<div id="app">',blk+'<div id="app">',1)
    open(p,'w',encoding='utf-8').write(s);print(g,'ok')
p='/home/claude/bg/build.py';s=open(p,encoding='utf-8').read()
if 'BGMB' not in s:
    s=s.replace("EMO=block()\n","EMO=block()\nsys.path.insert(0,'/home/claude/bgm')\nfrom build_bgm import block as BGMB\n",1)
    a=".replace('@EMO@',EMO)"
    assert a in s
    s=s.replace(a,".replace('@EMO@',EMO+BGMB(key))",1)
    open(p,'w',encoding='utf-8').write(s)
print('build.py ok')
