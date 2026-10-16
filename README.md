# Mee Overlay Studio

ລະບົບ overlay ສຳລັບ Live Now (ປຸ່ມ Web).

**ລິ້ງດຽວສຳລັບຄວບຄຸມທຸກກິລາ: `live.html`** — ເລືອກກິລາຢູ່ແຖບເທິງ; ກິລາທີ່ເລືອກຈະຂຶ້ນໄລ້ (`meta/sport`), ກິລາອື່ນເຊື່ອງເອງ.
ເພີ່ມກິລາໃໝ່ = ເພີ່ມ 1 ແຖວໃນ `SPORTS` ຂອງ live.html.

ໜ້າອື່ນ:

- `index.html`: Studio ສຳລັບແກ້ໄຂ ແລະ ຄວບຄຸມ live
- `overlay.html?u=...`: ລິ້ງທີ່ໃສ່ໃນປຸ່ມ Web ຂອງ Live Now
- `boat.html`: ໜ້າຄວບຄຸມປ້າຍແຂ່ງເຮືອຊ່ວງ (ຖ້ຽວ, ຜົນ, ແຖບລາຍລະອຽດລຸ່ມສຸດ). ປ້າຍຂຶ້ນໃນ `overlay.html` ລິ້ງເດີມ (ໂຄດຢູ່ `boat-bug.js`)
- `petanque.html`: ໜ້າຄວບຄຸມສະກໍບອດເປຕັ່ງ. ສະກໍຂຶ້ນໃນ `overlay.html` ລິ້ງເດີມ (ໂຄດຢູ່ `petanque-bug.js`)

ຟາຍອື່ນ: `common.js` ແລະ `render.css` (ໃຊ້ຮ່ວມກັນ), `editor.js` (Studio), `config.js` (ຄ່າ Firebase), `database.rules.json` (ກົດຄວາມປອດໄພ)

ຖ້າ `config.js` ຍັງວ່າງ, ລະບົບຈະເຮັດວຽກໃນ "ໂໝດທົດລອງ". ໂໝດນີ້ບັນທຶກຂໍ້ມູນໄວ້ໃນ browser ດຽວເທົ່ານັ້ນ, ແອັບ Live Now ຈຶ່ງບໍ່ເຫັນຂໍ້ມູນ.

## ໂມດູນໃຊ້ຮ່ວມ (ສຳລັບເພີ່ມກິລາອື່ນ)

- `extras.js` — ແຕ້ມ **ໜັງສື ແລະ ຮູບ** (`overlays/{uid}/extras/items`) ເທິງ `overlay.html`. ໃຊ້ຮ່ວມທຸກກິລາ
- `extras-panel.js` — ແຜງເພີ່ມ/ແກ້ໜັງສື ແລະ ຮູບ + ປຸ່ມເປີດ/ປິດດ່ວນ ໃນໜ້າຄວບຄຸມ
- `mee-editor.js` — ລາກວາງໃນກ່ອງຕົວຢ່າງ: ແຕະອົງປະກອບທີ່ມີ `data-edit` → ຍ້າຍ / ປັບຂະໜາດ (ກອບຫາຍເອງ)
- `fonts/` — Noto Sans Lao (ບໍ່ມີຫົວ) + Oswald ເກັບໃນ repo

ເພີ່ມກິລາໃໝ່: ສ້າງ `<ກິລາ>-bug.js` (ແຕ້ມສະກໍ, ໃສ່ `data-edit="bug"`, ອ່ານ `overlays/{uid}/<ກິລາ>`), ໂຫຼດມັນໃນ `overlay.html`,
ແລ້ວສ້າງໜ້າຄວບຄຸມ `<ກິລາ>.html` ທີ່ໃຊ້ `MeeExtrasPanel` ແລະ `MeeEditor` ຄືກັບ `petanque.html`.

