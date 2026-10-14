// ===== Mee Overlay — ສະກໍບອດເປຕັ່ງ (ໃຊ້ຮ່ວມກັນ: overlay.html ແລະ petanque-overlay.html) =====
// MeePetanque.mount(db) — ຕິດຕາມ overlays/{uid}/petanque ແລ້ວແຕ້ມສະກໍເທິງ overlay
(() => {
  const DESIGN_W = 720;
  const CSS = `
  .mp-root { position:absolute; inset:0; pointer-events:none; z-index:50; }
  .mp-root * { box-sizing:border-box; }
  .mp-root { --a:#1c5cd0; --b:#d6281e; --gold:#ffc21a; --bar:#0f141c; --bar2:#1b222d; --line:rgba(255,255,255,.08);
    --lao:'Noto Sans Lao','Phetsarath OT',system-ui,sans-serif; --num:'Oswald','Arial Narrow',sans-serif; }
  .mp-bug { position:absolute; width:${DESIGN_W}px; transform-origin:0 0; font-family:var(--lao); color:#fff;
    transition:opacity .35s; filter:drop-shadow(0 6px 14px rgba(0,0,0,.45)); }
  .mp-bug.off { opacity:0; }
  .mp-title { display:inline-block; background:var(--bar); padding:4px 16px 2px; border-radius:12px 12px 0 0; font-size:22px; font-weight:700; max-width:100%;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mp-title:empty { display:none; }
  .mp-card { background:var(--bar); border-radius:12px; overflow:hidden; }
  .mp-title:not(:empty) + .mp-card { border-top-left-radius:0; }
  .mp-team { display:flex; align-items:center; height:76px; gap:14px; padding-right:14px; position:relative; }
  .mp-team + .mp-team { border-top:1px solid var(--line); }
  .mp-team::before { content:""; width:9px; align-self:stretch; background:var(--tc); flex:none; }
  .mp-logo { width:56px; height:56px; border-radius:50%; flex:none; background:#fff center/cover no-repeat; box-shadow:0 0 0 2px rgba(255,255,255,.85); }
  .mp-nologo .mp-logo { display:none; }
  .mp-name { flex:1; min-width:0; font-size:34px; font-weight:900; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-block:3px; }
  .mp-jack { width:22px; height:22px; border-radius:50%; flex:none; background:var(--gold); box-shadow:0 0 0 2px #fff;
    transform:scale(0); transition:transform .3s cubic-bezier(.3,1.6,.6,1); }
  .mp-team.j .mp-jack { transform:scale(1); }
  .mp-balls { display:flex; gap:6px; flex:none; }
  .mp-noballs .mp-balls { display:none; }
  .mp-balls i { width:20px; height:20px; border-radius:50%; background:radial-gradient(circle at 35% 30%,#fff 0 8%,var(--tc) 45%,rgba(0,0,0,.55) 120%);
    box-shadow:0 0 0 1.5px rgba(255,255,255,.55); transition:opacity .3s, transform .3s; }
  .mp-balls i.used { opacity:.22; transform:scale(.7); box-shadow:none; }
  .mp-score { width:92px; height:62px; flex:none; display:grid; place-items:center; background:var(--tc); border-radius:10px;
    font-family:var(--num); font-weight:700; font-size:54px; line-height:1; font-variant-numeric:tabular-nums; }
  .mp-score.pop { animation:mp-pop .6s ease; }
  @keyframes mp-pop { 0%{transform:scale(1)} 30%{transform:scale(1.22); box-shadow:0 0 0 4px var(--gold)} 100%{transform:scale(1)} }
  .mp-foot { display:inline-flex; gap:10px; align-items:center; background:var(--bar2); border-radius:0 0 10px 10px; margin-left:18px;
    padding:4px 18px 5px; font-size:23px; font-weight:700; }
  .mp-foot .mp-dim { opacity:.65; font-weight:500; }
  .mp-clock { font-family:var(--num); font-weight:500; font-size:24px; letter-spacing:.03em; opacity:.8; }
  .mp-clock:empty { display:none; }
  .mp-fw { display:flex; }
  .mp-flash { margin-top:8px; display:inline-flex; align-items:center; gap:10px; background:var(--tc); padding:5px 14px 5px 12px; border-radius:10px;
    font-size:28px; font-weight:700; transform:translateY(-12px); opacity:0; transition:all .35s; }
  .mp-flash.on { transform:none; opacity:1; }
  .mp-flash b { font-family:var(--num); font-size:34px; background:rgba(0,0,0,.25); border-radius:8px; padding:0 10px; }
  .mp-win { position:absolute; left:50%; top:50%; width:820px; transform-origin:0 0; font-family:var(--lao); color:#fff; text-align:center;
    opacity:0; transition:opacity .4s; }
  .mp-win.on { opacity:1; }
  .mp-wcard { background:var(--bar); border-radius:18px; overflow:hidden; box-shadow:0 18px 50px rgba(0,0,0,.55); }
  .mp-win.on .mp-wcard { animation:mp-rise .6s cubic-bezier(.2,1.4,.5,1); }
  @keyframes mp-rise { from { transform:translateY(40px) scale(.9) } to { transform:none } }
  .mp-wtop { background:var(--tc); padding:18px 20px 14px; display:grid; justify-items:center; gap:6px; }
  .mp-wlogo { width:96px; height:96px; border-radius:50%; background:#fff center/cover no-repeat; box-shadow:0 0 0 4px #fff; }
  .mp-nologo .mp-wlogo { display:none; }
  .mp-lbl { font-size:24px; font-weight:700; letter-spacing:.04em; color:var(--gold); }
  .mp-who { font-size:56px; font-weight:900; line-height:1.35; }
  .mp-fs { font-family:var(--num); font-weight:700; font-size:96px; line-height:1.05; padding:10px 0 4px; }
  .mp-meta { font-size:22px; opacity:.8; padding-bottom:18px; }
  .mp-fanny { display:inline-block; background:var(--gold); color:#1a1404; font-weight:900; border-radius:999px; padding:2px 18px; font-size:26px; margin-bottom:12px; }
  .mp-tap .mp-team, .mp-tap .mp-win.on { pointer-events:auto; cursor:pointer; touch-action:manipulation;
    -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; -webkit-tap-highlight-color:transparent; }
  .mp-tap .mp-team.press { background:rgba(255,255,255,.07); }
  .mp-flash { position:relative; overflow:hidden; }
  .mp-flash.pend::after { content:""; position:absolute; left:0; bottom:0; height:4px; width:100%; background:#fff; opacity:.85;
    transform-origin:0 50%; animation:mp-wait var(--wait,2.5s) linear forwards; }
  @keyframes mp-wait { from { transform:scaleX(1) } to { transform:scaleX(0) } }
  @media (prefers-reduced-motion:reduce) { .mp-root * { animation:none !important; transition:none !important; } }`;

  const team = (i) => `
      <div class="mp-team" data-k="s${i}" style="--tc:var(--${i ? 'b' : 'a'})">
        <span class="mp-logo" data-k="l${i}"></span><span class="mp-name" data-k="n${i}"></span><i class="mp-jack"></i>
        <span class="mp-balls" data-k="b${i}"></span><span class="mp-score" data-k="c${i}">0</span>
      </div>`;
  const HTML = `
  <div class="mp-bug off">
    <div class="mp-title" data-k="title"></div>
    <div class="mp-card">${team(0)}${team(1)}</div>
    <div class="mp-foot"><span data-k="endno"></span><span class="mp-dim" data-k="target"></span><span class="mp-clock" data-k="clock"></span></div>
    <div class="mp-fw"><div class="mp-flash" data-k="flash"><span data-k="fname"></span><b data-k="fpts"></b></div></div>
  </div>
  <div class="mp-win"><div class="mp-wcard"><div class="mp-wtop"><span class="mp-wlogo" data-k="wlogo"></span><div class="mp-lbl">ຜູ້ຊະນະ</div><div class="mp-who" data-k="wname"></div></div>
    <div class="mp-fs" data-k="wscore"></div><div data-k="wfanny" hidden><span class="mp-fanny">ແຟນນີ້! 13–0</span></div><div class="mp-meta" data-k="wmeta"></div></div></div>`;

  const BALLS = { single:3, double:6, triple:6 };
  const list = (v) => Array.isArray(v) ? v.filter(Boolean)
    : v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]).filter(Boolean) : [];
  const fmt = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60,
    p = (n) => String(n).padStart(2, '0'); return (h ? h + ':' : '') + p(m) + ':' + p(s); };
  const bg = (url) => url ? 'url("' + String(url).replace(/"/g, '%22') + '")' : 'none';

  function mount(db, opts) {
    opts = opts || {};
    if (!document.getElementById('mp-css')) {
      const st = document.createElement('style'); st.id = 'mp-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const root = document.createElement('div'); root.className = 'mp-root'; root.innerHTML = HTML;
    document.body.appendChild(root);
    const el = {}; root.querySelectorAll('[data-k]').forEach((n) => { el[n.dataset.k] = n; });
    const bug = root.querySelector('.mp-bug'), win = root.querySelector('.mp-win');

    let S = null, last = null, lastEventAt = 0, flashT = null, ballSig = '';

    function layout() {
      const W = innerWidth, H = innerHeight, land = W >= H;
      // ຂະໜາດກາງ: ກວ້າງ 55% ຂອງຈໍແນວນອນ, 92% ຂອງຈໍແນວຕັ້ງ
      const k = W * (land ? .55 : .92) / DESIGN_W * ((S && S.size) || 1), m = W * (land ? .022 : .04);
      const kk = Math.min(k, (W - 2 * m) / DESIGN_W);
      const w = DESIGN_W * kk, h = bug.offsetHeight * kk, pos = (S && S.pos) || 'tl';
      let x = m, y = m;
      if (pos === 'tc' || pos === 'bc') x = (W - w) / 2;
      if (pos === 'tr') x = W - w - m;
      if (pos === 'bl' || pos === 'bc' || pos === 'br') y = H - h - m;
      if (pos === 'br') x = W - w - m;
      bug.style.left = x + 'px'; bug.style.top = y + 'px'; bug.style.transform = 'scale(' + kk + ')';
      const wk = Math.min(W * .8 / 820, H * .8 / 560);
      win.style.transform = 'scale(' + wk + ') translate(-50%,-50%)';
    }

    function tick() {
      el.clock.textContent = S && S.startedAt && S.clock !== false ? fmt((S.finishedAt || Date.now()) - S.startedAt) : '';
    }

    function render() {
      const on = !!S && S.show !== false;
      bug.classList.toggle('off', !on);
      if (!S) { win.classList.remove('on'); return; }
      const ends = list(S.ends), teams = list(S.teams), target = S.target || 13;
      const name = (i) => (teams[i] && teams[i].name) || (i ? 'ທີມ B' : 'ທີມ A');
      const logo = (i) => (teams[i] && teams[i].logo) || '';
      const sc = [0, 0]; ends.forEach((e) => { if (!e.n) sc[e.t] += e.p; });
      const w = sc[0] >= target ? 0 : sc[1] >= target ? 1 : null;
      const jt = ends.length ? ends[ends.length - 1].t : (S.firstJack == null ? null : S.firstJack);
      const nb = BALLS[S.format] || 6, th = S.thrown || {}, thrown = [+th[0] || 0, +th[1] || 0];
      const logosOn = S.logos !== false && (logo(0) || logo(1));
      root.classList.toggle('mp-nologo', !logosOn);
      root.classList.toggle('mp-noballs', S.balls === false || w !== null);
      root.style.setProperty('--a', (teams[0] && teams[0].color) || '#1c5cd0');
      root.style.setProperty('--b', (teams[1] && teams[1].color) || '#d6281e');
      el.title.textContent = S.title || '';
      el.endno.textContent = w === null ? 'ຮອບທີ ' + (ends.length + 1) : 'ຈົບເກມ';
      el.target.textContent = 'ເກມ ' + target;
      const sig = [nb, thrown[0], thrown[1]].join(',');
      [0, 1].forEach((i) => {
        el['n' + i].textContent = name(i);
        el['l' + i].style.backgroundImage = bg(logo(i));
        const c = el['c' + i];
        if (last && last[i] !== sc[i]) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
        c.textContent = sc[i];
        el['s' + i].classList.toggle('j', w === null && jt === i);
        if (sig !== ballSig) {
          const used = Math.min(nb, +thrown[i] || 0);
          el['b' + i].innerHTML = Array.from({ length:nb }, (_, n) => `<i class="${n >= nb - used ? 'used' : ''}"></i>`).join('');
        }
      });
      ballSig = sig; last = sc;

      const ev = S.lastEvent;
      if (ev && ev.at && ev.at !== lastEventAt) {
        const fresh = lastEventAt !== 0 && Date.now() - ev.at < 15000;
        lastEventAt = ev.at;
        if (fresh && on) {
          const f = el.flash;
          if (ev.n) {
            f.style.setProperty('--tc', '#4a5260');
            el.fname.textContent = 'ຮອບນີ້ ໂມຄະ'; el.fpts.textContent = '0';
          } else {
            f.style.setProperty('--tc', ev.t ? 'var(--b)' : 'var(--a)');
            el.fname.textContent = name(ev.t) + ' ໄດ້'; el.fpts.textContent = '+' + ev.p;
          }
          f.classList.add('on'); clearTimeout(flashT); flashT = setTimeout(() => f.classList.remove('on'), 3500);
        }
      } else if (!ev) lastEventAt = lastEventAt || 1;

      if (w !== null) {
        win.style.setProperty('--tc', w ? 'var(--b)' : 'var(--a)');
        el.wlogo.style.backgroundImage = bg(logo(w));
        el.wlogo.hidden = !logo(w);
        el.wname.textContent = name(w);
        el.wscore.textContent = sc[w] + ' – ' + sc[1 - w];
        el.wfanny.hidden = sc[1 - w] !== 0;
        el.wmeta.textContent = ends.length + ' ຮອບ' + (S.startedAt ? ' · ' + fmt((S.finishedAt || Date.now()) - S.startedAt) : '');
      }
      win.classList.toggle('on', on && w !== null && S.showWin !== false);
      tick(); layout();
    }

    if (opts.tap) setupTap();

    // ---------- ໂໝດກົດເທິງຈໍ (overlay.html?...&tap=1)
    // ກົດກ່ອງຄະແນນ = +1 (ກົດຕໍ່ກັນໄດ້ +2, +3…, ລໍ 2.5 ວິ ຈຶ່ງບັນທຶກເປັນ 1 ຮອບ)
    // ກົດຄ້າງກ່ອງຄະແນນ = ຍົກເລີກ (ຄະແນນທີ່ກຳລັງນັບ ຫຼື ຮອບລ່າສຸດ)
    // ກົດແຖບທີມ (ຊື່/ລູກ) = ໂຍນ 1 ລູກ · ກົດຄ້າງ = ຄືນ 1 ລູກ · ກົດປ້າຍຜູ້ຊະນະ = ເຊື່ອງປ້າຍ
    function setupTap() {
      root.classList.add('mp-tap');
      const WAIT = 2500, HOLD = 650;
      let pend = null;
      const can = () => !opts.tap.canWrite || opts.tap.canWrite();
      const state = () => {
        const n = JSON.parse(JSON.stringify(S));
        n.ends = list(n.ends); n.teams = list(n.teams);
        const th = n.thrown || {}; n.thrown = [+th[0] || 0, +th[1] || 0];
        return n;
      };
      const scoreOf = (n) => { const sc = [0, 0]; n.ends.forEach((e) => { if (!e.n) sc[e.t] += e.p; }); return sc; };
      const winOf = (n) => { const sc = scoreOf(n), t = n.target || 13; return sc[0] >= t ? 0 : sc[1] >= t ? 1 : null; };
      const nameOf = (i) => { const t = list(S.teams)[i]; return (t && t.name) || (i ? 'ທີມ B' : 'ທີມ A'); };
      const save = (n) => db.set('petanque', n).catch((e) => note('ບັນທຶກບໍ່ໄດ້: ' + (e.code || e.message), '#4a5260'));
      function note(txt, color, pts) {
        const f = el.flash;
        f.style.setProperty('--tc', color);
        el.fname.textContent = txt; el.fpts.textContent = pts || ''; el.fpts.hidden = !pts;
        f.classList.remove('pend'); f.classList.add('on');
        clearTimeout(flashT); flashT = setTimeout(() => { f.classList.remove('on'); el.fpts.hidden = false; }, 2500);
      }
      function showPend() {
        const f = el.flash;
        f.style.setProperty('--tc', pend.t ? 'var(--b)' : 'var(--a)'); f.style.setProperty('--wait', WAIT + 'ms');
        el.fname.textContent = nameOf(pend.t) + ' ໄດ້'; el.fpts.textContent = '+' + pend.p; el.fpts.hidden = false;
        clearTimeout(flashT); f.classList.remove('pend'); void f.offsetWidth; f.classList.add('on', 'pend');
      }
      function commit() {
        if (!pend) return;
        const { t, p } = pend; clearTimeout(pend.timer); pend = null;
        el.flash.classList.remove('pend');
        const n = state(); if (winOf(n) !== null) return;
        if (!n.startedAt) n.startedAt = Date.now();
        n.ends.push({ t, p }); n.lastEvent = { t, p, at: Date.now() }; n.thrown = [0, 0];
        if (winOf(n) !== null) { n.finishedAt = Date.now(); n.showWin = true; }
        save(n);
      }
      function scoreTap(t) {
        const n = state(); if (winOf(n) !== null) return;
        if (pend && pend.t !== t) commit();
        if (!pend) pend = { t, p: 0 };
        pend.p = Math.min(BALLS[n.format] || 6, pend.p + 1);
        clearTimeout(pend.timer); pend.timer = setTimeout(commit, WAIT);
        showPend();
      }
      function scoreHold() {
        if (pend) { clearTimeout(pend.timer); pend = null; note('ຍົກເລີກແລ້ວ', '#4a5260'); return; }
        const n = state(); if (!n.ends.length) return;
        n.ends.pop(); n.finishedAt = null; n.lastEvent = null; n.thrown = [0, 0];
        save(n); note('ຍົກເລີກຮອບລ່າສຸດ', '#4a5260');
      }
      function ball(t, d) {
        const n = state(); if (winOf(n) !== null) return;
        n.thrown[t] = Math.max(0, Math.min(BALLS[n.format] || 6, n.thrown[t] + d)); save(n);
      }
      function press(node, onTap, onHold) {
        let timer = null, held = false, down = false;
        const end = () => { clearTimeout(timer); node.classList.remove('press'); down = false; };
        node.addEventListener('pointerdown', (e) => {
          if (!S) return; e.preventDefault(); down = true; held = false; node.classList.add('press');
          timer = setTimeout(() => { held = true; end(); if (!can()) { if (opts.tap.needLogin) opts.tap.needLogin(); return; } onHold(e); }, HOLD);
        });
        node.addEventListener('pointerup', (e) => {
          if (!down) return; end(); if (held) return;
          if (!can()) { if (opts.tap.needLogin) opts.tap.needLogin(); return; }
          onTap(e);
        });
        ['pointercancel', 'pointerleave'].forEach((ev) => node.addEventListener(ev, end));
        node.addEventListener('contextmenu', (e) => e.preventDefault());
      }
      [0, 1].forEach((i) => press(el['s' + i],
        (e) => e.target.closest('.mp-score') ? scoreTap(i) : ball(i, 1),
        (e) => e.target.closest('.mp-score') ? scoreHold() : ball(i, -1)));
      press(win, () => { const n = state(); n.showWin = false; save(n); }, () => {});
    }

    setInterval(tick, 1000);
    addEventListener('resize', layout);
    if (document.fonts) document.fonts.ready.then(layout);
    layout();
    return db.watch('petanque', (v) => { S = v || null; render(); if (opts.onState) opts.onState(S); });
  }

  window.MeePetanque = { mount, BALLS };
})();
