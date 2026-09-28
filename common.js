/* ===== Mee Overlay — shared data layer + render engine ===== */
(function () {
  'use strict';

  // ---------------------------------------------------------------- constants
  const SIZES = { land: { w: 1920, h: 1080 }, port: { w: 1080, h: 1920 } };

  const FONTS = [
    { id: 'Noto Sans Lao', label: 'Noto Sans Lao (ທົ່ວໄປ)' },
    { id: 'Noto Sans Lao Looped', label: 'Noto Sans Lao Looped (ມີຫົວ)' },
    { id: 'Noto Serif Lao', label: 'Noto Serif Lao (ທາງການ)' },
    { id: 'Roboto Condensed', label: 'Roboto Condensed (ອັງກິດ ແຄບ)' },
    { id: 'Oswald', label: 'Oswald (ອັງກິດ ກິລາ)' },
    { id: 'Anton', label: 'Anton (ອັງກິດ ໜາ)' },
  ];
  const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700;900&family=Noto+Sans+Lao+Looped:wght@400;700;900&family=Noto+Serif+Lao:wght@400;700;900&family=Roboto+Condensed:wght@400;700&family=Oswald:wght@500;700&family=Anton&display=swap';

  const TEXT_FX = [
    ['none', 'ບໍ່ມີ'], ['scroll-l', 'ເລື່ອນ ຂວາ→ຊ້າຍ'], ['scroll-r', 'ເລື່ອນ ຊ້າຍ→ຂວາ'], ['scroll-u', 'ເລື່ອນ ລຸ່ມ→ເທິງ'],
    ['wave', 'ຄື້ນ (ເຕັ້ນທີລະໂຕ)'], ['typing', 'ພິມດີດ'], ['shake', 'ສັ່ນ'], ['wiggle', 'ໂຍກ'], ['pulse', 'ເຕັ້ນ ຂະຫຍາຍ'],
    ['float', 'ລອຍ ຂຶ້ນລົງ'], ['blink', 'ກະພິບ'], ['glow', 'ເຮືອງແສງ'], ['rainbow', 'ສີຮຸ້ງ'],
  ];
  const IMG_FX = [
    ['none', 'ບໍ່ມີ'], ['pulse', 'ເຕັ້ນ ຂະຫຍາຍ'], ['heart', 'ເຕັ້ນ ຄືຫົວໃຈ'], ['float', 'ລອຍ ຂຶ້ນລົງ'], ['spin', 'ໝຸນ'],
    ['swing', 'ແກວ່ງ'], ['shake', 'ສັ່ນ'], ['wiggle', 'ໂຍກ'], ['blink', 'ກະພິບ'], ['shine', 'ແສງວິ່ງຜ່ານ'],
  ];
  const ENTER = [
    ['fade', 'ຈາງເຂົ້າ'], ['left', 'ເລື່ອນຈາກຊ້າຍ'], ['right', 'ເລື່ອນຈາກຂວາ'], ['up', 'ເລື່ອນຈາກລຸ່ມ'],
    ['down', 'ເລື່ອນຈາກເທິງ'], ['zoom', 'ຊູມ'], ['bounce', 'ເດັ້ງ'], ['none', 'ບໍ່ມີ'],
  ];

  const uid = (p) => (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function newTextLayer(size) {
    const w = Math.round(size.w * 0.6), h = Math.round(size.h * 0.12);
    return {
      id: uid('t'), type: 'text', name: 'ຂໍ້ຄວາມ', visible: true, locked: false,
      x: Math.round((size.w - w) / 2), y: Math.round((size.h - h) / 2), w, h, rot: 0, opacity: 1, z: 0,
      enter: 'fade',
      text: {
        content: 'ພິມຂໍ້ຄວາມທີ່ນີ້', font: 'Noto Sans Lao', size: 64, color: '#ffffff', bold: true, align: 'center',
        strokeW: 0, strokeColor: '#000000', shadow: true,
        bgOn: true, bgColor: '#000000', bgAlpha: 0.6, radius: 16, pad: 24,
        fx: 'none', speed: 5,
      },
    };
  }
  function newImageLayer(size, assets) {
    const w = Math.round(Math.min(size.w, size.h) * 0.3);
    return {
      id: uid('i'), type: 'image', name: 'ຮູບ', visible: true, locked: false,
      x: Math.round((size.w - w) / 2), y: Math.round((size.h - w) / 2), w, h: w, rot: 0, opacity: 1, z: 0,
      enter: 'zoom',
      image: {
        assets: assets || [], mode: 'single', fit: 'contain', interval: 3, dir: 'l', gap: 16,
        radius: 0, borderW: 0, borderColor: '#ffffff', shadow: false, bgOn: false, bgColor: '#ffffff',
        fx: 'none', speed: 5,
      },
    };
  }

  // ---------------------------------------------------------------- helpers
  const graphemes = (s) => {
    try {
      if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter('lo', { granularity: 'grapheme' }).segment(s), (x) => x.segment);
    } catch (e) {}
    // fallback: attach Lao combining marks (U+0EB1, U+0EB4–0EBC, U+0EC8–0ECD) to the previous char
    const out = [];
    for (const ch of Array.from(s)) {
      const c = ch.codePointAt(0);
      const mark = c === 0x0EB1 || (c >= 0x0EB4 && c <= 0x0EBC) || (c >= 0x0EC8 && c <= 0x0ECD);
      if (mark && out.length) out[out.length - 1] += ch; else out.push(ch);
    }
    return out;
  };
  const hexA = (hex, a) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return hex || 'transparent';
    const n = parseInt(m[1], 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + (a == null ? 1 : a) + ')';
  };
  const speedDur = (base, speed) => (base * 5 / Math.max(1, Math.min(10, speed || 5))).toFixed(2) + 's';
  const asArray = (v) => (Array.isArray(v) ? v.filter(Boolean) : v && typeof v === 'object' ? Object.values(v).filter(Boolean) : []);

  // ---------------------------------------------------------------- data layer
  // Tree per user: overlays/{uid}/{ meta, scenes, assets }
  function createDB() {
    const cfg = window.MEE_FIREBASE_CONFIG || {};
    const useFirebase = !!(cfg.apiKey && cfg.databaseURL && window.firebase);
    return useFirebase ? firebaseDB(cfg) : localDB();
  }

  function firebaseDB(cfg) {
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
    const auth = firebase.auth ? firebase.auth() : null;
    const db = firebase.database();
    let root = null;
    const r = (p) => db.ref(root + (p ? '/' + p : ''));
    return {
      mode: 'firebase',
      setUser(u) { root = 'overlays/' + u; },
      onAuth(cb) { if (!auth) return cb(null); auth.onAuthStateChanged((u) => cb(u ? u.uid : null, u)); },
      signIn: (e, p) => auth.signInWithEmailAndPassword(e, p),
      signUp: (e, p) => auth.createUserWithEmailAndPassword(e, p),
      signOut: () => auth.signOut(),
      watch(p, cb) { const ref = r(p); const h = (s) => cb(s.val()); ref.on('value', h); return () => ref.off('value', h); },
      get: (p) => r(p).once('value').then((s) => s.val()),
      set: (p, v) => r(p).set(v),
      update: (p, v) => r(p).update(v),
      remove: (p) => r(p).remove(),
      onConnection(cb) { const ref = db.ref('.info/connected'); ref.on('value', (s) => cb(!!s.val())); },
    };
  }

  function localDB() {
    const KEY = 'mee-local-db';
    let tree = {};
    try { tree = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    let bc = null;
    try { bc = new BroadcastChannel('mee-local'); } catch (e) {}
    const listeners = new Set();
    let root = 'overlays/local';
    const split = (p) => (root + (p ? '/' + p : '')).split('/').filter(Boolean);
    const read = (parts) => parts.reduce((o, k) => (o == null ? undefined : o[k]), tree);
    const clean = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
    const write = (parts, v) => {
      let o = tree;
      for (let i = 0; i < parts.length - 1; i++) { if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
      const k = parts[parts.length - 1];
      if (v == null) delete o[k]; else o[k] = clean(v);
    };
    const notify = () => listeners.forEach((l) => l());
    const persist = () => {
      try { localStorage.setItem(KEY, JSON.stringify(tree)); } catch (e) { console.warn('local save failed', e); }
      if (bc) bc.postMessage('changed');
      notify();
    };
    const reload = () => { try { tree = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {} notify(); };
    if (bc) bc.onmessage = reload;
    addEventListener('storage', (e) => { if (e.key === KEY) reload(); });
    return {
      mode: 'local',
      setUser(u) { root = 'overlays/' + u; },
      onAuth(cb) { setTimeout(() => cb('local'), 0); },
      signIn: async () => {}, signUp: async () => {}, signOut: async () => {},
      watch(p, cb) {
        let last;
        const fire = () => { const v = read(split(p)); const s = JSON.stringify(v === undefined ? null : v); if (s !== last) { last = s; cb(clean(v)); } };
        listeners.add(fire); setTimeout(fire, 0);
        return () => listeners.delete(fire);
      },
      get: async (p) => clean(read(split(p))),
      set: async (p, v) => { write(split(p), v); persist(); },
      update: async (p, obj) => { const base = split(p); Object.keys(obj).forEach((k) => write(base.concat(k.split('/').filter(Boolean)), obj[k])); persist(); },
      remove: async (p) => { write(split(p), null); persist(); },
      onConnection(cb) { cb(true); },
    };
  }

  // ---------------------------------------------------------------- render engine
  // opts: { editor: bool, getAsset(id) -> Promise<dataURL> }
  function createRenderer(stage, opts) {
    opts = opts || {};
    const state = new Map(); // id -> { key, el, visible, cleanup[] }
    let sceneId = null, orient = null;

    const size = () => SIZES[orient] || SIZES.land;

    function applyBox(el, L) {
      el.style.left = (L.x || 0) + 'px'; el.style.top = (L.y || 0) + 'px';
      el.style.width = Math.max(10, L.w || 10) + 'px'; el.style.height = Math.max(10, L.h || 10) + 'px';
      el.style.transform = L.rot ? 'rotate(' + L.rot + 'deg)' : '';
      el.style.opacity = L.opacity == null ? 1 : L.opacity;
      el.style.zIndex = 10 + (L.z || 0);
    }

    function buildText(fx, L, cleanup) {
      const t = L.text || {};
      const box = document.createElement('div');
      const effect = t.fx || 'none';
      box.className = 'mt al-' + (t.align || 'center');
      box.style.fontFamily = "'" + (t.font || 'Noto Sans Lao') + "','Noto Sans Lao','Phetsarath OT',sans-serif";
      box.style.fontSize = (t.size || 48) + 'px';
      box.style.fontWeight = t.bold ? 700 : 400;
      box.style.color = t.color || '#fff';
      box.style.padding = (t.pad || 0) + 'px';
      box.style.borderRadius = (t.radius || 0) + 'px';
      box.style.background = t.bgOn ? hexA(t.bgColor || '#000000', t.bgAlpha == null ? 0.6 : t.bgAlpha) : 'transparent';
      box.style.setProperty('--glow', t.color || '#fff');
      const tx = document.createElement('div');
      tx.className = 'tx';
      if (t.strokeW) tx.style.webkitTextStroke = (t.strokeW * 2) + 'px ' + (t.strokeColor || '#000');
      if (t.shadow) tx.style.textShadow = '0 .06em .18em rgba(0,0,0,.65)';
      const content = String(t.content == null ? '' : t.content);
      const sp = t.speed || 5;

      if (effect === 'scroll-l' || effect === 'scroll-r' || effect === 'scroll-u') {
        const vertical = effect === 'scroll-u';
        box.classList.add(vertical ? 'scroll-u' : 'scroll-h', effect);
        const oneLine = vertical ? content : content.replace(/\s*\n\s*/g, '   ');
        const mk = () => { const s = document.createElement('span'); s.className = 'seg'; s.textContent = oneLine; return s; };
        tx.appendChild(mk());
        if (vertical) tx.style.whiteSpace = 'pre-wrap';
        box.appendChild(tx);
        const measure = () => {
          const first = tx.firstChild; if (!first) return;
          const set = vertical ? first.offsetHeight : first.offsetWidth;
          const view = vertical ? box.clientHeight : box.clientWidth;
          if (!set) return;
          while (tx.children.length > 1) tx.removeChild(tx.lastChild);
          const reps = Math.max(2, Math.ceil(view / set) + 1);
          for (let i = 1; i < reps; i++) tx.appendChild(mk());
          tx.style.setProperty('--set', set + 'px');
          tx.style.setProperty('--dur', (set / (25 * sp)).toFixed(2) + 's');
        };
        requestAnimationFrame(measure);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
        const t2 = setTimeout(measure, 1200); cleanup.push(() => clearTimeout(t2));
      } else if (effect === 'wave' || effect === 'typing') {
        box.classList.add('fx-' + effect);
        graphemes(content).forEach((g, i) => {
          if (g === '\n') { tx.appendChild(document.createElement('br')); return; }
          const s = document.createElement('span'); s.className = 'g'; s.textContent = g; s.style.setProperty('--i', i); tx.appendChild(s);
        });
        if (effect === 'wave') box.style.setProperty('--dur', speedDur(1.2, sp));
        if (effect === 'typing') {
          const gs = tx.querySelectorAll('.g'); let n = 0, hold = 0;
          const step = Math.max(30, 600 / sp);
          const iv = setInterval(() => {
            if (n < gs.length) { gs[n].classList.add('on'); n++; }
            else if (++hold > 2400 / step) { gs.forEach((g) => g.classList.remove('on')); n = 0; hold = 0; }
          }, step);
          cleanup.push(() => clearInterval(iv));
        }
        box.appendChild(tx);
      } else {
        tx.textContent = content;
        box.appendChild(tx);
        if (effect === 'rainbow' || effect === 'glow') { box.classList.add('fx-' + effect); box.style.setProperty('--dur', speedDur(effect === 'rainbow' ? 4 : 1.6, sp)); }
        else if (effect !== 'none') { fx.classList.add('fx-' + effect); fx.style.setProperty('--dur', speedDur({ shake: .5, wiggle: 1, pulse: 1.2, float: 2.4, blink: 1 }[effect] || 1, sp)); }
      }
      fx.appendChild(box);
    }

    function buildImage(fx, L, cleanup) {
      const im = L.image || {};
      const box = document.createElement('div');
      box.className = 'mi fit-' + (im.fit || 'contain');
      const rad = im.radius === 'circle' ? '50%' : (im.radius || 0) + 'px';
      box.style.borderRadius = rad;
      if (im.borderW) box.style.border = im.borderW + 'px solid ' + (im.borderColor || '#fff');
      if (im.shadow) box.style.boxShadow = '0 10px 30px rgba(0,0,0,.45)';
      if (im.bgOn) box.style.background = im.bgColor || '#fff';
      const ids = asArray(im.assets);
      const mode = ids.length > 1 ? (im.mode || 'single') : 'single';
      const sp = im.speed || 5;
      const load = (img, id) => {
        if (!id || !opts.getAsset) return;
        Promise.resolve(opts.getAsset(id)).then((src) => { if (src) img.src = src; });
      };
      if (mode === 'marquee') {
        box.classList.add('marquee'); if (im.dir === 'r') box.classList.add('rev');
        box.style.setProperty('--gap', (im.gap == null ? 16 : im.gap) + 'px');
        const trk = document.createElement('div'); trk.className = 'trk'; box.appendChild(trk);
        const imgs = ids.map((id) => { const i = document.createElement('img'); i.alt = ''; load(i, id); trk.appendChild(i); return i; });
        const measure = () => {
          const set = trk.scrollWidth; if (!set) return;
          while (trk.children.length > imgs.length) trk.removeChild(trk.lastChild);
          const reps = Math.max(2, Math.ceil(box.clientWidth / set) + 1);
          for (let r = 1; r < reps; r++) imgs.forEach((i) => trk.appendChild(i.cloneNode(true)));
          trk.style.setProperty('--set', set + 'px');
          trk.style.setProperty('--dur', (set / (20 * sp)).toFixed(2) + 's');
        };
        let pending = imgs.length;
        imgs.forEach((i) => { const done = () => { if (--pending <= 0) requestAnimationFrame(measure); }; i.onload = done; i.onerror = done; });
        const t2 = setTimeout(measure, 2500); cleanup.push(() => clearTimeout(t2));
      } else if (mode === 'slide') {
        box.classList.add('slide');
        const imgs = ids.map((id, n) => { const i = document.createElement('img'); i.alt = ''; if (!n) i.className = 'on'; load(i, id); box.appendChild(i); return i; });
        let k = 0;
        const iv = setInterval(() => { imgs[k].classList.remove('on'); k = (k + 1) % imgs.length; imgs[k].classList.add('on'); }, Math.max(1, im.interval || 3) * 1000);
        cleanup.push(() => clearInterval(iv));
      } else {
        const i = document.createElement('img'); i.alt = ''; load(i, ids[0]); box.appendChild(i);
      }
      const effect = im.fx || 'none';
      if (effect === 'shine') {
        const s = document.createElement('div'); s.className = 'sheen'; s.style.setProperty('--dur', speedDur(2.8, sp)); box.appendChild(s);
      } else if (effect !== 'none') {
        fx.classList.add('fx-' + effect);
        fx.style.setProperty('--dur', speedDur({ pulse: 1.2, heart: 1.4, float: 2.4, spin: 4, swing: 2, shake: .5, wiggle: 1, blink: 1 }[effect] || 1, sp));
      }
      fx.appendChild(box);
    }

    function build(L) {
      const el = document.createElement('div');
      el.className = 'ml'; el.dataset.id = L.id;
      const en = document.createElement('div'); en.className = 'ml-enter';
      const fx = document.createElement('div'); fx.className = 'ml-fx';
      en.appendChild(fx); el.appendChild(en);
      const cleanup = [];
      if (L.type === 'image') buildImage(fx, L, cleanup); else buildText(fx, L, cleanup);
      applyBox(el, L);
      return { el, en, cleanup };
    }

    function playEnter(rec, kind) {
      const en = rec.en;
      en.className = 'ml-enter';
      if (!kind || kind === 'none') return;
      void en.offsetWidth;
      en.classList.add('en-' + kind);
    }
    function playExit(rec, kind, done) {
      const en = rec.en;
      en.className = 'ml-enter';
      if (!kind || kind === 'none') { done(); return; }
      void en.offsetWidth;
      en.classList.add('ex-' + kind);
      const t = setTimeout(done, 450);
      rec.cleanup.push(() => clearTimeout(t));
    }

    function destroy(rec) { rec.cleanup.forEach((f) => { try { f(); } catch (e) {} }); rec.el.remove(); }

    // Render a scene. Layers are keyed by id; unchanged layers are left alone.
    function setScene(scene, id) {
      const newOrient = (scene && scene.orient) || 'land';
      const switched = id !== sceneId || newOrient !== orient;
      if (switched) { state.forEach(destroy); state.clear(); }
      sceneId = id; orient = newOrient;
      const s = size();
      stage.style.width = s.w + 'px'; stage.style.height = s.h + 'px';
      const layers = scene && scene.layers ? Object.values(scene.layers).filter((l) => l && l.id) : [];
      const seen = new Set();
      layers.forEach((L) => {
        seen.add(L.id);
        const { visible, ...rest } = L;
        const key = JSON.stringify(rest);
        const vis = visible !== false;
        let rec = state.get(L.id);
        if (rec && rec.key !== key) {
          // position-only change → move in place; anything else → rebuild
          const prev = JSON.parse(rec.key);
          const posOnly = JSON.stringify(stripPos(prev)) === JSON.stringify(stripPos(rest));
          const sizeChanged = prev.w !== L.w || prev.h !== L.h;
          if (posOnly && !(sizeChanged && hasMeasured(L))) { applyBox(rec.el, L); rec.key = key; }
          else { const wasVis = rec.visible; destroy(rec); rec = null; state.delete(L.id); const r2 = build(L); r2.key = key; r2.visible = wasVis; stage.appendChild(r2.el); state.set(L.id, r2); rec = r2; applyVisibility(rec, L, vis, false); return; }
        }
        if (!rec) {
          rec = build(L); rec.key = key; rec.visible = vis; stage.appendChild(rec.el); state.set(L.id, rec);
          applyVisibility(rec, L, vis, !opts.editor && switched ? 'enter' : false, true);
          return;
        }
        applyVisibility(rec, L, vis, true);
      });
      state.forEach((rec, lid) => { if (!seen.has(lid)) { destroy(rec); state.delete(lid); } });
    }
    const POS = ['x', 'y', 'w', 'h', 'rot', 'opacity', 'z', 'name', 'locked'];
    const stripPos = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !POS.includes(k)).sort((p, q) => (p[0] < q[0] ? -1 : 1)));
    const hasMeasured = (L) => (L.type === 'text' && /^scroll/.test((L.text || {}).fx || '')) || (L.type === 'image' && ((L.image || {}).mode === 'marquee'));

    function applyVisibility(rec, L, vis, animate, fresh) {
      if (opts.editor) {
        rec.el.classList.remove('off');
        rec.el.classList.toggle('ed-hidden', !vis);
        rec.visible = vis;
        return;
      }
      if (fresh) {
        rec.el.classList.toggle('off', !vis);
        if (vis && animate) playEnter(rec, L.enter || 'fade');
        rec.visible = vis; return;
      }
      if (vis === rec.visible) return;
      rec.visible = vis;
      if (vis) { rec.el.classList.remove('off'); if (animate) playEnter(rec, L.enter || 'fade'); }
      else if (animate) playExit(rec, L.enter || 'fade', () => { if (!rec.visible) rec.el.classList.add('off'); });
      else rec.el.classList.add('off');
    }

    return {
      setScene,
      size,
      layerEl: (id) => (state.get(id) || {}).el || null,
      clear() { state.forEach(destroy); state.clear(); sceneId = null; },
    };
  }

  // ---------------------------------------------------------------- image helper (editor)
  // Shrinks an uploaded file; keeps PNG when it has transparency, JPEG otherwise.
  async function fileToAsset(file, maxSide) {
    maxSide = maxSide || 900;
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
      const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
      let alpha = false;
      try { const d = ctx.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 16) { if (d[i] < 250) { alpha = true; break; } } } catch (e) {}
      const data = alpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85);
      return { data, w: c.width, h: c.height, name: file.name.slice(0, 60) };
    } finally { URL.revokeObjectURL(url); }
  }

  window.Mee = { SIZES, FONTS, FONT_CSS, TEXT_FX, IMG_FX, ENTER, uid, newTextLayer, newImageLayer, createDB, createRenderer, fileToAsset, asArray, hexA };
})();
