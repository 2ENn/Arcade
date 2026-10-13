const C=require('./chess-core.js');
function fen(f){const[p,t,c,e]=f.split(' ');const b=new Int8Array(64);let i=0;const M={p:1,n:2,b:3,r:4,q:5,k:6};
 for(const ch of p){if(ch==='/')continue;if(/\d/.test(ch)){i+=+ch;continue;}const lo=ch.toLowerCase();b[i++]=(ch===lo?-1:1)*M[lo];}
 let cas=0;if(c.includes('K'))cas|=1;if(c.includes('Q'))cas|=2;if(c.includes('k'))cas|=4;if(c.includes('q'))cas|=8;
 let ep=-1;if(e!=='-')ep=(8-+e[1])*8+'abcdefgh'.indexOf(e[0]);
 return{b,t,cas,ep,hm:0,fm:1};}
function perft(s,d){if(!d)return 1;let n=0;for(const m of C.legal(s))n+=perft(C.apply(s,m),d-1);return n;}
const T=[['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -',[20,400,8902,197281]],
['r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -',[48,2039,97862]],
['8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -',[14,191,2812,43238]],
['r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq -',[6,264,9467]]];
let bad=0;for(const[f,exp]of T){const s=fen(f);exp.forEach((e,i)=>{const t=Date.now(),n=perft(s,i+1);const ok=n===e;if(!ok)bad++;console.log(ok?'ok ':'BAD',f.slice(0,20),'d'+(i+1),n,e,Date.now()-t+'ms');});}
console.log('bad',bad);
