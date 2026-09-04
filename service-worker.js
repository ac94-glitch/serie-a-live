const CACHE_VERSION = "serie-a-live-v20";

self.addEventListener("install",event=>{
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target = event.notification?.data?.url || "./";
  event.waitUntil(
    self.clients.matchAll({type:"window",includeUncontrolled:true}).then(clients=>{
      for(const client of clients){
        if("focus" in client) return client.focus();
      }
      if(self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

// Già predisposto per il vero Web Push: quando in futuro arriverà
// un payload push, il service worker saprà mostrarlo.
self.addEventListener("push",event=>{
  let payload = {};
  try{
    payload = event.data ? event.data.json() : {};
  }catch{
    payload = {body:event.data ? event.data.text() : ""};
  }

  const title = payload.title || "Serie A Live";
  const options = {
    body:payload.body || "",
    icon:"./seriea-live-v3-192.png",
    badge:"./seriea-live-v3-192.png",
    tag:payload.tag || undefined,
    data:{url:payload.url || "./"}
  };

  event.waitUntil(self.registration.showNotification(title,options));
});
