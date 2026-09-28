/* ===== Mee Overlay Studio — editor + live control ===== */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const el = (tag, props, kids) => {
    const n = document.createElement(tag);
    if (props) Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (v !== undefined && v !== null) n.setAttribute(k, v);
    });
    (kids || []).forEach((c) => c && n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return n;
  };
  const toastT = { t: 0 };
  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT.t); toastT.t = setTimeout(() => t.classList.remove('on'), 2200); };

  $('fontcss').href = Mee.FONT_CSS;

  // ------------------------------------------------------------------ state
  const db = Mee.createDB();
  let user = null;
  let scenes = {};          // id -> scene
  let meta = {};
  let curId = null;
  let selId = null;
  const pending = new Map(); // layerId -> timeout (local edits not yet written)
  const assetCache = new Map();
  let started = false;

  const scene = () => (curId && scenes[curId]) || null;
  const layers = () => { const s = scene(); return s && s.layers ? Object.values(s.layers).filter((l) => l && l.id) : []; };
  const sorted = () => layers().sort((a, b) => (a.z || 0) - (b.z || 0));
  const selLayer = () => { const s = scene(); return s && s.layers && selId ? s.layers[selId] || null : null; };
  const size = () => Mee.SIZES[(scene() || {}).orient || 'land'];

  const getAsset = (id) => {
    if (!assetCache.has(id)) assetCache.set(id, db.get('assets/' + id + '/data').catch(() => null));
    return assetCache.get(id);
  };

  // ------------------------------------------------------------------ renderer + layout
  const stage = $('stage');
  const preview = $('preview');
  const renderer = Mee.createRenderer(stage, { editor: true, getAsset });
  let K = 1;

  function layout() {
    const s = size();
    const pw = preview.clientWidth, ph = preview.clientHeight;
    K = Math.max(0.05, Math.min((pw - 24) / s.w, (ph - 24) / s.h));
    const left = (pw - s.w * K) / 2, top = (ph - s.h * K) / 2;
    stage.style.transform = 'scale(' + K + ')';
    stage.style.left = left + 'px'; stage.style.top = top + 'px';
    stage.style.setProperty('--inv', (1 / K).toFixed(3));
    const bg = $('canvasBg');
    bg.style.left = left + 'px'; bg.style.top = top + 'px'; bg.style.width = s.w * K + 'px'; bg.style.height = s.h * K + 'px';
    $('zoomInfo').textContent = s.w + '×' + s.h + ' · ' + Math.round(K * 100) + '%';
  }
  new ResizeObserver(() => { layout(); }).observe(preview);

  function renderStage() {
    const s = scene();
    renderer.setScene(s || { layers: {} }, curId || '-');
    layout();
    drawSelection();
  }

  // ------------------------------------------------------------------ selection box
  let selBox = null;
  function drawSelection() {
    const L = selLayer();
    if (!L) { if (selBox) { selBox.remove(); selBox = null; } return; }
    if (!selBox) {
      selBox = el('div', { class: 'sel' }, [el('div', { class: 'stem' })].concat(['tl', 'tr', 'bl', 'br', 'rot'].map((h) => el('div', { class: 'h ' + h, 'data-h': h }))));
      stage.appendChild(selBox);
    }
    if (selBox.parentNode !== stage) stage.appendChild(selBox);
    selBox.style.left = L.x + 'px'; selBox.style.top = L.y + 'px';
    selBox.style.width = L.w + 'px'; selBox.style.height = L.h + 'px';
    selBox.style.transform = L.rot ? 'rotate(' + L.rot + 'deg)' : '';
    selBox.style.borderWidth = (3 / K) + 'px';
    selBox.classList.toggle('locked', !!L.locked);
  }

  // ------------------------------------------------------------------ saving
  function saveLayer(L, delay) {
    const sid = curId;
    if (!sid || !L) return;
    clearTimeout(pending.get(L.id));
    const t = setTimeout(() => {
      db.set('scenes/' + sid + '/layers/' + L.id, clone(L)).catch((e) => toast('ບັນທຶກບໍ່ສຳເລັດ: ' + e.message))
        .finally(() => setTimeout(() => { if (pending.get(L.id) === t) pending.delete(L.id); }, 400));
    }, delay == null ? 250 : delay);
    pending.set(L.id, t);
  }
  function changed(L, opts) {
    renderStage();
    renderLayerList();
    if (opts && opts.live) renderLive();
    saveLayer(L, opts && opts.delay);
  }

  // ------------------------------------------------------------------ pointer: drag / resize / rotate
  let drag = null;
  const toStage = (e) => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / K, y: (e.clientY - r.top) / K }; };
  const guides = [];
  const clearGuides = () => { guides.forEach((g) => g.remove()); guides.length = 0; };
  const guide = (vertical, pos) => {
    const s = size();
    const g = el('div', { class: 'guide' });
    if (vertical) { g.style.left = pos + 'px'; g.style.top = 0; g.style.width = (2 / K) + 'px'; g.style.height = s.h + 'px'; }
    else { g.style.top = pos + 'px'; g.style.left = 0; g.style.height = (2 / K) + 'px'; g.style.width = s.w + 'px'; }
    stage.appendChild(g); guides.push(g);
  };

  preview.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('.h');
    const layerEl = e.target.closest('.ml');
    if (handle && selLayer()) { startHandle(e, handle.dataset.h); return; }
    if (layerEl && stage.contains(layerEl)) {
      const id = layerEl.dataset.id;
      if (id !== selId) select(id);
      const L = selLayer();
      if (L && !L.locked) startMove(e, L);
      return;
    }
    if (e.target === preview || e.target.id === 'canvasBg' || e.target === stage) select(null);
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
    const p = toStage(e);
    drag = { kind: h === 'rot' ? 'rot' : 'resize', h, L, p0: p, w0: L.w, h0: L.h, x0: L.x, y0: L.y, id: e.pointerId, last: 0,
      ratio: L.w / Math.max(1, L.h) };
    preview.setPointerCapture(e.pointerId);
  }

  preview.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const L = drag.L, p = toStage(e), s = size();
    clearGuides();
    if (drag.kind === 'move') {
      let x = p.x - drag.ox, y = p.y - drag.oy;
      const thr = 14;
      const cx = x + L.w / 2, cy = y + L.h / 2;
      if (Math.abs(cx - s.w / 2) < thr) { x = s.w / 2 - L.w / 2; guide(true, s.w / 2); }
      if (Math.abs(cy - s.h / 2) < thr) { y = s.h / 2 - L.h / 2; guide(false, s.h / 2); }
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
      let w = Math.max(20, drag.w0 + sx * lx), h = Math.max(20, drag.h0 + sy * ly);
      const keep = L.type === 'image' && ((L.image || {}).mode !== 'marquee');
      if (keep) { if (Math.abs(sx * lx) / drag.w0 > Math.abs(sy * ly) / drag.h0) h = w / drag.ratio; else w = h * drag.ratio; }
      const dw = w - drag.w0, dh = h - drag.h0;
      const cx0 = drag.x0 + drag.w0 / 2, cy0 = drag.y0 + drag.h0 / 2;
      const mx = sx * dw / 2, my = sy * dh / 2;
      const cx = cx0 + mx * cos - my * sin, cy = cy0 + mx * sin + my * cos;
      L.w = Math.round(w); L.h = Math.round(h); L.x = Math.round(cx - w / 2); L.y = Math.round(cy - h / 2);
    } else if (drag.kind === 'rot') {
      const cx = L.x + L.w / 2, cy = L.y + L.h / 2;
      let a = Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI + 90;
      a = ((a % 360) + 360) % 360; if (a > 180) a -= 360;
      const snap = Math.round(a / 45) * 45; if (Math.abs(a - snap) < 5) a = snap;
      L.rot = Math.round(a);
    }
    renderStage();
    const now = Date.now();
    if (now - drag.last > 140) { drag.last = now; saveLayer(L, 0); }
  });
  const endDrag = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const L = drag.L; drag = null; clearGuides();
    saveLayer(L, 0); renderLayerList(); if (curTab === 'props') refreshBoxInputs();
  };
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', endDrag);

  addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const L = selLayer(); if (!L) return;
    const step = e.shiftKey ? 10 : 1;
    if ((e.key === 'Delete' || e.key === 'Backspace') && !L.locked) { e.preventDefault(); askDelete(); return; }
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (mv && !L.locked) { e.preventDefault(); L.x += mv[0]; L.y += mv[1]; changed(L, { delay: 300 }); if (curTab === 'props') refreshBoxInputs(); }
  });

  // ------------------------------------------------------------------ tabs
  let curTab = 'layers';
  const tabs = ['layers', 'props', 'live'];
  function showTab(t) {
    curTab = t;
    tabs.forEach((x) => { $('tab-' + x).setAttribute('aria-selected', String(x === t)); $('pane-' + x).hidden = x !== t; });
    if (t === 'props') renderProps(); if (t === 'live') renderLive(); if (t === 'layers') renderLayerList();
  }
  tabs.forEach((t) => $('tab-' + t).addEventListener('click', () => showTab(t)));

  function select(id) {
    if (id !== selId) resetDelBtn();
    selId = id;
    $('delSel').hidden = !id;
    drawSelection(); renderLayerList();
    if (curTab === 'props') renderProps();
  }

  // ------------------------------------------------------------------ layer list
  function renderLayerList() {
    const pane = $('pane-layers');
    if (curTab !== 'layers') return;
    pane.textContent = '';
    const s = scene();
    if (!s) { pane.appendChild(el('p', { class: 'muted', text: 'ຍັງບໍ່ມີໜ້າຈໍ. ກົດ "＋ ໜ້າຈໍ" ເພື່ອສ້າງ.' })); return; }
    const list = sorted().reverse();
    if (!list.length) pane.appendChild(el('p', { class: 'muted', text: 'ໜ້າຈໍນີ້ຍັງວ່າງ. ກົດ "＋ ຂໍ້ຄວາມ" ຫຼື "＋ ຮູບ" ເພື່ອເພີ່ມ.' }));
    const ul = el('ul', { class: 'layers' });
    list.forEach((L) => {
      const vis = L.visible !== false;
      const fxName = L.type === 'text' ? (Mee.TEXT_FX.find((f) => f[0] === (L.text || {}).fx) || [0, ''])[1] : (Mee.IMG_FX.find((f) => f[0] === (L.image || {}).fx) || [0, ''])[1];
      const eye = el('button', { class: 'eye' + (vis ? ' on' : ''), type: 'button', 'aria-label': vis ? 'ເຊື່ອງ' : 'ສະແດງ', text: vis ? '👁' : '—',
        onclick: (e) => { e.stopPropagation(); L.visible = !vis; changed(L, { delay: 0 }); } });
      const lock = el('button', { class: 'btn sm', type: 'button', 'aria-label': L.locked ? 'ປົດລັອກ' : 'ລັອກ', text: L.locked ? '🔒' : '🔓',
        onclick: (e) => { e.stopPropagation(); L.locked = !L.locked; changed(L, { delay: 0 }); drawSelection(); } });
      const name = el('div', { class: 'nm' }, [
        (L.type === 'image' ? '🖼 ' : 'T  ') + (L.name || ''),
        el('small', { text: L.type === 'text' ? String((L.text || {}).content || '').slice(0, 40) : Mee.asArray((L.image || {}).assets).length + ' ຮູບ' + (fxName && fxName !== 'ບໍ່ມີ' ? ' · ' + fxName : '') }),
      ]);
      const trash = el('button', { class: 'btn sm warn', type: 'button', 'aria-label': 'ລຶບ ' + (L.name || ''), text: '🗑',
        onclick: (e) => { e.stopPropagation(); select(L.id); askDelete(); } });
      const li = el('li', { class: L.id === selId ? 'cur' : '', onclick: () => { select(L.id); showTab('props'); } }, [eye, name, el('div', { class: 'acts' }, [lock, trash])]);
      ul.appendChild(li);
    });
    pane.appendChild(ul);
    if (list.length) pane.appendChild(el('p', { class: 'muted', text: '👁 = ເປີດ/ປິດ ຊັ້ນນັ້ນໃນ live ທັນທີ. ແຕະຊື່ເພື່ອປັບແຕ່ງ.' }));
  }

  // ------------------------------------------------------------------ property panel
  const getP = (o, path) => path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setP = (o, path, v) => { const ks = path.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) { if (!a[ks[i]] || typeof a[ks[i]] !== 'object') a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; };

  const grp = (title, kids) => el('div', { class: 'grp' }, [el('h3', { text: title })].concat(kids));
  const row = (label, ctl) => el('div', { class: 'row' }, [el('label', { text: label }), ...(Array.isArray(ctl) ? ctl : [ctl])]);
  function range(L, path, min, max, step, fmt, onAfter) {
    const out = el('output', { text: fmt ? fmt(getP(L, path)) : getP(L, path) });
    const inp = el('input', { type: 'range', min, max, step, value: getP(L, path) == null ? min : getP(L, path),
      oninput: () => { const v = parseFloat(inp.value); setP(L, path, v); out.textContent = fmt ? fmt(v) : v; changed(L); if (onAfter) onAfter(v); } });
    return [inp, out];
  }
  function color(L, path) {
    return el('input', { type: 'color', value: getP(L, path) || '#ffffff', oninput: (e) => { setP(L, path, e.target.value); changed(L); } });
  }
  function select2(L, path, options, onAfter) {
    const s = el('select', { onchange: () => { setP(L, path, s.value); changed(L, { delay: 0 }); if (onAfter) onAfter(s.value); } },
      options.map(([v, t]) => el('option', { value: v, text: t })));
    s.value = getP(L, path) == null ? options[0][0] : getP(L, path);
    return s;
  }
  function seg(L, path, options, onAfter) {
    const wrap = el('div', { class: 'seg', role: 'group' });
    const cur = getP(L, path);
    options.forEach(([v, t]) => wrap.appendChild(el('button', { type: 'button', 'aria-pressed': String(cur === v), text: t,
      onclick: () => { setP(L, path, v); changed(L, { delay: 0 }); wrap.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === t))); if (onAfter) onAfter(v); } })));
    return wrap;
  }
  function toggle(L, path, onTxt, offTxt, onAfter) {
    const b = el('button', { type: 'button', class: 'btn sm' + (getP(L, path) ? ' on' : ''), text: getP(L, path) ? onTxt : offTxt,
      onclick: () => { const v = !getP(L, path); setP(L, path, v); b.className = 'btn sm' + (v ? ' on' : ''); b.textContent = v ? onTxt : offTxt; changed(L, { delay: 0 }); if (onAfter) onAfter(v); } });
    return b;
  }

  const boxInputs = {};
  function refreshBoxInputs() {
    const L = selLayer(); if (!L) return;
    ['x', 'y', 'w', 'h', 'rot'].forEach((k) => { if (boxInputs[k] && document.activeElement !== boxInputs[k]) boxInputs[k].value = Math.round(L[k] || 0); });
  }

  function renderProps() {
    const pane = $('pane-props');
    pane.textContent = '';
    const L = selLayer();
    if (!L) { pane.appendChild(el('p', { class: 'muted', text: 'ແຕະຊັ້ນໃນໜ້າຕົວຢ່າງ ຫຼື ໃນລາຍການ "ຊັ້ນ" ເພື່ອປັບແຕ່ງ.' })); return; }

    // --- general
    const nameIn = el('input', { type: 'text', value: L.name || '', oninput: () => { L.name = nameIn.value; renderLayerList(); saveLayer(L); } });
    const num = (k, label) => {
      const i = el('input', { type: 'number', value: Math.round(L[k] || 0), onchange: () => { L[k] = parseFloat(i.value) || 0; if (k === 'w' || k === 'h') L[k] = Math.max(10, L[k]); changed(L, { delay: 0 }); } });
      boxInputs[k] = i; return el('label', {}, [label, i]);
    };
    const s = size();
    const align = (how) => { if (how === 'cx') L.x = Math.round((s.w - L.w) / 2); if (how === 'cy') L.y = Math.round((s.h - L.h) / 2);
      if (how === 'fullw') { L.x = 0; L.w = s.w; } if (how === 'fill') { L.x = 0; L.y = 0; L.w = s.w; L.h = s.h; }
      changed(L, { delay: 0 }); refreshBoxInputs(); };
    const del = el('span', { class: 'confirm' });
    const askDel = () => { del.textContent = ''; del.append(el('span', { class: 'muted', text: 'ລຶບແທ້ບໍ່?' }),
      el('button', { class: 'btn sm warn', type: 'button', text: 'ລຶບ', onclick: removeSel }),
      el('button', { class: 'btn sm', type: 'button', text: 'ບໍ່', onclick: () => { del.textContent = ''; del.appendChild(delBtn); } })); };
    const delBtn = el('button', { class: 'btn sm warn', type: 'button', text: 'ລຶບຊັ້ນ', onclick: askDel });
    del.appendChild(delBtn);

    pane.appendChild(grp('ທົ່ວໄປ', [
      row('ຊື່ຊັ້ນ', nameIn),
      el('div', { class: 'num4' }, [num('x', 'X'), num('y', 'Y'), num('w', 'ກວ້າງ'), num('h', 'ສູງ')]),
      row('ໝຸນ', range(L, 'rot', -180, 180, 1, (v) => v + '°', refreshBoxInputs)),
      row('ຄວາມເຂັ້ມ', range(L, 'opacity', 0.05, 1, 0.05, (v) => Math.round(v * 100) + '%')),
      el('div', { class: 'row' }, [
        el('button', { class: 'btn sm', type: 'button', text: '↔ ກາງ', onclick: () => align('cx') }),
        el('button', { class: 'btn sm', type: 'button', text: '↕ ກາງ', onclick: () => align('cy') }),
        el('button', { class: 'btn sm', type: 'button', text: 'ເຕັມກວ້າງ', onclick: () => align('fullw') }),
        el('button', { class: 'btn sm', type: 'button', text: 'ເຕັມຈໍ', onclick: () => align('fill') }),
      ]),
      el('div', { class: 'row' }, [
        el('button', { class: 'btn sm', type: 'button', text: '⬆ ຂຶ້ນເທິງ', onclick: () => reorder(1) }),
        el('button', { class: 'btn sm', type: 'button', text: '⬇ ລົງລຸ່ມ', onclick: () => reorder(-1) }),
        el('button', { class: 'btn sm', type: 'button', text: 'ສຳເນົາ', onclick: duplicateSel }),
        del,
      ]),
      row('ເວລາເປີດ', select2(L, 'enter', Mee.ENTER)),
    ]));

    if (L.type === 'text') renderTextProps(pane, L); else renderImageProps(pane, L);
  }

  function renderTextProps(pane, L) {
    const ta = el('textarea', { oninput: () => { L.text.content = ta.value; changed(L, { delay: 400 }); } });
    ta.value = L.text.content || '';
    pane.appendChild(grp('ຂໍ້ຄວາມ', [
      ta,
      row('Font', select2(L, 'text.font', Mee.FONTS.map((f) => [f.id, f.label]))),
      row('ຂະໜາດ', range(L, 'text.size', 12, 320, 1, (v) => v + 'px')),
      row('ສີ', [color(L, 'text.color'), toggle(L, 'text.bold', 'ໂຕໜາ ✓', 'ໂຕໜາ')]),
      row('ຈັດວາງ', seg(L, 'text.align', [['left', 'ຊ້າຍ'], ['center', 'ກາງ'], ['right', 'ຂວາ']])),
    ]));
    pane.appendChild(grp('ຂອບ ແລະ ເງົາ', [
      row('ຂອບໂຕໜັງສື', range(L, 'text.strokeW', 0, 12, 1, (v) => v + 'px')),
      row('ສີຂອບ', [color(L, 'text.strokeColor'), toggle(L, 'text.shadow', 'ເງົາ ✓', 'ເງົາ')]),
    ]));
    const bgKids = () => [
      row('ສີພື້ນ', color(L, 'text.bgColor')),
      row('ໂປ່ງໃສ', range(L, 'text.bgAlpha', 0, 1, 0.05, (v) => Math.round(v * 100) + '%')),
      row('ມຸມມົນ', range(L, 'text.radius', 0, 120, 1, (v) => v + 'px')),
      row('ໄລຍະຂອບ', range(L, 'text.pad', 0, 120, 1, (v) => v + 'px')),
    ];
    const bgWrap = el('div', { style: 'display:flex;flex-direction:column;gap:10px' }, L.text.bgOn ? bgKids() : []);
    pane.appendChild(grp('ກ່ອງພື້ນຫຼັງ', [row('ສະແດງ', toggle(L, 'text.bgOn', 'ເປີດ ✓', 'ປິດ', (v) => { bgWrap.textContent = ''; if (v) bgKids().forEach((k) => bgWrap.appendChild(k)); })), bgWrap]));
    pane.appendChild(grp('ເອັບເຟັກ', [
      row('ແບບ', select2(L, 'text.fx', Mee.TEXT_FX)),
      row('ຄວາມໄວ', range(L, 'text.speed', 1, 10, 1)),
      el('p', { class: 'muted', style: 'margin:0', text: 'ເອັບເຟັກ "ເລື່ອນ" ຈະສະແດງຂໍ້ຄວາມເປັນແຖວດຽວ ແລ່ນວົນໃນກອບຂອງຊັ້ນ.' }),
    ]));
  }

  function renderImageProps(pane, L) {
    const im = L.image;
    const ids = Mee.asArray(im.assets);
    const thumbs = el('div', { class: 'thumbs' });
    ids.forEach((id, i) => {
      const t = el('div', { class: 't' });
      getAsset(id).then((src) => { if (src) t.style.backgroundImage = 'url("' + src + '")'; });
      t.appendChild(el('button', { type: 'button', 'aria-label': 'ເອົາຮູບອອກ', text: '✕', onclick: () => { const a = Mee.asArray(im.assets); a.splice(i, 1); im.assets = a; changed(L, { delay: 0 }); renderProps(); } }));
      if (i > 0) t.appendChild(el('button', { class: 'mv', type: 'button', 'aria-label': 'ຍ້າຍໄປກ່ອນ', text: '◀', onclick: () => { const a = Mee.asArray(im.assets); [a[i - 1], a[i]] = [a[i], a[i - 1]]; im.assets = a; changed(L, { delay: 0 }); renderProps(); } }));
      thumbs.appendChild(t);
    });
    const more = el('input', { type: 'file', accept: 'image/*', multiple: '', hidden: '' });
    more.addEventListener('change', async () => {
      const files = Array.from(more.files || []); more.value = '';
      const newIds = await uploadFiles(files);
      im.assets = Mee.asArray(im.assets).concat(newIds);
      if (im.assets.length > 1 && im.mode === 'single') im.mode = 'slide';
      changed(L, { delay: 0 }); renderProps();
    });
    const fitRatio = async () => {
      const id = Mee.asArray(im.assets)[0]; if (!id) return;
      const a = await db.get('assets/' + id); if (!a || !a.w) return;
      L.h = Math.round(L.w * a.h / a.w); changed(L, { delay: 0 }); refreshBoxInputs();
    };
    pane.appendChild(grp('ຮູບ (' + ids.length + ')', [
      thumbs,
      el('div', { class: 'row' }, [
        el('button', { class: 'btn sm', type: 'button', text: '＋ ເພີ່ມຮູບ', onclick: () => more.click() }), more,
        el('button', { class: 'btn sm', type: 'button', text: 'ປັບສູງຕາມຮູບ', onclick: fitRatio }),
      ]),
    ]));
    const multiKids = [];
    if (ids.length > 1) {
      multiKids.push(row('ຫຼາຍຮູບ', seg(L, 'image.mode', [['single', 'ຮູບທຳອິດ'], ['slide', 'ສະລັບວົນ'], ['marquee', 'ແຖບເລື່ອນ']], () => renderProps())));
      if (im.mode === 'slide') multiKids.push(row('ປ່ຽນທຸກ', range(L, 'image.interval', 1, 15, 0.5, (v) => v + ' ວິ')));
      if (im.mode === 'marquee') {
        multiKids.push(row('ທິດທາງ', seg(L, 'image.dir', [['l', 'ຂວາ→ຊ້າຍ'], ['r', 'ຊ້າຍ→ຂວາ']])));
        multiKids.push(row('ຊ່ອງຫ່າງ', range(L, 'image.gap', 0, 80, 2, (v) => v + 'px')));
        multiKids.push(row('ຄວາມໄວ', range(L, 'image.speed', 1, 10, 1)));
      }
      pane.appendChild(grp('ການສະແດງຫຼາຍຮູບ', multiKids));
    }
    pane.appendChild(grp('ຮູບແບບ', [
      row('ການວາງ', seg(L, 'image.fit', [['contain', 'ເຫັນທັງຮູບ'], ['cover', 'ເຕັມກອບ']])),
      row('ມຸມມົນ', [...range(L, 'image.radius', 0, 200, 2, (v) => v + 'px'),
        el('button', { class: 'btn sm', type: 'button', text: 'ວົງມົນ', onclick: () => { im.radius = 'circle'; changed(L, { delay: 0 }); renderProps(); } })]),
      row('ຂອບ', range(L, 'image.borderW', 0, 30, 1, (v) => v + 'px')),
      row('ສີຂອບ', [color(L, 'image.borderColor'), toggle(L, 'image.shadow', 'ເງົາ ✓', 'ເງົາ')]),
      row('ພື້ນຫຼັງ', [toggle(L, 'image.bgOn', 'ມີພື້ນ ✓', 'ບໍ່ມີພື້ນ'), color(L, 'image.bgColor')]),
    ]));
    pane.appendChild(grp('ເອັບເຟັກ', [
      row('ແບບ', select2(L, 'image.fx', Mee.IMG_FX)),
      row('ຄວາມໄວ', range(L, 'image.speed', 1, 10, 1)),
    ]));
  }

  // ------------------------------------------------------------------ layer ops
  function nextZ() { return layers().reduce((m, l) => Math.max(m, l.z || 0), 0) + 1; }
  function putLayer(L) {
    const s = scene(); if (!s) return;
    s.layers = s.layers || {}; s.layers[L.id] = L;
    select(L.id); changed(L, { delay: 0 });
  }
  function addText() {
    if (!ensureScene()) return;
    const L = Mee.newTextLayer(size()); L.z = nextZ(); L.name = 'ຂໍ້ຄວາມ ' + (layers().filter((l) => l.type === 'text').length + 1);
    putLayer(L); showTab('props');
  }
  async function uploadFiles(files) {
    const ids = [];
    for (const f of files) {
      try {
        toast('ກຳລັງອັບໂຫຼດ ' + f.name + '…');
        const a = await Mee.fileToAsset(f, 900);
        const id = Mee.uid('a');
        await db.set('assets/' + id, a);
        assetCache.set(id, Promise.resolve(a.data));
        ids.push(id);
      } catch (e) { toast('ເປີດຮູບ ' + f.name + ' ບໍ່ໄດ້'); }
    }
    return ids;
  }
  $('addText').addEventListener('click', addText);
  $('addImage').addEventListener('click', () => { if (ensureScene()) $('fileImg').click(); });
  $('fileImg').addEventListener('change', async () => {
    const files = Array.from($('fileImg').files || []); $('fileImg').value = '';
    if (!files.length) return;
    const ids = await uploadFiles(files);
    if (!ids.length) return;
    const L = Mee.newImageLayer(size(), ids); L.z = nextZ();
    L.name = 'ຮູບ ' + (layers().filter((l) => l.type === 'image').length + 1);
    if (ids.length > 1) L.image.mode = 'slide';
    const a = await db.get('assets/' + ids[0]);
    if (a && a.w) { L.h = Math.round(L.w * a.h / a.w); L.y = Math.round((size().h - L.h) / 2); }
    putLayer(L); showTab('props');
  });
  let delTimer = 0;
  function resetDelBtn() { clearTimeout(delTimer); const b = $('delSel'); b.dataset.arm = ''; b.textContent = '🗑 ລຶບຊັ້ນທີ່ເລືອກ'; b.classList.remove('live'); }
  function askDelete() {
    const b = $('delSel');
    if (b.dataset.arm === '1') { resetDelBtn(); removeSel(); return; }
    b.dataset.arm = '1'; b.textContent = 'ແຕະອີກເທື່ອ ເພື່ອຢືນຢັນການລຶບ'; b.classList.add('live');
    toast('ແຕະປຸ່ມລຶບອີກເທື່ອ ເພື່ອຢືນຢັນ');
    clearTimeout(delTimer); delTimer = setTimeout(resetDelBtn, 4000);
  }
  $('delSel').addEventListener('click', askDelete);
  function removeSel() {
    const s = scene(); const L = selLayer(); if (!s || !L) return;
    clearTimeout(pending.get(L.id)); pending.delete(L.id);
    delete s.layers[L.id]; selId = null; $('delSel').hidden = true;
    toast('ລຶບ "' + (L.name || '') + '" ແລ້ວ');
    db.remove('scenes/' + curId + '/layers/' + L.id);
    renderStage(); renderLayerList(); renderProps();
  }
  function duplicateSel() {
    const L = selLayer(); if (!L) return;
    const c = clone(L); c.id = Mee.uid(L.type === 'image' ? 'i' : 't'); c.x += 40; c.y += 40; c.z = nextZ(); c.name = (L.name || '') + ' (ສຳເນົາ)';
    putLayer(c);
  }
  function reorder(dir) {
    const list = sorted(); const i = list.findIndex((l) => l.id === selId); const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    list.forEach((l, n) => { if (l.z !== n) { l.z = n; saveLayer(l, 0); } });
    renderStage(); renderLayerList();
  }

  // ------------------------------------------------------------------ scenes
  function fillSceneSel() {
    const sel = $('sceneSel'); sel.textContent = '';
    const ids = Object.keys(scenes).sort((a, b) => (scenes[a].order || 0) - (scenes[b].order || 0));
    ids.forEach((id) => sel.appendChild(el('option', { value: id, text: (meta.active === id ? '🔴 ' : '') + (scenes[id].name || 'ໜ້າຈໍ') })));
    if (curId) sel.value = curId;
    const s = scene();
    document.querySelectorAll('[data-or]').forEach((b) => b.setAttribute('aria-pressed', String(((s || {}).orient || 'land') === b.dataset.or)));
    $('sceneName').value = s ? s.name || '' : '';
    const isLive = s && meta.active === curId;
    $('liveBtn').textContent = isLive ? '● ກຳລັງ live' : 'ຂຶ້ນ live';
    $('liveBtn').className = 'btn sm' + (isLive ? ' live' : '');
    $('hideAllBtn').className = 'btn sm' + (meta.hideAll ? ' on' : '');
    $('hideAllBtn').textContent = meta.hideAll ? 'ສະແດງຄືນ' : 'ເຊື່ອງທັງໝົດ';
  }
  function ensureScene() { if (scene()) return true; newScene(); return !!scene(); }
  function newScene(orient) {
    const id = Mee.uid('s');
    const n = Object.keys(scenes).length + 1;
    const sc = { name: 'ໜ້າຈໍ ' + n, orient: orient || ((scene() || {}).orient) || 'land', order: n, layers: {} };
    scenes[id] = sc; curId = id; selId = null;
    try { localStorage.setItem('mee-cur-scene', id); } catch (e) {}
    db.set('scenes/' + id, sc);
    fillSceneSel(); renderStage(); renderLayerList(); renderProps();
  }
  $('sceneSel').addEventListener('change', () => { curId = $('sceneSel').value; selId = null; try { localStorage.setItem('mee-cur-scene', curId); } catch (e) {} fillSceneSel(); renderStage(); renderLayerList(); renderProps(); });
  $('sceneNew').addEventListener('click', () => newScene());
  $('sceneMore').addEventListener('click', () => { const m = $('sceneMenu'); m.hidden = !m.hidden; $('sceneMore').setAttribute('aria-expanded', String(!m.hidden)); $('linkShow').textContent = overlayUrl(); });
  $('sceneName').addEventListener('input', () => { const s = scene(); if (!s) return; s.name = $('sceneName').value; db.set('scenes/' + curId + '/name', s.name); fillSceneSel(); });
  $('sceneDup').addEventListener('click', () => {
    const s = scene(); if (!s) return;
    const id = Mee.uid('s'); const c = clone(s); c.name = (s.name || '') + ' (ສຳເນົາ)'; c.order = Object.keys(scenes).length + 1;
    scenes[id] = c; curId = id; db.set('scenes/' + id, c); fillSceneSel(); renderStage(); renderLayerList(); toast('ສຳເນົາໜ້າຈໍແລ້ວ');
  });
  $('sceneDel').addEventListener('click', () => {
    const w = $('sceneDelWrap'); const orig = $('sceneDel');
    w.textContent = '';
    w.append(el('span', { class: 'muted', text: 'ລຶບໜ້າຈໍນີ້ ແລະ ທຸກຊັ້ນໃນມັນ?' }),
      el('button', { class: 'btn sm warn', type: 'button', text: 'ລຶບ', onclick: () => {
        const id = curId; delete scenes[id]; db.remove('scenes/' + id);
        if (meta.active === id) db.update('meta', { active: null });
        curId = Object.keys(scenes)[0] || null; selId = null; w.textContent = ''; w.appendChild(orig);
        fillSceneSel(); renderStage(); renderLayerList(); renderProps();
      } }),
      el('button', { class: 'btn sm', type: 'button', text: 'ບໍ່', onclick: () => { w.textContent = ''; w.appendChild(orig); } }));
  });
  document.querySelectorAll('[data-or]').forEach((b) => b.addEventListener('click', () => {
    const s = scene(); if (!s) { newScene(b.dataset.or); return; }
    const from = Mee.SIZES[s.orient || 'land'], to = Mee.SIZES[b.dataset.or];
    if ((s.orient || 'land') === b.dataset.or) return;
    s.orient = b.dataset.or;
    // keep layers on screen: move proportionally, shrink if too big
    const upd = {};
    layers().forEach((L) => {
      const k = Math.min(1, to.w / L.w, to.h / L.h);
      L.w = Math.round(L.w * k); L.h = Math.round(L.h * k);
      L.x = Math.round(Math.min(to.w - L.w, Math.max(0, (L.x + L.w / 2) * to.w / from.w - L.w / 2)));
      L.y = Math.round(Math.min(to.h - L.h, Math.max(0, (L.y + L.h / 2) * to.h / from.h - L.h / 2)));
      upd['layers/' + L.id] = clone(L);
    });
    upd.orient = s.orient;
    db.update('scenes/' + curId, upd);
    fillSceneSel(); renderStage();
    toast(s.orient === 'port' ? 'ປ່ຽນເປັນແນວຕັ້ງ 1080×1920' : 'ປ່ຽນເປັນແນວນອນ 1920×1080');
  }));

  // ------------------------------------------------------------------ live controls
  const overlayUrl = () => new URL('overlay.html?u=' + encodeURIComponent(user || 'local'), location.href).href;
  $('liveBtn').addEventListener('click', () => {
    if (!scene()) return;
    const going = meta.active !== curId;
    db.update('meta', { active: going ? curId : null });
    toast(going ? 'ໜ້າຈໍ "' + scene().name + '" ຂຶ້ນ live ແລ້ວ' : 'ເອົາໜ້າຈໍລົງຈາກ live ແລ້ວ');
  });
  $('hideAllBtn').addEventListener('click', () => db.update('meta', { hideAll: !meta.hideAll }));
  $('linkBtn').addEventListener('click', async () => {
    const u = overlayUrl();
    try { await navigator.clipboard.writeText(u); toast('ສຳເນົາລິ້ງ overlay ແລ້ວ — ວາງໃສ່ປຸ່ມ Web ໃນ Live Now'); }
    catch (e) { $('sceneMenu').hidden = false; $('linkShow').textContent = u; toast('ສຳເນົາອັດຕະໂນມັດບໍ່ໄດ້ — ກົດຄ້າງລິ້ງເພື່ອສຳເນົາ'); }
  });

  function renderLive() {
    const pane = $('pane-live');
    if (curTab !== 'live') return;
    if (pane.contains(document.activeElement) && document.activeElement.tagName === 'TEXTAREA') return;
    pane.textContent = '';
    const ids = Object.keys(scenes).sort((a, b) => (scenes[a].order || 0) - (scenes[b].order || 0));
    const sb = el('div', { class: 'sceneBtns' });
    ids.forEach((id) => sb.appendChild(el('button', { class: 'btn', type: 'button', 'aria-pressed': String(meta.active === id), text: scenes[id].name || 'ໜ້າຈໍ',
      onclick: () => db.update('meta', { active: meta.active === id ? null : id }) })));
    pane.appendChild(grp('ໜ້າຈໍທີ່ຂຶ້ນ live (ແຕະເພື່ອສະລັບ)', [sb,
      el('div', { class: 'row' }, [el('span', { class: 'muted', style: 'flex:1', text: 'ເຊື່ອງ overlay ທັງໝົດຊົ່ວຄາວ' }),
        el('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(!!meta.hideAll), 'aria-label': 'ເຊື່ອງທັງໝົດ', onclick: () => db.update('meta', { hideAll: !meta.hideAll }) })])]));
    const liveId = meta.active;
    const ls = liveId && scenes[liveId];
    if (!ls) { pane.appendChild(el('p', { class: 'muted', text: 'ຍັງບໍ່ມີໜ້າຈໍຂຶ້ນ live. ແຕະຊື່ໜ້າຈໍຂ້າງເທິງ.' })); return; }
    const list = Object.values(ls.layers || {}).filter((l) => l && l.id).sort((a, b) => (b.z || 0) - (a.z || 0));
    const wrap = el('div', { class: 'liveList' });
    list.forEach((L) => {
      const vis = L.visible !== false;
      const sw = el('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(vis), 'aria-label': 'ສະແດງ ' + (L.name || ''),
        onclick: () => { L.visible = !vis; db.set('scenes/' + liveId + '/layers/' + L.id + '/visible', L.visible); if (liveId === curId) { renderStage(); renderLayerList(); } renderLive(); } });
      const item = el('div', { class: 'liveItem' }, [el('div', { class: 'hd' }, [el('span', { class: 'nm', text: (L.type === 'image' ? '🖼 ' : 'T  ') + (L.name || '') }), sw])]);
      if (L.type === 'text') {
        const ta = el('textarea', { style: 'min-height:56px' }); ta.value = (L.text || {}).content || '';
        const send = el('button', { class: 'btn sm primary', type: 'button', text: 'ອັບເດດຂໍ້ຄວາມ', onclick: () => {
          L.text.content = ta.value; db.set('scenes/' + liveId + '/layers/' + L.id + '/text/content', ta.value);
          if (liveId === curId) { renderStage(); renderLayerList(); } toast('ອັບເດດແລ້ວ'); ta.blur(); } });
        item.append(ta, send);
      }
      wrap.appendChild(item);
    });
    pane.appendChild(grp('ຊັ້ນໃນ "' + (ls.name || '') + '"', [wrap]));
  }

  // ------------------------------------------------------------------ network pill
  function setNet(ok, txt) { $('netDot').className = 'dot ' + (ok ? 'ok' : 'bad'); $('netTxt').textContent = txt; }

  // ------------------------------------------------------------------ start / auth
  function start() {
    if (started) return; started = true;
    $('login').hidden = true; $('app').hidden = false;
    db.setUser(user);
    if (db.mode === 'local') { $('netDot').className = 'dot'; $('netDot').style.background = '#ffb020'; $('netTxt').textContent = 'ໂໝດທົດລອງ'; $('outBtn').hidden = true; }
    else db.onConnection((ok) => setNet(ok, ok ? 'ເຊື່ອມຕໍ່ແລ້ວ' : 'ຂາດການເຊື່ອມຕໍ່'));
    try { curId = localStorage.getItem('mee-cur-scene'); } catch (e) {}
    let first = true;
    db.watch('scenes', (v) => {
      const incoming = v || {};
      // keep local versions of layers that are being edited right now
      if (curId && scenes[curId] && incoming[curId]) {
        const mine = scenes[curId].layers || {};
        incoming[curId].layers = incoming[curId].layers || {};
        pending.forEach((_, lid) => { if (mine[lid]) incoming[curId].layers[lid] = mine[lid]; });
        if (drag && mine[drag.L.id]) incoming[curId].layers[drag.L.id] = drag.L;
      }
      scenes = incoming;
      if (drag && scenes[curId] && scenes[curId].layers) drag.L = scenes[curId].layers[drag.L.id] || drag.L;
      if (!curId || !scenes[curId]) curId = Object.keys(scenes)[0] || null;
      if (first) { first = false; if (!curId) { seed(); return; } }
      if (selId && !selLayer()) selId = null;
      fillSceneSel(); renderStage(); renderLayerList();
      const focusInProps = $('pane-props').contains(document.activeElement);
      if (curTab === 'props' && !focusInProps && !drag) renderProps();
      renderLive();
    });
    db.watch('meta', (v) => { meta = v || {}; fillSceneSel(); renderLive(); });
    showTab('layers');
  }
  function seed() {
    const id = Mee.uid('s');
    const sc = { name: 'ໜ້າຈໍ 1', orient: 'land', order: 1, layers: {} };
    const L = Mee.newTextLayer(Mee.SIZES.land);
    L.name = 'ຊື່ເພຈ'; L.text.content = 'Mee Sport Live'; L.text.fx = 'none'; L.z = 1;
    L.x = 60; L.y = 50; L.w = 620; L.h = 120; L.text.size = 64; L.text.bgColor = '#d6281e'; L.text.bgAlpha = 1;
    sc.layers[L.id] = L;
    scenes[id] = sc; curId = id;
    db.set('scenes/' + id, sc);
    fillSceneSel(); renderStage(); renderLayerList();
  }

  $('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('lg-msg').textContent = 'ກຳລັງເຂົ້າສູ່ລະບົບ…';
    try { await db.signIn($('lg-email').value.trim(), $('lg-pass').value); }
    catch (err) { $('lg-msg').textContent = 'ເຂົ້າສູ່ລະບົບບໍ່ໄດ້: ' + (err.code || err.message); }
  });
  $('lg-up').addEventListener('click', async () => {
    if (!$('login').reportValidity()) return;
    $('lg-msg').textContent = 'ກຳລັງສ້າງບັນຊີ…';
    try { await db.signUp($('lg-email').value.trim(), $('lg-pass').value); }
    catch (err) { $('lg-msg').textContent = 'ສ້າງບັນຊີບໍ່ໄດ້: ' + (err.code || err.message); }
  });
  $('outBtn').addEventListener('click', () => { db.signOut(); location.reload(); });

  db.onAuth((u) => {
    if (!u) { $('app').hidden = true; $('login').hidden = false; return; }
    user = u; start();
  });
})();
