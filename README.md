# Mee Overlay Studio

ລະບົບ overlay ສຳລັບ Live Now (ປຸ່ມ Web). ມີ 2 ໜ້າ:

- `index.html`: Studio ສຳລັບແກ້ໄຂ ແລະ ຄວບຄຸມ live
- `overlay.html?u=...`: ລິ້ງທີ່ໃສ່ໃນປຸ່ມ Web ຂອງ Live Now
- `petanque.html`: ໜ້າຄວບຄຸມສະກໍບອດເປຕັ່ງ. ສະກໍຂຶ້ນໃນ `overlay.html` ລິ້ງເດີມ (ໂຄດຢູ່ `petanque-bug.js`)
- `overlay.html?u=...&tap=1`: ຄືລິ້ງເດີມ ແຕ່ກົດສະກໍເປຕັ່ງເທິງຈໍ Live Now ໄດ້ (ກົດຄະແນນ = +1, ກົດຄ້າງ = ຍົກເລີກ, ກົດຊື່ທີມ = ໂຍນ 1 ລູກ). ເທື່ອທຳອິດຕ້ອງເຂົ້າສູ່ລະບົບ

ຟາຍອື່ນ: `common.js` ແລະ `render.css` (ໃຊ້ຮ່ວມກັນ), `editor.js` (Studio), `config.js` (ຄ່າ Firebase), `database.rules.json` (ກົດຄວາມປອດໄພ)

ຖ້າ `config.js` ຍັງວ່າງ, ລະບົບຈະເຮັດວຽກໃນ "ໂໝດທົດລອງ". ໂໝດນີ້ບັນທຶກຂໍ້ມູນໄວ້ໃນ browser ດຽວເທົ່ານັ້ນ, ແອັບ Live Now ຈຶ່ງບໍ່ເຫັນຂໍ້ມູນ.
