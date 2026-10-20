const CACHE='ghost-kiosk-v1.7.2';
const LOCAL=['./','./index.html','./style.css','./sketch.js','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
const P5_URL='https://cdn.jsdelivr.net/npm/p5@1.11.13/lib/p5.min.js';

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(LOCAL).then(()=>fetch(P5_URL,{mode:'cors'}).then(response=>{if(response&&response.ok)return cache.put(P5_URL,response.clone());}).catch(()=>{})))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);

  // Cache p5 after a successful online load so the installed app can reopen without the CDN.
  if(event.request.url===P5_URL){
    event.respondWith(caches.match(P5_URL).then(hit=>hit||fetch(event.request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(P5_URL,copy));}
      return response;
    })));
    return;
  }

  if(url.origin!==self.location.origin) return;

  // Navigation checks the network first so a deployed interface/engine revision does not remain stale.
  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          if(response && response.ok){
            const copy=response.clone();
            caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
          }
          return response;
        })
        .catch(()=>caches.match('./index.html').then(hit=>hit||caches.match('./')))
    );
    return;
  }

  // Local assets remain immediately available offline. New SW versions pre-cache their revised copies.
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response && response.ok){
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    }
    return response;
  })));
});
