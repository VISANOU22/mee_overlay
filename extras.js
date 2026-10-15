// ===== Mee Overlay — ໜັງສື ແລະ ຮູບ ເທິງໄລ້ (ໃຊ້ຮ່ວມທຸກກິລາ) =====
// MeeExtras.mount(db) — ຕິດຕາມ overlays/{uid}/extras/items ແລ້ວແຕ້ມທັບໜ້າຈໍ (ຢູ່ລຸ່ມສະກໍ)
// item: { type:'text'|'image', x, y (ສັດສ່ວນຈໍ), show, z,
//         text, fs (ຂະໜາດຟອນ = ສັດສ່ວນຄວາມກວ້າງຈໍ), color, style:'shadow'|'dark'|'light'|'red'   — ໜັງສື
//         src (dataURL), w (ຄວາມກວ້າງ = ສັດສ່ວນຈໍ)                                         — ຮູບ }
(() => {
  const CSS = `
  .mx-root { position:absolute; inset:0; pointer-events:none; z-index:40; overflow:hidden; }
  .mx-it { position:absolute; left:0; top:0; }
  .mx-it img { display:block; width:100%; height:auto; }
  .mx-txt { font-family:'MeeLao','Noto Sans Lao',sans-serif; font-weight:900; line-height:1.35; white-space:pre; padding:.06em .45em .1em; border-radius:.22em; }
  .mx-s-shadow { text-shadow:0 .05em .14em rgba(0,0,0,.9), 0 0 .5em rgba(0,0,0,.5); padding-inline:.1em; }
  .mx-s-dark { background:rgba(12,14,19,.85); }
  .mx-s-light { background:rgba(255,255,255,.95); }
  .mx-s-red { background:#e0261b; }`;
  const STYLES = ['shadow', 'dark', 'light', 'red'];

  function mount(db) {
    if (!document.getElementById('mx-css')) {
      const st = document.createElement('style'); st.id = 'mx-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    if (!document.getElementById('mp-fonts')) {
      const lk = document.createElement('link'); lk.id = 'mp-fonts'; lk.rel = 'stylesheet'; lk.href = 'fonts/fonts.css?v=1'; document.head.appendChild(lk);
    }
    const root = document.createElement('div'); root.className = 'mx-root'; document.body.appendChild(root);
    const nodes = {};
    let items = {}, ov = {};
    // ໃຫ້ໜ້າຄວບຄຸມເຫັນຜົນທັນທີ ຂະນະລາກ
    window.__mxPreview = { set(id, o) { ov[id] = Object.assign(ov[id] || {}, o); render(); } };

    function render() {
      const W = innerWidth, H = innerHeight;
      Object.keys(nodes).forEach((id) => { if (!items[id]) { nodes[id].remove(); delete nodes[id]; } });
      Object.keys(items).forEach((id) => {
        const it = Object.assign({}, items[id], ov[id] || {});
        let n = nodes[id];
        if (!n || n.dataset.type !== it.type) {
          if (n) n.remove();
          n = nodes[id] = document.createElement('div'); n.className = 'mx-it'; n.dataset.type = it.type; n.dataset.edit = 'x:' + id;
          n.innerHTML = it.type === 'image' ? '<img alt="">' : '<div class="mx-txt"></div>';
          root.appendChild(n);
        }
        n.hidden = it.show === false;
        n.style.zIndex = 1 + (+it.z || 0);
        if (it.type === 'image') {
          const img = n.firstChild; if (img.getAttribute('src') !== it.src) img.setAttribute('src', it.src || '');
          n.style.width = Math.max(8, (+it.w || .15) * W) + 'px';
        } else {
          const t = n.firstChild;
          t.textContent = it.text || '';
          t.className = 'mx-txt mx-s-' + (STYLES.includes(it.style) ? it.style : 'dark');
          t.style.fontSize = Math.max(6, (+it.fs || .035) * W) + 'px';
          t.style.color = it.color || '#ffffff';
        }
        n.style.transform = 'translate(' + Math.round((+it.x || 0) * W) + 'px,' + Math.round((+it.y || 0) * H) + 'px)';
      });
    }
    addEventListener('resize', render);
    if (document.fonts) document.fonts.ready.then(render);
    return db.watch('extras/items', (v) => {
      items = v && typeof v === 'object' ? v : {};
      Object.keys(ov).forEach((id) => {
        const it = items[id], o = ov[id];
        if (!it || Object.keys(o).every((k) => it[k] === o[k])) delete ov[id];
      });
      render();
    });
  }

  window.MeeExtras = { mount, STYLES };
})();
