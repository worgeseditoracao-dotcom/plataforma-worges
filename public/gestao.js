'use strict';
(() => {
const admin = document.body.dataset.area === 'admin';
if (!admin && new URLSearchParams(location.search).get('area') === 'admin') {
 location.replace('/administracao.html' + location.hash);
 return;
}
const host='https://rraitizanntzdurqdqkm.supabase.co';
const key='sb_publishable_VvOy5B3haLBPS7sIyfZ9gg_bHiBRbiy';
const sessionKey = admin ? 'worges-admin-login' : 'worges-login';
const $=id=>document.getElementById(id);
const money=n=>(n/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const element=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
const tell=text=>{$('msg').textContent=text};
const onError=e=>tell(e.message||'Confira sua conexão e tente novamente.');
let session=JSON.parse(sessionStorage.getItem(sessionKey)||'null'), projects=[], editing=null;
function remember(data){session=data;sessionStorage.setItem(sessionKey,JSON.stringify(data));}
async function request(path,method='GET',body,raw=false,extra={}){
 const headers={apikey:key,...extra};
 if(session?.access_token && !headers.Authorization)headers.Authorization='Bearer '+session.access_token;
 if(body && !raw)headers['Content-Type']='application/json';
 const r=await fetch(host+path,{method,headers,body:raw?body:body?JSON.stringify(body):undefined,cache:'no-store'});
 if(!r.ok && path.startsWith('/auth/')){
  const detail=await r.json().catch(()=>({}));
  if(detail.error_code==='email_not_confirmed' && $('reenviarAntigo'))$('reenviarAntigo').hidden=false;
  const reasons={email_not_confirmed:'Confirme o e-mail antes de entrar. Você pode reenviar o link abaixo.',invalid_credentials:'Confira o e-mail e a senha.',weak_password:'Escolha uma senha mais forte, com pelo menos 8 caracteres.',signup_disabled:'O cadastro está temporariamente indisponível.'};
  throw Error(reasons[detail.error_code]||(r.status===429?'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.':'Não foi possível concluir o acesso. Confira os dados e tente novamente.'));
 }
 if(!r.ok)throw Error(r.status===401?'Entre novamente para continuar.':r.status===403?'Sua conta não tem permissão para esta ação.':'Não foi possível concluir. Confira os dados e tente novamente.');
 return r;
}
async function login(signup){
 const f=$('login');if(!f.reportValidity())return;
 const payload=Object.fromEntries(new FormData(f));
 const r=await request(signup?'/auth/v1/signup?redirect_to='+encodeURIComponent(location.origin+'/gestao.html'):'/auth/v1/token?grant_type=password','POST',payload);
 const result=await r.json();f.elements.password.value="";
 if(!result.access_token){tell('Verifique a caixa de entrada e o spam de '+payload.email+'. Abra o link de confirmação e depois entre com sua senha.');return}
 remember(result);await openDesk();
}
$('heading').textContent=admin?'Painel administrativo':'Meus projetos';
$('login').onsubmit=e=>{e.preventDefault();login(false).catch(onError)};
if ($('signup')) $('signup').onclick=()=>login(true).catch(onError);
$('logout').onclick=async()=>{try{await request('/auth/v1/logout','POST')}finally{sessionStorage.removeItem(sessionKey);location.reload()}};
const fields=[['obra','Título da obra ou capítulo','text'],['autor','Nome do autor','text'],['email','E-mail de acesso do autor','email'],['whatsapp','WhatsApp com DDD','tel'],['tipo_projeto','Tipo de publicação','select'],['situacao_comercial','Situação comercial','select'],['pacote','Pacote ou modalidade','text'],['data_projeto','Data do projeto ou atividade documentada','date'],['original_final_em','Recebimento do original final','date'],['revisao_adicional','Revisão adicional contratada','checkbox'],['revisao_enviada_em','Revisão enviada ao autor (inicia a pausa)','date'],['revisao_devolvida_em','Resposta do autor recebida (retoma o prazo)','date'],['prazo','Publicação prevista pela equipe','date'],['andamento','Andamento da obra','text'],['valor','Valor pago confirmado (R$)','number'],['orcado','Valor da proposta (R$)','number'],['referencia_origem','Referência da informação (e-mail ou registro)','text']];
for(const [name,title,type] of fields){
 const label=element('label',title),input=document.createElement(type==='select'?'select':'input');input.name=name;if(type!=='select')input.type=type;
 if(name==='tipo_projeto')for(const [value,text] of [['livro','Livro'],['capitulo','Capítulo de livro']])input.add(new Option(text,value));
 if(name==='situacao_comercial')for(const [value,text] of [['a_conferir','Dados a conferir'],['proposta','Proposta sem pagamento confirmado'],['pago','Pagamento confirmado'],['em_andamento_anterior','Projeto anterior em andamento']])input.add(new Option(text,value));
 input.required=!['revisao_enviada_em','revisao_devolvida_em','prazo','whatsapp','original_final_em','revisao_adicional','orcado','referencia_origem'].includes(name);if(['valor','orcado'].includes(name)){input.min='0';input.step='0.01'}
 label.append(input);$('fields').append(label);
}
function reset(){editing=null;if(admin)$('editor-title').textContent='Cadastrar projeto';HTMLFormElement.prototype.reset.call($('project'));$('project').elements.valor.value='0';$('project').elements.orcado.value='';$('project').elements.andamento.value='Recebido';$('project').elements.data_projeto.value=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});}
$('reset').onclick=reset;
$('project').onsubmit=async e=>{
 e.preventDefault();const f=e.target,data=Object.fromEntries(new FormData(f));
 data.email=data.email.trim().toLowerCase();data.pago_centavos=Math.round(Number(data.valor)*100);delete data.valor;
 if (admin && data.pago_centavos > 0 && data.situacao_comercial !== 'pago') {
  tell('Selecione Pagamento confirmado para registrar um valor recebido.');
  return;
 }
 data.valor_orcado_centavos=data.orcado===''?null:Math.round(Number(data.orcado)*100);delete data.orcado;
 for(const key of ['revisao_enviada_em','revisao_devolvida_em'])data[key]=data[key]||null;
 if(!data.prazo)data.prazo=null;if(!data.original_final_em)data.original_final_em=null;data.revisao_adicional=f.elements.revisao_adicional.checked;
 try{await request('/rest/v1/projetos_painel'+(editing?'?id=eq.'+editing:''),editing?'PATCH':'POST',data);reset();$('editor').open=false;await loadProjects();tell('Projeto salvo.')}catch(err){onError(err)}
};
async function allRows(path){
 const result=[];for(let offset=0;;offset+=500){const rows=await(await request(path+'&limit=500&offset='+offset)).json();result.push(...rows);if(rows.length<500)return result;}
}
async function loadProjects(){projects=await allRows('/rest/v1/projetos_painel?select=*&order=data_projeto.desc,id');if(admin)updateMonthOptions();render();}
function botaoCertificado(p){
 const b=element('button','Gerar certificado em PDF');let chave=crypto.randomUUID();
 b.onclick=async()=>{b.disabled=true;try{
 const r=await fetch(host+'/functions/v1/certificado-obra',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,apikey:key,'Content-Type':'application/json'},body:JSON.stringify({projeto:p.id,chave})});
 if(!r.ok){const e=await r.json().catch(()=>({}));throw Error(e.mensagem||'Falha na emissão. Tente novamente.')}
 const url=URL.createObjectURL(await r.blob());const a=element('a','');a.href=url;a.download='Certificado Worges - '+p.obra+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);tell('Certificado gerado.');chave=crypto.randomUUID();
 }catch(e){onError(e)}finally{b.disabled=false}};return b;
}
window.addEventListener('hashchange',()=>{if(session&&!admin)render()});
function calendario(rows){
 const section=element('section','');section.append(element('h2',admin?'Cronograma editorial da equipe':'Meu cronograma editorial'));
 const eventos=[];
 for(const p of rows){const c=p.cronograma;
 if(!c){
  if(p.prazo)eventos.push({data:p.prazo,obra:p.obra,nome:'Publicação prevista'});
  continue;
 }
 if(c.pausado)section.append(element('p',p.obra+' · Aguardando análise do autor. Prazo pausado. Saldo para a diagramação: '+c.saldo_diagramacao+' dia(s) útil(eis).'));
 for(const [campo,nome] of [['capa','Duas propostas de capa'],['revisao','Entrega do texto revisado'],['diagramacao','Entrega do livro diagramado'],['publicacao','Publicação prevista']])if(c[campo])eventos.push({data:c[campo],obra:p.obra,nome,provisorio:c.provisorio});
 }
 if(!eventos.length)section.append(element('p','As previsões aparecem após o registro do pagamento.'));
 else{const ol=element('ol','');for(const e of eventos.sort((a,b)=>a.data.localeCompare(b.data))){const li=element('li','');li.append(element('strong',e.data.split('-').reverse().join('/')+' · '+e.nome),element('p',e.obra+(e.provisorio?' · Previsão inicial, aguardando original final.':'')));ol.append(li)}section.append(ol)}
 return section;
}
let adminView = 'projetos';
const situacaoLabel = {
 pago:'Pagamento confirmado',
 proposta:'Proposta · pagamento não confirmado',
 em_andamento_anterior:'Projeto anterior · ativo no mês',
 a_conferir:'Dados a conferir'
};
const projectType = p => p.tipo_projeto === 'capitulo' ? 'Capítulo de livro' : 'Livro';
const dateLabel = date => date ? date.split('-').reverse().join('/') : '—';

