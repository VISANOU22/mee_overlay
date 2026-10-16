// ===== Mee Overlay — ລາກວາງໃນກ່ອງຕົວຢ່າງ (ໃຊ້ຮ່ວມທຸກກິລາ) =====
// MeeEditor.attach(iframe, handler)
//   ແຕະອົງປະກອບທີ່ມີ [data-edit] ໃນ overlay (ສະກໍ, ໜັງສື, ຮູບ) → ຂຶ້ນກອບສີເຫຼືອງ
//   ລາກ = ຍ້າຍ · ດຶງຈຸດມຸມ = ປັບຂະໜາດ · ກອບຫາຍເອງຫຼັງປ່ອຍນິ້ວ 2.5 ວິ ຫຼື ແຕະບ່ອນຫວ່າງ
// handler.change(key, { fx, fy, f }, final, live, iframe)   fx/fy = ມຸມຊ້າຍເທິງ (ສັດສ່ວນຈໍ), f = ອັດຕາຂະຫຍາຍທຽບກັບຕອນເລີ່ມລາກ
// handler.start(key) (ບໍ່ບັງຄັບ) — ເອີ້ນຕອນເລີ່ມລາກ
(() => {
  const CSS = `
  .me-catch { position:absolute; inset:0; z-index:2; touch-action:none; cursor:pointer; }
  .me-frame { position:absolute; z-index:3; border:2px dashed #ffc21a; border-radius:6px; cursor:move; touch-action:none;
    background:rgba(255,194,26,.10); box-shadow:0 0 0 1px rgba(0,0,0,.4); }
  .me-frame.drag { background:rgba(255,194,26,.18); }
  .me-frame .me-rz { position:absolute; right:-3px; bottom:-3px; width:30px; height:30px; border-radius:50%; background:#ffc21a;
    border:3px solid #0c0e13; cursor:nwse-resize; touch-action:none; box-shadow:0 2px 6px rgba(0,0,0,.5); }
  .me-frame .me-rz::after { content:""; position:absolute; inset:7px; border-right:2px solid #1a1404; border-bottom:2px solid #1a1404; }
  .me-bar { position:absolute; z-index:4; display:flex; gap:6px; transform:translateY(-100%); padding-bottom:6px; }
  .me-bar button { min-height:34px; padding:0 12px; border-radius:9px; border:0; font:700 13.5px 'MeeLao','Noto Sans Lao',sans-serif;
    background:#0c0e13; color:#fff; box-shadow:0 2px 8px rgba(0,0,0,.5); }
  .me-bar button.del { background:#e0261b; }
  .me-hint { position:absolute; right:6px; top:6px; z-index:1; font-size:12px; color:#fff; background:rgba(0,0,0,.6);
    padding:2px 8px; border-radius:6px; pointer-events:none; transition:opacity .3s; }
  .me-hint.dim { opacity:0; }`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function attach(ifr, handler) {
    if (!document.getElementById('me-css')) {
      const st = document.createElement('style'); st.id = 'me-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const pre = ifr.parentElement;
    const catcher = document.createElement('div'); catcher.className = 'me-catch';
    const frame = document.createElement('div'); frame.className = 'me-frame'; frame.hidden = true;
    frame.innerHTML = '<span class="me-rz" title="ປັບຂະໜາດ"></span>';
    const hint = document.createElement('span'); hint.className = 'me-hint'; hint.textContent = 'ແຕະສະກໍ, ໜັງສື ຫຼື ຮູບ ເພື່ອຍ້າຍ / ປັບຂະໜາດ';
    const bar = document.createElement('div'); bar.className = 'me-bar'; bar.hidden = true;
    pre.append(catcher, frame, bar, hint);

    let sel = null, drag = null, hideT = null;
    const rank = (n) => (n.closest('.mp-root') ? 100000 : 0) + (parseInt(n.style.zIndex, 10) || 0);
    const doc = () => { try { return ifr.contentDocument; } catch (e) { return null; } };
    const nodeOf = (key) => { const d = doc(); return d && d.querySelector('[data-edit="' + key + '"]'); };
    const rectOf = (key) => { const n = nodeOf(key), r = n && n.getBoundingClientRect(); return r && r.width ? r : null; };

    function place() {
      if (drag || !sel) return;
      const r = rectOf(sel);
      if (!r) { deselect(); return; }
      Object.assign(frame.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      frame.hidden = false;
      placeBar(r);
    }
    // ປຸ່ມດ່ວນເທິງກອບ (ເຊັ່ນ ເຊື່ອງ / ລຶບ) — handler.actions(key) → [{ label, cls, run }]
    let barKey = null;
    function placeBar(r) {
      const acts = handler.actions ? handler.actions(sel) || [] : [];
      if (!acts.length) { bar.hidden = true; return; }
      if (barKey !== sel) {
        barKey = sel; bar.innerHTML = '';
        acts.forEach((a) => {
          const b = document.createElement('button'); b.type = 'button'; b.textContent = a.label; if (a.cls) b.className = a.cls;
          b.addEventListener('pointerdown', (e) => e.stopPropagation());
          b.addEventListener('click', (e) => {
            e.stopPropagation(); clearTimeout(hideT);
            if (a.confirm && !b.dataset.arm) { b.dataset.arm = 1; const t = b.textContent; b.textContent = a.confirm; setTimeout(() => { delete b.dataset.arm; b.textContent = t; }, 3000); autoHide(4000); return; }
            a.run(); deselect();
          });
          bar.appendChild(b);
        });
      }
      const top = Math.max(40, r.top);
      Object.assign(bar.style, { left: Math.max(0, Math.min(r.left, ifr.clientWidth - 170)) + 'px', top: top + 'px' });
      bar.hidden = false;
    }
    function select(key) { sel = key; clearTimeout(hideT); hint.classList.add('dim'); place(); }
    function deselect() { sel = null; barKey = null; frame.hidden = true; bar.hidden = true; clearTimeout(hideT); hint.classList.remove('dim'); }
    const autoHide = (ms) => { clearTimeout(hideT); hideT = setTimeout(deselect, ms || (handler.actions && handler.actions(sel) && handler.actions(sel).length ? 4000 : 2500)); };
    setInterval(place, 300);

    function begin(e, key, mode) {
      const r = rectOf(key); if (!r) return;
      e.preventDefault();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
      select(key); clearTimeout(hideT); frame.classList.add('drag');
      drag = { key, mode, x0: e.clientX, y0: e.clientY, l: r.left, t: r.top, w: r.width, h: r.height,
        W: ifr.clientWidth, H: ifr.clientHeight, last: null, sentAt: 0, moved: false };
      if (handler.start) handler.start(key, ifr);
    }
    function move(e) {
      if (!drag) return;
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      let p;
      if (drag.mode === 'move') {
        const l = clamp(drag.l + dx, 0, Math.max(0, drag.W - drag.w)), t = clamp(drag.t + dy, 0, Math.max(0, drag.H - drag.h));
        frame.style.left = l + 'px'; frame.style.top = t + 'px';
        p = { fx: l / drag.W, fy: t / drag.H, f: 1 };
      } else {
        const fmax = Math.min((drag.W - drag.l) / drag.w, (drag.H - drag.t) / drag.h);   // ບໍ່ໃຫ້ລົ້ນຂອບຈໍ
        const f = clamp((drag.w + dx) / drag.w, 0.15, Math.max(0.15, fmax));
        frame.style.width = drag.w * f + 'px'; frame.style.height = drag.h * f + 'px';
        p = { fx: drag.l / drag.W, fy: drag.t / drag.H, f };
      }
      p.fx = +p.fx.toFixed(4); p.fy = +p.fy.toFixed(4); p.f = +p.f.toFixed(4);
      drag.last = p;
      const live = Date.now() - drag.sentAt > 250;     // ສົ່ງໄປ Live Now ບໍ່ເກີນ 4 ເທື່ອ/ວິ
      if (live) drag.sentAt = Date.now();
      handler.change(drag.key, p, false, live, ifr);
    }
    function end() {
      if (!drag) return;
      const d = drag; drag = null; frame.classList.remove('drag');
      if (d.last && d.moved) handler.change(d.key, d.last, true, true, ifr);
      autoHide();
    }

    catcher.addEventListener('pointerdown', (e) => {
      const d = doc(); if (!d) return;
      const b = ifr.getBoundingClientRect();
      // overlay ຕັ້ງ pointer-events:none ທັງໝົດ → ກວດເອງດ້ວຍຂອບເຂດ; ເລືອກອັນທີ່ຢູ່ເທິງສຸດ (ສະກໍ > ໜັງສື/ຮູບ z ສູງ)
      const x = e.clientX - b.left, y = e.clientY - b.top;
      const hit = Array.from(d.querySelectorAll('[data-edit]')).filter((n) => {
        const r = n.getBoundingClientRect(), cs = d.defaultView.getComputedStyle(n);
        return r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05;
      }).sort((a, c) => rank(c) - rank(a))[0];
      if (!hit) { deselect(); return; }
      begin(e, hit.dataset.edit, 'move');
    });
    bar.addEventListener('pointerenter', () => clearTimeout(hideT));
    frame.addEventListener('pointerdown', (e) => { if (sel) begin(e, sel, e.target.closest('.me-rz') ? 'size' : 'move'); });
    [catcher, frame].forEach((n) => {
      n.addEventListener('pointermove', move);
      n.addEventListener('pointerup', end); n.addEventListener('pointercancel', end);
    });
    return { deselect, select };
  }

  window.MeeEditor = { attach };
})();
