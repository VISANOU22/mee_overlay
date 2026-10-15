// ===== Mee Overlay — ແຜງເພີ່ມ/ແກ້ ໜັງສື ແລະ ຮູບ (ໃຊ້ຮ່ວມທຸກກິລາ) =====
// const ex = MeeExtrasPanel.mount(db, { list: elem, chips: elem, addText: btn, upload: input[type=file], toast })
//   list  = ລາຍການແກ້ໄຂເຕັມ (ໜ້າຕັ້ງຄ່າ) · chips = ປຸ່ມເປີດ/ປິດດ່ວນ (ໜ້າຫຼັກ)
//   ex.change(id, {fx, fy, f}, final, live) — ໃຫ້ MeeEditor ເອີ້ນຕອນລາກ/ປັບຂະໜາດໃນຕົວຢ່າງ
//   ex.start(id) — ເອີ້ນຕອນເລີ່ມລາກ
(() => {
  const CSS = `
  .xp-list { display:grid; gap:10px; }
  .xp-empty { color:var(--muted); font-size:13.5px; margin:0; }
  .xp-it { border:1px solid var(--line2); border-radius:12px; padding:10px; display:grid; gap:8px; background:var(--raised); }
  .xp-it.off { opacity:.6; }
  .xp-top { display:flex; align-items:center; gap:8px; }
  .xp-th { width:52px; height:40px; border-radius:8px; flex:none; background:#0a0c10 center/contain no-repeat; border:1px solid var(--line2);
    display:grid; place-items:center; font-weight:900; font-size:15px; overflow:hidden; }
  .xp-ttl { flex:1; min-width:0; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .xp-it textarea { width:100%; min-height:48px; resize:vertical; border-radius:10px; border:1px solid var(--line2); background:var(--field);
    color:inherit; padding:8px 10px; font:600 16px/1.45 var(--lao); }
  .xp-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
  .xp-sw { width:34px; height:34px; border-radius:50%; border:2px solid var(--line2); padding:0; flex:none; }
  .xp-sw[aria-pressed="true"] { outline:3px solid var(--gold); outline-offset:1px; }
  .xp-row input[type=color] { width:38px; height:34px; padding:0; border:1px solid var(--line2); border-radius:8px; background:none; }
  .xp-st { flex:1 1 auto; min-height:38px; padding:2px 10px; border-radius:9px; border:1px solid var(--line2); background:var(--surface); font-size:13px; font-weight:600; }
  .xp-st[aria-pressed="true"] { background:var(--ink); color:var(--bg); border-color:var(--ink); }
  .xp-ic { min-height:38px; min-width:44px; padding:0 10px; border-radius:9px; border:1px solid var(--line2); background:var(--surface); font-size:13.5px; font-weight:700; }
  .xp-ic.del { color:var(--warn); } .xp-ic.del.arm { background:var(--onair); color:#fff; border-color:var(--onair); }
  .xp-ic[aria-pressed="false"] { opacity:.75; }
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
  const STYLES = [['shadow', 'ເງົາ'], ['dark', 'ກ່ອງເຂັ້ມ'], ['light', 'ກ່ອງຂາວ'], ['red', 'ກ່ອງແດງ']];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ຫຍໍ້ຮູບໃຫ້ນ້ອຍລົງ (ດ້ານຍາວສຸດ 800px) ເພື່ອບໍ່ໃຫ້ຖານຂໍ້ມູນໜັກ; ຮັກສາພື້ນໂປ່ງໃສ
  function loadImage(file, max) {
    return new Promise((ok, bad) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, (max || 800) / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        let d = c.toDataURL('image/webp', 0.9); if (!d.startsWith('data:image/webp')) d = c.toDataURL('image/png');
        ok({ src: d, ratio: c.height / c.width });
      };
      img.onerror = () => { URL.revokeObjectURL(url); bad(new Error('ອ່ານຮູບບໍ່ໄດ້')); };
      img.src = url;
    });
  }

  function mount(db, ui) {
    if (!document.getElementById('xp-css')) {
      const st = document.createElement('style'); st.id = 'xp-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const toast = ui.toast || (() => {});
    let items = {}, base = {};
    const path = (id) => 'extras/items/' + id;
    const upd = (id, o) => db.update(path(id), o).catch((e) => toast('ບັນທຶກບໍ່ໄດ້: ' + (e.code || e.message)));
    const sorted = () => Object.keys(items).map((id) => Object.assign({ id }, items[id])).sort((a, b) => (a.z || 0) - (b.z || 0) || String(a.id).localeCompare(b.id));
    const label = (it, i) => it.type === 'image' ? (it.name || 'ຮູບ ' + (i + 1)) : (String(it.text || '').split('\n')[0] || 'ໜັງສື');
    const topZ = () => sorted().reduce((m, it) => Math.max(m, +it.z || 0), 0) + 1;
    const frames = () => (ui.frames ? ui.frames() : []);
    const preview = (id, o) => frames().forEach((f) => { try { f.contentWindow.__mxPreview && f.contentWindow.__mxPreview.set(id, o); } catch (e) {} });

    // ---------- ເພີ່ມ
    if (ui.addText) ui.addText.addEventListener('click', () => {
      const id = nid();
      db.set(path(id), { type: 'text', text: 'ພິມໜັງສືຢູ່ນີ້', x: 0.05, y: 0.82, fs: 0.035, color: '#ffffff', style: 'dark', show: true, z: topZ() })
        .then(() => { toast('ເພີ່ມໜັງສືແລ້ວ'); setTimeout(() => { const t = ui.list && ui.list.querySelector('[data-id="' + id + '"] textarea'); if (t) { t.focus(); t.select(); } }, 300); });
    });
    if (ui.upload) ui.upload.addEventListener('change', async () => {
      const f = ui.upload.files[0]; ui.upload.value = ''; if (!f) return;
      try {
        const { src, ratio } = await loadImage(f, 800);
        const w = ratio > 1.5 ? 0.12 : 0.18;
        await db.set(path(nid()), { type: 'image', name: f.name.replace(/\.[^.]+$/, '').slice(0, 30), src, x: +(0.97 - w).toFixed(3), y: 0.04, w, show: true, z: topZ() });
        toast('ເພີ່ມຮູບແລ້ວ');
      } catch (e) { toast(e.message); }
    });

    // ---------- ລາຍການ (ໜ້າຕັ້ງຄ່າ)
    function row(it) {
      const isT = it.type !== 'image';
      const d = document.createElement('div'); d.className = 'xp-it'; d.dataset.id = it.id;
      d.innerHTML = `
        <div class="xp-top"><span class="xp-th"></span><span class="xp-ttl"></span>
          <button class="xp-ic" data-a="show" type="button"></button>
          <button class="xp-ic" data-a="up" type="button" title="ເອົາຂຶ້ນເທິງ">⤒</button>
          <button class="xp-ic del" data-a="del" type="button">ລຶບ</button></div>
        ${isT ? `<textarea rows="2" aria-label="ຂໍ້ຄວາມ"></textarea>
        <div class="xp-row">${COLORS.map((c) => `<button class="xp-sw" type="button" data-c="${c}" style="background:${c}" aria-label="ສີ ${c}"></button>`).join('')}
          <input type="color" aria-label="ເລືອກສີເອງ"></div>
        <div class="xp-row">${STYLES.map(([v, n]) => `<button class="xp-st" type="button" data-s="${v}">${n}</button>`).join('')}</div>` : ''}`;
      const ta = d.querySelector('textarea');
      if (ta) ta.addEventListener('input', () => { clearTimeout(ta.t); ta.t = setTimeout(() => upd(it.id, { text: ta.value }), 300); });
      d.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const cur = items[it.id]; if (!cur) return;
        if (b.dataset.c) upd(it.id, { color: b.dataset.c });
        else if (b.dataset.s) upd(it.id, { style: b.dataset.s });
        else if (b.dataset.a === 'show') upd(it.id, { show: cur.show === false });
        else if (b.dataset.a === 'up') upd(it.id, { z: topZ() });
        else if (b.dataset.a === 'del') {
          if (!b.classList.contains('arm')) { b.classList.add('arm'); b.textContent = 'ແນ່ໃຈ?'; setTimeout(() => { b.classList.remove('arm'); b.textContent = 'ລຶບ'; }, 3000); return; }
          db.remove(path(it.id)).then(() => toast('ລຶບແລ້ວ'));
        }
      });
      const ci = d.querySelector('input[type=color]');
      if (ci) ci.addEventListener('input', () => { clearTimeout(ci.t); ci.t = setTimeout(() => upd(it.id, { color: ci.value }), 200); });
      return d;
    }
    function fill(d, it, i) {
      d.classList.toggle('off', it.show === false);
      const th = d.querySelector('.xp-th');
      if (it.type === 'image') { th.style.backgroundImage = 'url("' + it.src + '")'; th.textContent = ''; }
      else { th.style.backgroundImage = 'none'; th.textContent = 'Aa'; th.style.color = it.color || '#fff'; }
      d.querySelector('.xp-ttl').textContent = label(it, i);
      const sb = d.querySelector('[data-a="show"]'); sb.textContent = it.show === false ? 'ເຊື່ອງຢູ່' : 'ສະແດງ'; sb.setAttribute('aria-pressed', String(it.show !== false));
      const ta = d.querySelector('textarea'); if (ta && document.activeElement !== ta) ta.value = it.text || '';
      d.querySelectorAll('[data-c]').forEach((b) => b.setAttribute('aria-pressed', String((it.color || '#ffffff').toLowerCase() === b.dataset.c)));
      d.querySelectorAll('[data-s]').forEach((b) => b.setAttribute('aria-pressed', String((it.style || 'dark') === b.dataset.s)));
      const ci = d.querySelector('input[type=color]'); if (ci && document.activeElement !== ci) ci.value = it.color || '#ffffff';
    }
    function render() {
      const arr = sorted();
      if (ui.list) {
        const have = {}; ui.list.querySelectorAll('.xp-it').forEach((n) => { have[n.dataset.id] = n; });
        Object.keys(have).forEach((id) => { if (!items[id]) have[id].remove(); });
        let emp = ui.list.querySelector('.xp-empty');
        if (!arr.length && !emp) { emp = document.createElement('p'); emp.className = 'xp-empty'; emp.textContent = 'ຍັງບໍ່ມີ. ກົດ "＋ ໜັງສື" ຫຼື "＋ ຮູບ" ເພື່ອເພີ່ມ'; ui.list.appendChild(emp); }
        if (arr.length && emp) emp.remove();
        arr.slice().reverse().forEach((it, i) => {      // ອັນເທິງສຸດ (z ສູງ) ຢູ່ກ່ອນ
          const n = have[it.id] || row(it);
          fill(n, it, arr.length - 1 - i); ui.list.appendChild(n);
        });
      }
      if (ui.chips) {
        ui.chips.innerHTML = arr.map((it, i) => `<button type="button" class="xp-chip" data-id="${esc(it.id)}" aria-pressed="${it.show !== false}">
          <i style="${it.type === 'image' ? 'background-image:url(&quot;' + esc(it.src) + '&quot;)' : 'color:' + esc(it.color || '#fff')}">${it.type === 'image' ? '' : 'Aa'}</i><span>${esc(label(it, i))}</span></button>`).join('');
      }
    }
    if (ui.chips) ui.chips.addEventListener('click', (e) => {
      const b = e.target.closest('.xp-chip'); if (!b) return;
      const it = items[b.dataset.id]; if (it) upd(b.dataset.id, { show: it.show === false });
    });

    db.watch('extras/items', (v) => { items = v && typeof v === 'object' ? v : {}; render(); });

    // ---------- ລາກວາງ (ເອີ້ນຈາກ MeeEditor)
    return {
      start(id) { const it = items[id]; if (it) base[id] = { w: +it.w || 0.15, fs: +it.fs || 0.035 }; },
      change(id, p, final, live) {
        const it = items[id], b = base[id]; if (!it || !b) return;
        const o = { x: p.fx, y: p.fy };
        if (p.f !== 1) { if (it.type === 'image') o.w = +(b.w * p.f).toFixed(4); else o.fs = +(b.fs * p.f).toFixed(4); }
        preview(id, o);
        if (final || live) upd(id, o);
      },
    };
  }

  window.MeeExtrasPanel = { mount };
})();