function updateMonthOptions() {
 const months = $('filter-month');
 const previous = months.value;
 months.replaceChildren(new Option('Todos os meses','todos'));
 for (const month of [...new Set(projects.map(p => p.data_projeto.slice(0,7)))].sort().reverse()) {
  const date = new Date(month + '-02T12:00:00');
  months.add(new Option(date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}),month));
 }
 if ([...months.options].some(option => option.value === previous)) months.value = previous;
}

function renderMetrics(rows) {
 const paid = rows.filter(p => p.situacao_comercial === 'pago');
 const received = paid.reduce((sum,p) => sum + p.pago_centavos,0);
 const metrics = [
  [rows.length,'Projetos'],
  [rows.filter(p => !p.original_final_em && p.situacao_comercial === 'pago' && !isPublished(p)).length,'Pagos sem original final registrado'],
  [paid.length,'Pagamentos confirmados'],
  [money(received),'Total recebido identificado']
 ];
 $('report').replaceChildren(...metrics.map(([value,label]) => {
  const card = element('div','');
  card.className = 'metric';
  card.append(element('strong',String(value)),element('span',label));
  return card;
 }));
}

function financialReport(rows) {
 const section = element('section','');
 section.append(element('h2','Financeiro'));
 const scroll = element('div','');
 scroll.className = 'table-scroll';
 const table = element('table','');
 table.setAttribute('aria-label','Valores dos projetos filtrados');
 const header = table.createTHead().insertRow();
 for (const label of ['Projeto','Situação','Proposta','Recebido']) {
  const cell = element('th',label);
  cell.scope = 'col';
  header.append(cell);
 }
 const body = table.createTBody();
 for (const p of rows) {
  const row = body.insertRow();
  const project = element('th',p.obra);
  project.scope = 'row';
  project.append(element('p',p.autor + ' · ' + projectType(p)));
  row.append(project);
  row.insertCell().textContent = situacaoLabel[p.situacao_comercial] || 'A conferir';
  row.insertCell().textContent = p.valor_orcado_centavos == null ? '—' : money(p.valor_orcado_centavos);
  row.insertCell().textContent = p.situacao_comercial === 'pago'
   ? (p.pago_centavos > 0 ? money(p.pago_centavos) : 'Valor não informado')
   : '—';
 }
 scroll.append(table);
 section.append(scroll);
 return section;
}
const isPublished = p => /^(publicad[oa]|obra publicada|livro publicado|capítulo publicado)$/i.test(p.andamento.trim());

