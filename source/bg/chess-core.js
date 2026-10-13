/* ---------- หมากรุกสากล: กติกา + AI ---------- */
const Core=(function(){
  // ช่อง idx = r*8+c , r=0 คือแถว 8 (บนสุด) ; a8=0 , h1=63 ; ขาว=บวก ดำ=ลบ ; 1=P 2=N 3=B 4=R 5=Q 6=K
  const SQN=i=>'abcdefgh'[i&7]+(8-(i>>3));
  const KN=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  const KG=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const DI=[[-1,-1],[-1,1],[1,-1],[1,1]],OR=[[-1,0],[1,0],[0,-1],[0,1]];
  const PV=[0,100,320,330,500,900,0];
  function init(){
    const b=new Int8Array(64),back=[4,2,3,5,6,3,2,4];
    for(let c=0;c<8;c++){b[c]=-back[c];b[8+c]=-1;b[48+c]=1;b[56+c]=back[c];}
    return{b,t:'w',cas:15,ep:-1,hm:0,fm:1};
  }
  function attacked(b,sq,by){ // ช่อง sq ถูกฝั่ง by (1=ขาว,-1=ดำ) โจมตีไหม
    const r=sq>>3,c=sq&7,s=by;
    // เบี้ย
    const pr=r+(s===1?1:-1);
    if(pr>=0&&pr<8){if(c>0&&b[pr*8+c-1]===s)return true;if(c<7&&b[pr*8+c+1]===s)return true;}
    for(const[d,e]of KN){const rr=r+d,cc=c+e;if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===2*s)return true;}
    for(const[d,e]of KG){const rr=r+d,cc=c+e;if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===6*s)return true;}
    for(const[d,e]of DI){let rr=r+d,cc=c+e;while(rr>=0&&rr<8&&cc>=0&&cc<8){const p=b[rr*8+cc];if(p){if(p===3*s||p===5*s)return true;break;}rr+=d;cc+=e;}}
    for(const[d,e]of OR){let rr=r+d,cc=c+e;while(rr>=0&&rr<8&&cc>=0&&cc<8){const p=b[rr*8+cc];if(p){if(p===4*s||p===5*s)return true;break;}rr+=d;cc+=e;}}
    return false;
  }
  function kingSq(b,s){for(let i=0;i<64;i++)if(b[i]===6*s)return i;return -1;}
  function inCheck(s,side){const sg=(side||s.t)==='w'?1:-1;const k=kingSq(s.b,sg);return k>=0&&attacked(s.b,k,-sg);}
  function pseudo(s){
    const b=s.b,sg=s.t==='w'?1:-1,out=[];
    const add=(f,t,p)=>out.push({f,t,p:p||0});
    for(let i=0;i<64;i++){
      const pc=b[i];if(!pc||(pc>0?1:-1)!==sg)continue;
      const ty=Math.abs(pc),r=i>>3,c=i&7;
      if(ty===1){
        const fr=r-sg,start=sg===1?6:1,last=sg===1?1:6;
        if(fr>=0&&fr<8&&!b[fr*8+c]){
          if(r===last)for(let p=5;p>=2;p--)add(i,fr*8+c,p);else{add(i,fr*8+c);
            if(r===start&&!b[(r-2*sg)*8+c])add(i,(r-2*sg)*8+c);}
        }
        for(const dc of[-1,1]){const cc=c+dc;if(cc<0||cc>7||fr<0||fr>7)continue;const t=fr*8+cc,q=b[t];
          if(q&&(q>0?1:-1)!==sg){if(r===last)for(let p=5;p>=2;p--)add(i,t,p);else add(i,t);}
          else if(t===s.ep)add(i,t);}
      }else if(ty===2||ty===6){
        for(const[d,e]of(ty===2?KN:KG)){const rr=r+d,cc=c+e;if(rr<0||rr>7||cc<0||cc>7)continue;const t=rr*8+cc,q=b[t];
          if(!q||(q>0?1:-1)!==sg)add(i,t);}
        if(ty===6){
          const home=sg===1?60:4;
          if(i===home&&!attacked(b,i,-sg)){
            const ks=sg===1?1:4,qs=sg===1?2:8;
            if((s.cas&ks)&&!b[i+1]&&!b[i+2]&&b[i+3]===4*sg&&!attacked(b,i+1,-sg)&&!attacked(b,i+2,-sg))add(i,i+2);
            if((s.cas&qs)&&!b[i-1]&&!b[i-2]&&!b[i-3]&&b[i-4]===4*sg&&!attacked(b,i-1,-sg)&&!attacked(b,i-2,-sg))add(i,i-2);
          }
        }
      }else{
        const dirs=ty===3?DI:ty===4?OR:DI.concat(OR);
        for(const[d,e]of dirs){let rr=r+d,cc=c+e;while(rr>=0&&rr<8&&cc>=0&&cc<8){const t=rr*8+cc,q=b[t];
          if(!q)add(i,t);else{if((q>0?1:-1)!==sg)add(i,t);break;}rr+=d;cc+=e;}}
      }
    }
    return out;
  }
  function apply(s,m){
    const b=s.b.slice(),sg=s.t==='w'?1:-1,pc=b[m.f],ty=Math.abs(pc),cap=b[m.t];
    let cas=s.cas,ep=-1,hm=(ty===1||cap)?0:s.hm+1;
    b[m.f]=0;
    if(ty===1&&m.t===s.ep&&!cap){b[m.t+8*sg]=0;hm=0;}
    b[m.t]=m.p?m.p*sg:pc;
    if(ty===6){
      if(m.t-m.f===2){b[m.f+1]=b[m.f+3];b[m.f+3]=0;}
      else if(m.f-m.t===2){b[m.f-1]=b[m.f-4];b[m.f-4]=0;}
      cas&=sg===1?~3:~12;
    }
    if(ty===1&&Math.abs(m.t-m.f)===16)ep=(m.f+m.t)>>1;
    const drop=(sq,bit)=>{if(m.f===sq||m.t===sq)cas&=~bit;};
    drop(63,1);drop(56,2);drop(7,4);drop(0,8);
    return{b,t:s.t==='w'?'b':'w',cas,ep,hm,fm:s.fm+(s.t==='b'?1:0)};
  }
  function legal(s){
    const sg=s.t==='w'?1:-1,res=[];
    for(const m of pseudo(s)){
      const n=apply(s,m),k=kingSq(n.b,sg);
      if(!attacked(n.b,k,-sg))res.push(m);
    }
    return res;
  }
  const PL={2:'n',3:'b',4:'r',5:'q'};
  function mid(m){return SQN(m.f)+SQN(m.t)+(m.p?PL[m.p]:'');}
  function legalIds(s){const l=legal(s);l.forEach(m=>m.id=mid(m));return l;}
  function key(s){
    let k='';for(let i=0;i<64;i++)k+=String.fromCharCode(65+s.b[i]+6);
    // ep นับเมื่อมีเบี้ยฝั่งตรงข้ามจับได้จริง
    let ep=-1;if(s.ep>=0){const sg=s.t==='w'?1:-1,r=(s.ep>>3)+sg,c=s.ep&7;
      for(const dc of[-1,1]){const cc=c+dc;if(cc>=0&&cc<8&&r>=0&&r<8&&s.b[r*8+cc]===sg)ep=s.ep;}}
    return k+s.t+s.cas+ep;
  }
  function insufficient(b){
    const mins=[];let bw=0;
    for(let i=0;i<64;i++){const p=Math.abs(b[i]);if(!p||p===6)continue;if(p===1||p===4||p===5)return false;mins.push([p,((i>>3)+(i&7))&1,b[i]>0]);}
    if(mins.length<=1)return true;
    if(mins.every(x=>x[0]===3)){const col=mins[0][1];return mins.every(x=>x[1]===col);}
    return false;
  }
  function result(states){
    const s=states[states.length-1],l=legal(s);
    if(!l.length){return inCheck(s)?{w:s.t==='w'?'b':'w',why:'รุกฆาต'}:{w:null,why:'เสมอ (ไม่มีทางเดิน)'};}
    if(insufficient(s.b))return{w:null,why:'เสมอ (กำลังไม่พอรุกฆาต)'};
    if(s.hm>=100)return{w:null,why:'เสมอ (50 ตาไม่มีการกินหรือเดินเบี้ย)'};
    const k=key(s);let n=0;for(const x of states)if(key(x)===k)n++;
    if(n>=3)return{w:null,why:'เสมอ (ซ้ำตำแหน่ง 3 ครั้ง)'};
    return null;
  }
  /* ---------- AI ---------- */
  const PST={
    1:[0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    2:[-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    3:[-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    4:[0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    5:[-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    6:[-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]
  };
  function evalS(s){ // คะแนนจากมุมมองฝั่งที่จะเดิน
    let v=0;
    for(let i=0;i<64;i++){const p=s.b[i];if(!p)continue;const ty=Math.abs(p);
      if(p>0)v+=PV[ty]+PST[ty][i];else v-=PV[ty]+PST[ty][(7-(i>>3))*8+(i&7)];}
    return s.t==='w'?v:-v;
  }
  let nodes=0,deadline=0,stop=false;
  function score(s,m){const t=s.b[m.t];let v=0;if(t)v+=10*PV[Math.abs(t)]-PV[Math.abs(s.b[m.f])]/10+1000;if(m.p)v+=PV[m.p]+900;return v;}
  function order(s,l){return l.map(m=>[score(s,m),m]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);}
  function qs(s,a,b,d){
    if((++nodes&1023)===0&&Date.now()>deadline)stop=true;
    const st=evalS(s);if(stop||d>=6)return st;
    if(st>=b)return st;if(st>a)a=st;
    const caps=order(s,legal(s).filter(m=>s.b[m.t]||m.p||(Math.abs(s.b[m.f])===1&&m.t===s.ep)));
    for(const m of caps){const v=-qs(apply(s,m),-b,-a,d+1);if(stop)return a;if(v>=b)return v;if(v>a)a=v;}
    return a;
  }
  function nega(s,d,a,b,ply){
    if((++nodes&1023)===0&&Date.now()>deadline)stop=true;
    if(stop)return 0;
    if(s.hm>=100)return 0;
    const l=legal(s);
    if(!l.length)return inCheck(s)?-30000+ply:0;
    if(d<=0)return qs(s,a,b,0);
    for(const m of order(s,l)){const v=-nega(apply(s,m),d-1,-b,-a,ply+1);if(stop)return 0;if(v>=b)return v;if(v>a)a=v;}
    return a;
  }
  function ai(states,level,ms){
    const s=states[states.length-1],l=legal(s);l.forEach(m=>m.id=mid(m));
    if(l.length<=1)return l[0];
    const maxD=level==='easy'?1:level==='medium'?3:6;
    deadline=Date.now()+(level==='easy'?200:level==='medium'?(ms||500):(ms||1200));stop=false;nodes=0;
    const seenKeys=new Map();states.forEach(x=>{const k=key(x);seenKeys.set(k,(seenKeys.get(k)||0)+1);});
    let best=l[0],ord=order(s,l);
    for(let d=1;d<=maxD;d++){
      let bm=null,bv=-Infinity,a=-Infinity;
      for(const m of ord){
        let v=-nega(apply(s,m),d-1,-Infinity,-a,1);
        if(stop)break;
        if(level==='easy')v+=Math.random()*120;
        else if((seenKeys.get(key(apply(s,m)))||0)>=2)v-=60; // เลี่ยงซ้ำตำแหน่งเมื่อได้เปรียบ
        if(v>bv){bv=v;bm=m;}
        if(v>a)a=v;
      }
      if(stop)break;
      best=bm;ord=[bm].concat(ord.filter(x=>x!==bm));
      if(bv>29000)break;
    }
    return best;
  }
  function fromId(s,id){return legalIds(s).find(m=>m.id===id)||null;}
  return{init,legal:legalIds,apply,result,ai,key,inCheck,fromId,SQN,PV,attacked,kingSq,name:'chess'};
})();
if(typeof module!=='undefined')module.exports=Core;
