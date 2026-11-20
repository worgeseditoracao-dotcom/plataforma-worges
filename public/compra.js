const entregas={"Bronze": ["Diagramação digital — organização do texto e das páginas no PDF do e-book.", "Duas propostas de capa para escolha.", "ISBN digital para identificar a edição do e-book.", "Ficha catalográfica com os dados bibliográficos da obra.", "Conselho editorial."], "Prata": ["Diagramação do e-book e preparação do PDF para impressão.", "Duas propostas de capa e capa física com orelhas.", "ISBN para as edições digital e física.", "Ficha catalográfica e conselho editorial.", "QR Code e código de barras para a edição física."], "Ouro": ["Todos os itens do Prata, incluindo os arquivos para impressão.", "Revisão ortográfica e gramatical do texto.", "E-book para Amazon Kindle em EPUB refluível: o texto se adapta à tela e ao tamanho de letra escolhido pelo leitor.", "O serviço Kindle inclui a versão digital. A adaptação específica para o livro impresso na Amazon KDP é opcional e custa R$ 49,90 por obra."]};
const pack=new URLSearchParams(location.search).get('pacote');
const rates={Bronze:30900,Prata:33990,Ouro:49990};
const el=id=>document.getElementById(id);
const dinheiro=n=>(n/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
if(Object.hasOwn(rates,pack)){
 el('title').textContent='Pacote '+pack;
 for(const item of entregas[pack]){const li=document.createElement('li');li.textContent=item;el('itens').append(li)}
 const key='compra-worges-'+pack;
 const saved=JSON.parse(sessionStorage.getItem(key)||'{}');
 const ouro=pack==='Ouro';
 const extras=[
  ['doi','Registro DOI via Crossref',4000,'Identificador permanente da obra. A Worges aceita até 10 pessoas nos créditos de cada registro.'],
  ['abnt','Normalização ABNT',12990,'Padronização da apresentação do texto, das citações e das referências.'],
  ['revisao','Revisão ortográfica e gramatical',ouro?0:12000,'Correção de ortografia, pontuação e concordância.'],
  ['copidesque','Copidesque',18990,'Preparação de texto com ajustes de clareza, fluidez e coerência. Valor único por obra.']
 ];
 for(const [id,nome,valor,descricao] of extras){
  if(valor===0)continue;
  const label=document.createElement('label'),box=document.createElement('input');
  box.type='checkbox';box.id=id;box.style.width='auto';box.style.marginRight='8px';
  box.checked=valor===0||Boolean(saved[id]);box.disabled=valor===0;
  label.append(box,nome+' · '+(valor?dinheiro(valor):'Incluído no Ouro'));
  const note=document.createElement('p');note.textContent=descricao;el('extras').append(label,note);
 }
 const formatos=ouro?[['0','E-book Kindle incluído',0],['4990','E-book incluído + adaptação para impresso',4990]]:
 [['0','Sem arquivos Amazon KDP',0],['ebook','Somente e-book Kindle',9990],['fisico','Somente arquivo para livro físico',9990],['ambos','E-book + arquivo físico (economia de R$ 39,90)',15990]];
 for(const [id,nome,valor] of formatos)el('kdp').add(new Option(nome+(valor?' · '+dinheiro(valor):''),id));
 el('faixa').value=saved.faixa==='300'?'300':'150';el('kdp').value=formatos.some(f=>f[0]===saved.kdp)?saved.kdp:'0';
 function atualizar(){
  const paginas=el('faixa').value==='300'?2990:0;
  const formato=formatos.find(f=>f[0]===el('kdp').value);
  const selecao={faixa:el('faixa').value,kdp:formato[0]};
  const linhas=['Pacote com 40% de desconto: '+dinheiro(rates[pack]),'Acréscimo por páginas: '+dinheiro(paginas)];
  let total=rates[pack]+paginas+formato[2];
  for(const [id,nome,valor] of extras){if(!valor)continue;selecao[id]=el(id).checked;if(selecao[id]&&valor){linhas.push(nome+': '+dinheiro(valor));total+=valor}}
  if(formato[2])linhas.push(formato[1]+': '+dinheiro(formato[2]));
  el('memoria').textContent=[...linhas,'Total: '+dinheiro(total)].join('\n');
  sessionStorage.setItem(key,JSON.stringify(selecao));
 }
 atualizar();el('faixa').onchange=el('adicionais').onchange=atualizar;
 if(sessionStorage.getItem('worges-login')){el('comprar').disabled=true;el('comprar').textContent='Pagamento em ativação';el('compraStatus').textContent='A contratação online estará disponível após a liberação do termo e do pagamento.'}
 else el('comprar').onclick=()=>location.assign('/gestao.html?area=cliente&comprar='+encodeURIComponent(pack));
}else{el('comprar').disabled=true;el('title').textContent='Selecione um pacote na página de publicação.'}