function render(){
 const list=$('list');list.replaceChildren();
 if(!admin){
  const view=['livros','certificados','pacotes','cronograma'].includes(location.hash.slice(1))?location.hash.slice(1):'pacotes';
  const style=document.createElement('style');style.textContent='.portal-nav,.portal-ofertas{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}.portal-nav a,.portal-ofertas a{padding:14px 18px;border-radius:12px;text-decoration:none;font-weight:700}.portal-nav a{background:white;color:#4a205c;border:1px solid #d5bddb}.portal-nav a[aria-current=page]{background:#52245e;color:white}.portal-ofertas a{flex:1 1 150px;display:grid;gap:10px;color:white!important;background:linear-gradient(125deg,#80432a,#64324d);box-shadow:0 9px 22px #36133420}.portal-ofertas a:nth-child(2){background:linear-gradient(125deg,#374a74,#21637b)}.portal-ofertas a:nth-child(3){background:linear-gradient(125deg,#75450a,#805325)}.portal-ofertas strong{font:600 26px Georgia}.portal-ofertas span{font-size:14px}';list.append(style);
  const nav=document.createElement('nav');nav.className='portal-nav';nav.setAttribute('aria-label','Área do autor');
  for(const [key,label] of [['pacotes','Meus pacotes'],['livros','Meus livros e projetos'],['certificados','Meus certificados'],['cronograma','Meu cronograma']]){
   const a=element('a',label);a.href='#'+key;if(key===view)a.setAttribute('aria-current','page');nav.append(a);
  }
  list.append(nav);$('search').parentElement.hidden=view!=='livros'||!projects.length;
  if(view==='cronograma'){list.append(calendario(projects));return}
  if(view==='pacotes'){
   const section=element('section','');section.append(element('h2','Meus pacotes'));
   const purchases=projects.filter(p=>p.checkout_id||(p.situacao_comercial==='pago'&&p.pago_centavos>0));
   if(!purchases.length)section.append(element('p','Escolha o pacote para a sua próxima obra.'));
   for(const p of purchases){section.append(element('p',p.pacote+' · '+p.obra+' · Pago '+money(p.pago_centavos)))}
   const offers=element('div','');offers.className='portal-ofertas';
   for(const [name,desc] of [['Bronze','Publicação digital'],['Prata','Digital e impressão'],['Ouro','Revisão e Kindle incluídos']]){
    const a=element('a','');a.href='/pedido.html?pacote='+name;a.append(element('strong',name),element('span',desc),element('span','Escolher pacote →'));offers.append(a)
   }
   section.append(offers);
   const coletaneas=element('section','');
   coletaneas.append(element('h2','Coletâneas'),element('h3','Publicar um capítulo de livro'),element('p','Nesta modalidade, seu capítulo integra um livro com trabalhos de outros autores. As condições para envio dos capítulos serão divulgadas aqui.'));
   const acervo=element('a','Conhecer as coletâneas publicadas →');acervo.href='/capitulos.html';coletaneas.append(acervo);
   list.append(section,coletaneas);if(purchases.length)list.append(calendario(purchases));return;
  }
  if(view==='certificados'){
   const section=element('section','');section.append(element('h2','Certificados de publicação'),element('p','Primeira emissão gratuita por obra. Reemissão: R$ 29,90.'));
   const obras=projects.filter(p=>/^(publicad[oa]|obra publicada|livro publicado)$/i.test(p.andamento.trim()));
   if(!obras.length)section.append(element('p','Quando sua obra estiver publicada e vinculada ao catálogo, você poderá gerar o PDF aqui.'));
   for(const p of obras){section.append(element('h3',p.obra),botaoCertificado(p))}
   list.append(section);return;
  }
  list.append(element('h2','Meus livros e projetos'));
 }
 const term = $('search').value.trim().toLocaleLowerCase();
 const month = admin ? $('filter-month').value : 'todos';
 const kind = admin ? $('filter-kind').value : 'todos';
 const status = admin ? $('filter-status').value : 'todos';
 const rows = projects.filter(p =>
  (month === 'todos' || p.data_projeto.startsWith(month)) &&
  (kind === 'todos' || (p.tipo_projeto || 'livro') === kind) &&
  (status === 'todos' || p.situacao_comercial === status) &&
  [p.obra,p.autor,p.email,p.whatsapp,p.pacote,p.andamento,p.referencia_origem].join(' ').toLocaleLowerCase().includes(term)
 );
 if (admin) renderMetrics(rows);
 if (!rows.length) {
  list.append(element('p',projects.length ? 'Nenhum projeto corresponde aos filtros.' : 'Nenhum projeto cadastrado.'));
  return;
 }
 if (admin && adminView === 'cronograma') { list.append(calendario(rows)); return; }
 if (admin && adminView === 'financeiro') { list.append(financialReport(rows)); return; }
 for(const p of rows){
  const card=document.createElement('article');card.id='obra-'+p.id;
  const badge = element('p',projectType(p)+' · '+(situacaoLabel[p.situacao_comercial]||'Situação a conferir'));
  badge.className = 'project-status';
  badge.dataset.status = p.situacao_comercial || 'a_conferir';
  card.append(badge,element('h2',p.obra),element('p',p.autor+' · '+p.pacote+' · '+p.andamento),element('p','Registro '+p.data_projeto.split('-').reverse().join('/')+(p.prazo?' · Prazo '+p.prazo.split('-').reverse().join('/'):'')+(p.situacao_comercial==='pago'?(p.pago_centavos>0?' · Valor recebido identificado '+money(p.pago_centavos):' · Valor pago não informado'):p.valor_orcado_centavos!=null?' · Proposta '+money(p.valor_orcado_centavos):' · Valor não confirmado')),element('p',[p.email,p.whatsapp].filter(Boolean).join(' · ')));
  if(admin&&p.referencia_origem)card.append(element('small','Origem: '+p.referencia_origem));
  if(admin&&isPublished(p))card.append(botaoCertificado(p));
  if(admin){const edit=element('button','Editar projeto');edit.onclick=()=>{editing=p.id;$('editor-title').textContent='Editar projeto: '+p.obra;for(const [name] of fields)if(name==='revisao_adicional')$('project').elements[name].checked=p.revisao_adicional;else $('project').elements[name].value=name==='valor'?p.pago_centavos/100:name==='orcado'?(p.valor_orcado_centavos==null?'':p.valor_orcado_centavos/100):p[name]||'';$('editor').open=true;$('editor').scrollIntoView()};card.append(edit)}
  const box=document.createElement('details');box.append(element('summary','Etapas, arquivos e orientações da obra'));const content=document.createElement('div');box.append(content);box.ontoggle=()=>{if(box.open)details(p,content).catch(onError)};card.append(box);list.append(card);
 }
}
$('search').oninput=render;
if (admin) {
 const views = [...$('admin-nav').querySelectorAll('[data-view]')];
 for (const button of views) button.onclick = () => {
  adminView = button.dataset.view;
  for (const item of views) item.setAttribute('aria-pressed', String(item === button));
  render();
 };
 for (const id of ['filter-month','filter-kind','filter-status']) $(id).onchange = render;
 $('new-project').onclick = () => {
  reset();
  $('editor').open = true;
  $('project').elements.obra.focus();
 };
}
async function details(p,content){
 const notes=await allRows('/rest/v1/relato_projeto?select=texto,criado_em&projeto_id=eq.'+p.id+'&order=criado_em,id');
 const files=[];for(let offset=0;;offset+=100){const batch=await(await request('/storage/v1/object/list/originais-worges','POST',{prefix:p.id,limit:100,offset,sortBy:{column:'name',order:'asc'}})).json();files.push(...batch);if(batch.length<100)break;}
 const history=await allRows('/rest/v1/historico_projeto?select=andamento,registrado_em&projeto_id=eq.'+p.id+'&order=registrado_em,id');
 content.replaceChildren(element('h3','Histórico de etapas'));
 const timeline=document.createElement('ol');
 for(const event of history)timeline.append(element('li',new Date(event.registrado_em).toLocaleString('pt-BR')+' · '+event.andamento));
 content.append(timeline,element('h3','Arquivos para download'));
 for(const file of files){const name=file.name.replace(/^[0-9a-f-]{36}_/,'');const b=element('button','Baixar '+name);b.onclick=async()=>{try{const r=await request('/storage/v1/object/authenticated/originais-worges/'+p.id+'/'+encodeURIComponent(file.name));const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}catch(err){onError(err)}};const row=document.createElement('p');row.append(b);content.append(row);}
 if (admin && p.pedido_capitulo_id) {
  const [order] = await allRows('/rest/v1/pedidos_capitulo?select=arquivo,paginas,abnt,revisao&id=eq.' + p.pedido_capitulo_id);
  if (order) {
   const extras = [order.abnt && 'Normalização ABNT',order.revisao && 'Correção ortográfica'].filter(Boolean);
   content.append(element('p',order.paginas + ' páginas · ' + (extras.join(' · ') || 'Sem serviços adicionais')));
   const download = element('button','Baixar original da submissão');
   download.onclick = async () => {
    download.disabled = true;
    try {
     const path = order.arquivo.split('/').map(encodeURIComponent).join('/');
     const response = await request('/storage/v1/object/authenticated/originais-coletaneas/' + path);
     const link = element('a','');
     const url = URL.createObjectURL(await response.blob());
     link.href = url;
     link.download = 'Original do capítulo.' + order.arquivo.split('.').at(-1);
     link.click();
     setTimeout(() => URL.revokeObjectURL(url),30000);
    } catch (error) { onError(error); }
    finally { download.disabled = false; }
   };
   content.append(download);
  }
 }
 if(!files.length && !(admin && p.pedido_capitulo_id))content.append(element('p','Nenhum arquivo enviado.'));
 if (!admin) content.append(element('p','Envie o original final em Word ou PDF em até um ano após a contratação. Você também pode anexar a capa. Depois de enviar o original final, entregue o questionário editorial em até dois dias.'));
 if((p.checkout_id||p.pago_centavos>0)&&!admin){
 const pack=p.pacote.split(' ')[0];
 if(['Bronze','Prata','Ouro'].includes(pack)){const ficha=element('a','Preencher ficha editorial desta obra');ficha.href='/ficha.html?pacote='+encodeURIComponent(pack)+'&projeto='+encodeURIComponent(p.id);content.append(ficha)}
 }
 const final=document.createElement('input');final.type='checkbox';const finalLabel=element('label','Este envio contém o original final em Word ou PDF');finalLabel.prepend(final);if(!p.original_final_em)content.append(finalLabel);
 const upload=element('label',admin?'Anexar arquivo ao projeto':'Anexar original, capa ou questionário preenchido');const input=document.createElement('input');input.type='file';input.multiple=true;upload.append(input);content.append(upload);
 input.onchange=async()=>{input.disabled=true;try{let original;if(final.checked&&![...input.files].some(f=>/\.(docx?|pdf)$/i.test(f.name)))throw Error('Selecione um original em Word ou PDF.');for(const file of input.files){const clean=file.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'_');const path=p.id+'/'+crypto.randomUUID()+'_'+clean;if(final.checked&&/\.(docx?|pdf)$/i.test(clean))original=path;await request('/storage/v1/object/originais-worges/'+path,'POST',file,true,{'Content-Type':file.type||'application/octet-stream'});}if(original){await request('/rest/v1/rpc/confirmar_original_final','POST',{projeto:p.id,arquivo:original});await loadProjects()}tell(original?'Original recebido. Cronograma atualizado.':'Arquivos enviados.')}catch(err){onError(err)}finally{input.disabled=false;details(p,content).catch(onError)}};
 content.append(element('h3','Orientações e informações da obra'));
 for(const n of notes)content.append(element('p',new Date(n.criado_em).toLocaleString('pt-BR')+' · '+n.texto));
 const form=document.createElement('form'),label=element('label',admin?'Registrar orientação visível ao autor':'Adicionar orientação ou completar o questionário editorial'),area=document.createElement('textarea');area.required=true;area.maxLength=16000;label.append(area);const save=element('button','Registrar orientação');form.append(label,save);content.append(form);
 form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await request('/rest/v1/relato_projeto','POST',{projeto_id:p.id,texto:area.value.trim()});await details(p,content);tell('Orientação registrada.')}catch(err){onError(err);save.disabled=false}};
}
async function openDesk(){
 const user=await(await request('/auth/v1/user')).json();
 const comprar=new URLSearchParams(location.search).get('comprar');if(!admin&&['Bronze','Prata','Ouro'].includes(comprar)){location.replace('/pedido.html?pacote='+comprar);return}
 $('auth').hidden=true;$('desk').hidden=false;
 if (admin && user.app_metadata?.worges_role !== 'admin') {
  $('auth').hidden = false;
  $('desk').hidden = true;
  session = null;
  sessionStorage.removeItem(sessionKey);
  tell('Use uma conta da equipe com acesso administrativo.');
  return;
 }
 if (admin) $('logout').hidden = false;
 $('manager').hidden=!admin;if(admin)reset();tell('');await loadProjects();
 if(!admin && new URLSearchParams(location.search).has('orcamento')){
  const pending=JSON.parse(sessionStorage.getItem('worges-orcamento')||'null');
  if(!pending)return;
  const {email,...pedido}=pending;
  if(email!==user.email.toLowerCase()){tell('Entre com o mesmo e-mail informado no orçamento.');return}
  const send=element('button','Enviar orçamento de '+pedido.titulo);
  $('desk').prepend(send);
  send.onclick=async()=>{send.disabled=true;try{await request('/rest/v1/rpc/registrar_orcamento','POST',pedido);sessionStorage.removeItem('worges-orcamento');sessionStorage.removeItem('worges-questionario-'+pedido.modalidade);send.remove();await loadProjects();tell('Orçamento enviado. Abra os arquivos da obra para anexar seu Word, PDF ou proposta de capa.')}catch(err){onError(err);send.disabled=false}};
 }
}

