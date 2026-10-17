const CACHE="mobilog-public-r01-v1";
const ASSETS=["/logo-senai-hub.webp","/favicon.svg","/icon-192.png","/icon-512.png","/manifest.webmanifest","/offline.html"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith("mobilog-public-")||key.startsWith("movel-fluxo-shell-"))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
  const request=event.request,url=new URL(request.url);
  if(url.origin!==self.location.origin||request.method!=="GET"||url.pathname.startsWith("/api/")||url.pathname.startsWith("/auth/")||url.searchParams.has("_rsc"))return;
  if(request.mode==="navigate"&&["/","/demo"].includes(url.pathname)){
    // These pages contain a public React shell. Identity and private records
    // are fetched only through /api/*, which this worker never caches.
    event.respondWith(fetch(request).then(response=>{
      if(response.ok&&!response.redirected&&response.headers.get("content-type")?.includes("text/html")){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(url.pathname,copy)));}
      return response;
    }).catch(async()=>await caches.match(url.pathname)||await caches.match("/offline.html")));
  }else if(url.pathname.startsWith("/_next/static/")||ASSETS.includes(url.pathname)){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok&&!response.redirected){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}
      return response;
    })));
  }
});
