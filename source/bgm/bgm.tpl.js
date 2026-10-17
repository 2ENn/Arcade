<script>
/* ===== BGM: เพลงพื้นหลังสังเคราะห์ด้วย WebAudio + แผงตั้งค่า (ไม่ใช้ไฟล์เสียง) =====
   BGM.init({game, inGame:()=>bool, menuBtn:'css selector ของปุ่มเมนูในเกม'})
   - กดปุ่มเมนูในเกม → เปิดแผงเมนู (ตั้งค่าเสียง + เล่นต่อ + กลับเมนูหลัก) แทนการออกทันที
   - เพลงเล่นเฉพาะตอน inGame() เป็นจริง (หน้าเมนู/ล็อบบี้เงียบ)
   - ตั้งค่า (ระดับเสียง/เปิด-ปิด) เก็บใน localStorage 'bgm.v1' ใช้ร่วมกันทุกเกม */
(function () {
  'use strict';
  var KEY = 'bgm.v1';
  var st = { v: 0.5, m: false, fs: true }; /* fs: เข้าเกมแล้วขยายเต็มหน้าจออัตโนมัติ (ปิดได้ในเมนู) */
  try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j) { if (typeof j.v === 'number') st.v = Math.min(1, Math.max(0, j.v)); st.m = !!j.m; if (typeof j.fs === 'boolean') st.fs = j.fs; } } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  /* ---------- แต่งเพลง (กำหนดแน่นอนจาก seed จึงวนซ้ำเหมือนเดิมทุกครั้ง) ---------- */
  var PROGS = {
    A: [[0, 0], [9, 1], [5, 0], [7, 0], [0, 0], [9, 1], [5, 0], [7, 0]],
    B: [[0, 0], [7, 0], [9, 1], [4, 1], [5, 0], [0, 0], [5, 0], [7, 0]],
    C: [[0, 0], [5, 0], [0, 0], [7, 0], [9, 1], [5, 0], [2, 1], [7, 0]]
  };
  var TPL = ['x.xxx.x.', 'x..xx.xx', 'xx.xx.x.', 'x.x.xxx.', 'xxx.x..x', 'x..x..x.', 'x.xx.xx.', 'xx..xx.x'];
  var TRACKS = {
    amath:    { bpm: 108, key: 0,  seed: 11, prog: 'A', swing: 0.14 },
    sudoku:   { bpm: 96,  key: 7,  seed: 23, prog: 'B', swing: 0.10 },
    game24:   { bpm: 120, key: 2,  seed: 37, prog: 'C', swing: 0.16 },
    chess:    { bpm: 100, key: 5,  seed: 41, prog: 'B', swing: 0.08 },
    checkers: { bpm: 112, key: 10, seed: 53, prog: 'A', swing: 0.14 }
  };
  var PENTA = [0, 2, 4, 7, 9];
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function compose(T) {
    var rnd = mulberry(T.seed), prog = PROGS[T.prog], ladder = [], i, o;
    for (o = 0; o < 3; o++) for (i = 0; i < 5; i++) ladder.push(T.key + 60 + o * 12 + PENTA[i]);
    var pick = []; var pool = TPL.slice();
    while (pick.length < 6) pick.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    var bars = [], idx = 7, ph, b;
    for (ph = 0; ph < 2; ph++) for (b = 0; b < 8; b++) {
      var ch = prog[b], root = (T.key + ch[0]) % 12, tones = [root, (root + (ch[1] ? 3 : 4)) % 12, (root + 7) % 12];
      var order = ph === 0 ? [0, 1, 0, 2] : [3, 1, 3, 4], tpl = pick[order[b % 4]];
      var lead = [], s;
      for (s = 0; s < 8; s++) {
        if (tpl.charAt(s) !== 'x') continue;
        var strong = s === 0 || s === 4, ni = idx;
        if (strong) {
          var best = -1, bd = 99;
          for (i = 3; i <= 12; i++) { if (tones.indexOf(ladder[i] % 12) < 0) continue; var d = Math.abs(i - idx) + rnd() * 0.6; if (d < bd) { bd = d; best = i; } }
          if (best >= 0) ni = best;
        } else {
          var step = [-2, -1, -1, 1, 1, 2][Math.floor(rnd() * 6)]; ni = Math.min(12, Math.max(3, idx + step));
        }
        idx = ni; lead.push({ s: s, n: ladder[ni] + (ph === 1 && b >= 4 ? 12 : 0) });
      }
      for (i = 0; i < lead.length; i++) { var nx = i + 1 < lead.length ? lead[i + 1].s : 8; lead[i].len = Math.min(3, nx - lead[i].s); }
      bars.push({ root: T.key + ch[0], minor: ch[1], lead: lead });
    }
    return bars;
  }

  /* ---------- เครื่องดนตรีสังเคราะห์ ---------- */
  var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  var noiseBuf = null;
  function mkNoise(c) { var n = c.sampleRate, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function env(c, g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur); }
  function osc(c, type, f, t, t2, dest) { var o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(dest); o.start(t); o.stop(t + t2); return o; }
  function marimba(c, out, t, m, dur, v) {
    var f = mtof(m), g = c.createGain(), g2 = c.createGain(), L = Math.max(0.28, dur * 1.3);
    env(c, g, t, 0.004, v, L); g.connect(out); osc(c, 'sine', f, t, L + 0.05, g);
    env(c, g2, t, 0.002, v * 0.35, 0.09); g2.connect(out); osc(c, 'sine', f * 4, t, 0.15, g2);
  }
  function pluck(c, out, t, m, v) {
    var g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700; lp.connect(out);
    env(c, g, t, 0.004, v, 0.2); g.connect(lp); osc(c, 'triangle', mtof(m), t, 0.3, g);
  }
  function bass(c, out, t, m, dur, v) {
    var g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.connect(out);
    env(c, g, t, 0.012, v, Math.max(0.2, dur)); g.connect(lp); osc(c, 'triangle', mtof(m), t, dur + 0.3, g); osc(c, 'sine', mtof(m) * 2, t, dur + 0.3, g);
  }
  function kick(c, out, t, v) {
    var o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.22);
  }
  function noise(c, out, t, hz, type, dur, v) {
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf; f.type = type; f.frequency.value = hz; if (type === 'bandpass') f.Q.value = 0.8;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  /* เล่น 1 ช่อง (โน้ตเขบ็ต 1 ชั้น) ของห้องที่ bi */
  function slotAt(c, out, bar, s, t, e) {
    var i, L = bar.lead;
    for (i = 0; i < L.length; i++) if (L[i].s === s) marimba(c, out, t, L[i].n, L[i].len * e, 0.2);
    var r = bar.root, rb = 36 + ((r % 12 + 12) % 12), r5 = rb + 7;
    if (s === 0) bass(c, out, t, rb, e * 3, 0.3);
    else if (s === 4) bass(c, out, t, r5 - 12 + 12, e * 1.6, 0.24);
    else if (s === 6) bass(c, out, t, rb, e * 1.2, 0.2);
    if (s % 2 === 1) { var cr = 60 + (r % 12 + 12) % 12 - 12; pluck(c, out, t, cr, 0.06); pluck(c, out, t, cr + (bar.minor ? 3 : 4), 0.05); pluck(c, out, t, cr + 7, 0.05); }
    if (s === 0 || s === 4) kick(c, out, t, 0.34);
    if (s === 2 || s === 6) noise(c, out, t, 1900, 'bandpass', 0.1, 0.09);
    noise(c, out, t, 7500, 'highpass', 0.035, s % 2 ? 0.055 : 0.032);
  }

  /* ---------- ตัวเล่น ---------- */
  var cfg = null, T = null, song = null, ctx = null, master = null, comp = null;
  var want = false, timer = null, nextT = 0, slot = 0, bi = 0, base = 0, eighth = 0.28, offT = null;
  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; return null; }
    master = ctx.createGain(); master.gain.value = 0; comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    comp.connect(master); master.connect(ctx.destination); noiseBuf = mkNoise(ctx);
    try { ctx.onstatechange = function () { if (want && ctx.state !== 'running') { try { ctx.resume(); } catch (e) {} } }; } catch (e) {}
    return ctx;
  }
  /* iPhone/iPad: Web Audio ถูกปิดเสียงเมื่อเปิดสวิตช์โหมดเงียบ + ต้องปลดล็อกด้วยการแตะ
     วิธีแก้: ตั้ง audio session เป็น playback และเล่นไฟล์เสียงเงียบวนลูปผ่านแท็ก <audio> (ช่องทางสื่อ) */
  var keep = null;
  function silentWav() {
    var n = 8000, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), i, w = function (o, t) { for (var k = 0; k < t.length; k++) v.setUint8(o + k, t.charCodeAt(k)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  }
  function mediaUnlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    try {
      if (!keep) {
        keep = document.createElement('audio'); keep.src = silentWav(); keep.loop = true; keep.preload = 'auto'; keep.setAttribute('playsinline', ''); keep.setAttribute('aria-hidden', 'true'); keep.style.display = 'none'; keep.volume = 0.01;
        document.body.appendChild(keep);
      }
      if (keep.paused) { var pr = keep.play(); if (pr && pr.catch) pr.catch(function () {}); }
    } catch (e) {}
  }
  /* เสียง "ติ๊ง" สั้นๆ เมื่อปรับระดับเสียง/เปิดเสียง ให้รู้ว่าเสียงทำงาน */
  function blip() {
    if (!ctx || ctx.state !== 'running' || !comp) return;
    var t = ctx.currentTime + 0.02; marimba(ctx, comp, t, 84, 0.2, 0.22); marimba(ctx, comp, t + 0.11, 91, 0.25, 0.2);
  }
  var hinted = false, hintT = 0;
  function hint() {
    if (hinted || !want) return;
    if (ctx && ctx.state === 'running') return;
    if (!hintT) hintT = Date.now(); else if (Date.now() - hintT > 1400) {
      hinted = true; var d = document.createElement('div');
      d.textContent = '🎵 แตะหน้าจอหนึ่งครั้งเพื่อเปิดเสียงเพลง';
      d.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:101;background:#1e2d3b;color:#eaf0f4;border:1px solid #2a3b4b;border-radius:99px;padding:10px 16px;font:700 14px Sarabun,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4)';
      document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4500);
    }
  }
  function level() { return st.m ? 0 : st.v * st.v * 0.9; }
  function applyVol(fast) { if (!master) return; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(want ? level() : 0, ctx.currentTime, fast ? 0.03 : 0.35); }
  function tick() {
    if (!ctx || ctx.state !== 'running') { nextT = Math.max(nextT, ctx ? ctx.currentTime + 0.05 : 0); if (ctx) { try { ctx.resume(); } catch (e) {} } hint(); return; }
    hintT = 0;
    var guard = 0;
    while (nextT < ctx.currentTime + 0.18 && guard++ < 64) {
      slotAt(ctx, comp, song[bi], slot, nextT + (slot % 2 ? T.swing * eighth : 0), eighth);
      nextT += eighth; if (++slot >= 8) { slot = 0; bi = (bi + 1) % song.length; }
    }
  }
  function sync() {
    var should = want && !document.hidden;
    if (should) {
      if (!ensureCtx()) return;
      if (offT) { clearTimeout(offT); offT = null; }
      if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) {} }
      if (!timer) { nextT = ctx.currentTime + 0.1; timer = setInterval(tick, 30); }
      applyVol(false);
    } else if (timer && !offT) {
      if (master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      offT = setTimeout(function () { clearInterval(timer); timer = null; offT = null; }, 900);
    }
  }
  function setWant(b) { if (b === want) return; want = b; sync(); applyFs(false); }
  function unlock() { if (!cfg) return; if (want && st.fs && !fsTried && canFs() && !isFs()) { fsTried = true; reqFs(); } mediaUnlock(); if (!ensureCtx()) return; if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) {} } }

  /* ---------- แผงตั้งค่า ---------- */
  var CSS = '.bgmB{font-family:inherit}html.bgfs #gnav{display:none!important}html.bgfs{--gnh:0px!important}' +
    '.bgmCtl .bgmSub{display:block;font-size:12px;opacity:.65;font-weight:400;margin-top:2px}' +
    '#bgmOv{position:fixed;inset:0;z-index:100;background:rgba(5,10,16,.72);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Sarabun,system-ui,-apple-system,sans-serif}' +
    '#bgmOv[hidden]{display:none}' +
    '#bgmOv .bgmC{background:#1e2d3b;color:#eaf0f4;border:1px solid #2a3b4b;border-radius:16px;padding:18px 18px 20px;width:100%;max-width:340px;display:flex;flex-direction:column;gap:16px;box-shadow:0 18px 50px rgba(0,0,0,.45)}' +
    '#bgmOv .bgmH{display:flex;align-items:center;justify-content:space-between}#bgmOv .bgmH b{font-size:20px}' +
    '#bgmOv button{font:inherit;cursor:pointer}' +
    '#bgmOv .bgmX{width:36px;height:36px;border-radius:10px;border:1px solid #2a3b4b;background:#2a3b4b;color:#eaf0f4;font-size:16px}' +
    '.bgmCtl{display:flex;flex-direction:column;gap:16px;font-family:Sarabun,system-ui,-apple-system,sans-serif;color:inherit;text-align:left}' +
    '.bgmCtl button{font:inherit;cursor:pointer}' +
    '.bgmCtl .bgmRow{display:flex;align-items:center;justify-content:space-between;gap:12px}' +
    '.bgmCtl .bgmSw{min-width:128px;padding:10px 14px;border-radius:99px;border:0;font-weight:700;font-size:15px;background:#ffcf5a;color:#2a2007}' +
    '.bgmCtl .bgmSw[aria-pressed=false]{background:#8a97a3;color:#fff}' +
    '.bgmCtl .bgmL{display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;opacity:.85}.bgmCtl .bgmL output{font-weight:700;font-variant-numeric:tabular-nums;opacity:1}' +
    '.bgmCtl .bgmS{display:flex;align-items:center;gap:10px}.bgmCtl .bgmS span{font-size:18px}' +
    '.bgmCtl input[type=range]{flex:1;min-width:0;height:36px;accent-color:#e8a317;cursor:pointer;margin:0}' +
    '.bgmCtl .bgmN{margin:0;font-size:12.5px;opacity:.65}' +
    '#bgmOv .bgmA{display:flex;flex-direction:column;gap:8px}' +
    '#bgmOv .bgmGo{padding:12px;border-radius:12px;border:0;background:#ffcf5a;color:#2a2007;font-weight:700;font-size:16px}' +
    '#bgmOv .bgmBk{padding:11px;border-radius:12px;border:1px solid #2a3b4b;background:#2a3b4b;color:#eaf0f4;font-weight:700;font-size:15px}';
  /* เมนูในเกมแบบปุ่มกลม (สไตล์กล่องเกม เหมือนหน้าแรก) */
  var CSS2 =
    '#bgmOv{--pbg:#d9eefb;--pedge:#10202c;--psh:#10202c;--pink:#10202c;--pmut:#52657a;--pcard:#fffdf6;--ptint:#e9eff5;--pbad:#c0392b;--pbadbg:#ffdcd6;--pscrim:rgba(8,18,28,.6);align-items:flex-start;justify-content:center;overflow:auto;background:var(--pscrim);padding:calc(env(safe-area-inset-top,0px) + 12px) 12px calc(env(safe-area-inset-bottom,0px) + 12px);font-family:Sarabun,system-ui,-apple-system,sans-serif}' +
    '@media (prefers-color-scheme:dark){#bgmOv{--pbg:#12303f;--pedge:#eaf0f4;--psh:#050a0e;--pink:#eaf0f4;--pmut:#9fb2c3;--pcard:#1b2b36;--ptint:#24394a;--pbad:#ff917c;--pbadbg:#4a2622;--pscrim:rgba(0,0,0,.65)}}' +
    '#bgmOv .bgmC{margin:auto;width:100%;max-width:400px;background:none;border:0;box-shadow:none;padding:0;gap:14px;color:var(--pink)}' +
    '#bgmOv .bgmCard{background:var(--pcard);border:3px solid var(--pedge);border-radius:26px;box-shadow:0 6px 0 var(--psh);padding:16px;display:flex;flex-direction:column;gap:14px}' +
    '#bgmOv .bgmH{display:flex;align-items:center;justify-content:space-between}' +
    '#bgmOv .bgmH b{font:700 24px Mali,Sarabun,sans-serif}' +
    '#bgmOv .bgmX{width:44px;height:44px;border-radius:50%;border:3px solid var(--pedge);background:var(--pcard);color:var(--pink);box-shadow:0 3px 0 var(--psh);display:grid;place-items:center;padding:0}' +
    '#bgmOv .bgmI{width:1.3em;height:1.3em;flex:none;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
    '#bgmOv .bgmI.f{fill:currentColor;stroke:none}' +
    '#bgmOv .bgmRd{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 8px}' +
    '#bgmOv .bgmRb{display:flex;flex-direction:column;align-items:center;gap:6px;font:700 15px/1.2 Mali,Sarabun,sans-serif;text-align:center;color:var(--pink);background:none;border:0;padding:0}' +
    '#bgmOv .bgmRb i{display:grid;place-items:center;width:72px;height:72px;border-radius:50%;border:3px solid var(--pedge);box-shadow:0 4px 0 var(--psh);background:var(--c);color:#10202c;font-style:normal}' +
    '#bgmOv .bgmRb i .bgmI{width:30px;height:30px}' +
    '#bgmOv .bgmRb:active i{transform:translateY(2px);box-shadow:0 2px 0 var(--psh)}' +
    '#bgmOv .bgmRb[aria-pressed=false] i{background:var(--ptint);color:var(--pmut)}' +
    '#bgmOv .bgmRb.bad i{background:var(--pbadbg);color:var(--pbad)}' +
    '#bgmOv .bgmSlr{display:flex;align-items:center;gap:10px;color:var(--pink)}' +
    '#bgmOv .bgmSlr input{flex:1;min-width:0;height:36px;accent-color:#e8a317;margin:0}' +
    '#bgmOv .bgmSlr output{min-width:3.4em;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;font-size:15px}' +
    '#bgmOv .bgmGo{display:flex;align-items:center;justify-content:center;gap:8px;min-height:60px;border-radius:999px;border:3px solid var(--pedge);box-shadow:0 4px 0 var(--psh);background:#ffcf5a;color:#2a2007;font:700 22px Mali,Sarabun,sans-serif;width:100%}' +
    '#bgmOv .bgmGo:active{transform:translateY(2px);box-shadow:0 2px 0 var(--psh)}' +
    '#bgmOv .bgmIn{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;padding:18px;background:var(--pscrim);overflow:auto}' +
    '#bgmOv .bgmIn[hidden]{display:none}' +
    '#bgmOv .bgmInC{width:100%;max-width:400px;background:var(--pcard);color:var(--pink);border:3px solid var(--pedge);border-radius:24px;box-shadow:0 6px 0 var(--psh);padding:16px;display:flex;flex-direction:column;gap:12px;max-height:100%;overflow:auto}' +
    '#bgmOv .bgmInC h3{margin:0;font:700 22px Mali,Sarabun,sans-serif}' +
    '#bgmOv .bgmInC ol,#bgmOv .bgmInC ul{margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:6px;font-size:16px;line-height:1.5}' +
    '#bgmOv .bgmInC p{margin:0;font-size:15px;color:var(--pmut)}' +
    '#bgmOv .bgmTl{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center}' +
    '#bgmOv .bgmTl div{background:var(--ptint);border-radius:12px;padding:8px 4px}' +
    '#bgmOv .bgmTl b{display:block;font:700 24px/1.2 Mali,Sarabun,sans-serif;font-variant-numeric:tabular-nums}' +
    '#bgmOv .bgmTl span{font-size:14px;color:var(--pmut)}' +
    '#bgmOv .bgmRows div{display:flex;justify-content:space-between;gap:10px;padding:7px 2px;border-top:1px solid var(--ptint);font-size:15px;font-variant-numeric:tabular-nums}' +
    '#bgmOv .bgmRows div span:last-child{color:var(--pmut);text-align:right}' +
    '#bgmOv .bgmBtn{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:999px;border:3px solid var(--pedge);box-shadow:0 4px 0 var(--psh);background:#ffcf5a;color:#2a2007;font:700 18px Mali,Sarabun,sans-serif;text-decoration:none;width:100%}' +
    '@media (max-height:520px){#bgmOv .bgmC{max-width:640px;gap:10px}#bgmOv .bgmCard{padding:12px;gap:10px}#bgmOv .bgmRd{grid-template-columns:repeat(6,1fr);gap:8px 4px}#bgmOv .bgmRb{font-size:13px}#bgmOv .bgmRb i{width:52px;height:52px}#bgmOv .bgmRb i .bgmI{width:24px;height:24px}#bgmOv .bgmH b{font-size:20px}#bgmOv .bgmGo{min-height:48px;font-size:19px}}'+
    '#bgmOv button:focus-visible,#bgmOv a:focus-visible{outline:3px solid #1b6dd6;outline-offset:3px}';

  /* ---------- เต็มหน้าจอ: ซ่อนแถบเมนูของเว็บ (ใช้ได้ทุกเครื่อง) + Fullscreen API เมื่อเครื่องรองรับ (iPhone ไม่รองรับ) ---------- */
  var de = document.documentElement, fsOwn = false, fsTried = false;
  function canFs() { return !!(de.requestFullscreen || de.webkitRequestFullscreen) && document.fullscreenEnabled !== false; }
  function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function reqFs() { try { var f = de.requestFullscreen || de.webkitRequestFullscreen, p = f.call(de, { navigationUI: 'hide' }); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  function exitFs() { try { fsOwn = true; var f = document.exitFullscreen || document.webkitExitFullscreen; var p = f && f.call(document); if (p && p.catch) p.catch(function () {}); } catch (e) {} setTimeout(function () { fsOwn = false; }, 600); }
  function applyFs(gesture) {
    var on = want && st.fs;
    de.classList.toggle('bgfs', on);
    if (on) { if (gesture && canFs() && !isFs()) { fsTried = true; reqFs(); } }
    else { fsTried = false; if (isFs()) exitFs(); }
    setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 60);
    setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 400);
  }
  function onFsChange() { if (!isFs() && !fsOwn && st.fs && want) { st.fs = false; save(); applyFs(false); } } /* กด Esc ออกจากเต็มจอเอง = ปิดโหมดนี้ */
  var cssDone = false;
  function addCss() { if (cssDone) return; cssDone = true; var s = document.createElement('style'); s.textContent = CSS + CSS2; document.head.appendChild(s); }
  /* กล่องควบคุมเสียง (สวิตช์ + แถบเลื่อน) ใช้ในแผงเมนูของ BGM หรือฝังในเมนูของเกมเอง (BGM.controls()) */
  function controls() {
    addCss();
    var d = document.createElement('div'); d.className = 'bgmCtl';
    d.innerHTML = '<div class="bgmRow"><span>🎵 เพลงประกอบ</span><button type="button" class="bgmSw"></button></div>' +
      '<div><div class="bgmL"><label>ระดับเสียง</label><output></output></div><div class="bgmS"><span aria-hidden="true">🔈</span><input type="range" min="0" max="100" step="1" aria-label="ระดับเสียง"><span aria-hidden="true">🔊</span></div></div>' +
      '<p class="bgmN">เพลงจะเล่นเฉพาะตอนอยู่ในเกม</p>' +
      '<div class="bgmRow"><span>⛶ เต็มหน้าจอ<small class="bgmSub"></small></span><button type="button" class="bgmSw bgmFs"></button></div>';
    var sw = d.querySelector('.bgmSw:not(.bgmFs)'), fb = d.querySelector('.bgmFs'), fsub = d.querySelector('.bgmSub'), rg = d.querySelector('input'), out = d.querySelector('output');
    function paint() {
      sw.setAttribute('aria-pressed', String(!st.m)); sw.textContent = st.m ? '🔇 ปิดเสียง' : '🔊 เปิดเสียง';
      rg.value = String(Math.round(st.v * 100)); out.textContent = st.m ? 'ปิดอยู่' : Math.round(st.v * 100) + '%';
      fb.setAttribute('aria-pressed', String(st.fs)); fb.textContent = st.fs ? '✓ เปิดอยู่' : 'เปิด';
      fsub.textContent = (canFs() ? 'ขยายเต็มจออัตโนมัติเมื่อเข้าเกม' : 'ซ่อนแถบด้านบนอัตโนมัติเมื่อเข้าเกม');
    }
    fb.onclick = function () { st.fs = !st.fs; save(); paint(); applyFs(true); };
    sw.onclick = function () { st.m = !st.m; if (!st.m && st.v === 0) st.v = 0.5; save(); paint(); unlock(); applyVol(true); if (!st.m) setTimeout(blip, 60); };
    rg.oninput = function () { st.v = (+rg.value) / 100; if (st.m && st.v > 0) st.m = false; save(); paint(); unlock(); applyVol(true); };
    rg.onchange = function () { unlock(); setTimeout(blip, 60); };
    paint(); return d;
  }
  var ov = null, curAct = null, actNow = {};
  var IP = { sp: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/>', sx: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>', fs: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', hp: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 115 .8c0 1.6-2.5 2-2.5 3.7M12 17.2v.1"/>', hi: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>', fl: '<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>', hm: '<path d="M3.5 11.5L12 4l8.5 7.5M6 10v10h12V10"/>', pl: '<path d="M7 4.5v15l12.5-7.5z"/>', cl: '<path d="M6 6l12 12M18 6L6 18"/>' };
  function ico(n, f) { return '<svg class="bgmI' + (f ? ' f' : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + IP[n] + '</svg>'; }
  var CL = { c24: '#ffcf5a', sd: '#2a9cc2', am: '#2f9e6a', ck: '#3f9a7c', ch: '#c89b6a' };
  function rb(k, ic, label, on, c, bad) { return '<button type="button" class="bgmRb' + (bad ? ' bad' : '') + '" data-k="' + k + '" aria-pressed="' + on + '" style="--c:' + c + '"><i>' + ico(ic) + '</i>' + label + '</button>'; }
  function giveOk(A) { var g = A.give; if (!g) return false; if (typeof g === 'function') return true; var el = document.querySelector(g); return !!el && !el.hidden && !el.disabled && el.offsetParent !== null; }
  function paintPanel() {
    var A = actNow, rd = '';
    rd += rb('snd', st.m ? 'sx' : 'sp', st.m ? 'เสียงปิด' : 'เสียงเปิด', !st.m, CL.c24);
    rd += rb('fs', 'fs', st.fs ? 'เต็มจอ' : 'จอปกติ', st.fs, CL.sd);
    if (A.how) rd += rb('how', 'hp', 'วิธีเล่น', true, CL.am);
    if (A.hist) rd += rb('hist', 'hi', 'ประวัติ', true, CL.ck);
    if (giveOk(A)) rd += rb('give', 'fl', 'ยอมแพ้', true, '', true);
    rd += rb('home', 'hm', A.homeLabel || 'กลับเมนู', true, CL.ch);
    ov.querySelector('.bgmRd').innerHTML = rd;
    var sl = ov.querySelector('.bgmSlr'), rg = sl.querySelector('input'), out = sl.querySelector('output');
    rg.value = String(Math.round(st.v * 100)); rg.disabled = !!st.m; out.textContent = st.m ? 'ปิดอยู่' : Math.round(st.v * 100) + '%';
  }
  function showIn(html) { var i = ov.querySelector('.bgmIn'); i.innerHTML = '<div class="bgmInC">' + html + '<button type="button" class="bgmBtn" data-k="inx">ปิด</button></div>'; i.hidden = false; var b = i.querySelector('.bgmBtn'); if (b) b.focus(); }
  function statsHtml(done) {
    var g = cfg.game, u = null; try { u = window.Arcade && Arcade.user && Arcade.user(); } catch (e) {}
    if (!u) { done('<h3>ประวัติของฉัน</h3><p>เข้าสู่ระบบเพื่อเก็บสถิติและติดอันดับ</p><a class="bgmBtn" href="../#login">เข้าสู่ระบบ</a>'); return; }
    var AIL = { easy: 'สู้ AI ง่าย', medium: 'สู้ AI กลาง', hard: 'สู้ AI ยาก', online: 'แข่งกับเพื่อน' }, LV = { easy: 'ง่าย', medium: 'กลาง', hard: 'ยาก', expert: 'โหด', online: 'แข่งกับเพื่อน' };
    var ai = g === 'chess' || g === 'checkers' || g === 'amath', time = g === 'sudoku' || g === 'game24';
    function fmt(t) { t = +t; if (t >= 60) { var m = Math.floor(t / 60), s2 = Math.round(t - m * 60); if (s2 === 60) { m++; s2 = 0; } return m + ':' + (s2 < 10 ? '0' : '') + s2 + ' น.'; } return t.toFixed(1) + ' วิ'; }
    Arcade.userRows(u.username).then(function (rows) {
      var rs = rows.filter(function (x) { return x.game === g && x.plays > 0; }), w = 0, p = 0; rs.forEach(function (x) { w += x.wins; p += x.plays; });
      if (!p) { done('<h3>ประวัติของฉัน</h3><p>ยังไม่เคยเล่นเกมนี้ ลองเล่นรอบแรกได้เลย</p>'); return; }
      var h = '<h3>ประวัติของฉัน</h3><div class="bgmTl"><div><b>' + w + '</b><span>ชนะ</span></div><div><b>' + p + '</b><span>เล่น</span></div><div><b>' + Math.round(100 * w / p) + '%</b><span>อัตราชนะ</span></div></div><div class="bgmRows">';
      ['easy', 'medium', 'hard', 'expert', 'online'].forEach(function (c) {
        var x = rs.filter(function (y) { return y.cat === c; })[0]; if (!x) return;
        var ex = time && c !== 'online' && x.best_time != null ? ' · เร็วสุด ' + fmt(x.best_time) : (g === 'amath' && x.best_score != null ? ' · สูงสุด ' + x.best_score : '');
        h += '<div><span>' + ((ai ? AIL : LV)[c] || c) + '</span><span>ชนะ ' + x.wins + '/' + x.plays + ex + '</span></div>';
      });
      done(h + '</div>');
    }, function () { done('<h3>ประวัติของฉัน</h3><p>โหลดไม่ได้ ลองใหม่อีกครั้ง</p>'); });
  }
  function build() {
    if (ov) return ov;
    addCss();
    ov = document.createElement('div'); ov.id = 'bgmOv'; ov.hidden = true;
    ov.innerHTML = '<div class="bgmC" role="dialog" aria-modal="true" aria-label="เมนู"><div class="bgmCard"><div class="bgmH"><b>พักเกมก่อน</b><button type="button" class="bgmX" aria-label="ปิด">' + ico('cl') + '</button></div><div class="bgmRd"></div>' +
      '<div class="bgmSlr">' + ico('sx') + '<input type="range" min="0" max="100" step="1" aria-label="ระดับเสียง">' + ico('sp') + '<output></output></div></div>' +
      '<button type="button" class="bgmGo" id="bgmGo">' + ico('pl', 1) + 'เล่นต่อ</button></div><div class="bgmIn" hidden></div>';
    document.body.appendChild(ov);
    var rg = ov.querySelector('.bgmSlr input');
    rg.oninput = function () { st.v = (+rg.value) / 100; if (st.m && st.v > 0) st.m = false; save(); paintPanel(); unlock(); applyVol(true); };
    rg.onchange = function () { unlock(); setTimeout(blip, 60); };
    ov.paint = paintPanel;
    ov.querySelector('.bgmX').onclick = close; ov.querySelector('#bgmGo').onclick = close;
    ov.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-k]'); if (!b) return; var k = b.getAttribute('data-k'), A = actNow;
      if (k === 'snd') { st.m = !st.m; if (!st.m && st.v === 0) st.v = 0.5; save(); paintPanel(); unlock(); applyVol(true); if (!st.m) setTimeout(blip, 60); }
      else if (k === 'fs') { st.fs = !st.fs; save(); paintPanel(); applyFs(true); }
      else if (k === 'inx') { ov.querySelector('.bgmIn').hidden = true; }
      else if (k === 'how') { if (typeof A.how === 'function') { close(); A.how(); } else showIn(A.how); }
      else if (k === 'hist') { if (typeof A.hist === 'function') { close(); A.hist(); } else statsHtml(showIn); }
      else if (k === 'give') { close(); if (typeof A.give === 'function') A.give(); else { var el = document.querySelector(A.give); if (el) el.click(); } }
      else if (k === 'home') { close(); if (typeof A.home === 'function') A.home(); else { var m = document.querySelector(cfg.menuBtn); if (!m) return; bypass = true; try { m.click(); } finally { bypass = false; } } }
    });
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var i = ov.querySelector('.bgmIn'); if (!i.hidden) i.hidden = true; else close(); } });
    return ov;
  }
  var opener = null;
  function open() { build(); actNow = curAct || (cfg && cfg.act) || {}; curAct = null; opener = document.activeElement; ov.querySelector('.bgmIn').hidden = true; ov.paint(); ov.hidden = false; unlock(); ov.querySelector('#bgmGo').focus(); }
  function openMenu(extra) { curAct = extra || null; open(); }
  function close() { if (ov) ov.hidden = true; if (opener && opener.focus) try { opener.focus(); } catch (e) {} }

  var bypass = false;
  function intercept() {
    document.addEventListener('click', function (e) {
      if (bypass || !cfg.menuBtn) return;
      var t = e.target && e.target.closest && e.target.closest(cfg.menuBtn); if (!t) return;
      e.preventDefault(); e.stopImmediatePropagation(); open();
    }, true);
  }

  function init(c) {
    if (cfg) return; cfg = c; T = TRACKS[c.game] || TRACKS.amath; song = compose(T); eighth = 30 / T.bpm;
    function go() {
      addCss(); intercept();
      setInterval(function () { var g = false; try { g = !!cfg.inGame(); } catch (e) {} setWant(g); }, 400);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
    ['pointerdown', 'touchend', 'keydown', 'click'].forEach(function (ev) { document.addEventListener(ev, unlock, true); });
    ['click', 'touchend'].forEach(function (ev) {
      document.addEventListener(ev, function () {
        var g = false; try { g = !!cfg.inGame(); } catch (e) {} setWant(g);
        if (want && st.fs && !fsTried && canFs() && !isFs()) { fsTried = true; reqFs(); }
      }, false);
    });
    document.addEventListener('fullscreenchange', onFsChange); document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) unlock(); sync(); });
  }

  /* ใช้ทดสอบ: เรนเดอร์เพลงแบบออฟไลน์แล้วคืนค่าพีก/RMS */
  function render(game, secs) {
    var t = TRACKS[game], sg = compose(t), e = 30 / t.bpm, sr = 22050;
    var oc = new OfflineAudioContext(1, Math.floor(sr * secs), sr);
    noiseBuf = mkNoise(oc); var cm = oc.createDynamicsCompressor(); cm.threshold.value = -16; cm.ratio.value = 4;
    var m = oc.createGain(); m.gain.value = 0.9; cm.connect(m); m.connect(oc.destination);
    var tt = 0.05, s = 0, b = 0; while (tt < secs - 0.4) { slotAt(oc, cm, sg[b], s, tt + (s % 2 ? t.swing * e : 0), e); tt += e; if (++s >= 8) { s = 0; b = (b + 1) % sg.length; } }
    return oc.startRendering().then(function (buf) {
      var d = buf.getChannelData(0), pk = 0, sum = 0, i; for (i = 0; i < d.length; i++) { var a = Math.abs(d[i]); if (a > pk) pk = a; sum += d[i] * d[i]; }
      return { peak: pk, rms: Math.sqrt(sum / d.length), loopSec: sg.length * 8 * e, nan: d.some(function (x) { return x !== x; }) };
    });
  }
  window.BGM = { init: init, open: open, openMenu: openMenu, controls: controls, _bypass: function () { return bypass; }, _st: st, _render: render, _state: function () { return { want: want, ctx: ctx && ctx.state, gain: master ? master.gain.value : null, playing: !!timer }; } };
})();
</script>
