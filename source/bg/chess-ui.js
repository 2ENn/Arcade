/* ---------- หน้าตาหมากรุก ---------- */
const UI=(function(){
  const GL={1:'♟',2:'♞',3:'♝',4:'♜',5:'♛',6:'♚'};
  const glyph=p=>GL[Math.abs(p)]+'︎';
  let cells=[],sel=-1,flipped=null,boardEl=null;
  function mount(el){
    boardEl=el;el.innerHTML='';cells=[];flipped=null;sel=-1;
    for(let i=0;i<64;i++){const d=document.createElement('div');d.className='sq'+(((i>>3)+(i&7))%2?' d':'');d.dataset.i=i;
      d.innerHTML='<span class="pc"></span>';cells.push(d);}
  }
  function order(flip){
    boardEl.innerHTML='';
    for(let k=0;k<64;k++){const i=flip?63-k:k;boardEl.appendChild(cells[i]);}
    cells.forEach((d,i)=>{const r=i>>3,c=i&7;
      d.querySelectorAll('.co').forEach(x=>x.remove());
      const lastCol=flip?(c===0):(c===7),firstCol=flip?(c===7):(c===0),bottomRow=flip?(r===0):(r===7);
      if(firstCol)d.insertAdjacentHTML('beforeend','<span class="co r">'+(8-r)+'</span>');
      if(bottomRow)d.insertAdjacentHTML('beforeend','<span class="co f">'+'abcdefgh'[c]+'</span>');});
  }
  let V=null;
  function targets(){return V&&sel>=0?V.legal.filter(m=>m.f===sel):[];}
  function draw(v){
    V=v;
    if(flipped!==v.flip){flipped=v.flip;order(v.flip);}
    const s=v.s,tg=targets(),tgSet=new Map();tg.forEach(m=>tgSet.set(m.t,m));
    const king=s.t==='w'?1:-1,kq=Core.kingSq(s.b,king),chk=Core.inCheck(s);
    for(let i=0;i<64;i++){
      const d=cells[i],p=s.b[i],pc=d.firstChild;
      const txt=p?glyph(p):'',cls='pc '+(p>0?'w':p<0?'b':'');
      if(pc.textContent!==txt)pc.textContent=txt;if(pc.className!==cls)pc.className=cls;
      const own=p&&((p>0)===(s.t==='w'));
      d.classList.toggle('last',v.last.indexOf(i)>=0);
      d.classList.toggle('sel',i===sel);
      d.classList.toggle('chk',chk&&i===kq);
      d.classList.toggle('mv',tgSet.has(i)&&!p&&!(Math.abs(s.b[sel])===1&&i===s.ep));
      d.classList.toggle('cp',tgSet.has(i)&&(!!p||(sel>=0&&Math.abs(s.b[sel])===1&&i===s.ep)));
    }
  }
  function tap(i,ctx){
    if(!ctx.canTap()){return;}
    const s=ctx.s(),p=s.b[i],mine=p&&((p>0)===(s.t==='w'));
    if(sel>=0){
      const ms=ctx.legal().filter(m=>m.f===sel&&m.t===i);
      if(ms.length){
        if(ms[0].p){
          const col=s.t==='w'?'w':'b';
          ctx.modal('<h2>เลื่อนขั้นเป็น?</h2><div class="promo">'+[5,4,3,2].map(q=>'<button data-p="'+q+'" class="pc '+col+'">'+glyph(q)+'</button>').join('')+'</div>');
          document.querySelectorAll('.promo button').forEach(b=>b.onclick=()=>{ctx.closeModal();ctx.commit(ms.find(m=>m.p===+b.dataset.p));});
          return;
        }
        ctx.commit(ms[0]);return;
      }
    }
    if(mine&&ctx.legal().some(m=>m.f===i)){sel=sel===i?-1:i;}else sel=-1;
    ctx.redraw();
  }
  function reset(){sel=-1;}
  function lastSqs(m){return[m.f,m.t];}
  function cap(s){
    const init={1:8,2:2,3:2,4:2,5:1},have={w:{1:0,2:0,3:0,4:0,5:0},b:{1:0,2:0,3:0,4:0,5:0}};
    for(let i=0;i<64;i++){const p=s.b[i];if(p&&Math.abs(p)!==6)have[p>0?'w':'b'][Math.abs(p)]++;}
    const lost=c=>{let g='',v=0;[5,4,3,2,1].forEach(t=>{const n=Math.max(0,init[t]-have[c][t]);for(let k=0;k<n;k++)g+=glyph(t);v+=n*Core.PV[t];});return[g,v];};
    const[gb,vb]=lost('b'),[gw,vw]=lost('w'); // gb = หมากดำที่ถูกกิน = ขาวกินได้
    const d=vb-vw;
    return{w:'<span style="letter-spacing:-2px">'+gb+'</span>'+(d>0?' +'+d/100:''),b:'<span style="letter-spacing:-2px">'+gw+'</span>'+(d<0?' +'+(-d)/100:'')};
  }
  function statusExtra(s){return Core.inCheck(s)?'รุก!':'';}
  const icon='<svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#8a5a2b"/><g fill="#f0d9b5"><rect x="0" y="0" width="16" height="16"/><rect x="32" y="0" width="16" height="16"/><rect x="16" y="16" width="16" height="16"/><rect x="48" y="16" width="16" height="16"/><rect x="0" y="32" width="16" height="16"/><rect x="32" y="32" width="16" height="16"/><rect x="16" y="48" width="16" height="16"/><rect x="48" y="48" width="16" height="16"/></g><text x="32" y="48" font-size="46" text-anchor="middle" fill="#201408" stroke="#f7ecd5" stroke-width="1.2">♞︎</text></svg>';
  return{key:'chess',name:'หมากรุก',sub:'หมากรุกสากล เล่นกับ AI เพื่อน หรือออนไลน์',icon,
    rule:'กติกาสากลครบ: เข้าป้อม จับเบี้ยผ่าน เลื่อนขั้น เสมอเมื่อซ้ำ 3 ครั้ง / 50 ตา / กำลังไม่พอ',
    mins:[3,5,10,15],mount,draw,tap,reset,lastSqs,cap,statusExtra};
})();
