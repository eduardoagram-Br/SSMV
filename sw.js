const CACHE_NAME = "ssmv-cache-v3";
const FILES_TO_CACHE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Só cuida dos arquivos do próprio app — chamadas a APIs externas (CoinGecko, Open Library, etc.)
  // sempre vão direto pra rede, nunca ficam presas em cache velho.
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) return;
  // Rede primeiro: garante que uma versão nova do app sempre chega.
  // O cache só entra em ação quando não há internet.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
