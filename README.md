# Mee Overlay Studio

ລະບົບ overlay ສຳລັບ Live Now (ປຸ່ມ Web). ມີ 2 ໜ້າ:

- `index.html`: Studio ສຳລັບແກ້ໄຂ ແລະ ຄວບຄຸມ live
- `overlay.html?u=...`: ລິ້ງທີ່ໃສ່ໃນປຸ່ມ Web ຂອງ Live Now
- `petanque.html`: ໜ້າຄວບຄຸມສະກໍບອດເປຕັ່ງ. ສະກໍຂຶ້ນໃນ `overlay.html` ລິ້ງເດີມ (ໂຄດຢູ່ `petanque-bug.js`)
- `overlay.html?u=...&tap=1`: ຄືລິ້ງເດີມ ແຕ່ກົດສະກໍເປຕັ່ງເທິງຈໍ Live Now ໄດ້ (ກົດຄະແນນ = +1, ກົດຄ້າງ = ຍົກເລີກ, ກົດຊື່ທີມ = ໂຍນ 1 ລູກ). ເທື່ອທຳອິດຕ້ອງເຂົ້າສູ່ລະບົບ

ຟາຍອື່ນ: `common.js` ແລະ `render.css` (ໃຊ້ຮ່ວມກັນ), `editor.js` (Studio), `config.js` (ຄ່າ Firebase), `database.rules.json` (ກົດຄວາມປອດໄພ)

ຖ້າ `config.js` ຍັງວ່າງ, ລະບົບຈະເຮັດວຽກໃນ "ໂໝດທົດລອງ". ໂໝດນີ້ບັນທຶກຂໍ້ມູນໄວ້ໃນ browser ດຽວເທົ່ານັ້ນ, ແອັບ Live Now ຈຶ່ງບໍ່ເຫັນຂໍ້ມູນ.

## Import ເຂົ້າ Live Now (ໄຟລ໌ HTML)

`petanque-livenow.html` ເປັນໄຟລ໌ດຽວ (ມີຟອນໃນໄຟລ໌, ບໍ່ຕ້ອງໃຊ້ເນັດ) ສຳລັບ "Import overlay" ໃນ Live Now.
ໃຊ້ຮູບແບບດຽວກັບ scoreboard ຂອງ Live Now ແລະ ບອກແອັບວ່າເປັນ `badminton`, ແອັບຈຶ່ງສ້າງປຸ່ມກົດຄະແນນໃຫ້
ແລ້ວສົ່ງຄ່າເຂົ້າມາທາງ `window.template.update(field, value)`: `scoreA/B` ຄະແນນ, `teamA/B` ຊື່, `logoA/B` ໂລໂກ້, `teamTurn` ຈຸດລູກໝູ, `setA/B` ນັດທີ່ຊະນະ.
ບໍ່ຊິ້ງກັບ Firebase/petanque.html. ດາວໂຫຼດໄດ້ຈາກ petanque.html → ຕັ້ງຄ່າ → ຂໍ້ 4.

ແກ້ທີ່ `livenow/petanque-livenow.src.html` ແລ້ວ build:
`npm i @fontsource/noto-sans-lao@5 @fontsource/oswald@5 && python3 livenow/build.py node_modules/@fontsource`
