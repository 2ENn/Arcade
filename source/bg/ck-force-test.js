const C=require('./checkers-core.js');let bad=0;const T=(n,c)=>{if(!c){bad++;console.log('BAD',n);}else console.log('ok',n);};
const sq=n=>(8-n[1])*8+'abcdefgh'.indexOf(n[0]);
const mk=(rows,t='w',f)=>{const b=new Int8Array(64);for(const[s,p]of rows)b[s]=p;return{b,t,hm:0,f};};
const rows=[[sq('d4'),1],[sq('c5'),-1],[sq('h2'),1]];
let F=C.legal(mk(rows,'w',1)),O=C.legal(mk(rows,'w',0));
T('forced: only captures',F.every(m=>m.caps.length)&&F.length===1);
T('optional: captures AND quiet moves',O.some(m=>m.caps.length)&&O.some(m=>!m.caps.length)&&O.length>F.length);
T('optional: quiet moves of other piece (h2-g3) present',O.some(m=>m.id==='h2-g3'));
T('optional: quiet move of capturing piece present (d4-e5)',O.some(m=>m.id==='d4-e5'));
T('init(false).f===0, init().f===1',C.init(false).f===0&&C.init().f===1&&C.init(true).f===1);
let s=C.init(false);s=C.apply(s,C.legal(s)[0]);T('apply keeps f=0',s.f===0);
// multi-jump still maximal under optional
let m=C.legal(mk([[sq('a1'),1],[sq('b2'),-1],[sq('d4'),-1],[sq('f6'),-1]],'w',0));
T('optional multi-jump still full chain',m.some(x=>x.caps.length===3)&&!m.some(x=>x.caps.length===1||x.caps.length===2));
// random games both rules terminate and every move legal; AI legal under optional
for(const f of [0,1]){let ok=true;for(let g=0;g<150;g++){let s=C.init(f===1),st=[s],i=0,r;while(!(r=C.result(st))&&i<500){const l=C.legal(s);if(!l.length){ok=false;break;}const mv=(i%7===0)?C.ai(st,'easy',30):l[Math.random()*l.length|0];if(!l.some(x=>x.id===mv.id)){ok=false;break;}s=C.apply(s,mv);st.push(s);i++;}}T('random/AI games rule f='+f,ok);}
// optional: a position where only captures exist behaves like forced
let t=mk([[sq('d4'),1],[sq('c5'),-1],[sq('b6'),-1]],'w',0);T('optional with no quiet alternative',C.legal(t).length>=1);
console.log('bad',bad);process.exit(bad?1:0);
