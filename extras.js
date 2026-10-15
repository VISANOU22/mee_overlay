// ===== Mee Overlay — ໜັງສື ແລະ ຮູບ ເທິງໄລ້ (ໃຊ້ຮ່ວມທຸກກິລາ) =====
// MeeExtras.mount(db) — ຕິດຕາມ overlays/{uid}/extras/items ແລ້ວແຕ້ມທັບໜ້າຈໍ (ຢູ່ລຸ່ມສະກໍ)
// ແຕ່ລະ item ໃຊ້ຮູບແບບດຽວກັບ layer ຂອງ Studio (x, y, w, h ເປັນ px ໃນຈໍ 1920×1080, text{...} / image{assets...})
// ແລະ ແຕ້ມດ້ວຍເຄື່ອງແຕ້ມຂອງ Studio (Mee.createRenderer) → ເອັບເຟັກ ແລະ ທ່າເຂົ້າ ຄືກັນທຸກຢ່າງ
(() => {
  const W0 = 1920, H0 = 1080;
  const stable = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, kk) => (o[kk] = x[kk], o), {}) : x));
  // ຟອນ Noto Sans Lao ຂອງ Studio → ໃຊ້ໂຕທີ່ເກັບໃນ repo (ສະຫຼະບໍ່ທັບວັນນະຍຸດ)
  const fixFont = (L) => {
    if (L.type !== 'image' && L.text && (!L.text.font || L.text.font === 'Noto Sans Lao')) L.text = Object.assign({}, L.text, { font: 'MeeLao' });
    return L;
  };

  function mount(db) {
    if (!window.Mee || !Mee.createRenderer) return;
    if (!document.getElementById('mp-fonts')) {
      const lk = document.createElement('link'); lk.id = 'mp-fonts'; lk.rel = 'stylesheet'; lk.href = 'fonts/fonts.css?v=1'; document.head.appendChild(lk);
    }
    if (!document.querySelector('link[href^="render.css"]')) {
      const lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = 'render.css?v=3'; document.head.appendChild(lk);
    }
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:40;overflow:hidden';
    const stage = document.createElement('div'); stage.className = 'mee-stage'; wrap.appendChild(stage); document.body.appendChild(wrap);
    const cache = new Map();
    const getAsset = (id) => { if (!cache.has(id)) cache.set(id, db.get('assets/' + id + '/data').catch(() => null)); return cache.get(id); };
    const r = Mee.createRenderer(stage, { editor: false, getAsset });
    let items = {}, ov = {}, G = { k: 1, left: 0, top: 0 };

    function fit() {
      const W = innerWidth, H = innerHeight, k = Math.min(W / W0, H / H0);
      G = { k, left: (W - W0 * k) / 2, top: (H - H0 * k) / 2 };
      stage.style.transform = 'scale(' + k + ')'; stage.style.left = G.left + 'px'; stage.style.top = G.top + 'px';
    }
    function render() {
      const layers = {};
      Object.keys(items).forEach((id) => {
        const L = ov[id] || items[id];
        if (L && typeof L === 'object' && L.type) layers[id] = fixFont(Object.assign({}, L, { id }));
      });
      r.setScene({ orient: 'land', layers }, 'extras');
      Object.keys(layers).forEach((id) => { const el = r.layerEl(id); if (el) el.dataset.edit = 'x:' + id; });
      fit();
    }
    // ໃຫ້ໜ້າຄວບຄຸມເຫັນຜົນທັນທີ ຂະນະລາກ ແລະ ແປງຕຳແໜ່ງຈໍ → px ຂອງ stage
    window.__mxPreview = {
      set(id, L) { ov[id] = L; render(); },
      geom() { return { k: G.k, left: G.left, top: G.top, W: innerWidth, H: innerHeight }; },
    };
    addEventListener('resize', fit);
    fit();
    return db.watch('extras/items', (v) => {
      items = v && typeof v === 'object' ? v : {};
      Object.keys(ov).forEach((id) => { if (!items[id] || stable(items[id]) === stable(ov[id])) delete ov[id]; });
      render();
    });
  }

  window.MeeExtras = { mount, W0, H0 };
})();
