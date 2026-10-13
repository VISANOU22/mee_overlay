// Service worker ຂອງແອັບສະກໍເປຕັ່ງ: ໃຫ້ຕິດຕັ້ງເປັນແອັບໄດ້ ແລະ ເປີດໜ້າໄດ້ຕອນເນັດຫຼຸດ.
// ຈັບແຕ່ໜ້າ petanque.html ແລະ ໄອຄອນ; overlay.html ແລະ Studio ບໍ່ຖືກແຕະຕ້ອງ.
const CACHE = 'petanque-v1';
const OWN = /\/petanque(\.html|\.webmanifest|-icon-\d+\.png)?$/;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !OWN.test(u.pathname)) return;
  // ເອົາຈາກເນັດກ່ອນ (ໄດ້ໂຕໃໝ່ສະເໝີ), ເນັດຫຼຸດຈຶ່ງໃຊ້ໂຕທີ່ເກັບໄວ້
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then((ch) => ch.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
