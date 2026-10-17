/* ---------- หน้าตาหมากฮอส ---------- */
const UI=(function(){
  let cells=[],part=[],flipped=null,boardEl=null,V=null;
  function mount(el){
    boardEl=el;el.innerHTML='';cells=[];flipped=null;part=[];
    for(let i=0;i<64;i++){const d=document.createElement('div');d.className='sq'+(((i>>3)+(i&7))%2?' d':'');d.dataset.i=i;d.innerHTML='<span class="pc"></span>';cells.push(d);}
  }
  function order(flip){
    boardEl.innerHTML='';
    for(let k=0;k<64;k++){const i=flip?63-k:k;boardEl.appendChild(cells[i]);}
    cells.forEach((d,i)=>{const r=i>>3,c=i&7;d.querySelectorAll('.co').forEach(x=>x.remove());
      const firstCol=flip?(c===7):(c===0),bottomRow=flip?(r===0):(r===7);
      if(firstCol)d.insertAdjacentHTML('beforeend','<span class="co r">'+(8-r)+'</span>');
      if(bottomRow)d.insertAdjacentHTML('beforeend','<span class="co f">'+'abcdefgh'[c]+'</span>');});
  }
  const pref=(m,pt)=>pt.every((x,k)=>m.path[k]===x);
  function draw(v){
    V=v;if(flipped!==v.flip){flipped=v.flip;order(v.flip);}
    const s=v.s,ms=v.legal.filter(m=>!part.length||pref(m,part));
    const next=new Set(),movable=new Set();
    v.legal.forEach(m=>movable.add(m.path[0]));
    if(part.length)ms.forEach(m=>{if(m.path.length>part.length)next.add(m.path[part.length]);});
    const capNext=new Set();
    if(part.length)ms.forEach(m=>{if(m.path.length>part.length&&m.caps.length)capNext.add(m.path[part.length]);});
    /* กินหลายตัว: ทำทีละกระโดดจริงบนกระดาน ผู้เล่นกดช่องถัดไปเอง */
    const tk=new Set(),pb=s.b.slice();
    if(part.length){
      const m0=ms[0];
      if(m0&&part.length>1){pb[part[part.length-1]]=pb[part[0]];pb[part[0]]=0;for(let k=0;k<part.length-1;k++)pb[m0.caps[k]]=0;}
      ms.forEach(m=>{if(m.caps.length>=part.length&&m.caps[part.length-1]!=null)tk.add(m.caps[part.length-1]);});
    }
    for(let i=0;i<64;i++){
      const d=cells[i],p=pb[i],pc=d.firstChild;
      const cls='pc '+(p?(Math.abs(p)===2?'k ':'m ')+(p>0?'w':'b'):'');
      if(pc.className!==cls){pc.className=cls;pc.textContent=Math.abs(p)===2?'♛︎':'';}
      d.classList.toggle('last',v.last.indexOf(i)>=0);
      d.classList.toggle('sel',part.indexOf(i)>=0);
      d.classList.toggle('mv',next.has(i)&&!capNext.has(i));
      d.classList.toggle('cp',capNext.has(i));
      d.classList.toggle('tk',tk.has(i));
      d.classList.toggle('can',v.canTap&&!part.length&&movable.has(i));
    }
  }
  function tap(i,ctx){
    if(!ctx.canTap())return;
    const L=ctx.legal();
    if(part.length){
      const np=part.concat(i);
      const ms=L.filter(m=>pref(m,part)&&m.path.length>part.length&&m.path[part.length]===i);
      if(ms.length){
        const full=ms.find(m=>m.path.length===np.length);
        if(full){part=[];ctx.commit(full);return;}
        part=np;ctx.redraw();return;
      }
    }
    if(part.length>1&&i===part[part.length-1]){part=part.slice(0,-1);ctx.redraw();return;} // กดช่องล่าสุดซ้ำ = ถอยหนึ่งกระโดด
    part=L.some(m=>m.path[0]===i)?[i]:[];
    ctx.redraw();
  }
  function reset(){part=[];}
  function lastSqs(m){return[m.path[0],m.path[m.path.length-1]];}
  function cap(s){let w=0,b=0,wk=0,bk=0;for(let i=0;i<64;i++){const p=s.b[i];if(p>0){w++;if(p===2)wk++;}else if(p<0){b++;if(p===-2)bk++;}}
    return{w:'เหลือ '+w+(wk?' (ฮอส '+wk+')':''),b:'เหลือ '+b+(bk?' (ฮอส '+bk+')':'')};}
  function statusExtra(s){if(part.length>1)return 'กดช่องถัดไปเพื่อกินต่อ';const l=Core.legal(s);return l.some(m=>m.caps.length)?(s.f===0?'กินได้ (ไม่บังคับ)':'ต้องกิน'):'';}
  const icon='<svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#2f6b57"/><g fill="#e8d9b5"><rect x="0" y="0" width="16" height="16"/><rect x="32" y="0" width="16" height="16"/><rect x="16" y="16" width="16" height="16"/><rect x="48" y="16" width="16" height="16"/><rect x="0" y="32" width="16" height="16"/><rect x="32" y="32" width="16" height="16"/><rect x="16" y="48" width="16" height="16"/><rect x="48" y="48" width="16" height="16"/></g><circle cx="24" cy="24" r="10" fill="#2b1f1c" stroke="#6b5550" stroke-width="2"/><circle cx="40" cy="40" r="10" fill="#f6efe0" stroke="#bda97c" stroke-width="2"/></svg>';
  return{key:'checkers',name:'หมากฮอส',sub:'หมากฮอสไทย เล่นกับ AI เพื่อน หรือออนไลน์',icon,
    rule:'ตัวธรรมดาเดิน/กินเฉียงไปข้างหน้า · ถึงแถวสุดท้ายเป็นฮอส เดิน/กินเฉียงได้ทุกทิศไกลกี่ช่องก็ได้ · บังคับกิน',
    mins:[3,5,10,15],mount,draw,tap,reset,lastSqs,cap,statusExtra};
})();
