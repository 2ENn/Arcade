/* Taoob Arcade SDK — ใช้ร่วมกันทั้งห้องเกมและเกมทุกเกม
   window.Arcade: user(), onChange(fn), register(u,p), login(u,p), logout(), report({...}), board(game), overall(), client()
   ทุกอย่างปลอดภัยถ้าโหลดไม่สำเร็จ: เกมยังเล่นได้ แค่ไม่บันทึกอันดับ */
(function () {
  'use strict';
  var CFG = {
    url: 'https://suzjjwaamfsekokiukhj.supabase.co',
    key: 'sb_publishable_TxqJlQHRp_PdAnUUVRzVyQ_J56oGHHq',     // publishable key ใส่ในเว็บได้ (ห้ามใส่ service_role)
    lib: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js',
    emailDomain: 'gmail.com',                                  // ใช้แปลงชื่อผู้ใช้เป็นอีเมลภายใน (ไม่มีการส่งอีเมลจริง)
    storageKey: 'arcade.auth.v1', queueKey: 'arcade.queue.v1'
  };
  var client = null, user = null, listeners = [], libPromise = null, readyResolve, readyDone = false;
  var ready = new Promise(function (r) { readyResolve = r; });

  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ไม่เป็นไร */ } }

  function loadLib() {
    if (libPromise) return libPromise;
    libPromise = new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) { resolve(); return; }
      var s = document.createElement('script'); s.src = CFG.lib; s.async = true;
      s.onload = function () { resolve(); }; s.onerror = function () { reject(new Error('load')); };
      document.head.appendChild(s);
      setTimeout(function () { reject(new Error('timeout')); }, 9000);
    });
    return libPromise;
  }
  function toUser(session) {
    var u = session && session.user;
    if (!u) return null;
    var name = u.user_metadata && u.user_metadata.username;
    return name ? { id: u.id, username: String(name) } : null;
  }
  function setUser(session) {
    var nu = toUser(session), changed = (nu && nu.id) !== (user && user.id);
    user = nu;
    if (changed) { listeners.slice().forEach(function (f) { try { f(user); } catch (e) { /* ไม่เป็นไร */ } }); if (user) flushQueue(); }
  }
  function init() {
    return loadLib().then(function () {
      client = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: CFG.storageKey } });
      return client.auth.getSession();
    }).then(function (res) {
      setUser(res && res.data && res.data.session);
      client.auth.onAuthStateChange(function (_ev, session) { setUser(session); });
    }).catch(function () { client = null; }).then(function () { readyDone = true; readyResolve(user); listeners.slice().forEach(function (f) { try { f(user); } catch (e) { /* ไม่เป็นไร */ } }); });
  }

  function normName(u) { return String(u || '').trim().toLowerCase(); }
  function validName(u) { return /^[a-z0-9_]{3,16}$/.test(u); }
  function emailOf(u) { return u + '.arcade@' + CFG.emailDomain; }  /* ใช้โดเมนที่มี MX จริง ไม่งั้น Supabase ตอบ email_address_invalid */
  function needClient() { return client ? Promise.resolve() : Promise.reject({ code: 'offline', message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองอีกครั้ง' }); }

  /* รหัสผ่านต้องมี 6 ตัวขึ้นไป (ตอนสมัคร): แปลงเป็นรหัสยาวคงที่ด้วย SHA-256 ในเครื่องก่อนส่ง จึงไม่ติดกฎความยาวของ Supabase */
  function sha256hex(str) {
    var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var b = unescape(encodeURIComponent(str)), n = b.length, w = [], i, j;
    for (i = 0; i < n; i++) w[i >> 2] |= b.charCodeAt(i) << (24 - (i % 4) * 8);
    w[n >> 2] |= 0x80 << (24 - (n % 4) * 8);
    w[(((n + 8) >> 6) << 4) + 15] = n * 8;
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    function rr(x, c) { return (x >>> c) | (x << (32 - c)); }
    for (i = 0; i < w.length; i += 16) {
      var a = H.slice(), W = [];
      for (j = 0; j < 64; j++) {
        if (j < 16) W[j] = w[i + j] | 0;
        else { var s0 = rr(W[j-15],7) ^ rr(W[j-15],18) ^ (W[j-15] >>> 3), s1 = rr(W[j-2],17) ^ rr(W[j-2],19) ^ (W[j-2] >>> 10); W[j] = (W[j-16] + s0 + W[j-7] + s1) | 0; }
        var S1 = rr(a[4],6) ^ rr(a[4],11) ^ rr(a[4],25), ch = (a[4] & a[5]) ^ (~a[4] & a[6]), t1 = (a[7] + S1 + ch + K[j] + W[j]) | 0;
        var S0 = rr(a[0],2) ^ rr(a[0],13) ^ rr(a[0],22), mj = (a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]), t2 = (S0 + mj) | 0;
        a = [(t1 + t2) | 0, a[0], a[1], a[2], (a[3] + t1) | 0, a[4], a[5], a[6]];
      }
      for (j = 0; j < 8; j++) H[j] = (H[j] + a[j]) | 0;
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }
  function derivePw(u, p) { return 'tp1.' + sha256hex('taoob-arcade|' + u + '|' + p); }

  function mapErr(e, mode) {
    var m = String((e && (e.message || e.msg)) || ''), c = String((e && (e.code || e.error_code)) || '');
    if (c === 'offline') return e.message;
    if (/already registered|user_already_exists|already been registered/i.test(m + c)) return 'ชื่อนี้มีคนใช้แล้ว ลองชื่ออื่น';
    if (/invalid login|invalid_credentials/i.test(m + c)) return 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
    if (/rate|too many|over_.*limit/i.test(m + c)) return 'ลองบ่อยเกินไป รอสักครู่แล้วลองใหม่';
    if (/database error|unexpected_failure/i.test(m + c)) return 'ชื่อนี้ใช้ไม่ได้หรือมีคนใช้แล้ว ลองชื่ออื่น';
    if (/fetch|network|failed/i.test(m)) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองอีกครั้ง';
    if (/signup.*disabled|signups not allowed|email_provider_disabled|provider.*disabled/i.test(m + c)) return 'ระบบปิดรับสมัครอยู่ (ผู้ดูแลต้องเปิด Enable sign ups / Email provider ใน Supabase)';
    if (/email.*invalid|invalid.*email|email_address_invalid/i.test(m + c)) return 'Supabase ไม่รับอีเมลภายในของระบบ (email_address_invalid) แจ้งผู้ดูแล';
    if (/captcha/i.test(m + c)) return 'Supabase เปิด Captcha อยู่ ต้องปิดในเมนู Authentication';
    if (/api key|apikey|jwt|invalid.*key/i.test(m + c)) return 'API key ไม่ถูกต้อง (ตรวจ key/URL ใน platform.js)';
    return 'ทำรายการไม่สำเร็จ [' + (c || (e && e.status) || '?') + '] ' + m.slice(0, 120);
  }
  function register(u, p) {
    u = normName(u);
    if (!validName(u)) return Promise.reject({ message: 'ชื่อผู้ใช้ใช้ได้เฉพาะ a-z 0-9 และ _ ยาว 3–16 ตัว' });
    if (String(p || '').length < 6) return Promise.reject({ message: 'รหัสผ่านต้องมี 6 ตัวขึ้นไป' });
    return needClient().then(function () {
      return client.auth.signUp({ email: emailOf(u), password: derivePw(u, p), options: { data: { username: u } } });
    }).then(function (r) {
      if (r.error) throw r.error;
      if (!r.data || !r.data.session) throw { message: 'สมัครแล้ว แต่ระบบยังเปิดให้ยืนยันอีเมลอยู่ (ผู้ดูแลต้องปิด Confirm email ใน Supabase)' , raw: true };
      setUser(r.data.session); return user;
    }).catch(function (e) { throw { message: e && e.raw ? e.message : mapErr(e, 'register') }; });
  }

  /* รีเซตรหัสผ่าน: ชื่อผู้ใช้ + รหัสผ่านใหม่ (ไม่ต้องใช้อีเมลหรือรหัสเดิม) */
  function resetPassword(u, newPw) {
    u = normName(u);
    if (!validName(u)) return Promise.reject({ message: 'ไม่พบชื่อผู้ใช้นี้' });
    if (String(newPw || '').length < 6) return Promise.reject({ message: 'รหัสผ่านใหม่ต้องมี 6 ตัวขึ้นไป' });
    return needClient().then(function () {
      return client.rpc('reset_password', { p_username: u, p_new_pw: derivePw(u, newPw) });
    }).then(function (r) {
      if (r.error) throw r.error;
      if (r.data !== true) throw { raw: true, message: 'ไม่พบชื่อผู้ใช้นี้' };
      return true;
    }).catch(function (e) { throw { message: e && e.raw ? e.message : mapErr(e, 'reset') }; });
  }
  function login(u, p) {
    u = normName(u);
    if (!validName(u) || !p) return Promise.reject({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    return needClient().then(function () {
      return client.auth.signInWithPassword({ email: emailOf(u), password: derivePw(u, p) }).then(function (r) {
        /* บัญชีรุ่นเก่าที่สมัครด้วยรหัสดิบ: ลองรหัสดิบอีกครั้ง */
        if (r.error && /invalid login|invalid_credentials/i.test(String(r.error.message || '') + String(r.error.code || '')) && String(p).length >= 6)
          return client.auth.signInWithPassword({ email: emailOf(u), password: p }).then(function (r2) { return r2.error ? r : r2; });
        return r;
      });
    })
      .then(function (r) { if (r.error) throw r.error; setUser(r.data.session); return user; })
      .catch(function (e) { throw { message: mapErr(e, 'login') }; });
  }
  function logout() { return client ? client.auth.signOut().then(function () { setUser(null); }) : Promise.resolve(); }

  /* ส่งผลเกม: {game, cat, won, time, score, points} — ถ้าไม่ได้ล็อกอินจะไม่ส่ง คืน false */
  function sendOne(r) {
    return client.rpc('report_result', { p_game: r.game, p_cat: r.cat, p_won: !!r.won, p_time: r.time == null ? null : Math.round(r.time * 100) / 100, p_score: r.score == null ? null : r.score, p_points: r.points | 0 })
      .then(function (res) { if (res && res.error) throw res.error; return true; });
  }
  function report(r) {
    return ready.then(function () {
      if (!user || !client) return false;
      return sendOne(r).then(function () { return true; }, function () {
        var q = lsGet(CFG.queueKey) || []; q.push(Object.assign({ uid: user.id }, r)); lsSet(CFG.queueKey, q.slice(-50)); return false;
      });
    });
  }
  var flushing = false;
  function flushQueue() {
    if (flushing || !client || !user) return;
    var q = lsGet(CFG.queueKey) || []; if (!q.length) return;
    var mine = q.filter(function (x) { return x.uid === user.id; }), rest = q.filter(function (x) { return x.uid !== user.id; });
    flushing = true;
    mine.reduce(function (p, r) { return p.then(function (left) { return sendOne(r).then(function () { return left; }, function () { left.push(r); return left; }); }); }, Promise.resolve([]))
      .then(function (left) { lsSet(CFG.queueKey, rest.concat(left)); flushing = false; }, function () { flushing = false; });
  }

  function board(game) { return ready.then(needClient).then(function () { return client.from('leaderboard_game').select('*').eq('game', game); }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); }
  function overall() { return ready.then(needClient).then(function () { return client.from('leaderboard_overall').select('*'); }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); }
  /* สถิติรายเกม/รายระดับของผู้เล่นคนใดก็ได้ (ข้อมูลอันดับเปิดอ่านได้สาธารณะ) */
  function userRows(name) {
    name = normName(name);
    return ready.then(needClient).then(function () { return client.from('leaderboard_game').select('*').eq('username', name); }).then(function (r) { if (r.error) throw r.error; return r.data || []; });
  }
  function mine() { return ready.then(function () { if (!user) return []; return needClient().then(function () { return client.from('leaderboard_game').select('*').eq('username', user.username); }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); }); }

  window.Arcade = {
    ready: ready, user: function () { return user; },
    onChange: function (f) { listeners.push(f); if (readyDone) { try { f(user); } catch (e) { /* ไม่เป็นไร */ } } },
    register: register, login: login, logout: logout, resetPassword: resetPassword, report: report, board: board, overall: overall, mine: mine, userRows: userRows,
    client: function () { return client; },            // ให้เกมใช้ร่วมกันสำหรับห้องออนไลน์ (คืน null ถ้ายังไม่พร้อม)
    validName: validName, normName: normName
  };
  init();
})();
