const C=require('./checkers-core.js');let bad=0;const T=(n,c)=>{if(!c){bad++;console.log('BAD',n);}else console.log('ok',n);};
let s=C.init();T('start 7 moves?',C.legal(s).length>0);console.log(C.legal(s).map(m=>m.id).join(' '));
const mk=(rows,t='w')=>{const b=new Int8Array(64);for(const[sq,p]of rows)b[sq]=p;return{b,t,hm:0};};
const sq=n=>(8-n[1])*8+'abcdefgh'.indexOf(n[0]);
// ตัวธรรมดากินไปข้างหลังไม่ได้
let t=mk([[sq('d4'),1],[sq('c3'),-1]]);T('man no backward capture',C.legal(t).every(m=>!m.caps.length));
t=mk([[sq('d4'),1],[sq('c5'),-1]]);T('man forward capture',C.legal(t).length===1&&C.legal(t)[0].id==='d4-b6');
// บังคับกิน
t=mk([[sq('d4'),1],[sq('c5'),-1],[sq('h2'),1]]);T('forced capture',C.legal(t).every(m=>m.caps.length));
// ฮอสบิน
t=mk([[sq('a1'),2],[sq('d4'),-1]]);let l=C.legal(t);T('king flying capture lands e5..h8',l.length===4&&l.every(m=>m.caps.length===1));
// ฮอสกินต่อ: ต้องเลือกช่องที่กินต่อได้
t=mk([[sq('a1'),2],[sq('c3'),-1],[sq('f6'),-1],[sq('g3'),-1]]);l=C.legal(t);console.log(l.map(m=>m.id));
// เลื่อนขั้น
t=mk([[sq('b7'),1]]);l=C.legal(t);T('promo moves',l.length===2);let n=C.apply(t,l.find(m=>m.id==='b7-a8'));T('promoted king',n.b[sq('a8')]===2);
// กินหลายตัว
t=mk([[sq('a1'),1],[sq('b2'),-1],[sq('d4'),-1],[sq('f6'),-1]]);l=C.legal(t);T('multi jump',l.length===1&&l[0].caps.length===3);console.log(l[0].id);
// เกมสุ่มจนจบ
for(let g=0;g<200;g++){let s=C.init(),st=[s],i=0,r;while(!(r=C.result(st))&&i<400){const l=C.legal(s);s=C.apply(s,l[Math.random()*l.length|0]);st.push(s);i++;}if(!r){bad++;console.log('no end');}}
// AI vs random
let wins=0;for(let g=0;g<6;g++){let s=C.init(),st=[s],i=0,r;while(!(r=C.result(st))&&i<300){const l=C.legal(s);let m;if(s.t==='w')m=C.ai(st,'medium',100);else m=l[Math.random()*l.length|0];s=C.apply(s,m);st.push(s);i++;}if(r&&r.w==='w')wins++;console.log('game',g,r&&r.w,i);}
T('AI beats random >=5/6',wins>=5);console.log('bad',bad);
