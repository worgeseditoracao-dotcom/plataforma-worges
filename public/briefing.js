const form=document.querySelector('#briefing');
const fld=form.elements;
const pack=new URLSearchParams(location.search).get('pacote');
const rates={Bronze:30900,Prata:33990,Ouro:49990};
const draftKey='worges-questionario-'+pack;
const brl=n=>(n/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const inputs=[
 ['titulo','Título da obra (pode ser provisório)'],['responsavel','Nome do responsável pelo pedido'],
 ['autores','Autores, na ordem dos créditos (um por linha)','textarea'],['organizadores','Organizadores, se houver (um por linha)','textarea'],
 ['email','E-mail do responsável','email'],['confirmacao','Confirme o e-mail','email'],['telefone','WhatsApp com DDD','tel'],
 ['formato','Formato do livro',['Digital','Digital e físico']],['tamanho','Tamanho do livro físico',['A definir','14 × 21 cm','16 × 23 cm','Outro (descreva nas observações)']],
 ['orelhas','Orelhas da capa física',['A definir','Com orelhas','Sem orelhas']],['cores','Cores desejadas'],['capa','Ideia de capa e referências visuais','textarea'],
 ['doi','Deseja DOI?',['Não','Sim, incluir no orçamento']],['abnt','Deseja normalização ABNT?',['Não','Sim, incluir no orçamento']],
 ['repasse','Orientações ou dúvidas sobre repasse (opcional)','textarea'],['extras','Informações adicionais','textarea']
];
for(const [name,title,type] of inputs){
 const label=document.createElement('label');label.textContent=title;
 const input=document.createElement(Array.isArray(type)?'select':type==='textarea'?'textarea':'input');input.name=name;
 if(Array.isArray(type)) for(const value of type)input.add(new Option(value,value));else if(type&&type!=='textarea')input.type=type;
 input.required=['titulo','responsavel','email','confirmacao','telefone'].includes(name);
 input.maxLength=type==='textarea'?1200:240;
 if(name==='telefone')input.pattern='[+0-9\\s\\(\\)\\-]{8,25}';
 label.append(input);document.querySelector('#perguntas').append(label);
}
let draft;try{draft=JSON.parse(sessionStorage.getItem(draftKey))}catch{}
if(draft)for(const [name] of inputs)fld[name].value=draft[name]??fld[name].value;
const faixa=document.querySelector('#faixa');if(draft)faixa.value=draft.faixa;
const physical=()=>{for(const n of ['tamanho','orelhas'])fld[n].parentElement.hidden=fld.formato.value==='Digital'};
physical();fld.formato.onchange=physical;
function save(){const data=Object.fromEntries(new FormData(form));data.faixa=faixa.value;data.id=draft?.id||crypto.randomUUID();draft=data;sessionStorage.setItem(draftKey,JSON.stringify(data));document.querySelector('#revisao').hidden=true;}
form.addEventListener('input',save);faixa.addEventListener('change',save);
form.onsubmit=e=>{
 e.preventDefault();if(!Object.hasOwn(rates,pack))return;
 if(fld.email.value.trim().toLowerCase()!==fld.confirmacao.value.trim().toLowerCase()){fld.confirmacao.setCustomValidity('Os e-mails precisam ser iguais.');fld.confirmacao.reportValidity();fld.confirmacao.setCustomValidity('');return}
 if(!fld.autores.value.trim()&&!fld.organizadores.value.trim()){fld.autores.setCustomValidity('Informe ao menos um autor ou organizador.');fld.autores.reportValidity();fld.autores.setCustomValidity('');return}
 save();const resumo=['Pacote '+pack+' · até '+faixa.value+' páginas','Preço do pacote: '+brl(rates[pack]+(faixa.value==='300'?2990:0)),...inputs.filter(([n])=>n!=='confirmacao'&&!fld[n].parentElement.hidden&&fld[n].value).map(([n,t])=>t+': '+fld[n].value)];
 if(fld.doi.selectedIndex||fld.abnt.selectedIndex)resumo.push('Adicionais sujeitos a orçamento da equipe.');
 document.querySelector('#resumo').textContent=resumo.join('\n');
 sessionStorage.setItem('worges-orcamento',JSON.stringify({referencia:draft.id,titulo:draft.titulo,responsavel:draft.responsavel,telefone:draft.telefone,modalidade:pack,ficha:resumo.join('\n'),email:draft.email.trim().toLowerCase()}));
 document.querySelector('#revisao').hidden=false;document.querySelector('#revisao').scrollIntoView();
};
