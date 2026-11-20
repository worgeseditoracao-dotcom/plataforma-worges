'use strict';
const host='https://rraitizanntzdurqdqkm.supabase.co';
const key='sb_publishable_VvOy5B3haLBPS7sIyfZ9gg_bHiBRbiy';
const admin=new URLSearchParams(location.search).get('area')==='admin';
const $=id=>document.getElementById(id);
const money=n=>(n/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const element=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
const tell=text=>{$('msg').textContent=text};
const onError=e=>tell(e.message||'Confira sua conexão e tente novamente.');
let session=JSON.parse(sessionStorage.getItem('worges-login')||'null'), projects=[], editing=null;
function remember(data){session=data;sessionStorage.setItem('worges-login',JSON.stringify(data));}
async function request(path,method='GET',body,raw=false,extra={}){
 const headers={apikey:key,...extra};
 if(session?.access_token)headers.Authorization='Bearer '+session.access_token;
 if(body && !raw)headers['Content-Type']='application/json';
 const r=await fetch(host+path,{method,headers,body:raw?body:body?JSON.stringify(body):undefined,cache:'no-store'});
 if(!r.ok && path.startsWith('/auth/')){
  const detail=await r.json().catch(()=>({}));
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
$('heading').textContent=admin?'Administração editorial':'Meus projetos';
$('login').onsubmit=e=>{e.preventDefault();login(false).catch(onError)};
$('signup').onclick=()=>login(true).catch(onError);
$('logout').onclick=async()=>{try{await request('/auth/v1/logout','POST')}finally{sessionStorage.removeItem('worges-login');location.reload()}};
const fields=[['obra','Título da obra','text'],['autor','Nome do autor','text'],['email','E-mail de acesso do autor','email'],['whatsapp','WhatsApp com DDD','tel'],['pacote','Pacote contratado','text'],['data_projeto','Data do projeto','date'],['prazo','Prazo previsto','date'],['andamento','Andamento da obra','text'],['valor','Valor pago (R$)','number']];
for(const [name,title,type] of fields){
 const label=element('label',title),input=document.createElement('input');input.name=name;input.type=type;
 input.required=!['prazo','whatsapp'].includes(name);if(name==='valor'){input.min='0';input.step='0.01'}
 label.append(input);$('fields').append(label);
}
function reset(){editing=null;$('project').reset();$('project').elements.valor.value='0';$('project').elements.andamento.value='Recebido';$('project').elements.data_projeto.value=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});}
$('reset').onclick=reset;
$('project').onsubmit=async e=>{
 e.preventDefault();const f=e.target,data=Object.fromEntries(new FormData(f));
 data.email=data.email.trim().toLowerCase();data.pago_centavos=Math.round(Number(data.valor)*100);delete data.valor;
 if(!data.prazo)data.prazo=null;
 try{await request('/rest/v1/projetos_painel'+(editing?'?id=eq.'+editing:''),editing?'PATCH':'POST',data);reset();$('editor').open=false;await loadProjects();tell('Projeto salvo.')}catch(err){onError(err)}
};
async function allRows(path){
 const result=[];for(let offset=0;;offset+=500){const rows=await(await request(path+'&limit=500&offset='+offset)).json();result.push(...rows);if(rows.length<500)return result;}
}
async function loadProjects(){projects=await allRows('/rest/v1/projetos_painel?select=*&order=data_projeto.desc,id');render();}
function render(){
 const list=$('list');list.replaceChildren();
 if(!admin){
  const purchases=projects.filter(p=>p.checkout_id||p.pago_centavos>0);
  const section=element('section','');section.append(element('h2','Minhas compras'));
  if(!purchases.length)section.append(element('p','Suas compras aparecerão aqui após a confirmação do pagamento.'));
  for(const p of purchases){
   const link=element('a',p.pacote+' · '+p.obra);link.href='#obra-'+p.id;
   link.onclick=()=>{const detail=document.getElementById('obra-'+p.id)?.querySelector('details');if(detail)detail.open=true};
   const line=element('p','');line.append(link,document.createTextNode(' · Pago '+money(p.pago_centavos)));section.append(line);
  }
  list.append(section,element('h2','Meus projetos e orçamentos'));
 }
 const term=$('search').value.trim().toLocaleLowerCase();
 const rows=projects.filter(p=>[p.obra,p.autor,p.email,p.whatsapp,p.pacote,p.andamento].join(' ').toLocaleLowerCase().includes(term));
 $('report').textContent=rows.length+' projeto(s) · Total pago '+money(rows.reduce((s,p)=>s+p.pago_centavos,0));
 if(!rows.length)list.append(element('p','Nenhum projeto encontrado.'));
 for(const p of rows){
  const card=document.createElement('article');card.id='obra-'+p.id;card.append(element('h2',p.obra),element('p',p.autor+' · '+p.pacote+' · '+p.andamento),element('p','Início '+p.data_projeto.split('-').reverse().join('/')+(p.prazo?' · Prazo '+p.prazo.split('-').reverse().join('/'):'')+' · Pago '+money(p.pago_centavos)),element('p',[p.email,p.whatsapp].filter(Boolean).join(' · ')));
  if(admin){const edit=element('button','Editar projeto');edit.onclick=()=>{editing=p.id;for(const [name] of fields)$('project').elements[name].value=name==='valor'?p.pago_centavos/100:p[name]||'';$('editor').open=true;$('editor').scrollIntoView()};card.append(edit)}
  const box=document.createElement('details');box.append(element('summary','Etapas, arquivos e orientações da obra'));const content=document.createElement('div');box.append(content);box.ontoggle=()=>{if(box.open)details(p,content).catch(onError)};card.append(box);list.append(card);
 }
}
$('search').oninput=render;
async function details(p,content){
 const notes=await allRows('/rest/v1/relato_projeto?select=texto,criado_em&projeto_id=eq.'+p.id+'&order=criado_em,id');
 const files=[];for(let offset=0;;offset+=100){const batch=await(await request('/storage/v1/object/list/originais-worges','POST',{prefix:p.id,limit:100,offset,sortBy:{column:'name',order:'asc'}})).json();files.push(...batch);if(batch.length<100)break;}
 const history=await allRows('/rest/v1/historico_projeto?select=andamento,registrado_em&projeto_id=eq.'+p.id+'&order=registrado_em,id');
 content.replaceChildren(element('h3','Histórico de etapas'));
 const timeline=document.createElement('ol');
 for(const event of history)timeline.append(element('li',new Date(event.registrado_em).toLocaleString('pt-BR')+' · '+event.andamento));
 content.append(timeline,element('h3','Arquivos para download'));
 for(const file of files){const name=file.name.replace(/^[0-9a-f-]{36}_/,'');const b=element('button','Baixar '+name);b.onclick=async()=>{try{const r=await request('/storage/v1/object/authenticated/originais-worges/'+p.id+'/'+encodeURIComponent(file.name));const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}catch(err){onError(err)}};const row=document.createElement('p');row.append(b);content.append(row);}
 if(!files.length)content.append(element('p','Nenhum arquivo enviado.'));
 content.append(element('p','Envie o original final em Word ou PDF em até um ano após a contratação. Você também pode anexar a capa. Depois de enviar o original final, entregue o questionário editorial em até dois dias.'));
 if((p.checkout_id||p.pago_centavos>0)&&!admin){
 const pack=p.pacote.split(' ')[0];
 if(['Bronze','Prata','Ouro'].includes(pack)){const ficha=element('a','Preencher ficha editorial desta obra');ficha.href='/ficha.html?pacote='+encodeURIComponent(pack)+'&projeto='+encodeURIComponent(p.id);content.append(ficha)}
 }
 const upload=element('label','Anexar original, capa ou questionário preenchido');const input=document.createElement('input');input.type='file';input.multiple=true;upload.append(input);content.append(upload);
 input.onchange=async()=>{input.disabled=true;try{for(const file of input.files){const clean=file.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'_');await request('/storage/v1/object/originais-worges/'+p.id+'/'+crypto.randomUUID()+'_'+clean,'POST',file,true,{'Content-Type':file.type||'application/octet-stream'});}tell('Arquivos enviados.')}catch(err){onError(err)}finally{input.disabled=false;details(p,content).catch(onError)}};
 content.append(element('h3','Orientações e informações da obra'));
 for(const n of notes)content.append(element('p',new Date(n.criado_em).toLocaleString('pt-BR')+' · '+n.texto));
 const form=document.createElement('form'),label=element('label','Adicionar orientação ou completar o questionário editorial'),area=document.createElement('textarea');area.required=true;area.maxLength=16000;label.append(area);const save=element('button','Registrar orientação');form.append(label,save);content.append(form);
 form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await request('/rest/v1/relato_projeto','POST',{projeto_id:p.id,texto:area.value.trim()});await details(p,content);tell('Orientação registrada.')}catch(err){onError(err);save.disabled=false}};
}
async function openDesk(){
 const user=await(await request('/auth/v1/user')).json();
 const comprar=new URLSearchParams(location.search).get('comprar');if(!admin&&['Bronze','Prata','Ouro'].includes(comprar)){location.replace('/pedido.html?pacote='+comprar);return}
 $('auth').hidden=true;$('desk').hidden=false;
 if(admin&&user.app_metadata?.worges_role!=='admin'){tell('Seu acesso administrativo precisa ser habilitado pela Worges.');$('search').parentElement.hidden=true;return}
 $('manager').hidden=!admin;reset();tell('');await loadProjects();
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
   await request('/auth/v1/user','PUT',{password:form.elements.nova.value},false,{Authorization:'Bearer '+token});
   form.remove();$('login').hidden=false;tell('Senha atualizada. Entre com o e-mail e a nova senha.');
  }catch{tell('Não foi possível atualizar a senha. Solicite outro link de recuperação.');form.remove();$('login').hidden=false}
 };
}
async function startDesk(){
 offerRecovery();
 const resend=element('button','Reenviar e-mail de confirmação');resend.type='button';$('login').append(resend);
 resend.onclick=async()=>{
  const email=$('login').elements.email;if(!email.reportValidity())return;
  resend.disabled=true;
  try{await request('/auth/v1/resend?redirect_to='+encodeURIComponent(location.origin+'/gestao.html'),'POST',{type:'signup',email:email.value.trim()});tell('Se houver confirmação pendente, confira a caixa de entrada e o spam.')}catch(err){onError(err)}finally{resend.disabled=false}
 };
 const fragment=new URLSearchParams(location.hash.slice(1));
 if(fragment.get('type')==='signup'&&!fragment.has('error')){history.replaceState(null,'',location.pathname+location.search);tell('E-mail confirmado. Entre com seu e-mail e senha.');}
 if(fragment.has('error')||fragment.get('type')==='recovery'){
  history.replaceState(null,'',location.pathname+location.search);
  session=null;sessionStorage.removeItem('worges-login');
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
 const config=await(await request('/auth/v1/settings')).json();
 if(config.external?.google){
  const google=element('button','Continuar com Google');google.type='button';
  google.onclick=()=>googleLogin().catch(onError);$('auth').prepend(google);
 }
}
startDesk().catch(onError);
