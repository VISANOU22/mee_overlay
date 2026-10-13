// ===== Mee Overlay — ສະກໍບອດເປຕັ່ງ (ໃຊ້ຮ່ວມກັນ: overlay.html ແລະ petanque-overlay.html) =====
// MeePetanque.mount(db) — ຕິດຕາມ overlays/{uid}/petanque ແລ້ວແຕ້ມສະກໍເທິງ overlay
(() => {
  const CSS = `
  .mp-root { position:absolute; inset:0; pointer-events:none; z-index:50; }
  .mp-root * { box-sizing:border-box; }
  .mp-root { --a:#1c5cd0; --b:#d6281e; --gold:#ffc21a; --bar:#10141b; --bar2:#1d232d;
    --lao:'Noto Sans Lao','Phetsarath OT',system-ui,sans-serif; --num:'Oswald','Arial Narrow',sans-serif; }
  .mp-bug { position:absolute; width:760px; transform-origin:0 0; font-family:var(--lao); color:#fff;
    transition:opacity .35s; filter:drop-shadow(0 6px 14px rgba(0,0,0,.45)); }
  .mp-bug.off { opacity:0; }
  .mp-head { display:flex; align-items:center; gap:12px; background:var(--bar); height:40px; padding:0 14px;
    border-radius:10px 10px 0 0; font-size:17px; font-weight:700; width:max-content; max-width:100%; }
  .mp-ball { width:18px; height:18px; border-radius:50%; flex:none;
    background:radial-gradient(circle at 35% 30%,#fff 0 10%,#c9d0d8 25%,#7b8592 62%,#424a55 100%); }
  .mp-sep { opacity:.4 }
  .mp-clock { font-family:var(--num); font-weight:500; font-size:19px; letter-spacing:.03em; opacity:.85 }
  .mp-row { display:grid; grid-template-columns:1fr 1fr; background:var(--bar); border-radius:0 10px 10px 10px; overflow:hidden; }
  .mp-side { display:flex; align-items:stretch; height:84px; position:relative; }
  .mp-side.r { flex-direction:row-reverse; }
  .mp-name { flex:1; min-width:0; display:flex; align-items:center; gap:10px; padding:0 16px; background:var(--tc);
    font-size:26px; font-weight:900; line-height:1.25; }
  .mp-side.r .mp-name { flex-direction:row-reverse; text-align:right; }
  .mp-name span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-block:4px; }
  .mp-jack { width:20px; height:20px; border-radius:50%; flex:none; background:var(--gold); box-shadow:0 0 0 3px rgba(255,255,255,.9);
    transform:scale(0); transition:transform .3s cubic-bezier(.3,1.6,.6,1); }
  .mp-side.j .mp-jack { transform:scale(1); }
  .mp-score { width:104px; flex:none; display:grid; place-items:center; background:var(--bar2);
    font-family:var(--num); font-weight:700; font-size:64px; line-height:1; font-variant-numeric:tabular-nums; }
  .mp-score.pop { animation:mp-pop .6s ease; }
  @keyframes mp-pop { 0%{transform:scale(1)} 30%{transform:scale(1.25); color:var(--gold)} 100%{transform:scale(1)} }
  .mp-prog { position:absolute; left:0; right:0; bottom:0; height:6px; background:rgba(0,0,0,.35); }
  .mp-prog i { position:absolute; top:0; bottom:0; left:0; background:var(--gold); transition:width .5s; }
  .mp-side.r .mp-prog i { left:auto; right:0; }
  .mp-fw { display:flex; }
  .mp-flash { margin-top:8px; display:inline-flex; align-items:center; gap:10px; background:var(--tc); padding:6px 16px 6px 12px; border-radius:10px;
    font-size:22px; font-weight:700; transform:translateY(-12px); opacity:0; transition:all .35s; }
  .mp-flash.on { transform:none; opacity:1; }
  .mp-flash.r { margin-left:auto; }
  .mp-flash b { font-family:var(--num); font-size:28px; background:rgba(0,0,0,.25); border-radius:8px; padding:0 10px; }
  .mp-win { position:absolute; left:50%; top:50%; width:820px; transform-origin:0 0; font-family:var(--lao); color:#fff; text-align:center;
    opacity:0; transition:opacity .4s; }
  .mp-win.on { opacity:1; }
  .mp-card { background:var(--bar); border-radius:18px; overflow:hidden; box-shadow:0 18px 50px rgba(0,0,0,.55); }
  .mp-win.on .mp-card { animation:mp-rise .6s cubic-bezier(.2,1.4,.5,1); }
  @keyframes mp-rise { from { transform:translateY(40px) scale(.9) } to { transform:none } }
  .mp-top { background:var(--tc); padding:18px 20px 14px; }
  .mp-lbl { font-size:24px; font-weight:700; letter-spacing:.04em; color:var(--gold); }
  .mp-who { font-size:56px; font-weight:900; line-height:1.35; }
  .mp-fs { font-family:var(--num); font-weight:700; font-size:96px; line-height:1.05; padding:10px 0 4px; }
  .mp-meta { font-size:22px; opacity:.8; padding-bottom:18px; }
  .mp-fanny { display:inline-block; background:var(--gold); color:#1a1404; font-weight:900; border-radius:999px; padding:2px 18px; font-size:26px; margin-bottom:12px; }
  @media (prefers-reduced-motion:reduce) { .mp-root * { animation:none !important; transition:none !important; } }`;

  const HTML = `
  <div class="mp-bug off">
    <div class="mp-head"><span class="mp-ball"></span><span data-k="title">ເປຕັ່ງ</span><span class="mp-sep">|</span><span data-k="endno"></span><span class="mp-sep">|</span><span data-k="target"></span><span class="mp-clock" data-k="clock"></span></div>
    <div class="mp-row">
      <div class="mp-side" data-k="s0" style="--tc:var(--a)"><div class="mp-name"><span data-k="n0"></span><i class="mp-jack"></i></div><div class="mp-score" data-k="c0">0</div><div class="mp-prog"><i data-k="g0"></i></div></div>
      <div class="mp-side r" data-k="s1" style="--tc:var(--b)"><div class="mp-name"><span data-k="n1"></span><i class="mp-jack"></i></div><div class="mp-score" data-k="c1">0</div><div class="mp-prog"><i data-k="g1"></i></div></div>
    </div>
    <div class="mp-fw"><div class="mp-flash" data-k="flash"><span data-k="fname"></span><b data-k="fpts"></b></div></div>
  </div>
  <div class="mp-win"><div class="mp-card"><div class="mp-top"><div class="mp-lbl">ຜູ້ຊະນະ</div><div class="mp-who" data-k="wname"></div></div>
    <div class="mp-fs" data-k="wscore"></div><div data-k="wfanny" hidden><span class="mp-fanny">ແຟນນີ້! 13–0</span></div><div class="mp-meta" data-k="wmeta"></div></div></div>`;

  const list = (v) => Array.isArray(v) ? v.filter(Boolean)
    : v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]).filter(Boolean) : [];
  const fmt = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60,
    p = (n) => String(n).padStart(2, '0'); return (h ? h + ':' : '') + p(m) + ':' + p(s); };

  function mount(db, opts) {
    opts = opts || {};
    if (!document.getElementById('mp-css')) {
      const st = document.createElement('style'); st.id = 'mp-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const root = document.createElement('div'); root.className = 'mp-root'; root.innerHTML = HTML;
    document.body.appendChild(root);
    const el = {}; root.querySelectorAll('[data-k]').forEach((n) => { el[n.dataset.k] = n; });
    const bug = root.querySelector('.mp-bug'), win = root.querySelector('.mp-win');

    let S = null, last = null, lastEventAt = 0, flashT = null;

    function layout() {
      const W = innerWidth, H = innerHeight, base = W >= H ? 1920 : 1000;
      const k = W / base * ((S && S.size) || 1), m = 28 * (W / base);
      const w = 760 * k, h = bug.offsetHeight * k, pos = (S && S.pos) || 'tl';
      let x = m, y = m;
      if (pos === 'tc' || pos === 'bc') x = (W - w) / 2;
      if (pos === 'tr') x = W - w - m;
      if (pos === 'bc') y = H - h - m;
      bug.style.left = x + 'px'; bug.style.top = y + 'px'; bug.style.transform = 'scale(' + k + ')';
      const wk = Math.min(W * .8 / 820, H * .8 / 520);
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
      const sc = [0, 0]; ends.forEach((e) => { sc[e.t] += e.p; });
      const w = sc[0] >= target ? 0 : sc[1] >= target ? 1 : null;
      const jt = ends.length ? ends[ends.length - 1].t : (S.firstJack == null ? null : S.firstJack);
      root.style.setProperty('--a', (teams[0] && teams[0].color) || '#1c5cd0');
      root.style.setProperty('--b', (teams[1] && teams[1].color) || '#d6281e');
      el.title.textContent = S.title || 'ເປຕັ່ງ';
      el.endno.textContent = w === null ? 'ຮອບ ' + (ends.length + 1) : 'ຈົບເກມ';
      el.target.textContent = 'ເກມ ' + target;
      [0, 1].forEach((i) => {
        el['n' + i].textContent = name(i);
        const c = el['c' + i];
        if (last && last[i] !== sc[i]) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
        c.textContent = sc[i];
        el['g' + i].style.width = Math.min(100, sc[i] / target * 100) + '%';
        el['s' + i].classList.toggle('j', w === null && jt === i);
      });
      last = sc;

      const ev = S.lastEvent;
      if (ev && ev.at && ev.at !== lastEventAt) {
        const fresh = lastEventAt !== 0 && Date.now() - ev.at < 15000;
        lastEventAt = ev.at;
        if (fresh && on) {
          const f = el.flash;
          f.style.setProperty('--tc', ev.t ? 'var(--b)' : 'var(--a)');
          f.classList.toggle('r', ev.t === 1);
          el.fname.textContent = name(ev.t) + ' ໄດ້'; el.fpts.textContent = '+' + ev.p;
          f.classList.add('on'); clearTimeout(flashT); flashT = setTimeout(() => f.classList.remove('on'), 3500);
        }
      } else if (!ev) lastEventAt = lastEventAt || 1;

      if (w !== null) {
        win.style.setProperty('--tc', w ? 'var(--b)' : 'var(--a)');
        el.wname.textContent = name(w);
        el.wscore.textContent = sc[w] + ' – ' + sc[1 - w];
        el.wfanny.hidden = sc[1 - w] !== 0;
        el.wmeta.textContent = ends.length + ' ຮອບ' + (S.startedAt ? ' · ' + fmt((S.finishedAt || Date.now()) - S.startedAt) : '');
      }
      win.classList.toggle('on', on && w !== null && S.showWin !== false);
      tick(); layout();
    }

    setInterval(tick, 1000);
    addEventListener('resize', layout);
    if (document.fonts) document.fonts.ready.then(layout);
    layout();
    return db.watch('petanque', (v) => { S = v || null; render(); if (opts.onState) opts.onState(S); });
  }

  window.MeePetanque = { mount };
})();
