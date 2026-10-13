const C=require('./chess-core.js');
function fen(f){const[p,t,c,e]=f.split(' ');const b=new Int8Array(64);let i=0;const M={p:1,n:2,b:3,r:4,q:5,k:6};
 for(const ch of p){if(ch==='/')continue;if(/\d/.test(ch)){i+=+ch;continue;}const lo=ch.toLowerCase();b[i++]=(ch===lo?-1:1)*M[lo];}
 return{b,t,cas:0,ep:-1,hm:0,fm:1};}
for(const lv of['medium','hard']){
 let s=fen('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - -');console.log(lv,'mate-in-1 (a1a8):',C.ai([s],lv,500).id);
 s=fen('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq -'); // ... ขาวโดนรุกฆาต? ไม่ใช่ ทดสอบแค่ว่ารันได้
 s=fen('4k3/8/8/3q4/8/8/4R3/4K3 w - -');console.log(lv,'hanging queen Rxd?:',C.ai([s],lv,500).id,'(ควรเลี่ยงเสียเรือ)');
}
// เกมเต็ม hard vs medium สั้นๆ
let s=C.init(),st=[s],r,i=0;while(!(r=C.result(st))&&i<160){const m=C.ai(st,s.t==='w'?'hard':'medium',150);s=C.apply(s,m);st.push(s);i++;}
console.log('hard(w) vs medium(b):',r?r.w+' '+r.why:'ยังไม่จบ',i,'plies');
