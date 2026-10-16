// ===== Mee Overlay — ແຜງເພີ່ມ/ແກ້ ໜັງສື ແລະ ຮູບ (ໃຊ້ຮ່ວມທຸກກິລາ) =====
// const ex = MeeExtrasPanel.mount(db, { list, chips, addText, upload, importBox, toast, frames })
//   list  = ລາຍການແກ້ໄຂເຕັມ (ໜ້າຕັ້ງຄ່າ) · chips = ປຸ່ມເປີດ/ປິດດ່ວນ (ໜ້າຫຼັກ)
//   ex.start(id, iframe) / ex.change(id, {fx, fy, f}, final, live, iframe) — ໃຫ້ MeeEditor ເອີ້ນຕອນລາກໃນຕົວຢ່າງ
// item = layer ແບບ Studio (px ໃນຈໍ 1920×1080) → ເອັບເຟັກ/ທ່າເຂົ້າ ຂອງ Studio ໃຊ້ໄດ້ທັງໝົດ
(() => {
  const W0 = 1920, H0 = 1080, SIZE = { w: W0, h: H0 };
  const CSS = `
  .xp-list { display:grid; gap:10px; }
  .xp-empty { color:var(--muted); font-size:13.5px; margin:0; }
  .xp-it { border:1px solid var(--line2); border-radius:12px; background:var(--raised); }
  .xp-it.off { opacity:.65; }
  .xp-it > summary { list-style:none; cursor:pointer; padding:8px 10px; display:flex; align-items:center; gap:8px; }
  .xp-it > summary::-webkit-details-marker { display:none; }
  .xp-th { width:52px; height:40px; border-radius:8px; flex:none; background:#0a0c10 center/contain no-repeat; border:1px solid var(--line2);
    display:grid; place-items:center; font-weight:900; font-size:15px; overflow:hidden; }
  .xp-ttl { flex:1; min-width:0; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .xp-ttl small { display:block; font-weight:500; font-size:12px; color:var(--muted); }
  .xp-body { padding:0 10px 12px; display:grid; gap:10px; border-top:1px solid var(--line); padding-top:10px; }
  .xp-body textarea { width:100%; min-height:52px; resize:vertical; border-radius:10px; border:1px solid var(--line2); background:var(--field);
    color:inherit; padding:8px 10px; font:600 16px/1.45 var(--lao); }
  .xp-f { display:grid; gap:5px; }
  .xp-f > span { font-size:12.5px; color:var(--muted); }
  .xp-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
  .xp-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  @media (max-width:520px) { .xp-2 { grid-template-columns:1fr; } }
  .xp-body select { height:42px; border-radius:10px; border:1px solid var(--line2); background:var(--field); color:inherit; padding:0 10px; font:inherit; width:100%; }
  .xp-body input[type=range] { width:100%; accent-color:var(--gold); }
  .xp-sw { width:34px; height:34px; border-radius:50%; border:2px solid var(--line2); padding:0; flex:none; }
  .xp-sw[aria-pressed="true"] { outline:3px solid var(--gold); outline-offset:1px; }
  .xp-row input[type=color] { width:38px; height:34px; padding:0; border:1px solid var(--line2); border-radius:8px; background:none; }
  .xp-st { flex:1 1 auto; min-height:38px; padding:2px 10px; border-radius:9px; border:1px solid var(--line2); background:var(--surface); font-size:13px; font-weight:600; }
  .xp-st[aria-pressed="true"] { background:var(--ink); color:var(--bg); border-color:var(--ink); }
  .xp-ic { min-height:38px; min-width:44px; padding:0 10px; border-radius:9px; border:1px solid var(--line2); background:var(--surface); font-size:13.5px; font-weight:700; }
  .xp-ic.del { color:var(--warn); } .xp-ic.del.arm { background:var(--onair); color:#fff; border-color:var(--onair); }
  .xp-ic.on { border-color:var(--ok); color:var(--ok); }
  .xp-thumbs { display:flex; gap:6px; flex-wrap:wrap; }
  .xp-thumbs span { width:48px; height:48px; border-radius:8px; background:#0a0c10 center/contain no-repeat; border:1px solid var(--line2); position:relative; }
  .xp-thumbs button { position:absolute; right:-6px; top:-6px; width:22px; height:22px; border-radius:50%; border:0; background:var(--onair); color:#fff; font-size:12px; line-height:22px; padding:0; }
  .xp-chips { display:flex; gap:6px; flex-wrap:wrap; padding:0 10px 10px; }
  .xp-chips:empty { display:none; }
  .xp-chip { display:inline-flex; align-items:center; gap:6px; min-height:38px; max-width:100%; padding:3px 12px 3px 4px; border-radius:999px;
    border:1px solid var(--line2); background:var(--raised); font-size:13.5px; font-weight:700; }
  .xp-chip i { width:30px; height:30px; border-radius:50%; flex:none; background:#0a0c10 center/contain no-repeat; display:grid; place-items:center;
    font-style:normal; font-size:12px; font-weight:900; }
  .xp-chip span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px; }
  .xp-chip[aria-pressed="true"] { border-color:var(--ok); box-shadow:inset 0 0 0 1px var(--ok); }
  .xp-chip[aria-pressed="false"] { opacity:.55; }
  .xp-chip[aria-pressed="false"] span { text-decoration:line-through; }`;
  const COLORS = ['#ffffff', '#ffc21a', '#111111', '#e0261b', '#1c5cd0', '#34c77b'];
  const BOXES = [['shadow', 'ເງົາ', { bgOn: false, shadow: true }], ['dark', 'ກ່ອງເຂັ້ມ', { bgOn: true, bgColor: '#0c0e13', bgAlpha: 0.85, shadow: false }],
    ['light', 'ກ່ອງຂາວ', { bgOn: true, bgColor: '#ffffff', bgAlpha: 0.95, shadow: false }], ['red', 'ກ່ອງແດງ', { bgOn: true, bgColor: '#e0261b', bgAlpha: 1, shadow: false }],
    ['plain', 'ບໍ່ມີ', { bgOn: false, shadow: false }]];
  const SHAPES = [['0', 'ສີ່ຫຼ່ຽມ'], ['24', 'ມຸມມົນ'], ['circle', 'ວົງມົນ']];
  const MODES = [['single', 'ຮູບດຽວ'], ['slide', 'ສະໄລ້ (ປ່ຽນທີລະຮູບ)'], ['marquee', 'ເລື່ອນ (ແຖບສະປອນເຊີ)']];
  const FONT_OPTS = () => [['MeeLao', 'Noto Sans Lao (ບໍ່ມີຫົວ)']].concat(((window.Mee && Mee.FONTS) || []).filter((f) => f.id !== 'Noto Sans Lao').map((f) => [f.id, f.label]));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const asArr = (v) => (Array.isArray(v) ? v.filter(Boolean) : v && typeof v === 'object' ? Object.values(v).filter(Boolean) : []);
  const uid = (p) => (window.Mee && Mee.uid ? Mee.uid(p) : p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  const opts = (arr, v) => arr.map(([k, n]) => `<option value="${esc(k)}"${String(k) === String(v) ? ' selected' : ''}>${esc(n)}</option>`).join('');
  const boxOf = (t) => !t.bgOn ? (t.shadow ? 'shadow' : 'plain') : (t.bgColor || '').toLowerCase() === '#ffffff' ? 'light' : (t.bgColor || '').toLowerCase() === '#e0261b' ? 'red' : 'dark';
  const isScroll = (t) => /^scroll/.test(t.fx || '');

  // ຂະໜາດກ່ອງໃຫ້ພໍດີຂໍ້ຄວາມ (ຍົກເວັ້ນໜັງສືເລື່ອນ ທີ່ຄວາມກວ້າງຕາມທີ່ຜູ້ໃຊ້ຕັ້ງ)
  const cv = document.createElement('canvas').getContext('2d');
  function fitText(L) {
    const t = L.text; if (!t) return L;
    const lines = String(t.content || ' ').split('\n');
    cv.font = (t.bold ? 900 : 400) + ' ' + t.size + 'px "' + (t.font || 'MeeLao') + '", MeeLao, sans-serif';
    const tw = Math.max.apply(null, lines.map((l) => cv.measureText(l || ' ').width));
    const pad = +t.pad || 0, st = (+t.strokeW || 0) * 2;
    if (!isScroll(t)) L.w = Math.round(Math.min(W0, tw * 1.06 + pad * 2 + st + 8));
    L.h = Math.round(Math.min(H0, (isScroll(t) && t.fx !== 'scroll-u' ? 1 : lines.length) * t.size * 1.45 + pad * 2 + st));
    L.x = Math.max(0, Math.min(W0 - L.w, L.x)); L.y = Math.max(0, Math.min(H0 - L.h, L.y));
    return L;
  }

  function mount(db, ui) {
    if (!document.getElementById('xp-css')) {
      const st = document.createElement('style'); st.id = 'xp-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const toast = ui.toast || (() => {});
    let items = {}, base = {};
    const path = (id) => 'extras/items/' + id;
    const assetCache = new Map();
    const asset = (id) => { if (!assetCache.has(id)) assetCache.set(id, db.get('assets/' + id + '/data').catch(() => null)); return assetCache.get(id); };
    const save = (L) => db.set(path(L.id), L).catch((e) => toast('ບັນທຶກບໍ່ໄດ້: ' + (e.code || e.message)));
    const sorted = () => Object.keys(items).filter((id) => items[id] && items[id].type).map((id) => Object.assign({}, items[id], { id }))
      .sort((a, b) => (a.z || 0) - (b.z || 0) || String(a.id).localeCompare(b.id));
    const label = (L, i) => L.type === 'image' ? (L.name && L.name !== 'ຮູບ' ? L.name : 'ຮູບ ' + (i + 1)) : (String((L.text || {}).content || '').split('\n')[0] || 'ໜັງສື');
    const topZ = () => sorted().reduce((m, L) => Math.max(m, +L.z || 0), 0) + 1;
    const frames = () => (ui.frames ? ui.frames() : []);
    const preview = (L) => frames().forEach((f) => { try { f.contentWindow.__mxPreview && f.contentWindow.__mxPreview.set(L.id, L); } catch (e) {} });
    const edit = (id, fn, delay) => {        // ແກ້ໄຂ + ບັນທຶກ (ມີ delay ສຳລັບການພິມ/ເລື່ອນ)
      const L = items[id] ? clone(Object.assign({}, items[id], { id })) : null; if (!L) return;
      fn(L); items[id] = L; preview(L); render();
      clearTimeout(edit.t && edit.t[id]); edit.t = edit.t || {};
      if (delay) edit.t[id] = setTimeout(() => save(L), delay); else save(L);
    };

    async function addAsset(file) {
      const a = await Mee.fileToAsset(file, 900); const aid = uid('a');
      await db.set('assets/' + aid, a); assetCache.set(aid, Promise.resolve(a.data));
      return { aid, a };
    }

    // ---------- ເພີ່ມ
    if (ui.addText) ui.addText.addEventListener('click', () => {
      const L = Mee.newTextLayer(SIZE);
      Object.assign(L, { x: 60, y: 870, z: topZ(), enter: 'fade', name: 'ໜັງສື' });
      Object.assign(L.text, { content: 'ພິມໜັງສືຢູ່ນີ້', font: 'MeeLao', size: 64, pad: 22, radius: 14 }, BOXES[1][2]);
      fitText(L); items[L.id] = L; save(L).then(() => {
        toast('ເພີ່ມໜັງສືແລ້ວ');
        setTimeout(() => { const d = ui.list && ui.list.querySelector('[data-id="' + L.id + '"]'); if (d) { d.open = true; const t = d.querySelector('textarea'); if (t) { t.focus(); t.select(); } } }, 300);
      });
    });
    if (ui.upload) ui.upload.addEventListener('change', async () => {
      const f = ui.upload.files[0]; ui.upload.value = ''; if (!f) return;
      try {
        toast('ກຳລັງອັບໂຫຼດຮູບ…');
        const { aid, a } = await addAsset(f);
        const L = Mee.newImageLayer(SIZE, [aid]);
        const w = a.h > a.w * 1.5 ? 220 : 340;
        Object.assign(L, { name: f.name.replace(/\.[^.]+$/, '').slice(0, 30) || 'ຮູບ', w, h: Math.round(w * a.h / a.w), z: topZ(), enter: 'zoom' });
        L.x = W0 - w - 50; L.y = 50;
        await save(L); toast('ເພີ່ມຮູບແລ້ວ');
      } catch (e) { toast('ເພີ່ມຮູບບໍ່ໄດ້: ' + e.message); }
    });

    // ---------- ນຳເຂົ້າຈາກ Studio ເກົ່າ (scenes/*/layers)
    if (ui.importBox) {
      ui.importBox.innerHTML = '<div class="xp-row"><select style="flex:1;height:42px;border-radius:10px;border:1px solid var(--line2);background:var(--field);color:inherit;padding:0 10px;font:inherit"></select><button class="xp-ic" type="button">ນຳເຂົ້າ</button></div>';
      const sel = ui.importBox.querySelector('select'), btn = ui.importBox.querySelector('button');
      db.watch('scenes', (v) => {
        const sc = v && typeof v === 'object' ? v : {};
        const ids = Object.keys(sc).filter((k) => sc[k] && sc[k].layers && Object.keys(sc[k].layers).length);
        ui.importBox.hidden = !ids.length;
        sel.innerHTML = ids.map((k) => `<option value="${esc(k)}">${esc(sc[k].name || 'ໜ້າຈໍ')} · ${Object.keys(sc[k].layers).length} ອັນ${sc[k].orient === 'port' ? ' (ຈໍຕັ້ງ)' : ''}</option>`).join('');
        sel._sc = sc;
      });
      btn.addEventListener('click', async () => {
        const s = sel._sc && sel._sc[sel.value]; if (!s) return;
        const port = s.orient === 'port', z0 = topZ();
        const layers = Object.values(s.layers).filter((l) => l && l.type);
        for (let i = 0; i < layers.length; i++) {
          const L = clone(layers[i]); L.id = uid(L.type === 'image' ? 'i' : 't'); L.z = z0 + (+L.z || 0); L.visible = false;
          if (port) { const k = H0 / 1920; ['x', 'y', 'w', 'h'].forEach((p) => { L[p] = Math.round((L[p] || 0) * k); }); L.x += Math.round((W0 - 1080 * k) / 2); if (L.text) L.text.size = Math.round(L.text.size * k); }
          await save(L);
        }
        toast('ນຳເຂົ້າ ' + layers.length + ' ອັນ (ເຊື່ອງໄວ້ກ່ອນ, ກົດເປີດໃນລາຍການ)');
      });
    }

    // ---------- ລາຍການ (ໜ້າຕັ້ງຄ່າ)
    function body(L) {
      const isT = L.type !== 'image';
      if (isT) {
        const t = L.text || {};
        return `<textarea rows="2" data-k="content" aria-label="ຂໍ້ຄວາມ"></textarea>
          <div class="xp-f"><span>ສີໜັງສື</span><div class="xp-row">${COLORS.map((c) => `<button class="xp-sw" type="button" data-c="${c}" style="background:${c}" aria-label="ສີ ${c}"></button>`).join('')}<input type="color" data-k="color" aria-label="ເລືອກສີເອງ"></div></div>
          <div class="xp-f"><span>ພື້ນຫຼັງ</span><div class="xp-row">${BOXES.map(([v, n]) => `<button class="xp-st" type="button" data-box="${v}">${n}</button>`).join('')}</div></div>
          <div class="xp-2"><label class="xp-f"><span>ຟອນ</span><select data-k="font">${opts(FONT_OPTS(), t.font)}</select></label>
            <label class="xp-f"><span>ເອັບເຟັກ</span><select data-k="fx">${opts(Mee.TEXT_FX, t.fx || 'none')}</select></label></div>
          <div class="xp-2"><label class="xp-f"><span>ທ່າເຂົ້າ (ຕອນເປີດ/ປິດ)</span><select data-k="enter">${opts(Mee.ENTER, L.enter || 'fade')}</select></label>
            <label class="xp-f"><span>ຄວາມໄວເອັບເຟັກ</span><input type="range" min="1" max="10" data-k="speed"></label></div>`;
      }
      const im = L.image || {};
      return `<div class="xp-f"><span>ຮູບໃນຊຸດນີ້</span><div class="xp-row"><div class="xp-thumbs"></div><label class="xp-ic" style="display:inline-grid;place-items:center">＋ ເພີ່ມຮູບ<input type="file" accept="image/*" data-k="more" hidden></label></div></div>
        <label class="xp-f xp-mode"><span>ສະແດງຫຼາຍຮູບແບບ</span><select data-k="mode">${opts(MODES, im.mode || 'single')}</select></label>
        <div class="xp-f"><span>ຮູບຊົງ</span><div class="xp-row">${SHAPES.map(([v, n]) => `<button class="xp-st" type="button" data-shape="${v}">${n}</button>`).join('')}</div></div>
        <div class="xp-2"><label class="xp-f"><span>ເອັບເຟັກ</span><select data-k="ifx">${opts(Mee.IMG_FX, im.fx || 'none')}</select></label>
          <label class="xp-f"><span>ທ່າເຂົ້າ (ຕອນເປີດ/ປິດ)</span><select data-k="enter">${opts(Mee.ENTER, L.enter || 'zoom')}</select></label></div>
        <label class="xp-f"><span>ຄວາມໄວເອັບເຟັກ</span><input type="range" min="1" max="10" data-k="speed"></label>`;
    }
    function row(L) {
      const d = document.createElement('details'); d.className = 'xp-it'; d.dataset.id = L.id;
      d.innerHTML = `<summary><span class="xp-th"></span><span class="xp-ttl"></span>
          <button class="xp-ic" data-a="show" type="button"></button>
          <button class="xp-ic" data-a="up" type="button" title="ເອົາຂຶ້ນເທິງສຸດ">⤒</button>
          <button class="xp-ic del" data-a="del" type="button">ລຶບ</button></summary>
        <div class="xp-body">${body(L)}</div>`;
      const id = L.id;
      d.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.closest('summary')) e.preventDefault();
        const cur = items[id]; if (!cur) return;
        if (b.dataset.c) edit(id, (x) => { x.text.color = b.dataset.c; });
        else if (b.dataset.box) edit(id, (x) => { Object.assign(x.text, BOXES.find((q) => q[0] === b.dataset.box)[2]); fitText(x); });
        else if (b.dataset.shape) edit(id, (x) => { x.image.radius = b.dataset.shape === 'circle' ? 'circle' : +b.dataset.shape; });
        else if (b.dataset.rm != null) edit(id, (x) => { const a = asArr(x.image.assets); a.splice(+b.dataset.rm, 1); x.image.assets = a; });
        else if (b.dataset.a === 'show') edit(id, (x) => { x.visible = x.visible === false; });
        else if (b.dataset.a === 'up') edit(id, (x) => { x.z = topZ(); });
        else if (b.dataset.a === 'del') {
          if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = 'ແນ່ໃຈ?'; setTimeout(() => { b.classList.remove('arm'); b.textContent = 'ລຶບ'; }, 3000); return; }
          delete items[id]; db.remove(path(id)).then(() => toast('ລຶບແລ້ວ')); render();
        }
      });
      d.addEventListener('input', (e) => {
        const k = e.target.dataset.k; if (!k) return;
        const v = e.target.value;
        if (k === 'content') edit(id, (x) => { x.text.content = v; fitText(x); }, 350);
        else if (k === 'color') edit(id, (x) => { x.text.color = v; }, 200);
        else if (k === 'speed') edit(id, (x) => { (x.text || x.image).speed = +v; }, 250);
      });
      d.addEventListener('change', async (e) => {
        const k = e.target.dataset.k; if (!k) return;
        const v = e.target.value;
        if (k === 'font') edit(id, (x) => { x.text.font = v; fitText(x); });
        else if (k === 'fx') edit(id, (x) => {
          const was = isScroll(x.text); x.text.fx = v;
          if (isScroll(x.text) && !was) { x.w = Math.max(x.w, 1100); x.x = Math.max(0, Math.min(W0 - x.w, x.x)); }
          fitText(x);
        });
        else if (k === 'ifx') edit(id, (x) => { x.image.fx = v; });
        else if (k === 'enter') edit(id, (x) => { x.enter = v; });
        else if (k === 'mode') edit(id, (x) => { x.image.mode = v; if (v === 'marquee' && x.w < 900) { x.w = 1200; x.h = Math.min(x.h, 180); x.x = Math.max(0, Math.min(W0 - x.w, x.x)); } });
        else if (k === 'more') {
          const f = e.target.files[0]; e.target.value = ''; if (!f) return;
          try { const { aid } = await addAsset(f); edit(id, (x) => { x.image.assets = asArr(x.image.assets).concat([aid]); if ((x.image.mode || 'single') === 'single') x.image.mode = 'slide'; }); toast('ເພີ່ມຮູບໃນຊຸດແລ້ວ'); }
          catch (err) { toast('ເພີ່ມຮູບບໍ່ໄດ້: ' + err.message); }
        }
      });
      return d;
    }
    function fill(d, L, i) {
      d.classList.toggle('off', L.visible === false);
      const th = d.querySelector('.xp-th');
      const ids = L.type === 'image' ? asArr((L.image || {}).assets) : [];
      if (L.type === 'image') { th.textContent = ''; if (ids[0]) asset(ids[0]).then((s) => { if (s) th.style.backgroundImage = 'url("' + s + '")'; }); }
      else { th.style.backgroundImage = 'none'; th.textContent = 'Aa'; th.style.color = (L.text || {}).color || '#fff'; }
      const fxName = (L.type === 'image' ? Mee.IMG_FX : Mee.TEXT_FX).find((q) => q[0] === ((L.text || L.image || {}).fx || 'none'));
      d.querySelector('.xp-ttl').innerHTML = esc(label(L, i)) + `<small>${L.type === 'image' ? (ids.length > 1 ? ids.length + ' ຮູບ · ' : '') : ''}ເອັບເຟັກ: ${esc(fxName ? fxName[1] : 'ບໍ່ມີ')}</small>`;
      const sb = d.querySelector('[data-a="show"]'); sb.textContent = L.visible === false ? 'ເຊື່ອງຢູ່' : 'ສະແດງ'; sb.classList.toggle('on', L.visible !== false);
      const set = (sel, v) => { const n = d.querySelector(sel); if (n && document.activeElement !== n) n.value = v; };
      if (L.type !== 'image') {
        const t = L.text || {};
        set('[data-k="content"]', t.content || ''); set('[data-k="color"]', t.color || '#ffffff'); set('[data-k="font"]', t.font || 'MeeLao');
        set('[data-k="fx"]', t.fx || 'none'); set('[data-k="speed"]', t.speed || 5);
        d.querySelectorAll('[data-c]').forEach((b) => b.setAttribute('aria-pressed', String((t.color || '#ffffff').toLowerCase() === b.dataset.c)));
        d.querySelectorAll('[data-box]').forEach((b) => b.setAttribute('aria-pressed', String(boxOf(t) === b.dataset.box)));
      } else {
        const im = L.image || {};
        set('[data-k="ifx"]', im.fx || 'none'); set('[data-k="speed"]', im.speed || 5); set('[data-k="mode"]', im.mode || 'single');
        d.querySelector('.xp-mode').hidden = ids.length < 2;
        d.querySelectorAll('[data-shape]').forEach((b) => b.setAttribute('aria-pressed', String(String(im.radius == null ? 0 : im.radius) === b.dataset.shape)));
        const tb = d.querySelector('.xp-thumbs');
        if (tb.dataset.sig !== ids.join(',')) {
          tb.dataset.sig = ids.join(',');
          tb.innerHTML = ids.map((a, n) => `<span data-a="${esc(a)}">${ids.length > 1 ? `<button type="button" data-rm="${n}" aria-label="ເອົາອອກ">×</button>` : ''}</span>`).join('');
          tb.querySelectorAll('span').forEach((s) => asset(s.dataset.a).then((src) => { if (src) s.style.backgroundImage = 'url("' + src + '")'; }));
        }
      }
      set('[data-k="enter"]', L.enter || (L.type === 'image' ? 'zoom' : 'fade'));
    }
    function render() {
      const arr = sorted();
      if (ui.list) {
        const have = {}; ui.list.querySelectorAll('.xp-it').forEach((n) => { have[n.dataset.id] = n; });
        Object.keys(have).forEach((id) => { if (!items[id] || (have[id].dataset.type !== items[id].type)) { have[id].remove(); delete have[id]; } });
        let emp = ui.list.querySelector('.xp-empty');
        if (!arr.length && !emp) { emp = document.createElement('p'); emp.className = 'xp-empty'; emp.textContent = 'ຍັງບໍ່ມີ. ກົດ "＋ ໜັງສື" ຫຼື "＋ ຮູບ" ເພື່ອເພີ່ມ'; ui.list.appendChild(emp); }
        if (arr.length && emp) emp.remove();
        arr.slice().reverse().forEach((L, i) => {      // ອັນເທິງສຸດ (z ສູງ) ຢູ່ກ່ອນ
          let n = have[L.id]; if (!n) { n = row(L); n.dataset.type = L.type; }
          fill(n, L, arr.length - 1 - i);
          // ຍ້າຍສະເພາະຕອນລຳດັບປ່ຽນ — ການຍ້າຍ node ທີ່ກຳລັງພິມ ເຮັດໃຫ້ຊ່ອງພິມຫຼຸດ (ພິມໄດ້ເທື່ອລະໂຕ)
          const ref = ui.list.children[i];
          if (ref !== n) ui.list.insertBefore(n, ref || null);
        });
      }
      if (ui.chips) {
        ui.chips.innerHTML = arr.map((L, i) => `<button type="button" class="xp-chip" data-id="${esc(L.id)}" aria-pressed="${L.visible !== false}">
          <i style="color:${esc((L.text || {}).color || '#fff')}">${L.type === 'image' ? '' : 'Aa'}</i><span>${esc(label(L, i))}</span></button>`).join('');
        ui.chips.querySelectorAll('.xp-chip').forEach((c) => {
          const L = items[c.dataset.id]; const a = L && L.type === 'image' && asArr((L.image || {}).assets)[0];
          if (a) asset(a).then((s) => { const i = c.querySelector('i'); if (s && i) i.style.backgroundImage = 'url("' + s + '")'; });
        });
      }
    }
    if (ui.chips) ui.chips.addEventListener('click', (e) => {
      const b = e.target.closest('.xp-chip'); if (b) edit(b.dataset.id, (x) => { x.visible = x.visible === false; });
    });

    const upgrading = {};
    async function upgrade(id, o) {
      if (upgrading[id]) return; upgrading[id] = 1;
      try {
        let L;
        if (o.type === 'image' && o.src) {
          const aid = uid('a'), w = Math.round((+o.w || .15) * W0);
          const img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = o.src; });
          const ratio = img && img.width ? img.height / img.width : 1;
          await db.set('assets/' + aid, { data: o.src, w: img ? img.width : w, h: img ? img.height : w, name: o.name || 'ຮູບ' });
          L = Mee.newImageLayer(SIZE, [aid]); Object.assign(L, { id, name: o.name || 'ຮູບ', w, h: Math.round(w * ratio), enter: 'zoom' });
        } else {
          L = Mee.newTextLayer(SIZE); L.id = id;
          const st = BOXES.find((q) => q[0] === o.style) || BOXES[1];
          Object.assign(L.text, { content: String(o.text || ''), font: 'MeeLao', size: Math.round((+o.fs || .035) * W0), color: o.color || '#ffffff', pad: 22, radius: 14 }, st[2]);
          L.enter = 'fade';
        }
        Object.assign(L, { x: Math.round((+o.x || 0) * W0), y: Math.round((+o.y || 0) * H0), z: +o.z || 0, visible: o.show !== false });
        if (L.text) fitText(L);
        await db.set(path(id), L);
      } catch (e) { console.warn('upgrade', e); }
    }
    db.watch('extras/items', (v) => {
      items = {};
      const raw = v && typeof v === 'object' ? v : {};
      Object.keys(raw).forEach((id) => {
        const L = raw[id]; if (!L) return;
        if (L.type && (L.text && typeof L.text === 'object' || L.image)) items[id] = L;
        else upgrade(id, L);   // ຮູບແບບເກົ່າ (ສັດສ່ວນຈໍ) → layer ແບບ Studio
      });
      render();
    });

    // ---------- ລາກວາງ (ເອີ້ນຈາກ MeeEditor): fx/fy ສັດສ່ວນຂອງກ່ອງຕົວຢ່າງ → px ໃນຈໍ 1920×1080
    return {
      has: (id) => !!items[id],
      hide(id) { edit(id, (x) => { x.visible = false; }); toast('ເຊື່ອງແລ້ວ (ເປີດຄືນໄດ້ຢູ່ປຸ່ມລຸ່ມກ່ອງໜ້າຈໍໄລ້)'); },
      remove(id) { delete items[id]; db.remove(path(id)).then(() => toast('ລຶບແລ້ວ')); render(); },
      start(id) { if (items[id]) base[id] = clone(Object.assign({}, items[id], { id })); },
      change(id, p, final, live, ifr) {
        const b = base[id]; if (!b) return;
        let g; try { g = ifr.contentWindow.__mxPreview.geom(); } catch (e) { return; }
        const L = clone(b);
        L.x = Math.round((p.fx * g.W - g.left) / g.k); L.y = Math.round((p.fy * g.H - g.top) / g.k);
        if (p.f !== 1) {
          const f = p.f; L.w = Math.round(b.w * f); L.h = Math.round(b.h * f);
          if (L.text) { L.text.size = Math.max(8, Math.round(b.text.size * f)); L.text.pad = Math.round((+b.text.pad || 0) * f);
            if (typeof b.text.radius === 'number') L.text.radius = Math.round(b.text.radius * f); if (b.text.strokeW) L.text.strokeW = +(b.text.strokeW * f).toFixed(1); }
          if (L.image && b.image.borderW) L.image.borderW = Math.round(b.image.borderW * f);
        }
        L.x = Math.max(0, Math.min(W0 - L.w, L.x)); L.y = Math.max(0, Math.min(H0 - L.h, L.y));
        preview(L);
        if (final || live) { items[id] = L; save(L); }
        if (final) { delete base[id]; render(); }
      },
    };
  }

  window.MeeExtrasPanel = { mount };
})();
