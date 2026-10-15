// ===== Mee Overlay — ສະກໍບອດເປຕັ່ງ (ໃຊ້ຮ່ວມກັນ: overlay.html ແລະ petanque-overlay.html) =====
// MeePetanque.mount(db) — ຕິດຕາມ overlays/{uid}/petanque ແລ້ວແຕ້ມສະກໍເທິງ overlay
(() => {
  const DESIGN_W = 720, TV_W = 1040;
  const THEMES = ['classic', 'light', 'sport', 'tv'];
  const CSS = `
  .mp-root { position:absolute; inset:0; pointer-events:none; z-index:50; }
  .mp-root * { box-sizing:border-box; }
  .mp-root { --a:#1c5cd0; --b:#d6281e; --gold:#ffc21a; --bar:#0f141c; --bar2:#1b222d; --line:rgba(255,255,255,.08);
    --lao:'MeeLao','Noto Sans Lao',sans-serif; --num:'MeeNum','Oswald','MeeLao',sans-serif; }
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
  .mp-set { width:56px; height:62px; flex:none; display:grid; place-items:center; align-content:center; background:var(--bar2); border-radius:10px; line-height:1; }
  .mp-set small { font-size:15px; font-weight:700; opacity:.65; }
  .mp-set b { font-family:var(--num); font-weight:700; font-size:36px; font-variant-numeric:tabular-nums; }
  .mp-set.pop { animation:mp-pop .6s ease; }
  .mp-onesets .mp-set { display:none; }
  .mp-sets { font-size:22px; opacity:.85; padding-bottom:6px; }
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
  .mp-hide { display:none !important; }
  .mp-logo.mp-empty { background:rgba(255,255,255,.14); box-shadow:none; }
  .mp-t-light .mp-logo.mp-empty { background:rgba(0,0,0,.07); }

  /* ===== ແບບ: ພື້ນຂາວ ===== */
  .mp-t-light .mp-bug { color:#121820; filter:drop-shadow(0 6px 16px rgba(0,0,0,.28)); }
  .mp-t-light .mp-title, .mp-t-light .mp-card { background:rgba(255,255,255,.96); }
  .mp-t-light .mp-team + .mp-team { border-top-color:rgba(0,0,0,.08); }
  .mp-t-light .mp-score { color:#fff; }
  .mp-t-light .mp-set { background:#e8ecf2; }
  .mp-t-light .mp-logo { box-shadow:0 0 0 2px rgba(0,0,0,.12); }
  .mp-t-light .mp-jack { box-shadow:0 0 0 2px #121820; }
  .mp-t-light .mp-balls i { box-shadow:0 0 0 1.5px rgba(0,0,0,.25); }
  .mp-t-light .mp-foot { background:#fff; color:#121820; }
  .mp-t-light .mp-flash { color:#fff; }

  /* ===== ແບບ: ສະປອດ (ແຖບສີທີມ ຕັດອຽງ) ===== */
  .mp-t-sport .mp-title { background:#0b0d11; border-left:6px solid var(--gold); border-radius:0; transform:skewX(-12deg); margin-left:14px; padding:4px 18px 3px; }
  .mp-t-sport .mp-card { background:transparent; border-radius:0; overflow:visible; display:grid; gap:6px; padding:6px 0 0 6px; }
  .mp-t-sport .mp-team { background:linear-gradient(100deg, var(--tc) 0%, color-mix(in srgb, var(--tc) 62%, #000) 100%); border:0 !important;
    transform:skewX(-12deg); border-radius:4px; height:72px; box-shadow:0 4px 0 rgba(0,0,0,.35); }
  .mp-t-sport .mp-team::before { background:#fff; width:7px; }
  .mp-t-sport .mp-team > :not(.mp-jack) { transform:skewX(12deg); }
  .mp-t-sport .mp-jack { transform:skewX(12deg) scale(0); }
  .mp-t-sport .mp-team.j .mp-jack { transform:skewX(12deg) scale(1); }
  .mp-t-sport .mp-name { text-shadow:0 2px 0 rgba(0,0,0,.3); }
  .mp-t-sport .mp-score { background:#fff; color:var(--tc); border-radius:6px; }
  .mp-t-sport .mp-score.pop { animation:mp-pops .6s ease; }
  @keyframes mp-pops { 0%{transform:skewX(12deg) scale(1)} 30%{transform:skewX(12deg) scale(1.2)} 100%{transform:skewX(12deg) scale(1)} }
  .mp-t-sport .mp-set { background:rgba(0,0,0,.3); border-radius:6px; }
  .mp-t-sport .mp-balls i { background:radial-gradient(circle at 35% 30%,#fff 0 22%,#dfe3e8 60%,#7d8894 125%); box-shadow:0 1px 0 rgba(0,0,0,.35); }
  .mp-t-sport .mp-foot { background:#0b0d11; border-radius:0; transform:skewX(-12deg); margin-left:30px; margin-top:6px; border-bottom:3px solid var(--gold); }
  .mp-t-sport .mp-foot > * { display:inline-block; transform:skewX(12deg); }

  /* ===== ແບບ: ແຖບທີວີ (ແນວນອນ) ===== */
  .mp-tv { position:absolute; width:${TV_W}px; transform-origin:0 0; font-family:var(--lao); color:#fff; text-align:center;
    transition:opacity .35s; filter:drop-shadow(0 6px 14px rgba(0,0,0,.45)); }
  .mp-tv.off { opacity:0; }
  .mp-tv .mp-title { border-radius:12px 12px 0 0; font-size:21px; }
  .mp-tvbar { display:flex; align-items:stretch; height:76px; background:var(--bar); border-radius:12px; overflow:hidden; text-align:left; }
  .mp-tvt { flex:1; min-width:0; display:flex; align-items:center; gap:12px; padding:0 14px; position:relative; }
  .mp-tvt.a { background:linear-gradient(90deg, color-mix(in srgb, var(--tc) 55%, var(--bar)) 0%, var(--bar) 100%); }
  .mp-tvt.b { background:linear-gradient(270deg, color-mix(in srgb, var(--tc) 55%, var(--bar)) 0%, var(--bar) 100%); justify-content:flex-end; }
  .mp-tvt.a::before, .mp-tvt.b::after { content:""; position:absolute; top:0; bottom:0; width:8px; background:var(--tc); }
  .mp-tvt.a::before { left:0; } .mp-tvt.b::after { right:0; }
  .mp-tvt .mp-name { flex:0 1 auto; font-size:32px; }
  .mp-tvt.a .mp-name { margin-right:auto; } .mp-tvt.b .mp-name { margin-left:auto; text-align:right; }
  .mp-tvt.j .mp-jack { transform:scale(1); }
  .mp-tv .mp-score { width:96px; height:auto; border-radius:0; font-size:58px; }
  .mp-tvmid { width:190px; flex:none; display:grid; place-items:center; align-content:center; gap:2px; background:#080a0e; padding:0 8px; }
  .mp-tvmid span { font-size:17px; font-weight:700; line-height:1.3; white-space:nowrap; }
  .mp-tvmid .mp-clock { font-size:24px; }
  .mp-tvsub { display:inline-flex; align-items:center; gap:22px; background:var(--bar2); border-radius:0 0 12px 12px; padding:6px 22px 7px; }
  .mp-tvsub .mp-balls i { width:18px; height:18px; }
  .mp-tvsets { font-size:20px; font-weight:700; white-space:nowrap; }
  .mp-tvsets b { font-family:var(--num); font-size:26px; padding:0 4px; }
  .mp-onesets .mp-tvsets { display:none; }
  .mp-noballs .mp-tvsub .mp-balls { display:none; }
  .mp-tv .mp-fw { justify-content:center; }

  @media (prefers-reduced-motion:reduce) { .mp-root * { animation:none !important; transition:none !important; } }`;

  const team = (i) => `
      <div class="mp-team" data-k="s${i}" style="--tc:var(--${i ? 'b' : 'a'})">
        <span class="mp-logo" data-k="l${i}"></span><span class="mp-name" data-k="n${i}"></span><i class="mp-jack"></i>
        <span class="mp-balls" data-k="b${i}"></span><span class="mp-set" data-k="st${i}"><small>ເຊັດ</small><b data-k="sv${i}">0</b></span><span class="mp-score" data-k="c${i}">0</span>
      </div>`;
  const HTML = `
  <div class="mp-bug off">
    <div class="mp-title" data-k="title"></div>
    <div class="mp-card">${team(0)}${team(1)}</div>
    <div class="mp-foot"><span data-k="endno"></span><span class="mp-dim" data-k="target"></span><span class="mp-clock" data-k="clock"></span></div>
    <div class="mp-fw"><div class="mp-flash" data-k="flash"><span data-k="fname"></span><b data-k="fpts"></b></div></div>
  </div>
  <div class="mp-tv off mp-hide">
    <div class="mp-title" data-k="title"></div>
    <div class="mp-tvbar">
      <div class="mp-tvt a" data-k="s0" style="--tc:var(--a)"><span class="mp-logo" data-k="l0"></span><span class="mp-name" data-k="n0"></span><i class="mp-jack"></i></div>
      <span class="mp-score" data-k="c0" style="--tc:var(--a)">0</span>
      <div class="mp-tvmid"><span data-k="endno"></span><span class="mp-clock" data-k="clock"></span></div>
      <span class="mp-score" data-k="c1" style="--tc:var(--b)">0</span>
      <div class="mp-tvt b" data-k="s1" style="--tc:var(--b)"><i class="mp-jack"></i><span class="mp-name" data-k="n1"></span><span class="mp-logo" data-k="l1"></span></div>
    </div>
    <div class="mp-tvsub"><span class="mp-balls" data-k="b0" style="--tc:var(--a)"></span><span class="mp-tvsets">ເຊັດ <b data-k="sv0">0</b>–<b data-k="sv1">0</b></span><span class="mp-balls" data-k="b1" style="--tc:var(--b)"></span></div>
    <div class="mp-fw"><div class="mp-flash" data-k="flash"><span data-k="fname"></span><b data-k="fpts"></b></div></div>
  </div>
  <div class="mp-win"><div class="mp-wcard"><div class="mp-wtop"><span class="mp-wlogo" data-k="wlogo"></span><div class="mp-lbl" data-k="wlbl">ຜູ້ຊະນະ</div><div class="mp-who" data-k="wname"></div></div>
    <div class="mp-fs" data-k="wscore"></div><div data-k="wfanny" hidden><span class="mp-fanny">ແຟນນີ້! 13–0</span></div><div class="mp-sets" data-k="wsets"></div><div class="mp-meta" data-k="wmeta"></div></div></div>`;

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
    // ຟອນ Noto Sans Lao (ບໍ່ມີຫົວ) ທີ່ເກັບໄວ້ໃນ repo: ບໍ່ອີງ Google Fonts ຫຼື ຟອນລາວໃນເຄື່ອງ (ທີ່ສະຫຼະທັບວັນນະຍຸດ)
    if (!document.getElementById('mp-fonts')) {
      const lk = document.createElement('link'); lk.id = 'mp-fonts'; lk.rel = 'stylesheet'; lk.href = 'fonts/fonts.css?v=1'; document.head.appendChild(lk);
    }
    const root = document.createElement('div'); root.className = 'mp-root'; root.innerHTML = HTML;
    document.body.appendChild(root);
    // data-k ດຽວກັນ ມີໄດ້ຫຼາຍບ່ອນ (ແຕ່ລະແບບສະກໍ) → ຂຽນຄ່າໃສ່ທຸກບ່ອນ
    const all = {}; root.querySelectorAll('[data-k]').forEach((n) => { (all[n.dataset.k] = all[n.dataset.k] || []).push(n); });
    const el = new Proxy({}, { get: (_, k) => (all[k] || [])[0] });
    const each = (k, fn) => (all[k] || []).forEach(fn);
    const txt = (k, v) => each(k, (n) => { n.textContent = v; });
    const pop = (n) => { n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); };
    const bug = root.querySelector('.mp-bug'), tv = root.querySelector('.mp-tv'), win = root.querySelector('.mp-win');
    let theme = 'classic', active = bug, override = null;
    // ໃຫ້ໜ້າຄວບຄຸມ (petanque.html) ຍ້າຍ/ປັບຂະໜາດໃນຕົວຢ່າງໄດ້ທັນທີ ຂະນະລາກ (ກ່ອນຂໍ້ມູນກັບມາຈາກ Firebase)
    window.__mpPreview = { set(o) { override = Object.assign(override || {}, o); layout(); } };

    let S = null, last = null, lastSets = null, lastEventAt = 0, flashT = null, ballSig = '';

    function layout() {
      const W = innerWidth, H = innerHeight, land = W >= H;
      // ຂະໜາດກາງ: ກວ້າງ 55% ຂອງຈໍແນວນອນ, 92% ຂອງຈໍແນວຕັ້ງ
      const DW = theme === 'tv' ? TV_W : DESIGN_W, share = theme === 'tv' ? (land ? .7 : .96) : (land ? .55 : .92);
      const L = Object.assign({}, S || {}, override || {});
      const k = W * share / DW * (+L.size || 1), m = W * (land ? .022 : .04);
      const kk = Math.min(k, W / DW);
      const w = DW * kk, h = active.offsetHeight * kk, pos = L.pos || 'tl';
      let x = m, y = m;
      if (L.fx != null && L.fy != null) {
        // ວາງເອງ (ລາກວາງ): fx/fy = ສັດສ່ວນຂອງຈໍ, ບໍ່ໃຫ້ອອກນອກຈໍ
        x = Math.max(0, Math.min(W - w, L.fx * W)); y = Math.max(0, Math.min(H - h, L.fy * H));
      } else {
        if (pos === 'tc' || pos === 'bc') x = (W - w) / 2;
        if (pos === 'tr') x = W - w - m;
        if (pos === 'bl' || pos === 'bc' || pos === 'br') y = H - h - m;
        if (pos === 'br') x = W - w - m;
      }
      active.style.left = x + 'px'; active.style.top = y + 'px'; active.style.transform = 'scale(' + kk + ')';
      const wk = Math.min(W * .8 / 820, H * .8 / 560);
      win.style.transform = 'scale(' + wk + ') translate(-50%,-50%)';
    }

    function tick() {
      txt('clock', S && S.startedAt && S.clock !== false ? fmt((S.finishedAt || Date.now()) - S.startedAt) : '');
    }

    function render() {
      const on = !!S && S.show !== false;
      theme = S && THEMES.includes(S.theme) ? S.theme : 'classic';
      active = theme === 'tv' ? tv : bug;
      THEMES.forEach((t) => root.classList.toggle('mp-t-' + t, t === theme));
      bug.classList.toggle('mp-hide', active !== bug); tv.classList.toggle('mp-hide', active !== tv);
      bug.classList.toggle('off', !on); tv.classList.toggle('off', !on);
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
      txt('title', S.title || '');
      // ເຊັດ (ແຂ່ງ 2 ໃນ 3): ນັບເຊັດທີ່ຈົບແລ້ວ + ເຊັດປັດຈຸບັນຖ້າມີຜູ້ຊະນະ
      const bestOf = S.bestOf || 3, multi = bestOf > 1, need = Math.ceil(bestOf / 2), setLog = list(S.setLog);
      const sw = [0, 0]; setLog.forEach((x) => { sw[+x.w || 0]++; }); if (w !== null) sw[w]++;
      const mw = sw[0] >= need ? 0 : sw[1] >= need ? 1 : null, setNo = setLog.length + 1;
      root.classList.toggle('mp-onesets', !multi);
      txt('endno', (multi ? 'ເຊັດທີ ' + setNo + ' · ' : '') + (w === null ? 'ຮອບທີ ' + (ends.length + 1) : 'ຈົບເຊັດ'));
      [0, 1].forEach((i) => {
        txt('sv' + i, sw[i]);
        if (lastSets && lastSets[i] !== sw[i]) each('st' + i, pop);
      });
      lastSets = sw;
      txt('target', 'ເກມ ' + target);
      const sig = [nb, thrown[0], thrown[1]].join(',');
      [0, 1].forEach((i) => {
        txt('n' + i, name(i));
        each('l' + i, (n) => { n.style.backgroundImage = bg(logo(i)); n.classList.toggle('mp-empty', !logo(i)); });
        each('c' + i, (c) => { if (last && last[i] !== sc[i]) pop(c); c.textContent = sc[i]; });
        each('s' + i, (n) => n.classList.toggle('j', w === null && jt === i));
        if (sig !== ballSig) {
          const used = Math.min(nb, +thrown[i] || 0);
          // ລູກທີ່ໃຊ້ແລ້ວຫາຍຈາກທາງນອກ (ແຖບທີວີ: ທີມ A ຫາຍຈາກຊ້າຍ)
          each('b' + i, (n) => { n.innerHTML = Array.from({ length:nb }, (_, k) => `<i class="${(n.closest('.mp-tv') && !i ? k < used : k >= nb - used) ? 'used' : ''}"></i>`).join(''); });
        }
      });
      ballSig = sig; last = sc;

      const ev = S.lastEvent;
      if (ev && ev.at && ev.at !== lastEventAt) {
        const fresh = lastEventAt !== 0 && Date.now() - ev.at < 15000;
        lastEventAt = ev.at;
        if (fresh && on) {
          each('flash', (f) => f.style.setProperty('--tc', ev.n ? '#4a5260' : ev.t ? 'var(--b)' : 'var(--a)'));
          txt('fname', ev.n ? 'ຮອບນີ້ ໂມຄະ' : name(ev.t) + ' ໄດ້'); txt('fpts', ev.n ? '0' : '+' + ev.p);
          each('flash', (f) => f.classList.add('on'));
          clearTimeout(flashT); flashT = setTimeout(() => each('flash', (f) => f.classList.remove('on')), 3500);
        }
      } else if (!ev) lastEventAt = lastEventAt || 1;

      if (w !== null) {
        win.style.setProperty('--tc', w ? 'var(--b)' : 'var(--a)');
        el.wlogo.style.backgroundImage = bg(logo(w));
        el.wlogo.hidden = !logo(w);
        el.wname.textContent = name(w);
        el.wscore.textContent = sc[w] + ' – ' + sc[1 - w];
        el.wlbl.textContent = !multi ? 'ຜູ້ຊະນະ' : mw !== null ? 'ຊະນະການແຂ່ງ ' + sw[mw] + '–' + sw[1 - mw] + ' ເຊັດ' : 'ຊະນະເຊັດທີ ' + setNo;
        const past = setLog.map((x) => (+(x.s && x.s[0]) || 0) + '–' + (+(x.s && x.s[1]) || 0)).concat([sc[0] + '–' + sc[1]]);
        el.wsets.textContent = multi ? 'ເຊັດ: ' + past.join(' · ') : '';
        el.wfanny.hidden = sc[1 - w] !== 0;
        el.wmeta.textContent = ends.length + ' ຮອບ' + (S.startedAt ? ' · ' + fmt((S.finishedAt || Date.now()) - S.startedAt) : '');
      }
      win.classList.toggle('on', on && w !== null && S.showWin !== false);
      tick(); layout();
    }

    setInterval(tick, 1000);
    addEventListener('resize', layout);
    if (document.fonts) {
      document.fonts.ready.then(layout);
      Promise.all(['400', '700', '900'].map((w) => document.fonts.load(w + ' 30px MeeLao', 'ກີ້ຂ໋ອບ'))).then(layout, () => {});
    }
    layout();
    return db.watch('petanque', (v) => {
      S = v || null;
      if (override && S && ['fx', 'fy', 'size', 'pos'].every((k) => !(k in override) || S[k] === override[k])) override = null;
      render(); if (opts.onState) opts.onState(S);
    });
  }

  window.MeePetanque = { mount, BALLS, THEMES };
})();
