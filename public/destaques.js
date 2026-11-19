const rail=document.getElementById("featuredRail");
fetch("https://rraitizanntzdurqdqkm.supabase.co/rest/v1/catalogo_publicado?select=*&order=date.desc.nullslast,id.asc", { headers: { apikey: "sb_publishable_VvOy5B3haLBPS7sIyfZ9gg_bHiBRbiy" }, cache: "no-store" }).then(r=>r.json()).then(all=>{
  const latest=all.filter(x=>x.cover&&x.date).sort((a,b)=>b.date.localeCompare(a.date));
  const selected=[...latest.filter(x=>x.kind==="ebook").slice(0,8),...latest.filter(x=>x.kind==="coletanea").slice(0,3)].sort((a,b)=>b.date.localeCompare(a.date));
  selected.forEach(x=>{const a=document.createElement("a");a.className="featured-card";a.href=(x.kind==="ebook"?"/catalogo.html":"/capitulos.html")+"?obra="+encodeURIComponent(x.id);const image=document.createElement("div");image.className="featured-image";const img=document.createElement("img");img.src=x.cover;img.alt="Capa de "+x.title;img.loading="lazy";image.append(img);const info=document.createElement("div");info.className="featured-info";const title=document.createElement("strong");title.textContent=x.title;const detail=document.createElement("small");detail.textContent=(x.kind==="ebook"?"Livro":"Coletânea")+" · "+x.year;info.append(title,detail);a.append(image,info);rail.append(a)});
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  let timer;
  const stop=()=>clearInterval(timer);
  const start=()=>{stop();if(reduced.matches)return;timer=setInterval(()=>{if(document.hidden||rail.matches(":hover")||rail.contains(document.activeElement))return;const next=rail.scrollLeft+223;rail.scrollTo({left:next>=rail.scrollWidth-rail.clientWidth-10?0:next,behavior:"smooth"})},4000)};
  rail.addEventListener("pointerdown",stop);rail.addEventListener("pointerup",start);rail.addEventListener("focusin",stop);rail.addEventListener("focusout",start);reduced.addEventListener?.("change",start);start();
}).catch(()=>{rail.textContent="As publicações estarão disponíveis no catálogo."});
document.querySelectorAll("[data-featured-direction]").forEach(button=>button.addEventListener("click",()=>rail.scrollBy({left:button.dataset.featuredDirection==="next"?223:-223,behavior:"smooth"})));
