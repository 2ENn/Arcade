/* ---------- หมากฮอส (Thai draughts): กติกา + AI ----------
   กระดาน 8x8 เดินบนช่องเข้ม  ฝ่ายละ 8 ตัว (2 แถวหน้า)  ขาวเดินก่อน ขึ้นด้านบน
   ตัวธรรมดา: เดินเฉียงหน้า 1 ช่อง กินเฉียงหน้าเท่านั้น
   ฮอส (ตัวที่ถึงแถวสุดท้าย): เดิน/กินเฉียงได้ทุกทิศ ไกลกี่ช่องก็ได้
   บังคับกิน (เลือกสายไหนก็ได้) กินต่อเนื่องจนจบสาย ถ้าตัวธรรมดาขึ้นฮอสระหว่างกิน เทิร์นจบทันที */
const Core=(function(){
  const SQN=i=>'abcdefgh'[i&7]+(8-(i>>3));
  const DIRS=[[-1,-1],[-1,1],[1,-1],[1,1]];
  function init(force){
    const b=new Int8Array(64);
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){if((r+c)%2!==1)continue;
      if(r<2)b[r*8+c]=-1;else if(r>5)b[r*8+c]=1;}
    return{b,t:'w',hm:0,f:(force===false||force===0)?0:1}; // f: 1=บังคับกิน 0=ไม่บังคับ (ผู้เล่นเลือกก่อนเริ่ม)
  }
  const own=(p,sg)=>p!==0&&(p>0?1:-1)===sg;
  function jumpsFrom(b,sq,sg,isKing,capd,path,caps,out){
    const r0=sq>>3,c0=sq&7;let any=false;
    for(const[dr,dc]of DIRS){
      if(!isKing&&dr!==-sg)continue; // ตัวธรรมดากินเฉพาะเดินหน้า
      let r=r0+dr,c=c0+dc;
      if(isKing){while(r>=0&&r<8&&c>=0&&c<8&&b[r*8+c]===0){r+=dr;c+=dc;}}
      if(r<0||r>7||c<0||c>7)continue;
      const vi=r*8+c,v=b[vi];
      if(!v||own(v,sg)||capd.has(vi))continue;
      // ช่องที่ลงได้
      const lands=[];let lr=r+dr,lc=c+dc;
      while(lr>=0&&lr<8&&lc>=0&&lc<8&&b[lr*8+lc]===0){lands.push(lr*8+lc);if(!isKing)break;lr+=dr;lc+=dc;}
      // หมายเหตุ: ช่องเริ่มต้นของตัวที่กำลังเดินถือว่าว่างแล้ว (ถูกเอาออกจากกระดานก่อนเรียก)
      if(!lands.length)continue;
      any=true;
      const capd2=new Set(capd);capd2.add(vi);
      const cand=[];
      for(const l of lands){
        const promo=!isKing&&((sg===1&&(l>>3)===0)||(sg===-1&&(l>>3)===7));
        if(promo){cand.push({l,more:false,promo:true});continue;}
        const sub=[];
        jumpsFrom(b,l,sg,isKing,capd2,path.concat(l),caps.concat(vi),sub);
        cand.push({l,more:sub.length>0,sub});
      }
      const anyMore=cand.some(x=>x.more);
      for(const x of cand){
        if(anyMore){if(x.more)for(const m of x.sub)out.push(m);}
        else out.push({path:path.concat(x.l),caps:caps.concat(vi)});
      }
    }
    return any;
  }
  function legal(s){
    const sg=s.t==='w'?1:-1,b=s.b,caps=[],steps=[],forced=s.f!==0;
    for(let i=0;i<64;i++){
      const p=b[i];if(!own(p,sg))continue;
      const king=Math.abs(p)===2;
      b[i]=0; // เอาตัวที่เดินออกชั่วคราว (ให้ลงช่องเดิมผ่านได้)
      const out=[];jumpsFrom(b,i,sg,king,new Set(),[i],[],out);
      b[i]=p;
      for(const m of out)caps.push(m);
      if(forced&&caps.length)continue;
      const r=i>>3,c=i&7;
      for(const[dr,dc]of DIRS){
        if(!king&&dr!==-sg)continue;
        let rr=r+dr,cc=c+dc;
        while(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===0){steps.push({path:[i,rr*8+cc],caps:[]});if(!king)break;rr+=dr;cc+=dc;}
      }
    }
    const res=forced?(caps.length?caps:steps):caps.concat(steps);
    res.forEach(m=>m.id=m.path.map(SQN).join('-'));
    return res;
  }
  function apply(s,m){
    const b=s.b.slice(),sg=s.t==='w'?1:-1,from=m.path[0],to=m.path[m.path.length-1];
    let p=b[from];const wasMan=Math.abs(p)===1;
    b[from]=0;for(const c of m.caps)b[c]=0;
    if(wasMan&&((sg===1&&(to>>3)===0)||(sg===-1&&(to>>3)===7)))p=2*sg;
    b[to]=p;
    return{b,t:s.t==='w'?'b':'w',hm:(m.caps.length||wasMan)?0:s.hm+1,f:s.f};
  }
  function key(s){let k='';for(let i=0;i<64;i++)k+=String.fromCharCode(66+s.b[i]);return k+s.t;}
  function result(states){
    const s=states[states.length-1],l=legal(s);
    if(!l.length)return{w:s.t==='w'?'b':'w',why:'ไม่เหลือทางเดิน'};
    if(s.hm>=60)return{w:null,why:'เสมอ (30 ตาไม่มีการกินหรือเดินตัวธรรมดา)'};
    const k=key(s);let n=0;for(const x of states)if(key(x)===k)n++;
    if(n>=3)return{w:null,why:'เสมอ (ซ้ำตำแหน่ง 3 ครั้ง)'};
    return null;
  }
  /* ---------- AI ---------- */
  function evalS(s){
    let v=0;
    for(let i=0;i<64;i++){const p=s.b[i];if(!p)continue;const r=i>>3,c=i&7,a=Math.abs(p);
      let x=a===2?330:100;
      if(a===1)x+=(p>0?(7-r):r)*4; else x+=(c===0||c===7?-6:0);
      if(a===1&&(p>0?r===7:r===0))x+=6; // เก็บแถวหลังไว้
      v+=p>0?x:-x;}
    return s.t==='w'?v:-v;
  }
  let nodes=0,deadline=0,stop=false;
  function nega(s,d,a,b,ply){
    if((++nodes&511)===0&&Date.now()>deadline)stop=true;
    if(stop)return 0;
    const l=legal(s);
    if(!l.length)return -30000+ply;
    if(d<=0&&!(l[0].caps.length&&d>-4))return evalS(s);
    if(s.hm>=60)return 0;
    l.sort((x,y)=>y.caps.length-x.caps.length);
    for(const m of l){const v=-nega(apply(s,m),d-1,-b,-a,ply+1);if(stop)return 0;if(v>=b)return v;if(v>a)a=v;}
    return a;
  }
  function ai(states,level,ms){
    const s=states[states.length-1],l=legal(s);
    if(l.length<=1)return l[0];
    const maxD=level==='easy'?2:level==='medium'?5:14;
    deadline=Date.now()+(level==='easy'?200:level==='medium'?(ms||500):(ms||1200));stop=false;nodes=0;
    const seen=new Map();states.forEach(x=>{const k=key(x);seen.set(k,(seen.get(k)||0)+1);});
    let best=l[0],ord=l.slice().sort((x,y)=>y.caps.length-x.caps.length);
    for(let d=1;d<=maxD;d++){
      let bm=null,bv=-Infinity,a=-Infinity;
      for(const m of ord){
        const n=apply(s,m);
        let v=-nega(n,d-1,-Infinity,-a,1);
        if(stop)break;
        if(level==='easy')v+=Math.random()*90;
        else if((seen.get(key(n))||0)>=2)v-=40;
        if(v>bv){bv=v;bm=m;}if(v>a)a=v;
      }
      if(stop)break;
      best=bm;ord=[bm].concat(ord.filter(x=>x!==bm));
      if(Math.abs(bv)>29000)break;
    }
    return best;
  }
  function fromId(s,id){return legal(s).find(m=>m.id===id)||null;}
  return{init,legal,apply,result,ai,key,fromId,SQN,name:'checkers'};
})();
if(typeof module!=='undefined')module.exports=Core;
