/* ===== Mee Overlay Studio — editor + live control (v2 UI) ===== */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const el = (tag, props, kids) => {
    const n = document.createElement(tag);
    if (props) Object.entries(props).forEach(([k, v]) => {
      if (v === undefined || v === null || v === false) return;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach((c) => c != null && c !== false && n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return n;
  };
  let toastT = 0;
  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); };
  $('fontcss').href = Mee.FONT_CSS;

  // ================================================================ state
  const db = Mee.createDB();
  let user = null, userEmail = '';
  let scenes = {}, meta = {};
  let curId = null, selId = null;
  let mode = 'design';
  const pending = new Map();
  const assetCache = new Map();
  const openSecs = new Map();
  let started = false;

  const sceneIds = () => Object.keys(scenes).sort((a, b) => (scenes[a].order || 0) - (scenes[b].order || 0));
  const scene = () => (curId && scenes[curId]) || null;
  const layersOf = (s) => (s && s.layers ? Object.values(s.layers).filter((l) => l && l.id) : []);
  const layers = () => layersOf(scene());
  const sorted = () => layers().sort((a, b) => (a.z || 0) - (b.z || 0));
  const selLayer = () => { const s = scene(); return s && s.layers && selId ? s.layers[selId] || null : null; };
  const size = () => Mee.SIZES[(scene() || {}).orient || 'land'];
  const getAsset = (id) => { if (!assetCache.has(id)) assetCache.set(id, db.get('assets/' + id + '/data').catch(() => null)); return assetCache.get(id); };
  const fxLabel = (L) => { const list = L.type === 'image' ? Mee.IMG_FX : Mee.TEXT_FX; const f = list.find((x) => x[0] === ((L.type === 'image' ? L.image : L.text) || {}).fx); return f && f[0] !== 'none' ? f[1] : ''; };

  // two-tap confirm helper for destructive buttons
  function armable(btn, idle, armed, onConfirm) {
    let t = 0;
    const reset = () => { clearTimeout(t); btn.classList.remove('armed'); btn.dataset.arm = ''; idle(btn); };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.dataset.arm === '1') { reset(); onConfirm(); return; }
      btn.dataset.arm = '1'; btn.classList.add('armed'); armed(btn);
      clearTimeout(t); t = setTimeout(reset, 4000);
    });
    idle(btn);
    return btn;
  }

  // ================================================================ design: renderer & layout
  const stage = $('stage'), preview = $('preview');
  const renderer = Mee.createRenderer(stage, { editor: true, getAsset });
  let K = 1;
  function layout() {
    const s = size();
    const pw = preview.clientWidth, ph = preview.clientHeight;
    if (!pw || !ph) return;
    K = Math.max(0.05, Math.min((pw - 28) / s.w, (ph - 28) / s.h));
    const left = (pw - s.w * K) / 2, top = (ph - s.h * K) / 2;
    stage.style.transform = 'scale(' + K + ')'; stage.style.left = left + 'px'; stage.style.top = top + 'px';
    stage.style.setProperty('--inv', (1 / K).toFixed(3));
    const bg = $('canvasBg');
    bg.style.left = left + 'px'; bg.style.top = top + 'px'; bg.style.width = s.w * K + 'px'; bg.style.height = s.h * K + 'px';
    bg.classList.toggle('onair', !!curId && meta.active === curId);
    drawSelection();
  }
  new ResizeObserver(() => layout()).observe(preview);

  function renderStage() {
    renderer.setScene(scene() || { layers: {} }, curId || '-');
    $('emptyHint').hidden = !scene() || layers().length > 0;
    layout();
  }

  let selBox = null;
  function drawSelection() {
    const L = selLayer();
    if (!L) { if (selBox) { selBox.remove(); selBox = null; } return; }
    if (!selBox) selBox = el('div', { class: 'selbox' }, [el('div', { class: 'stem' })].concat(['tl', 'tr', 'bl', 'br', 'rot'].map((h) => el('div', { class: 'h ' + h, 'data-h': h }))));
    if (selBox.parentNode !== stage) stage.appendChild(selBox);
    selBox.style.left = L.x + 'px'; selBox.style.top = L.y + 'px'; selBox.style.width = L.w + 'px'; selBox.style.height = L.h + 'px';
    selBox.style.transform = L.rot ? 'rotate(' + L.rot + 'deg)' : '';
    selBox.style.borderWidth = (3 / K) + 'px';
    selBox.classList.toggle('locked', !!L.locked);
  }

  // ================================================================ saving
  function saveLayer(L, delay, sid) {
    sid = sid || curId;
    if (!sid || !L) return;
    const key = sid + '/' + L.id;
    clearTimeout(pending.get(key));
    const t = setTimeout(() => {
      db.set('scenes/' + sid + '/layers/' + L.id, clone(L)).catch((e) => toast('ບັນທຶກບໍ່ສຳເລັດ: ' + e.message))
        .finally(() => setTimeout(() => { if (pending.get(key) === t) pending.delete(key); }, 400));
    }, delay == null ? 250 : delay);
    pending.set(key, t);
  }
  // a layer property changed: refresh canvas + light UI, save
  function changed(L, opts) {
    opts = opts || {};
    renderStage();
    renderSelBar();
    if (opts.full) renderInspector();
    saveLayer(L, opts.delay);
  }

  // ================================================================ pointer: move / resize / rotate
  let drag = null;
  const toStage = (e) => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / K, y: (e.clientY - r.top) / K }; };
  const guides = [];
  const clearGuides = () => { guides.forEach((g) => g.remove()); guides.length = 0; };
  const guide = (vertical, pos) => {
    const s = size(); const g = el('div', { class: 'guide' });
    if (vertical) Object.assign(g.style, { left: pos + 'px', top: 0, width: (2 / K) + 'px', height: s.h + 'px' });
    else Object.assign(g.style, { top: pos + 'px', left: 0, height: (2 / K) + 'px', width: s.w + 'px' });
    stage.appendChild(g); guides.push(g);
  };
  preview.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('.h');
    const layerEl = e.target.closest('.ml');
    if (handle && selLayer()) { startHandle(e, handle.dataset.h); return; }
    if (layerEl && stage.contains(layerEl)) {
      if (layerEl.dataset.id !== selId) select(layerEl.dataset.id);
      const L = selLayer(); if (L && !L.locked) startMove(e, L);
      return;
    }
    select(null);
  });
  function startMove(e, L) {
    e.preventDefault();
    const p = toStage(e);
    drag = { kind: 'move', L, ox: p.x - L.x, oy: p.y - L.y, id: e.pointerId, last: 0 };
    preview.setPointerCapture(e.pointerId);
  }
  function startHandle(e, h) {
    e.preventDefault(); e.stopPropagation();
    const L = selLayer(); if (!L || L.locked) return;
    drag = { kind: h === 'rot' ? 'rot' : 'resize', h, L, p0: toStage(e), w0: L.w, h0: L.h, x0: L.x, y0: L.y, id: e.pointerId, last: 0, ratio: L.w / Math.max(1, L.h) };
    preview.setPointerCapture(e.pointerId);
  }
  preview.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const L = drag.L, p = toStage(e), s = size();
    clearGuides();
    if (drag.kind === 'move') {
      let x = p.x - drag.ox, y = p.y - drag.oy; const thr = 16;
      if (Math.abs(x + L.w / 2 - s.w / 2) < thr) { x = s.w / 2 - L.w / 2; guide(true, s.w / 2); }
      if (Math.abs(y + L.h / 2 - s.h / 2) < thr) { y = s.h / 2 - L.h / 2; guide(false, s.h / 2); }
      if (Math.abs(x) < thr) { x = 0; guide(true, 0); }
      if (Math.abs(y) < thr) { y = 0; guide(false, 0); }
      if (Math.abs(x + L.w - s.w) < thr) { x = s.w - L.w; guide(true, s.w); }
      if (Math.abs(y + L.h - s.h) < thr) { y = s.h - L.h; guide(false, s.h); }
      L.x = Math.round(x); L.y = Math.round(y);
    } else if (drag.kind === 'resize') {
      const r = (L.rot || 0) * Math.PI / 180, cos = Math.cos(r), sin = Math.sin(r);
      const dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
      const lx = dx * cos + dy * sin, ly = -dx * sin + dy * cos;
      const sx = drag.h.includes('r') ? 1 : -1, sy = drag.h.includes('b') ? 1 : -1;
      let w = Math.max(24, drag.w0 + sx * lx), h = Math.max(24, drag.h0 + sy * ly);
      if (L.type === 'image' && (L.image || {}).mode !== 'marquee') { if (Math.abs(lx) / drag.w0 > Math.abs(ly) / drag.h0) h = w / drag.ratio; else w = h * drag.ratio; }
      const dw = w - drag.w0, dh = h - drag.h0, mx = sx * dw / 2, my = sy * dh / 2;
      const cx = drag.x0 + drag.w0 / 2 + mx * cos - my * sin, cy = drag.y0 + drag.h0 / 2 + mx * sin + my * cos;
      L.w = Math.round(w); L.h = Math.round(h); L.x = Math.round(cx - w / 2); L.y = Math.round(cy - h / 2);
    } else {
      const cx = L.x + L.w / 2, cy = L.y + L.h / 2;
      let a = Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI + 90; a = ((a % 360) + 360) % 360; if (a > 180) a -= 360;
      const snap = Math.round(a / 45) * 45; if (Math.abs(a - snap) < 5) a = snap;
      L.rot = Math.round(a);
    }
    renderStage();
    const now = Date.now(); if (now - drag.last > 140) { drag.last = now; saveLayer(L, 0); }
  });
  const endDrag = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const L = drag.L; drag = null; clearGuides(); saveLayer(L, 0); refreshBoxInputs();
  };
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', endDrag);
  addEventListener('keydown', (e) => {
    if (mode !== 'design' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const L = selLayer(); if (!L) return;
    if (e.key === 'Escape') { select(null); return; }
    const st = e.shiftKey ? 10 : 1;
    const mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    if (mv && !L.locked) { e.preventDefault(); L.x += mv[0]; L.y += mv[1]; changed(L, { delay: 300 }); refreshBoxInputs(); }
  });

  function select(id) {
    if (id === selId) return;
    selId = id;
    drawSelection(); renderSelBar(); renderInspector();
  }

  // ================================================================ scene strip
  function renderScenes() {
    const nav = $('scenes'); nav.textContent = '';
    nav.appendChild(el('span', { class: 'lbl', text: 'ໜ້າຈໍ' }));
    sceneIds().forEach((id) => {
      const s = scenes[id], cur = id === curId, air = meta.active === id;
      const chip = el('div', { class: 'chip' + (cur ? ' cur' : '') });
      if (cur && renaming) {
        const inp = el('input', { type: 'text', value: s.name || '', 'aria-label': 'ຊື່ໜ້າຈໍ' });
        const done = () => { renaming = false; const v = inp.value.trim() || s.name || 'ໜ້າຈໍ'; s.name = v; db.set('scenes/' + id + '/name', v); renderScenes(); renderHead(); };
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { renaming = false; renderScenes(); } });
        inp.addEventListener('blur', done);
        chip.appendChild(inp); setTimeout(() => { inp.focus(); inp.select(); }, 0);
      } else {
        chip.appendChild(el('button', { class: 'nm', type: 'button', text: s.name || 'ໜ້າຈໍ', onclick: () => openScene(id) }));
        chip.appendChild(el('span', { class: 'or', text: (s.orient === 'port' ? '▯' : '▭') }));
      }
      if (air) chip.appendChild(el('span', { class: 'air', text: 'LIVE' }));
      if (cur && !renaming) {
        chip.appendChild(el('button', { class: 'mini', type: 'button', title: 'ປ່ຽນຊື່', 'aria-label': 'ປ່ຽນຊື່ໜ້າຈໍ', text: '✎', onclick: () => { renaming = true; renderScenes(); } }));
        chip.appendChild(el('button', { class: 'mini', type: 'button', title: 'ສຳເນົາ', 'aria-label': 'ສຳເນົາໜ້າຈໍ', text: '⧉', onclick: dupScene }));
        chip.appendChild(armable(el('button', { class: 'mini danger', type: 'button', 'aria-label': 'ລຶບໜ້າຈໍ' }),
          (b) => { b.textContent = '🗑'; }, (b) => { b.textContent = 'ແຕະອີກເທື່ອ ເພື່ອລຶບ'; toast('ແຕະອີກເທື່ອ ເພື່ອລຶບໜ້າຈໍ "' + (s.name || '') + '"'); }, () => delScene(id)));
      }
      nav.appendChild(chip);
    });
    nav.appendChild(el('button', { class: 'chip add', type: 'button', text: '＋ ໜ້າຈໍໃໝ່', onclick: () => newScene() }));
  }
  let renaming = false;

  function openScene(id) { curId = id; selId = null; renaming = false; try { localStorage.setItem('mee-cur-scene', id); } catch (e) {} renderAll(); }
  function newScene(orient) {
    const id = Mee.uid('s');
    const n = sceneIds().length + 1;
    const sc = { name: 'ໜ້າຈໍ ' + n, orient: orient || (scene() || {}).orient || 'land', order: Date.now(), layers: {} };
    scenes[id] = sc; db.set('scenes/' + id, sc);
    openScene(id); renaming = true; renderScenes();
  }
  function dupScene() {
    const s = scene(); if (!s) return;
    const id = Mee.uid('s'); const c = clone(s); c.name = (s.name || '') + ' (ສຳເນົາ)'; c.order = Date.now();
    scenes[id] = c; db.set('scenes/' + id, c); openScene(id); toast('ສຳເນົາໜ້າຈໍແລ້ວ');
  }
  function delScene(id) {
    const name = (scenes[id] || {}).name || '';
    delete scenes[id]; db.remove('scenes/' + id);
    if (meta.active === id) db.update('meta', { active: null });
    if (curId === id) { curId = sceneIds()[0] || null; selId = null; }
    if (!curId) newScene(); else renderAll();
    toast('ລຶບໜ້າຈໍ "' + name + '" ແລ້ວ');
  }

  // ================================================================ canvas head + selection bar
  function renderHead() {
    const s = scene();
    $('sceneTitle').textContent = s ? s.name || 'ໜ້າຈໍ' : '—';
    const sz = size();
    $('sceneMeta').textContent = s ? sz.w + '×' + sz.h + ' · ' + layers().length + ' ຊັ້ນ' : '';
    const air = !!s && meta.active === curId;
    const b = $('goLive');
    b.className = 'btn' + (air ? ' onair' : ' primary');
    b.textContent = air ? '● ກຳລັງ live — ແຕະເພື່ອເອົາລົງ' : '▶ ຂຶ້ນ live ໜ້າຈໍນີ້';
    document.querySelectorAll('.tool.or').forEach((t) => t.setAttribute('aria-pressed', String(((s || {}).orient || 'land') === t.dataset.or)));
    $('canvasBg').classList.toggle('onair', air);
  }
  $('goLive').addEventListener('click', () => {
    const s = scene(); if (!s) return;
    const going = meta.active !== curId;
    meta.active = going ? curId : null;
    db.update('meta', { active: meta.active });
    renderHead(); renderScenes();
    toast(going ? '"' + (s.name || '') + '" ຂຶ້ນ live ແລ້ວ' : 'ເອົາໜ້າຈໍລົງຈາກ live ແລ້ວ');
  });

  const act = (ic, label, onclick, extra) => el('button', Object.assign({ class: 'act', type: 'button', onclick }, extra || {}), [el('span', { class: 'ic', text: ic }), label]);
  function renderSelBar() {
    const bar = $('selbar'); bar.textContent = '';
    const L = selLayer();
    if (!L) { bar.appendChild(el('span', { class: 'hint', text: scene() && layers().length ? 'ແຕະສິ່ງໃດໜຶ່ງໃນໜ້າຈໍ ເພື່ອເລືອກ ແລ້ວລາກເພື່ອຍ້າຍ' : 'ເລີ່ມຈາກກົດ T ຂໍ້ຄວາມ ຫຼື 🖼 ຮູບ' })); return; }
    const vis = L.visible !== false;
    bar.append(
      el('span', { class: 'nm', text: L.name || '' }),
      act(vis ? '👁' : '◌', vis ? 'ສະແດງຢູ່' : 'ເຊື່ອງຢູ່', () => { L.visible = !vis; changed(L, { delay: 0 }); renderInspector(); }, { 'aria-pressed': String(vis) }),
      act(L.locked ? '🔒' : '🔓', L.locked ? 'ລັອກຢູ່' : 'ລັອກ', () => { L.locked = !L.locked; changed(L, { delay: 0 }); drawSelection(); }, { 'aria-pressed': String(!!L.locked) }),
      act('⬆', 'ໄວ້ເທິງ', () => reorder(1)),
      act('⬇', 'ໄວ້ລຸ່ມ', () => reorder(-1)),
      act('⧉', 'ສຳເນົາ', duplicateSel),
      act('✕', 'ຍົກເລີກ', () => select(null)),
      armable(el('button', { class: 'act danger', type: 'button' }),
        (b) => { b.innerHTML = '<span class="ic">🗑</span>ລຶບ'; }, (b) => { b.innerHTML = '<span class="ic">🗑</span>ແຕະອີກເທື່ອ'; }, removeSel),
    );
  }

  // ================================================================ inspector
  const getP = (o, path) => path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setP = (o, path, v) => { const ks = path.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) { if (!a[ks[i]] || typeof a[ks[i]] !== 'object') a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; };
  const sec = (title, open, kids) => {
    const d = el('details', { class: 'sec' });
    const st = openSecs.has(title) ? openSecs.get(title) : open; if (st) d.open = true;
    d.addEventListener('toggle', () => openSecs.set(title, d.open));
    d.append(el('summary', { text: title }), el('div', { class: 'secBody' }, kids));
    return d;
  };
  const field = (label, ctl, out) => el('div', { class: 'field' }, [el('div', { class: 'lb' }, [label, out || null]), ctl]);
  function range(L, path, label, min, max, step, fmt) {
    const v0 = getP(L, path);
    const out = el('output', { text: fmt ? fmt(v0 == null ? min : v0) : String(v0 == null ? min : v0) });
    const inp = el('input', { type: 'range', min, max, step, value: typeof v0 === 'number' ? v0 : min,
      oninput: () => { const v = parseFloat(inp.value); setP(L, path, v); out.textContent = fmt ? fmt(v) : v; changed(L); } });
    return field(label, inp, out);
  }
  const color = (L, path) => el('input', { type: 'color', value: getP(L, path) || '#ffffff', 'aria-label': 'ສີ', oninput: (e) => { setP(L, path, e.target.value); changed(L); } });
  function seg(L, path, options, after) {
    const wrap = el('div', { class: 'seg', role: 'group' }); const cur = getP(L, path);
    options.forEach(([v, t]) => wrap.appendChild(el('button', { type: 'button', 'aria-pressed': String(cur === v), text: t,
      onclick: () => { setP(L, path, v); wrap.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(options[i][0] === v))); changed(L, { delay: 0, full: !!after }); } })));
    return wrap;
  }
  function sw(L, path, label, after) {
    const on = !!getP(L, path);
    const b = el('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(on), 'aria-label': label,
      onclick: () => { const v = !getP(L, path); setP(L, path, v); b.setAttribute('aria-checked', String(v)); changed(L, { delay: 0, full: !!after }); } });
    return el('div', { class: 'toggle' }, [el('span', { text: label }), b]);
  }
  function fxGrid(L, path, list) {
    const g = el('div', { class: 'fxgrid' }); const cur = getP(L, path) || 'none';
    list.forEach(([v, t]) => g.appendChild(el('button', { type: 'button', 'aria-pressed': String(cur === v), text: t,
      onclick: () => { setP(L, path, v); g.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(list[i][0] === v))); changed(L, { delay: 0 }); } })));
    return g;
  }
  const selectBox = (L, path, options, label) => {
    const s = el('select', { 'aria-label': label, onchange: () => { setP(L, path, s.value); changed(L, { delay: 0 }); } }, options.map(([v, t]) => el('option', { value: v, text: t })));
    s.value = getP(L, path) || options[0][0]; return s;
  };

  const boxInputs = {};
  function refreshBoxInputs() { const L = selLayer(); if (!L) return; ['x', 'y', 'w', 'h'].forEach((k) => { const i = boxInputs[k]; if (i && document.activeElement !== i) i.value = Math.round(L[k] || 0); }); }
  function geometrySec(L) {
    const num = (k, label) => { const i = el('input', { type: 'number', value: Math.round(L[k] || 0), onchange: () => { L[k] = parseFloat(i.value) || 0; if (k === 'w' || k === 'h') L[k] = Math.max(10, L[k]); changed(L, { delay: 0 }); } }); boxInputs[k] = i; return el('label', {}, [label, i]); };
    const s = size();
    const put = (fn) => () => { fn(); changed(L, { delay: 0 }); refreshBoxInputs(); };
    return sec('ຕຳແໜ່ງ ແລະ ຂະໜາດ', false, [
      el('div', { class: 'grid4' }, [num('x', 'X'), num('y', 'Y'), num('w', 'ກວ້າງ'), num('h', 'ສູງ')]),
      el('div', { class: 'inline' }, [
        el('button', { class: 'btn sm', type: 'button', text: '↔ ກາງ', onclick: put(() => { L.x = Math.round((s.w - L.w) / 2); }) }),
        el('button', { class: 'btn sm', type: 'button', text: '↕ ກາງ', onclick: put(() => { L.y = Math.round((s.h - L.h) / 2); }) }),
        el('button', { class: 'btn sm', type: 'button', text: 'ເຕັມກວ້າງ', onclick: put(() => { L.x = 0; L.w = s.w; }) }),
        el('button', { class: 'btn sm', type: 'button', text: 'ເຕັມຈໍ', onclick: put(() => { L.x = 0; L.y = 0; L.w = s.w; L.h = s.h; }) }),
      ]),
      range(L, 'rot', 'ໝຸນ', -180, 180, 1, (v) => v + '°'),
      range(L, 'opacity', 'ຄວາມເຂັ້ມ', 0.05, 1, 0.05, (v) => Math.round(v * 100) + '%'),
    ]);
  }

  function renderInspector() {
    const head = $('insHead'), body = $('insBody');
    head.textContent = ''; body.textContent = '';
    const L = selLayer();
    if (!L) {
      head.appendChild(el('h3', { text: 'ຊັ້ນໃນໜ້າຈໍນີ້ (' + layers().length + ')' }));
      renderLayerList(body);
      return;
    }
    head.append(el('button', { class: 'btn sm ghost', type: 'button', text: '← ທັງໝົດ', onclick: () => select(null) }));
    const nm = el('input', { type: 'text', value: L.name || '', 'aria-label': 'ຊື່ຊັ້ນ', oninput: () => { L.name = nm.value; renderSelBar(); saveLayer(L); } });
    head.appendChild(nm);
    if (L.type === 'text') textProps(body, L); else imageProps(body, L);
    body.appendChild(geometrySec(L));
  }

  function renderLayerList(body) {
    if (!scene()) { body.appendChild(el('p', { class: 'muted', text: 'ຍັງບໍ່ມີໜ້າຈໍ.' })); return; }
    const list = sorted().reverse();
    if (!list.length) { body.appendChild(el('p', { class: 'muted', text: 'ຍັງບໍ່ມີຫຍັງໃນໜ້າຈໍນີ້. ກົດ T ຂໍ້ຄວາມ ຫຼື 🖼 ຮູບ ຢູ່ແຖບຊ້າຍ.' })); return; }
    const ul = el('ul', { class: 'layers' });
    list.forEach((L) => {
      const vis = L.visible !== false;
      const kind = el('span', { class: 'kind', text: L.type === 'image' ? '' : 'T' });
      if (L.type === 'image') { const id = Mee.asArray((L.image || {}).assets)[0]; if (id) getAsset(id).then((src) => { if (src) kind.style.backgroundImage = 'url("' + src + '")'; }); else kind.textContent = '🖼'; }
      const sub = L.type === 'text' ? String((L.text || {}).content || '').replace(/\s+/g, ' ').slice(0, 40) : Mee.asArray((L.image || {}).assets).length + ' ຮູບ';
      const swb = el('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(vis), 'aria-label': 'ສະແດງ ' + (L.name || ''),
        onclick: (e) => { e.stopPropagation(); L.visible = !vis; changed(L, { delay: 0, full: true }); } });
      ul.appendChild(el('li', { class: vis ? '' : 'off', onclick: () => select(L.id) }, [kind,
        el('div', { class: 'nm' }, [el('b', { text: (L.locked ? '🔒 ' : '') + (L.name || '') }), el('small', { text: sub + (fxLabel(L) ? ' · ' + fxLabel(L) : '') })]), swb]));
    });
    body.appendChild(ul);
    body.appendChild(el('p', { class: 'muted', text: 'ສະວິດ = ເປີດ/ປິດ ໃນ live ທັນທີ · ແຕະແຖວ = ປັບແຕ່ງ' }));
  }

  // ---------------- text presets
  const TEXT_PRESETS = [
    { name: 'ປ້າຍແດງ', css: 'background:#d6281e;color:#fff', t: { bgOn: true, bgColor: '#d6281e', bgAlpha: 1, color: '#ffffff', strokeW: 0, shadow: false, radius: 12, pad: 24, bold: true, fx: 'none' } },
    { name: 'ແຖບດຳ', css: 'background:rgba(0,0,0,.7);color:#fff', t: { bgOn: true, bgColor: '#000000', bgAlpha: 0.65, color: '#ffffff', strokeW: 0, shadow: false, radius: 16, pad: 24, bold: true } },
    { name: 'ປ້າຍເຫຼືອງ', css: 'background:#ffcc00;color:#111', t: { bgOn: true, bgColor: '#ffcc00', bgAlpha: 1, color: '#111111', strokeW: 0, shadow: false, radius: 12, pad: 24, bold: true } },
    { name: 'ຂອບດຳ', css: 'background:transparent;color:#fff;-webkit-text-stroke:1px #000;text-shadow:0 2px 4px #000', t: { bgOn: false, color: '#ffffff', strokeW: 5, strokeColor: '#000000', shadow: true, bold: true } },
    { name: 'ຫົວຂໍ້ໃຫຍ່', css: 'background:transparent;color:#ffcc00;font-size:17px;text-shadow:0 2px 6px #000', t: { bgOn: false, color: '#ffcc00', strokeW: 4, strokeColor: '#000000', shadow: true, bold: true, size: 120 } },
    { name: 'ຂ່າວແລ່ນ ລຸ່ມຈໍ', css: 'background:#111;color:#fff;border-bottom:3px solid #ff4d3d', t: { bgOn: true, bgColor: '#111111', bgAlpha: 0.85, color: '#ffffff', strokeW: 0, radius: 0, pad: 16, size: 48, align: 'left', fx: 'scroll-l', speed: 5 }, geo: (s) => ({ x: 0, w: s.w, h: 96, y: s.h - 96 }) },
  ];
  function textProps(body, L) {
    const t = L.text;
    const ta = el('textarea', { 'aria-label': 'ຂໍ້ຄວາມ', oninput: () => { t.content = ta.value; changed(L, { delay: 400 }); } }); ta.value = t.content || '';
    const presets = el('div', { class: 'presets' }, TEXT_PRESETS.map((p) => el('button', { class: 'preset', type: 'button', style: p.css, text: p.name,
      onclick: () => { Object.assign(t, p.t); if (p.geo) Object.assign(L, p.geo(size())); changed(L, { delay: 0, full: true }); toast('ໃຊ້ແບບ "' + p.name + '" ແລ້ວ'); } })));
    body.append(
      sec('ຂໍ້ຄວາມ', true, [ta,
        field('ແບບສຳເລັດຮູບ (ແຕະເພື່ອໃຊ້)', presets),
        field('Font', selectBox(L, 'text.font', Mee.FONTS.map((f) => [f.id, f.label]), 'Font')),
        range(L, 'text.size', 'ຂະໜາດຕົວໜັງສື', 16, 320, 1, (v) => v + 'px'),
        field('ສີ ແລະ ການຈັດວາງ', el('div', { class: 'inline' }, [color(L, 'text.color'),
          el('div', { style: 'flex:1' }, [seg(L, 'text.align', [['left', 'ຊ້າຍ'], ['center', 'ກາງ'], ['right', 'ຂວາ']])])])),
        sw(L, 'text.bold', 'ໂຕໜາ'),
      ]),
      sec('ເອັບເຟັກ', true, [fxGrid(L, 'text.fx', Mee.TEXT_FX),
        range(L, 'text.speed', 'ຄວາມໄວ', 1, 10, 1),
        field('ເອັບເຟັກຕອນເປີດ-ປິດ', selectBox(L, 'enter', Mee.ENTER, 'ເອັບເຟັກຕອນເປີດ'))]),
      sec('ກ່ອງພື້ນຫຼັງ', false, [sw(L, 'text.bgOn', 'ສະແດງກ່ອງພື້ນຫຼັງ'),
        field('ສີພື້ນ', color(L, 'text.bgColor')),
        range(L, 'text.bgAlpha', 'ຄວາມເຂັ້ມພື້ນ', 0, 1, 0.05, (v) => Math.round(v * 100) + '%'),
        range(L, 'text.radius', 'ມຸມມົນ', 0, 120, 1, (v) => v + 'px'),
        range(L, 'text.pad', 'ໄລຍະຂອບໃນ', 0, 120, 1, (v) => v + 'px')]),
      sec('ຂອບ ແລະ ເງົາຕົວໜັງສື', false, [range(L, 'text.strokeW', 'ຄວາມໜາຂອບ', 0, 12, 1, (v) => v + 'px'),
        field('ສີຂອບ', color(L, 'text.strokeColor')), sw(L, 'text.shadow', 'ເງົາ')]),
    );
  }

  // ---------------- image presets
  const IMG_PRESETS = [
    { name: 'ໂລໂກ້ມຸມຂວາເທິງ', apply: (L, s) => { const w = Math.round(Math.min(s.w, s.h) * 0.2); const h = Math.round(w * L.h / Math.max(1, L.w)); Object.assign(L, { w, h, x: s.w - w - 40, y: 40 }); } },
    { name: 'ໂລໂກ້ມຸມຊ້າຍເທິງ', apply: (L, s) => { const w = Math.round(Math.min(s.w, s.h) * 0.2); const h = Math.round(w * L.h / Math.max(1, L.w)); Object.assign(L, { w, h, x: 40, y: 40 }); } },
    { name: 'ວົງມົນ ຂອບຂາວ', apply: (L) => { Object.assign(L.image, { radius: 'circle', borderW: 6, borderColor: '#ffffff', fit: 'cover', shadow: true }); const m = Math.min(L.w, L.h); L.w = m; L.h = m; } },
    { name: 'ແຖບສະປອນເຊີ ລຸ່ມຈໍ', apply: (L, s) => { Object.assign(L.image, { mode: 'marquee', bgOn: true, bgColor: '#ffffff', gap: 24 }); Object.assign(L, { x: 0, w: s.w, h: 120, y: s.h - 120 }); } },
    { name: 'ເຕັມຈໍ', apply: (L, s) => { Object.assign(L, { x: 0, y: 0, w: s.w, h: s.h }); L.image.fit = 'cover'; } },
    { name: 'ຕ່ອງກາງຈໍ', apply: (L, s) => { L.x = Math.round((s.w - L.w) / 2); L.y = Math.round((s.h - L.h) / 2); } },
  ];
  function imageProps(body, L) {
    const im = L.image; const ids = Mee.asArray(im.assets);
    const thumbs = el('div', { class: 'thumbs' });
    ids.forEach((id, i) => {
      const t = el('div', { class: 't' });
      getAsset(id).then((src) => { if (src) t.style.backgroundImage = 'url("' + src + '")'; });
      t.appendChild(el('button', { class: 'x', type: 'button', 'aria-label': 'ເອົາຮູບນີ້ອອກ', text: '✕', onclick: () => { const a = Mee.asArray(im.assets); a.splice(i, 1); im.assets = a; changed(L, { delay: 0, full: true }); } }));
      if (i > 0) t.appendChild(el('button', { class: 'mv', type: 'button', 'aria-label': 'ຍ້າຍໄປກ່ອນ', text: '◀', onclick: () => { const a = Mee.asArray(im.assets); [a[i - 1], a[i]] = [a[i], a[i - 1]]; im.assets = a; changed(L, { delay: 0, full: true }); } }));
      thumbs.appendChild(t);
    });
    const more = el('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
    more.addEventListener('change', async () => {
      const files = Array.from(more.files || []); more.value = '';
      const newIds = await uploadFiles(files); if (!newIds.length) return;
      im.assets = Mee.asArray(im.assets).concat(newIds);
      if (im.assets.length > 1 && (!im.mode || im.mode === 'single')) im.mode = 'slide';
      changed(L, { delay: 0, full: true });
    });
    thumbs.appendChild(el('button', { class: 'addT', type: 'button', 'aria-label': 'ເພີ່ມຮູບ', text: '＋', onclick: () => more.click() }));
    const kids = [thumbs, more];
    if (ids.length > 1) {
      kids.push(field('ການສະແດງຫຼາຍຮູບ', seg(L, 'image.mode', [['single', 'ຮູບທຳອິດ'], ['slide', 'ສະລັບວົນ'], ['marquee', 'ແຖບເລື່ອນ']], true)));
      if (im.mode === 'slide') kids.push(range(L, 'image.interval', 'ປ່ຽນຮູບທຸກ', 1, 15, 0.5, (v) => v + ' ວິນາທີ'));
      if (im.mode === 'marquee') kids.push(field('ທິດທາງ', seg(L, 'image.dir', [['l', 'ຂວາ → ຊ້າຍ'], ['r', 'ຊ້າຍ → ຂວາ']])), range(L, 'image.gap', 'ຊ່ອງຫ່າງ', 0, 80, 2, (v) => v + 'px'), range(L, 'image.speed', 'ຄວາມໄວເລື່ອນ', 1, 10, 1));
    } else kids.push(el('p', { class: 'muted', text: 'ໃສ່ 2 ຮູບຂຶ້ນໄປ ຈະເລືອກໃຫ້ສະລັບວົນ ຫຼື ເລື່ອນເປັນແຖບໄດ້.' }));
    const fitRatio = async () => { const id = Mee.asArray(im.assets)[0]; if (!id) return; const a = await db.get('assets/' + id); if (!a || !a.w) return; L.h = Math.round(L.w * a.h / a.w); changed(L, { delay: 0 }); refreshBoxInputs(); };
    kids.push(el('button', { class: 'btn sm', type: 'button', text: 'ປັບກອບໃຫ້ພໍດີຮູບ', onclick: fitRatio }));
    const presets = el('div', { class: 'presets' }, IMG_PRESETS.map((p) => el('button', { class: 'preset', type: 'button', style: 'background:var(--field)', text: p.name,
      onclick: () => { p.apply(L, size()); changed(L, { delay: 0, full: true }); refreshBoxInputs(); toast('ໃຊ້ "' + p.name + '" ແລ້ວ'); } })));
    body.append(
      sec('ຮູບ (' + ids.length + ')', true, kids),
      sec('ແບບສຳເລັດຮູບ', true, [presets]),
      sec('ເອັບເຟັກ', true, [fxGrid(L, 'image.fx', Mee.IMG_FX), range(L, 'image.speed', 'ຄວາມໄວ', 1, 10, 1),
        field('ເອັບເຟັກຕອນເປີດ-ປິດ', selectBox(L, 'enter', Mee.ENTER, 'ເອັບເຟັກຕອນເປີດ'))]),
      sec('ຮູບແບບ', false, [
        field('ການວາງຮູບໃນກອບ', seg(L, 'image.fit', [['contain', 'ເຫັນທັງຮູບ'], ['cover', 'ເຕັມກອບ']])),
        field('ມຸມ', seg(L, 'image.radius', [[0, 'ສີ່ຫຼ່ຽມ'], [16, 'ມົນນ້ອຍ'], [40, 'ມົນຫຼາຍ'], ['circle', 'ວົງມົນ']])),
        range(L, 'image.borderW', 'ຂອບ', 0, 30, 1, (v) => v + 'px'),
        field('ສີຂອບ', color(L, 'image.borderColor')),
        sw(L, 'image.shadow', 'ເງົາ'),
        sw(L, 'image.bgOn', 'ພື້ນຫຼັງ (ສຳລັບຮູບໂປ່ງໃສ)'),
        field('ສີພື້ນຫຼັງ', color(L, 'image.bgColor'))]),
    );
  }

  // ================================================================ layer ops
  const nextZ = () => layers().reduce((m, l) => Math.max(m, l.z || 0), 0) + 1;
  function putLayer(L) { const s = scene(); if (!s) return; s.layers = s.layers || {}; s.layers[L.id] = L; selId = null; select(L.id); changed(L, { delay: 0 }); renderHead(); }
  $('addText').addEventListener('click', () => {
    if (!scene()) newScene();
    const L = Mee.newTextLayer(size()); L.z = nextZ(); L.name = 'ຂໍ້ຄວາມ ' + (layers().filter((l) => l.type === 'text').length + 1);
    putLayer(L); toast('ເພີ່ມຂໍ້ຄວາມແລ້ວ — ພິມຂໍ້ຄວາມຢູ່ດ້ານຂວາ');
    setTimeout(() => { const ta = document.querySelector('#insBody textarea'); if (ta && matchMedia('(min-width: 981px)').matches) { ta.focus(); ta.select(); } }, 50);
  });
  async function uploadFiles(files) {
    const ids = [];
    for (const f of files) {
      try {
        toast('ກຳລັງອັບໂຫຼດ ' + f.name + '…');
        const a = await Mee.fileToAsset(f, 900); const id = Mee.uid('a');
        await db.set('assets/' + id, a); assetCache.set(id, Promise.resolve(a.data)); ids.push(id);
      } catch (e) { toast('ອັບໂຫຼດ ' + f.name + ' ບໍ່ໄດ້'); }
    }
    return ids;
  }
  $('addImage').addEventListener('click', () => { if (!scene()) newScene(); $('fileImg').click(); });
  $('fileImg').addEventListener('change', async () => {
    const files = Array.from($('fileImg').files || []); $('fileImg').value = '';
    if (!files.length) return;
    const ids = await uploadFiles(files); if (!ids.length) return;
    const L = Mee.newImageLayer(size(), ids); L.z = nextZ(); L.name = 'ຮູບ ' + (layers().filter((l) => l.type === 'image').length + 1);
    if (ids.length > 1) L.image.mode = 'slide';
    const a = await db.get('assets/' + ids[0]);
    if (a && a.w) { L.h = Math.round(L.w * a.h / a.w); L.y = Math.round((size().h - L.h) / 2); }
    putLayer(L); toast(ids.length > 1 ? 'ເພີ່ມ ' + ids.length + ' ຮູບ ໃຫ້ສະລັບວົນແລ້ວ' : 'ເພີ່ມຮູບແລ້ວ');
  });
  function removeSel() {
    const s = scene(); const L = selLayer(); if (!s || !L) return;
    const key = curId + '/' + L.id; clearTimeout(pending.get(key)); pending.delete(key);
    delete s.layers[L.id]; selId = null;
    db.remove('scenes/' + curId + '/layers/' + L.id);
    renderStage(); drawSelection(); renderSelBar(); renderInspector(); renderHead();
    toast('ລຶບ "' + (L.name || '') + '" ແລ້ວ');
  }
  function duplicateSel() {
    const L = selLayer(); if (!L) return;
    const c = clone(L); c.id = Mee.uid(L.type === 'image' ? 'i' : 't'); c.x += 40; c.y += 40; c.z = nextZ(); c.name = (L.name || '') + ' (ສຳເນົາ)';
    putLayer(c); toast('ສຳເນົາແລ້ວ');
  }
  function reorder(dir) {
    const list = sorted(); const i = list.findIndex((l) => l.id === selId); const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) { toast(dir > 0 ? 'ຢູ່ເທິງສຸດແລ້ວ' : 'ຢູ່ລຸ່ມສຸດແລ້ວ'); return; }
    [list[i], list[j]] = [list[j], list[i]];
    list.forEach((l, n) => { if (l.z !== n) { l.z = n; saveLayer(l, 0); } });
    renderStage(); if (!selLayer()) return; renderInspector();
  }
  document.querySelectorAll('.tool.or').forEach((b) => b.addEventListener('click', () => {
    const s = scene(); if (!s) { newScene(b.dataset.or); return; }
    if ((s.orient || 'land') === b.dataset.or) return;
    const from = Mee.SIZES[s.orient || 'land'], to = Mee.SIZES[b.dataset.or];
    s.orient = b.dataset.or;
    const upd = { orient: s.orient };
    layers().forEach((L) => {
      const k = Math.min(1, to.w / L.w, to.h / L.h);
      L.w = Math.round(L.w * k); L.h = Math.round(L.h * k);
      L.x = Math.round(Math.min(to.w - L.w, Math.max(0, (L.x + L.w / 2) * to.w / from.w - L.w / 2)));
      L.y = Math.round(Math.min(to.h - L.h, Math.max(0, (L.y + L.h / 2) * to.h / from.h - L.h / 2)));
      upd['layers/' + L.id] = clone(L);
    });
    db.update('scenes/' + curId, upd);
    renderAll();
    toast(s.orient === 'port' ? 'ໜ້າຈໍນີ້ເປັນແນວຕັ້ງ 1080×1920' : 'ໜ້າຈໍນີ້ເປັນແນວນອນ 1920×1080');
  }));

  // ================================================================ live mode
  const lpStage = $('lpStage'), lpBox = $('lpBox');
  const lpRenderer = Mee.createRenderer(lpStage, { editor: false, getAsset });
  function lpLayout() {
    const s = Mee.SIZES[((scenes[meta.active] || {}).orient) || 'land'];
    const pw = lpBox.clientWidth, ph = lpBox.clientHeight; if (!pw || !ph) return;
    const k = Math.min((pw - 24) / s.w, (ph - 24) / s.h);
    const left = (pw - s.w * k) / 2, top = (ph - s.h * k) / 2;
    lpStage.style.transform = 'scale(' + k + ')'; lpStage.style.left = left + 'px'; lpStage.style.top = top + 'px';
    Object.assign($('lpBg').style, { left: left + 'px', top: top + 'px', width: s.w * k + 'px', height: s.h * k + 'px' });
  }
  new ResizeObserver(() => lpLayout()).observe(lpBox);

  function renderLive() {
    const liveId = meta.active, ls = liveId && scenes[liveId];
    $('onairTag').className = 'onairTag' + (ls ? '' : ' off');
    $('onairTag').lastChild.textContent = ls ? 'ON AIR' : 'ບໍ່ມີໜ້າຈໍ live';
    $('liveName').textContent = ls ? ls.name || '' : '';
    if (ls) lpRenderer.setScene(ls, liveId); else lpRenderer.clear();
    lpStage.classList.toggle('hide-all', !!meta.hideAll);
    lpLayout();

    const side = $('liveSide');
    if (side.contains(document.activeElement) && document.activeElement.tagName === 'TEXTAREA') return;
    side.textContent = '';
    side.appendChild(el('h3', { text: 'ແຕະເພື່ອເລືອກໜ້າຈໍທີ່ຂຶ້ນ live' }));
    const tiles = el('div', { class: 'sceneTiles' });
    sceneIds().forEach((id) => {
      const s = scenes[id], on = liveId === id;
      tiles.appendChild(el('button', { class: 'sceneTile', type: 'button', 'aria-pressed': String(on),
        onclick: () => { meta.active = on ? null : id; db.update('meta', { active: meta.active }); renderLive(); renderScenes(); } },
        [s.name || 'ໜ້າຈໍ', el('small', { text: on ? '● ກຳລັງ live · ແຕະເພື່ອເອົາລົງ' : layersOf(s).length + ' ຊັ້ນ' })]));
    });
    side.appendChild(tiles);
    side.appendChild(el('button', { class: 'btn panic' + (meta.hideAll ? ' on' : ''), type: 'button',
      text: meta.hideAll ? '👁 ສະແດງ overlay ຄືນ' : '🙈 ເຊື່ອງ overlay ທັງໝົດ (ຊົ່ວຄາວ)',
      onclick: () => { meta.hideAll = !meta.hideAll; db.update('meta', { hideAll: meta.hideAll }); renderLive(); } }));
    if (!ls) { side.appendChild(el('p', { class: 'muted', text: 'ຍັງບໍ່ມີໜ້າຈໍຂຶ້ນ live. ແຕະໜ້າຈໍຂ້າງເທິງ.' })); return; }
    side.appendChild(el('h3', { text: 'ສິ່ງທີ່ຢູ່ໃນ "' + (ls.name || '') + '"' }));
    layersOf(ls).sort((a, b) => (b.z || 0) - (a.z || 0)).forEach((L) => {
      const vis = L.visible !== false;
      const swb = el('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(vis), 'aria-label': 'ສະແດງ ' + (L.name || ''),
        onclick: () => { L.visible = !vis; db.set('scenes/' + liveId + '/layers/' + L.id + '/visible', L.visible); renderLive(); } });
      const item = el('div', { class: 'lItem' }, [el('div', { class: 'hd' }, [el('b', { text: (L.type === 'image' ? '🖼 ' : 'T  ') + (L.name || '') }), swb])]);
      if (L.type === 'text') {
        const ta = el('textarea', { 'aria-label': 'ຂໍ້ຄວາມຂອງ ' + (L.name || '') }); ta.value = (L.text || {}).content || '';
        const send = el('button', { class: 'btn sm primary', type: 'button', text: 'ອັບເດດຂໍ້ຄວາມ', onclick: () => {
          L.text.content = ta.value; db.set('scenes/' + liveId + '/layers/' + L.id + '/text/content', ta.value); toast('ອັບເດດຂໍ້ຄວາມແລ້ວ'); ta.blur(); renderLive(); } });
        item.append(ta, send);
      }
      side.appendChild(item);
    });
  }

  // ================================================================ modes, dialogs, menu
  function setMode(m) {
    mode = m;
    document.querySelectorAll('.modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    $('design').hidden = m !== 'design'; $('live').hidden = m !== 'live'; $('scenes').hidden = m !== 'design';
    renderAll();
  }
  document.querySelectorAll('.modes button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  const overlayUrl = () => new URL('overlay.html?u=' + encodeURIComponent(user || 'local'), location.href).href;
  function dialog(build) {
    const box = $('dlgBody'); box.textContent = ''; build(box); $('dlg').hidden = false;
    const f = box.querySelector('button'); if (f) f.focus();
  }
  const closeDlg = () => { $('dlg').hidden = true; };
  $('dlg').addEventListener('click', (e) => { if (e.target.id === 'dlg') closeDlg(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('dlg').hidden) closeDlg(); });

  $('connectBtn').addEventListener('click', () => dialog((box) => {
    const u = overlayUrl();
    const copy = el('button', { class: 'btn primary', type: 'button', text: '📋 ສຳເນົາລິ້ງ', onclick: async () => {
      try { await navigator.clipboard.writeText(u); copy.textContent = '✓ ສຳເນົາແລ້ວ'; }
      catch (e) { const r = document.createRange(); r.selectNodeContents(urlBox); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = 'ກົດຄ້າງລິ້ງເພື່ອສຳເນົາ'; } } });
    const urlBox = el('div', { class: 'urlBox', text: u });
    box.append(el('h2', { id: 'dlgTitle', text: '🔗 ເຊື່ອມກັບ Live Now' }), urlBox,
      el('div', { class: 'inline' }, [copy, el('a', { class: 'btn', href: u + '&test=1', target: '_blank', rel: 'noopener', text: 'ເປີດເບິ່ງ overlay' })]),
      el('ol', {}, [el('li', { html: 'ກົດ <b>ສຳເນົາລິ້ງ</b>' }), el('li', { html: 'ໃນ Live Now: ກົດ <b>Web</b> → ວາງລິ້ງ → <b>OK</b>' }),
        el('li', { html: 'ກົດ <b>Full Screen</b> → <b>Done</b> → <b>Save</b>' }), el('li', { html: 'ກັບມາທີ່ນີ້ ກົດ <b>▶ ຂຶ້ນ live ໜ້າຈໍນີ້</b>' })]),
      el('p', { class: 'muted', text: 'ລິ້ງນີ້ໃຊ້ໄດ້ຕະຫຼອດ. ເຮັດຂັ້ນຕອນນີ້ເທື່ອດຽວ ຕໍ່ໄປພຽງແຕ່ເລືອກໜ້າຈໍທີ່ຈະຂຶ້ນ live.' }),
      el('button', { class: 'btn', type: 'button', text: 'ປິດ', onclick: closeDlg }));
  }));
  const menu = $('menu');
  $('menuBtn').addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; $('menuBtn').setAttribute('aria-expanded', String(!menu.hidden)); });
  document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) { menu.hidden = true; $('menuBtn').setAttribute('aria-expanded', 'false'); } });
  $('mOut').addEventListener('click', () => { db.signOut(); location.reload(); });
  $('mHelp').addEventListener('click', () => { menu.hidden = true; dialog((box) => box.append(
    el('h2', { id: 'dlgTitle', text: '❓ ວິທີໃຊ້ແບບສັ້ນ' }),
    el('ol', {}, [
      el('li', { html: '<b>ໜ້າຈໍ</b> = ຊຸດ overlay ທີ່ກຽມໄວ້ (ເຊັ່ນ "ລໍຖ້າເລີ່ມ", "ພັກເຄິ່ງ"). ຂຶ້ນ live ໄດ້ເທື່ອລະໜ້າຈໍ.' }),
      el('li', { html: 'ໂໝດ <b>ອອກແບບ</b>: ເພີ່ມ <b>T ຂໍ້ຄວາມ</b> ຫຼື <b>🖼 ຮູບ</b> → ລາກຍ້າຍ, ລາກມຸມປັບຂະໜາດ, ລາກຈຸດເທິງໝຸນ → ປັບແຕ່ງຢູ່ດ້ານຂວາ.' }),
      el('li', { html: 'ແຖບລຸ່ມໜ້າຈໍ: <b>ສະແດງ/ເຊື່ອງ, ລັອກ, ຍ້າຍຊັ້ນ, ສຳເນົາ, ລຶບ</b> ສິ່ງທີ່ເລືອກ.' }),
      el('li', { html: 'ກົດ <b>▶ ຂຶ້ນ live ໜ້າຈໍນີ້</b> ເພື່ອໃຫ້ຂຶ້ນໃນ Live Now.' }),
      el('li', { html: 'ໂໝດ <b>ຄວບຄຸມ Live</b>: ປຸ່ມໃຫຍ່ສຳລັບສະລັບໜ້າຈໍ, ເປີດ/ປິດແຕ່ລະສິ່ງ ແລະ ແກ້ຂໍ້ຄວາມດ່ວນ ຕອນກຳລັງ live.' }),
    ]),
    el('button', { class: 'btn', type: 'button', text: 'ເຂົ້າໃຈແລ້ວ', onclick: closeDlg }))); });

  // ================================================================ render orchestration
  function renderAll() {
    renderScenes();
    if (mode === 'design') { renderHead(); renderStage(); renderSelBar(); renderInspector(); }
    else renderLive();
  }

  function setNet(ok, txt) { $('netDot').className = 'dot ' + (ok ? 'ok' : 'bad'); $('netTxt').textContent = txt; }

  function start() {
    if (started) return; started = true;
    $('login').hidden = true; $('app').hidden = false;
    db.setUser(user);
    $('who').textContent = userEmail || (db.mode === 'local' ? 'ໂໝດທົດລອງ (ບໍ່ໄດ້ເຊື່ອມ Firebase)' : '');
    if (db.mode === 'local') { $('netDot').className = 'dot demo'; $('netTxt').textContent = 'ໂໝດທົດລອງ'; $('mOut').hidden = true; }
    else db.onConnection((ok) => setNet(ok, ok ? 'ເຊື່ອມຕໍ່ແລ້ວ' : 'ຂາດການເຊື່ອມຕໍ່'));
    try { curId = localStorage.getItem('mee-cur-scene'); } catch (e) {}
    let first = true;
    db.watch('scenes', (v) => {
      const incoming = v || {};
      // keep local versions of layers still being written, so remote echoes don't undo typing / dragging
      pending.forEach((_, key) => {
        const [sid, lid] = key.split('/');
        const mine = scenes[sid] && scenes[sid].layers && scenes[sid].layers[lid];
        if (mine && incoming[sid]) { incoming[sid].layers = incoming[sid].layers || {}; incoming[sid].layers[lid] = mine; }
      });
      if (drag && curId && incoming[curId]) { incoming[curId].layers = incoming[curId].layers || {}; incoming[curId].layers[drag.L.id] = drag.L; }
      scenes = incoming;
      if (!curId || !scenes[curId]) curId = sceneIds()[0] || null;
      if (first) { first = false; if (!curId) { seed(); return; } }
      if (selId && !selLayer()) selId = null;
      renderScenes();
      if (mode === 'design') {
        renderHead(); renderStage(); renderSelBar();
        const focusIn = $('insBody').contains(document.activeElement) || $('insHead').contains(document.activeElement);
        if (!focusIn && !drag) renderInspector();
      } else renderLive();
    });
    db.watch('meta', (v) => { meta = v || {}; renderScenes(); if (mode === 'design') renderHead(); else renderLive(); });
    renderAll();
  }
  function seed() {
    const id = Mee.uid('s');
    const sc = { name: 'ໜ້າຈໍ 1', orient: 'land', order: Date.now(), layers: {} };
    const L = Mee.newTextLayer(Mee.SIZES.land);
    Object.assign(L, { name: 'ຊື່ເພຈ', z: 1, x: 60, y: 50, w: 620, h: 120 });
    Object.assign(L.text, { content: 'Mee Sport Live', size: 64, bgColor: '#d6281e', bgAlpha: 1, radius: 12 });
    sc.layers[L.id] = L; scenes[id] = sc; curId = id;
    db.set('scenes/' + id, sc); renderAll();
  }

  // ================================================================ auth
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); $('lg-msg').textContent = 'ກຳລັງເຂົ້າສູ່ລະບົບ…';
    try { await db.signIn($('lg-email').value.trim(), $('lg-pass').value); }
    catch (err) { $('lg-msg').textContent = 'ເຂົ້າສູ່ລະບົບບໍ່ໄດ້: ' + (err.code || err.message); }
  });
  $('lg-up').addEventListener('click', async () => {
    if (!$('loginForm').reportValidity()) return;
    $('lg-msg').textContent = 'ກຳລັງສ້າງບັນຊີ…';
    try { await db.signUp($('lg-email').value.trim(), $('lg-pass').value); }
    catch (err) { $('lg-msg').textContent = 'ສ້າງບັນຊີບໍ່ໄດ້: ' + (err.code || err.message); }
  });
  db.onAuth((u, info) => {
    const boot = $('boot'); if (boot) boot.style.display = 'none';
    if (!u) { $('app').hidden = true; $('login').hidden = false; return; }
    user = u; userEmail = (info && info.email) || ''; start();
  });
})();
