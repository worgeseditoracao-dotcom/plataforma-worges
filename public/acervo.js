const root=document.getElementById("app");
const kind=document.body.dataset.kind;
const params=new URLSearchParams(location.search);
const collator=new Intl.Collator("pt-BR",{sensitivity:"base"});
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node};
const link=(label,url,cls="btn")=>{const a=el("a",cls,label);a.href=url;if(/^https?:/.test(url)){a.target="_blank";a.rel="noopener noreferrer"}return a};
const dateText=date=>date?new Date(date+"T12:00:00").toLocaleDateString("pt-BR"):"Data a confirmar";
const summary=x=>x.authors?.length?x.authors.slice(0,3).join(" · ")+(x.authors.length>3?` · +${x.authors.length-3} autores`:""):"Autores em conferência";
const cover=x=>{const img=el("img","book-cover");img.src=x.cover;img.alt=`Capa de ${x.title}`;img.loading="lazy";img.decoding="async";return img};
function renderDetail(x){
  root.replaceChildren();
  const box=el("article","detail");
  box.append(link("Voltar ao acervo",kind==="ebook"?"/catalogo.html":"/capitulos.html","btn secondary"),el("p","eyebrow",x.kind==="ebook"?"Livro digital":"Coletânea de capítulos"),el("h1","",x.title));
  const dl=el("dl");
  [["Publicado em",dateText(x.date)],["Autores / organização",x.authors?.length?x.authors.join("; "):"Em conferência"],["ISBN do volume",x.isbn||"Não informado na ficha original"],["DOI do volume",x.doi||"Não informado na ficha original"]].forEach(([term,value])=>{dl.append(el("dt","",term),el("dd","",value))});
  if(x.cover){const visual=el("div","detail-cover");visual.append(cover(x));box.append(visual)}
  box.append(dl);
  const actions=el("div","links");
  if(x.download)actions.append(link(x.kind==="ebook"?"Abrir e-book":"Abrir livro completo",x.download));
  else actions.append(el("span","missing","Arquivo do volume ainda sem link público confirmado."));
  actions.append(link("Ver ficha no site anterior",x.source,"btn secondary"));box.append(actions);
  if(x.kind==="coletanea"){
    box.append(el("h2","","Capítulos deste livro"));
    if(x.chapters?.length){const list=el("ol","chapter-list");x.chapters.forEach(c=>{const li=el("li");li.append(el("strong","",c.title),el("p","meta",c.authors?.join("; ")||"Autores em conferência"),el("p","meta",c.doi?`DOI: ${c.doi}`:"DOI em conferência"));if(c.download)li.append(link("Abrir capítulo",c.download));list.append(li)});box.append(list)}
    else box.append(el("p","note","O volume completo já está catalogado. Os títulos, autores, DOI e PDFs de cada capítulo estão sendo conferidos para disponibilização individual."));
  }
  root.append(box);
}
function renderList(data){
  root.replaceChildren();
  const controls=el("div","controls"),qLabel=el("label","",kind==="ebook"?"Buscar livro":"Buscar coletânea"),search=el("input");search.type="search";search.placeholder="Título, autor, ISBN ou DOI";qLabel.append(search);
  const yLabel=el("label","","Ano"),select=el("select");const years=[...new Set(data.map(x=>x.year).filter(Boolean))].sort((a,b)=>Number(b)-Number(a));select.append(new Option("Todos os anos",""));years.forEach(y=>select.append(new Option(y,y)));yLabel.append(select);
  const count=el("span","count");controls.append(qLabel,yLabel,count);root.append(controls);
  const content=el("div");root.append(content);
  const render=()=>{
    content.replaceChildren();let q=search.value.trim().toLocaleLowerCase("pt-BR"),filtered=data.filter(x=>(!select.value||x.year===select.value)&&(!q||[x.title,...x.authors,x.isbn,x.doi].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(q)));
    count.textContent=`${filtered.length} ${kind==="ebook"?"livros":"coletâneas"}`;
    if(!filtered.length){content.append(el("p","empty","Nenhuma publicação encontrada."));return}
    const groups=[...new Set(filtered.map(x=>x.year||"Data a confirmar"))].sort((a,b)=>b.localeCompare(a));
    groups.forEach(year=>{content.append(el("h2","year",year));const grid=el("div","grid");filtered.filter(x=>(x.year||"Data a confirmar")===year).sort((a,b)=>(b.date||"").localeCompare(a.date||"")||collator.compare(a.title,b.title)).forEach(x=>{
      const card=el("article","card");if(x.cover){const visual=link(`Ver ${x.title}`,`?obra=${encodeURIComponent(x.id)}`,"cover-panel");visual.textContent="";visual.append(cover(x));card.append(visual)}card.append(el("span","tag",kind==="ebook"?"E-book":"Coletânea"),el("h3","",x.title),el("p","meta",summary(x)),el("p","meta",`Publicado em ${dateText(x.date)}`),el("p","meta",`ISBN: ${x.isbn||"em conferência"}`),el("p","meta",`DOI: ${x.doi||"não informado"}`));
      const foot=el("div","foot");foot.append(link("Ver detalhes",`?obra=${encodeURIComponent(x.id)}`,"btn secondary"));if(x.download)foot.append(link(kind==="ebook"?"Abrir e-book":"Abrir livro",x.download));else foot.append(el("span","missing","Download pendente"));card.append(foot);grid.append(card)
    });content.append(grid)});
  };
  search.addEventListener("input",render);select.addEventListener("change",render);render();
}
fetch("https://rraitizanntzdurqdqkm.supabase.co/rest/v1/catalogo_publicado?select=*&order=date.desc.nullslast,id.asc", { headers: { apikey: "sb_publishable_VvOy5B3haLBPS7sIyfZ9gg_bHiBRbiy" }, cache: "no-store" }).then(r=>{if(!r.ok)throw Error("Falha ao carregar catálogo");return r.json()}).then(all=>{const data=all.filter(x=>x.kind===kind);const selected=data.find(x=>x.id===params.get("obra"));if(selected)renderDetail(selected);else renderList(data)}).catch(()=>{root.replaceChildren(el("p","empty","O catálogo não pôde ser carregado agora. Tente atualizar a página."))});
