const form=document.querySelector('#briefing');
const fld=form.elements;
const pack=new URLSearchParams(location.search).get('pacote');
const rates={Bronze:30900,Prata:33990,Ouro:49990};
const projeto=new URLSearchParams(location.search).get('projeto');
const draftKey='worges-ficha-'+projeto;
const brl=n=>(n/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const inputs=[
 ['titulo','Título da obra (pode ser provisório)'],['responsavel','Nome do responsável pelo pedido'],
 ['autores','Autores, na ordem dos créditos (um por linha)','textarea'],['organizadores','Organizadores, se houver (um por linha)','textarea'],
 ['email','E-mail do responsável','email'],['confirmacao','Confirme o e-mail','email'],['telefone','WhatsApp com DDD','tel'],
 ['envio','Quando pretende enviar a obra final?',['Vou enviar a obra agora','Vou enviar a obra depois']],['previsao','Previsão de envio (aproximada e opcional)','date'],['motivo','Motivo ou observações (opcional)','textarea'],
 ['formato','Formato do livro',['Digital','Digital e físico']],['tamanho','Tamanho do livro físico',['A definir','14 × 21 cm','16 × 23 cm','Outro (descreva nas observações)']],
 ['orelhas','Orelhas da capa física',['A definir','Com orelhas','Sem orelhas']],['cores','Cores desejadas'],['capa','Ideia de capa e referências visuais','textarea'],
 ['doi','Deseja DOI?',['Não','Sim, incluir no orçamento']],['abnt','Deseja normalização ABNT?',['Não','Sim, incluir no orçamento']],
 ['repasse','Orientações ou dúvidas sobre repasse (opcional)','textarea'],['extras','Informações adicionais','textarea']
];
const entregas={"Bronze": ["Diagramação digital — organização do texto e das páginas no PDF do e-book.", "Duas propostas de capa para escolha.", "ISBN digital para identificar a edição do e-book.", "Ficha catalográfica com os dados bibliográficos da obra.", "Conselho editorial."], "Prata": ["Diagramação do e-book e preparação do PDF para impressão.", "Duas propostas de capa e capa física com orelhas.", "ISBN para as edições digital e física.", "Ficha catalográfica e conselho editorial.", "QR Code e código de barras para a edição física."], "Ouro": ["Todos os itens do Prata, incluindo os arquivos para impressão.", "Revisão ortográfica e gramatical do texto.", "E-book para Amazon Kindle em EPUB refluível: o texto se adapta à tela e ao tamanho de letra escolhido pelo leitor.", "O serviço Kindle inclui a versão digital. A adaptação específica para o livro impresso na Amazon KDP é opcional e custa R$ 49,90 por obra."]};
for(const texto of entregas[pack]||[]){const li=document.createElement('li');li.textContent=texto;document.querySelector('#itens').append(li)}
const sections={titulo:'Obra e autoria',email:'Contato do responsável',envio:'Entrega do original',formato:'Formato e capa',doi:'Serviços e orientações'};
let group;
for(const [name,title,type] of inputs){
 if(sections[name]){
  group=document.createElement('section');const heading=document.createElement('h3');
  heading.textContent=sections[name];group.append(heading);document.querySelector('#perguntas').append(group);
 }
 const label=document.createElement('label');label.textContent=title;
 const input=document.createElement(Array.isArray(type)?'select':type==='textarea'?'textarea':'input');input.name=name;
 if(Array.isArray(type)) for(const value of type)input.add(new Option(value,value));else if(type&&type!=='textarea')input.type=type;
 input.required=['titulo','responsavel','email','confirmacao','telefone'].includes(name);
 input.maxLength=type==='textarea'?1200:240;
 if(name==='telefone')input.pattern='[+0-9\\s\\(\\)\\-]{8,25}';
 label.append(input);group.append(label);
}
let draft;try{draft=JSON.parse(sessionStorage.getItem(draftKey))}catch{}
if(draft)for(const [name] of inputs)fld[name].value=draft[name]??fld[name].value;
const faixa=document.querySelector('#faixa');if(draft)faixa.value=draft.faixa;
fld.motivo.placeholder='Por exemplo: estou revisando o texto ou aguardando a aprovação dos coautores.';
const regras='Você tem até um ano após a contratação para enviar a obra final em Word, PDF ou ambos. Pode anexar sua capa ou proposta de capa. Envie o questionário editorial preenchido em até dois dias após entregar a obra final. A edição publicada pela Worges recebe novo ISBN registrado pela editora, mesmo que uma edição anterior já tenha ISBN.';
const aviso=document.createElement('p');aviso.textContent=regras;fld.envio.closest('section').append(aviso);
function entrega(){for(const name of ['previsao','motivo'])fld[name].parentElement.hidden=fld.envio.selectedIndex!==1;}
entrega();fld.envio.addEventListener('change',entrega);
const physical=()=>{for(const n of ['tamanho','orelhas'])fld[n].parentElement.hidden=fld.formato.value==='Digital'};
physical();fld.formato.onchange=physical;
function calcular(){
 const paginas=faixa.value==='300'?2990:0;
 const kdp=fld.kdp?.selectedIndex===1?4990:0;
 const linhas=['Pacote com 40% de desconto: '+brl(rates[pack]),'Acréscimo por páginas: '+brl(paginas)];
 if(pack==='Ouro')linhas.push('Adaptação para impresso Amazon KDP: '+brl(kdp));
 linhas.push('Subtotal: '+brl(rates[pack]+paginas+kdp));
 document.querySelector('#memoria').textContent=linhas.join('\n');return linhas;
}
if(Object.hasOwn(rates,pack)){calcular();faixa.addEventListener('change',calcular);fld.kdp?.addEventListener('change',calcular)}
function save(){const data=Object.fromEntries(new FormData(form));data.faixa=faixa.value;data.id=draft?.id||crypto.randomUUID();draft=data;sessionStorage.setItem(draftKey,JSON.stringify(data));document.querySelector('#revisao').hidden=true;}
form.addEventListener('input',save);faixa.addEventListener('change',save);
form.onsubmit=e=>{
 e.preventDefault();if(!Object.hasOwn(rates,pack))return;
 if(fld.email.value.trim().toLowerCase()!==fld.confirmacao.value.trim().toLowerCase()){fld.confirmacao.setCustomValidity('Os e-mails precisam ser iguais.');fld.confirmacao.reportValidity();fld.confirmacao.setCustomValidity('');return}
 if(!fld.autores.value.trim()&&!fld.organizadores.value.trim()){fld.autores.setCustomValidity('Informe ao menos um autor ou organizador.');fld.autores.reportValidity();fld.autores.setCustomValidity('');return}
 save();const resumo=['Ficha editorial · Pacote '+pack,...inputs.filter(([n])=>n!=='confirmacao'&&!fld[n].parentElement.hidden&&fld[n].value).map(([n,t])=>t+': '+fld[n].value)];
 resumo.push(regras);
 if(fld.doi.selectedIndex||fld.abnt.selectedIndex)resumo.push('Adicionais sujeitos a orçamento da equipe.');
 document.querySelector('#resumo').textContent=resumo.join('\n');
 
 document.querySelector('#revisao').hidden=false;document.querySelector('#revisao').scrollIntoView();
};

document.querySelector('#enviarFicha').onclick=async e=>{
 const session=JSON.parse(sessionStorage.getItem('worges-login')||'null');
 if(!session){location.assign('/cliente');return}
 const b=e.currentTarget;b.disabled=true;
 try{
 const r=await fetch('https://rraitizanntzdurqdqkm.supabase.co/rest/v1/relato_projeto',{method:'POST',headers:{apikey:'sb_publishable_VvOy5B3haLBPS7sIyfZ9gg_bHiBRbiy',Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({projeto_id:projeto,texto:document.querySelector('#resumo').textContent})});
 if(!r.ok)throw Error();sessionStorage.removeItem(draftKey);location.assign('/cliente');
 }catch{b.disabled=false;document.querySelector('#fichaStatus').textContent='Confira sua sessão na área do autor e tente novamente.'}
};