async function googleLogin(){
 const bytes=crypto.getRandomValues(new Uint8Array(48));
 const encode=b=>btoa(String.fromCharCode(...b)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
 const verifier=encode(bytes);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
 sessionStorage.setItem('worges-verifier',verifier);
 sessionStorage.setItem('worges-retorno',location.search);
 const url=new URL(host+'/auth/v1/authorize');
 url.search=new URLSearchParams({provider:'google',redirect_to:location.origin+'/gestao.html',code_challenge:encode(new Uint8Array(digest)),code_challenge_method:'s256'});
 location.assign(url.href);
}
function offerRecovery(){
 const button=element('button','Esqueci minha senha');button.type='button';
 $('login').append(button);
 button.onclick=async()=>{
  const email=$('login').elements.email;
  if(!email.reportValidity())return;
  button.disabled=true;
  try{
   await request('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+'/gestao.html'),'POST',{email:email.value.trim()});
   tell('Se esse e-mail estiver cadastrado, você receberá um link para escolher outra senha. Confira também o spam.');
  }catch(err){onError(err)}finally{button.disabled=false}
 };
}
async function recoveryForm(token){
 $('login').hidden=true;
 const form=document.createElement('form');
 form.innerHTML='<h2>Escolha uma nova senha</h2><label>Nova senha<input name="nova" type="password" minlength="8" required autocomplete="new-password"></label><label>Confirme a nova senha<input name="confirmar" type="password" minlength="8" required autocomplete="new-password"></label><button>Salvar nova senha</button>';
 $('auth').append(form);
 form.onsubmit=async e=>{
  e.preventDefault();
  if(form.elements.nova.value!==form.elements.confirmar.value){tell('As senhas precisam ser iguais.');return}
  const button=form.querySelector('button');button.disabled=true;
  try{
   const response = await request('/auth/v1/user','PUT',{password:form.elements.nova.value},false,{Authorization:'Bearer '+token});
   const user = await response.json();
   if (user.app_metadata?.worges_role === 'admin' && !admin) {
    location.replace('/administracao.html?senha=atualizada');
    return;
   }
   form.remove();$('login').hidden=false;tell('Senha atualizada. Entre com o e-mail e a nova senha.');
  }catch{tell('Não foi possível atualizar a senha. Solicite outro link de recuperação.');form.remove();$('login').hidden=false}
 };
}
async function startDesk(){
 offerRecovery();
 if (admin && new URLSearchParams(location.search).get('senha') === 'atualizada') {
  tell('Senha atualizada. Entre com seu e-mail e a nova senha.');
 }
 const resend=element('button','Reenviar e-mail de confirmação');resend.type='button';resend.id='reenviarAntigo';resend.hidden=true;$('login').append(resend);
 resend.onclick=async()=>{
  const email=$('login').elements.email;if(!email.reportValidity())return;
  resend.disabled=true;
  try{await request('/auth/v1/resend?redirect_to='+encodeURIComponent(location.origin+'/gestao.html'),'POST',{type:'signup',email:email.value.trim()});tell('Se houver confirmação pendente, confira a caixa de entrada e o spam.')}catch(err){onError(err)}finally{resend.disabled=false}
 };
 const fragment=new URLSearchParams(location.hash.slice(1));
 if(fragment.get('type')==='signup'&&!fragment.has('error')){history.replaceState(null,'',location.pathname+location.search);tell('E-mail confirmado. Entre com seu e-mail e senha.');}
 if(fragment.has('error')||fragment.get('type')==='recovery'){
  history.replaceState(null,'',location.pathname+location.search);
  session=null;sessionStorage.removeItem(sessionKey);
  if(fragment.get('type')==='recovery'&&fragment.has('access_token'))await recoveryForm(fragment.get('access_token'));
  else tell('Este link expirou ou é inválido. Use Esqueci minha senha para solicitar outro.');
  return;
 }
 const code=new URLSearchParams(location.search).get('code');
 if(code){
  const verifier=sessionStorage.getItem('worges-verifier');
  const previous=sessionStorage.getItem('worges-retorno')||'';
  history.replaceState(null,'','/gestao.html');
  if(!verifier)throw Error('Inicie novamente o acesso com Google nesta aba.');
  remember(await(await request('/auth/v1/token?grant_type=pkce','POST',{auth_code:code,code_verifier:verifier})).json());
  sessionStorage.removeItem('worges-verifier');sessionStorage.removeItem('worges-retorno');
  location.replace('/gestao.html'+(previous.startsWith('?')?previous:''));return;
 }
 if(session){
  remember(await(await request('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:session.refresh_token})).json());
  await openDesk();return;
 }
 if (admin) return;
 const config=await(await request('/auth/v1/settings')).json();
 if(!admin && config.external?.google){
  const google=element('button','Continuar com Google');google.type='button';
  google.onclick=()=>googleLogin().catch(onError);$('auth').prepend(google);
 }
}
startDesk().catch(onError);
})();
