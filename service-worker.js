const CACHE_NAME = "serie-a-live-v244";
const FALLBACK_INDEX = "./index.html";
const STATIC_ASSETS = [
  "./manifest.json",
  "./seriea-live-v3-32.png",
  "./seriea-live-v3-180.png",
  "./seriea-live-v3-192.png",
  "./seriea-live-v3-512.png"
];

async function fetchFresh(request){
  return fetch(new Request(request,{cache:"no-store"}));
}

self.addEventListener("install",event=>{
  self.skipWaiting();

  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE_NAME);

    // Cache the current HTML as an offline fallback, but never use it
    // ahead of the network on a normal launch.
    try{
      const response = await fetch(FALLBACK_INDEX,{cache:"no-store"});
      if(response.ok) await cache.put(FALLBACK_INDEX,response.clone());
    }catch(_){}

    await Promise.allSettled(
      STATIC_ASSETS.map(async asset=>{
        try{
          const response = await fetch(asset,{cache:"reload"});
          if(response.ok) await cache.put(asset,response.clone());
        }catch(_){}
      })
    );
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key=>key.startsWith("serie-a-live-") && key !== CACHE_NAME)
        .map(key=>caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  const request = event.request;
  if(request.method !== "GET") return;

  const url = new URL(request.url);

  // ESPN, CDN fonts/icons and every other external request are never
  // cached by this service worker.
  if(url.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate";
  const isIndex =
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/serie-a-live/") ||
    url.pathname === "/serie-a-live";

  if(isNavigation || isIndex){
    event.respondWith((async()=>{
      const cache = await caches.open(CACHE_NAME);

      try{
        const fresh = await fetchFresh(request);
        if(fresh.ok) await cache.put(FALLBACK_INDEX,fresh.clone());
        return fresh;
      }catch(_){
        const cached = await cache.match(FALLBACK_INDEX);
        if(cached) return cached;

        return new Response(
          "<!doctype html><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Serie A Live</title><p style='font-family:system-ui;padding:24px'>Connessione non disponibile.</p>",
          {headers:{"Content-Type":"text/html; charset=utf-8"}}
        );
      }
    })());
    return;
  }

  if(STATIC_ASSETS.some(asset=>url.pathname.endsWith(asset.replace("./","/")))){
    event.respondWith((async()=>{
      const cache = await caches.open(CACHE_NAME);

      try{
        const fresh = await fetchFresh(request);
        if(fresh.ok) await cache.put(request,fresh.clone());
        return fresh;
      }catch(_){
        return (await cache.match(request)) || Response.error();
      }
    })());
  }
});
