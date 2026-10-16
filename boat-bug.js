// ===== Mee Overlay — ປ້າຍຖ່າຍທອດ ແຂ່ງເຮືອຊ່ວງ (overlay.html) =====
// MeeBoat.mount(db) — ຕິດຕາມ overlays/{uid}/boat ແລ້ວແຕ້ມ:
//   ແຖບຄູ່ແຂ່ງ (ທີມ · ຂວາ · ໂລໂກ້ · ຊ້າຍ · ທີມ) + ແຖບປະເພດເຮືອ — ລາກ/ປັບຂະໜາດໄດ້ (data-edit="boat")
//   ແຖບລາຍລະອຽດ ຍາວເຕັມຈໍລຸ່ມສຸດ (ເລື່ອນ ຫຼື ປ່ຽນທີລະແຖວ)
(() => {
  const DW = 1500;   // ຄວາມກວ້າງອອກແບບຂອງແຖບຄູ່ແຂ່ງ
  const THEMES = {
    green: { c1: '#0b6b3a', c2: '#f5b51b', ink: '#ffffff' },
    red: { c1: '#c8102e', c2: '#ffc21a', ink: '#ffffff' },
    blue: { c1: '#0f3d91', c2: '#ffc21a', ink: '#ffffff' },
    dark: { c1: '#151a23', c2: '#ffc21a', ink: '#ffffff' },
  };
  const CSS = `
  .mb-root { position:absolute; inset:0; pointer-events:none; z-index:48; font-family:'MeeLao','Noto Sans Lao',sans-serif; color:#fff; }
  .mb-root * { box-sizing:border-box; }
  .mb-bar { position:absolute; width:${DW}px; transform-origin:0 0; transition:opacity .4s; filter:drop-shadow(0 8px 18px rgba(0,0,0,.4)); }
  .mb-bar.off, .mb-tick.off { opacity:0; }
  .mb-top { display:flex; justify-content:center; height:44px; }
  .mb-round { align-self:flex-end; background:var(--c2); color:#1a1404; font-weight:900; font-size:24px; line-height:1.3; padding:4px 26px 2px;
    border-radius:14px 14px 0 0; white-space:nowrap; }
  .mb-round:empty { visibility:hidden; }
  .mb-row { position:relative; display:flex; align-items:center; height:112px; }
  .mb-plate { flex:1; min-width:0; height:96px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:0;
    background:linear-gradient(180deg, color-mix(in srgb, var(--c1) 82%, #fff) 0%, var(--c1) 45%, color-mix(in srgb, var(--c1) 80%, #000) 100%);
    border:5px solid var(--c2); position:relative; padding:0 26px; transition:background .4s, opacity .4s; }
  .mb-plate.a { border-radius:44px 0 0 44px; border-right:0; }
  .mb-plate.b { border-radius:0 44px 44px 0; border-left:0; }
  .mb-name { max-width:100%; font-size:40px; font-weight:900; line-height:1.25; white-space:nowrap; transform-origin:50% 50%; padding-block:2px; }
  .mb-sub { max-width:100%; font-size:21px; font-weight:700; line-height:1.2; margin-top:-2px; opacity:.9; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mb-sub:empty { display:none; }
  .mb-lane { width:118px; height:96px; flex:none; display:grid; place-items:center; background:#fff; color:var(--c1);
    border-top:5px solid var(--c2); border-bottom:5px solid var(--c2); font-size:40px; font-weight:900; }
  .mb-lane.a { border-radius:0; } .mb-lane.b { border-radius:0; }
  .mb-mid { width:150px; flex:none; position:relative; height:112px; display:grid; place-items:center; }
  .mb-mid::before { content:""; position:absolute; left:0; right:0; top:8px; bottom:8px; background:#fff; border-top:5px solid var(--c2); border-bottom:5px solid var(--c2); }
  .mb-logo { position:relative; width:140px; height:140px; border-radius:50%; background:var(--c2) center/74% no-repeat; border:6px solid #fff;
    box-shadow:0 0 0 5px var(--c2), 0 6px 14px rgba(0,0,0,.35); display:grid; place-items:center; font-size:30px; font-weight:900; color:var(--c1);
    margin-top:-6px; z-index:1; }
  .mb-logo.img { background-color:#fff; }
  .mb-bot { display:flex; justify-content:center; margin-top:-8px; position:relative; z-index:2; }
  .mb-cat { background:var(--c1); color:#fff; border:4px solid var(--c2); border-top:0; border-radius:0 0 18px 18px; font-size:26px; font-weight:700;
    line-height:1.3; padding:4px 34px 6px; white-space:nowrap; min-width:360px; text-align:center; }
  .mb-cat:empty { display:none; }
  /* ຜົນ */
  .mb-plate.win { background:linear-gradient(180deg, #fff3c4 0%, var(--c2) 55%, color-mix(in srgb, var(--c2) 75%, #000) 100%); color:#1a1404; }
  .mb-plate.lose { opacity:.55; }
  .mb-badge { position:absolute; top:-46px; left:50%; transform:translate(-50%, 12px) scale(.6); opacity:0; background:var(--c2); color:#1a1404;
    font-weight:900; font-size:24px; line-height:1.3; padding:3px 18px; border-radius:12px; white-space:nowrap; transition:all .45s cubic-bezier(.3,1.5,.6,1);
    box-shadow:0 4px 10px rgba(0,0,0,.35); }
  .mb-plate.win .mb-badge { opacity:1; transform:translate(-50%, 0) scale(1); }
  .mb-plate.win .mb-name { animation:mb-pop .7s ease; }
  @keyframes mb-pop { 0%{transform:scale(1)} 35%{transform:scale(1.12)} 100%{transform:scale(1)} }
  /* ແຖບລາຍລະອຽດ ຍາວເຕັມຈໍ */
  .mb-tick { position:absolute; left:0; right:0; bottom:0; display:flex; align-items:stretch; transition:opacity .4s; overflow:hidden;
    background:var(--c1); border-top:var(--tl) solid var(--c2); box-shadow:0 -4px 14px rgba(0,0,0,.3); }
  .mb-tlab { flex:none; display:flex; align-items:center; padding:0 1.1em; background:var(--c2); color:#1a1404; font-weight:900; white-space:nowrap;
    clip-path:polygon(0 0, 100% 0, calc(100% - .7em) 100%, 0 100%); padding-right:1.6em; }
  .mb-tlab:empty { display:none; }
  .mb-tview { flex:1; min-width:0; position:relative; overflow:hidden; }
  .mb-ttrack { position:absolute; left:0; top:0; bottom:0; display:flex; align-items:center; white-space:nowrap; font-weight:700; }
  .mb-ttrack.run { animation:mb-scroll var(--dur,20s) linear infinite; }
  .mb-ttrack span { padding-right:3em; }
  @keyframes mb-scroll { from { transform:translateX(0) } to { transform:translateX(calc(-1 * var(--set))) } }
  .mb-tline { position:absolute; inset:0; display:flex; align-items:center; padding:0 .8em; white-space:nowrap; font-weight:700;
    transform:translateY(100%); opacity:0; transition:transform .5s, opacity .5s; }
  .mb-tline.on { transform:none; opacity:1; }
  .mb-tline.out { transform:translateY(-100%); opacity:0; }
  .mb-tline > span { display:inline-block; transform-origin:0 50%; }
  @media (prefers-reduced-motion:reduce) { .mb-root * { animation:none !important; transition:none !important; } }`;

  const list = (v) => Array.isArray(v) ? v.filter(Boolean) : v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map((k) => v[k]).filter(Boolean) : [];
  const bg = (u) => (u ? 'url("' + String(u).replace(/"/g, '%22') + '")' : 'none');

  function mount(db) {
    if (!document.getElementById('mb-css')) { const st = document.createElement('style'); st.id = 'mb-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (!document.getElementById('mp-fonts')) { const lk = document.createElement('link'); lk.id = 'mp-fonts'; lk.rel = 'stylesheet'; lk.href = 'fonts/fonts.css?v=1'; document.head.appendChild(lk); }
    const root = document.createElement('div'); root.className = 'mb-root';
    const side = (k) => `<div class="mb-plate ${k}" data-k="p${k}"><span class="mb-badge" data-k="w${k}"></span><div class="mb-name"><span data-k="n${k}"></span></div><div class="mb-sub" data-k="s${k}"></div></div>`;
    root.innerHTML = `
      <div class="mb-bar off" data-edit="boat">
        <div class="mb-top"><div class="mb-round" data-k="round"></div></div>
        <div class="mb-row">${side('a')}<div class="mb-lane a" data-k="la"></div><div class="mb-mid"><div class="mb-logo" data-k="logo"></div></div><div class="mb-lane b" data-k="lb"></div>${side('b')}</div>
        <div class="mb-bot"><div class="mb-cat" data-k="cat"></div></div>
      </div>
      <div class="mb-tick off" data-k="tick"><div class="mb-tlab" data-k="tlab"></div><div class="mb-tview" data-k="tview"></div></div>`;
    document.body.appendChild(root);
    const el = {}; root.querySelectorAll('[data-k]').forEach((n) => { el[n.dataset.k] = n; });
    const bar = root.querySelector('.mb-bar');
    let S = null, override = null, tickSig = '', rotT = null, lastWin = '';
    window.__mbPreview = { set(o) { override = Object.assign(override || {}, o); layout(); } };

    function fitName(k) {
      const sp = el['n' + k], wrap = sp.parentElement; sp.style.display = 'inline-block'; sp.style.transform = '';
      const k2 = Math.min(1, (wrap.parentElement.clientWidth - 52) / Math.max(1, sp.scrollWidth));
      if (k2 < 1) sp.style.transform = 'scaleX(' + Math.max(.5, k2) + ')';
    }
    function layout() {
      const W = innerWidth, H = innerHeight, land = W >= H;
      const L = Object.assign({}, S || {}, override || {});
      const tickOn = !!S && S.tickerOn !== false;
      const th = Math.round(Math.max(28, H * (land ? .065 : .045)) * (+((S && S.ticker && S.ticker.size)) || 1));
      el.tick.style.height = th + 'px'; el.tick.style.fontSize = Math.round(th * .5) + 'px'; el.tick.style.setProperty('--tl', Math.max(3, Math.round(th * .1)) + 'px');
      const k = Math.min(W * (land ? .78 : .98) / DW * (+L.size || 1), W / DW);
      const w = DW * k, h = bar.offsetHeight * k, m = W * .02;
      let x, y;
      if (L.fx != null && L.fy != null) { x = Math.max(0, Math.min(W - w, L.fx * W)); y = Math.max(0, Math.min(H - h, L.fy * H)); }
      else { x = (W - w) / 2; y = H - h - (tickOn ? th : 0) - m; }
      bar.style.left = x + 'px'; bar.style.top = y + 'px'; bar.style.transform = 'scale(' + k + ')';
      fitTicker();
    }

    function fitTicker() {
      const tr = el.tview.querySelector('.mb-ttrack');
      if (tr) {
        const first = tr.firstElementChild; if (!first) return;
        const set = first.offsetWidth; if (!set) return;
        while (tr.children.length > 1) tr.removeChild(tr.lastChild);
        const reps = Math.max(2, Math.ceil(el.tview.clientWidth / set) + 1);
        for (let i = 1; i < reps; i++) tr.appendChild(first.cloneNode(true));
        tr.style.setProperty('--set', set + 'px');
        tr.style.setProperty('--dur', (set / (16 * ((S && S.ticker && +S.ticker.speed) || 5))).toFixed(2) + 's');
        tr.classList.add('run');
      }
      el.tview.querySelectorAll('.mb-tline > span').forEach((s) => {
        s.style.transform = ''; const k = Math.min(1, (el.tview.clientWidth - 24) / Math.max(1, s.scrollWidth));
        if (k < 1) s.style.transform = 'scaleX(' + Math.max(.6, k) + ')';
      });
    }
    function buildTicker() {
      const t = (S && S.ticker) || {};
      const lines = list(t.lines).map((x) => String(x).trim()).filter(Boolean);
      const mode = t.mode === 'rotate' && lines.length > 1 ? 'rotate' : 'scroll';
      const sig = JSON.stringify([lines, mode, t.speed, t.secs]);
      el.tlab.textContent = t.label == null ? 'ລາຍລະອຽດ' : t.label;
      if (sig === tickSig) return; tickSig = sig;
      clearInterval(rotT); el.tview.innerHTML = '';
      if (!lines.length) return;
      if (mode === 'scroll') {
        const tr = document.createElement('div'); tr.className = 'mb-ttrack';
        const sp = document.createElement('span'); sp.textContent = lines.join('   •   '); tr.appendChild(sp);
        el.tview.appendChild(tr); requestAnimationFrame(fitTicker);
        if (document.fonts) document.fonts.ready.then(fitTicker);
      } else {
        const nodes = lines.map((l) => { const d = document.createElement('div'); d.className = 'mb-tline'; const s = document.createElement('span'); s.textContent = l; d.appendChild(s); el.tview.appendChild(d); return d; });
        let i = 0; nodes[0].classList.add('on'); requestAnimationFrame(fitTicker);
        rotT = setInterval(() => {
          const cur = nodes[i]; cur.classList.remove('on'); cur.classList.add('out');
          setTimeout(() => cur.classList.remove('out'), 600);
          i = (i + 1) % nodes.length; nodes[i].classList.add('on');
        }, Math.max(2, +t.secs || 5) * 1000);
      }
    }

    function render() {
      const on = !!S && S.show !== false, tickOn = !!S && S.tickerOn !== false;
      bar.classList.toggle('off', !on); el.tick.classList.toggle('off', !tickOn);
      if (!S) return;
      const th = THEMES[S.theme] || THEMES.green;
      root.style.setProperty('--c1', S.c1 || th.c1); root.style.setProperty('--c2', S.c2 || th.c2);
      const heats = list(S.heats), i = Math.max(0, Math.min(heats.length - 1, +S.cur || 0)), h = heats[i] || {};
      // ຂ້າງຈໍ: a = ຊ້າຍຈໍ, b = ຂວາຈໍ. ຄ່າເລີ່ມຕົ້ນ ຊ້າຍຈໍ = ເລນ "ຂວາ" (ຕາມກ້ອງເບິ່ງຈາກຝັ່ງ)
      const flip = S.laneOrder === 'lr';
      const A = flip ? (h.l || {}) : (h.r || {}), B = flip ? (h.r || {}) : (h.l || {});
      const keyA = flip ? 'l' : 'r', keyB = flip ? 'r' : 'l';
      el.na.textContent = A.name || ''; el.nb.textContent = B.name || '';
      el.sa.textContent = A.sub || ''; el.sb.textContent = B.sub || '';
      el.la.textContent = flip ? 'ຊ້າຍ' : 'ຂວາ'; el.lb.textContent = flip ? 'ຂວາ' : 'ຊ້າຍ';
      const lanes = S.lanes !== false; el.la.style.display = el.lb.style.display = lanes ? '' : 'none';
      el.cat.textContent = h.cat || S.cat || '';
      const rd = [h.round || S.round || '', heats.length > 1 || S.showHeatNo ? 'ຖ້ຽວທີ ' + (i + 1) : ''].filter(Boolean).join(' · ');
      el.round.textContent = rd;
      el.logo.classList.toggle('img', !!S.logo); el.logo.style.backgroundImage = bg(S.logo); el.logo.textContent = S.logo ? '' : (S.logoText || 'VS');
      const w = h.w === 'r' || h.w === 'l' ? h.w : '', show = w && S.showWin !== false;
      el.pa.classList.toggle('win', show && w === keyA); el.pb.classList.toggle('win', show && w === keyB);
      el.pa.classList.toggle('lose', show && w === keyB); el.pb.classList.toggle('lose', show && w === keyA);
      const badge = '🏆 ຊະນະ' + (h.note ? ' · ' + h.note : '');
      el.wa.textContent = badge; el.wb.textContent = badge;
      const sig = i + w; if (sig !== lastWin) lastWin = sig;
      buildTicker(); fitName('a'); fitName('b'); layout();
    }

    addEventListener('resize', () => { fitName('a'); fitName('b'); layout(); });
    if (document.fonts) document.fonts.ready.then(() => { fitName('a'); fitName('b'); layout(); });
    return db.watch('boat', (v) => {
      S = v || null;
      if (override && S && ['fx', 'fy', 'size'].every((k) => !(k in override) || S[k] === override[k])) override = null;
      render();
    });
  }

  window.MeeBoat = { mount, THEMES, DW };
})();
