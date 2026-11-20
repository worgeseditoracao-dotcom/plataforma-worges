const entregas={"Bronze": ["Diagramação digital — organização do texto e das páginas no PDF do e-book.", "Duas propostas de capa para escolha.", "ISBN digital para identificar a edição do e-book.", "Ficha catalográfica com os dados bibliográficos da obra.", "Conselho editorial."], "Prata": ["Diagramação do e-book e preparação do PDF para impressão.", "Duas propostas de capa e capa física com orelhas.", "ISBN para as edições digital e física.", "Ficha catalográfica e conselho editorial.", "QR Code e código de barras para a edição física."], "Ouro": ["Todos os itens do Prata, incluindo os arquivos para impressão.", "Revisão ortográfica e gramatical do texto.", "E-book para Amazon Kindle em EPUB refluível: o texto se adapta à tela e ao tamanho de letra escolhido pelo leitor.", "O serviço Kindle inclui a versão digital. A adaptação específica para o livro impresso na Amazon KDP é opcional e custa R$ 49,90 por obra."]};
const pack=new URLSearchParams(location.search).get('pacote');
const rates={Bronze:30900,Prata:33990,Ouro:49990};
const el=id=>document.getElementById(id);
const dinheiro=n=>(n/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
if(Object.hasOwn(rates,pack)){
 el('title').textContent='Pacote '+pack;
 for(const item of entregas[pack]){const li=document.createElement('li');li.textContent=item;el('itens').append(li)}
 el('opcaoKdp').hidden=pack!=='Ouro';
 const key='compra-worges-'+pack;
 const saved=JSON.parse(sessionStorage.getItem(key)||'{}');el('faixa').value=saved.faixa||'150';el('kdp').value=saved.kdp||'0';
 function atualizar(){
 const paginas=el('faixa').value==='300'?2990:0,kdp=pack==='Ouro'?Number(el('kdp').value):0;
 el('memoria').textContent=['Pacote com 40% de desconto: '+dinheiro(rates[pack]),'Acréscimo por páginas: '+dinheiro(paginas),...(pack==='Ouro'?['Adaptação para impresso Amazon KDP: '+dinheiro(kdp)]:[]),'Total: '+dinheiro(rates[pack]+paginas+kdp)].join('\n');
 sessionStorage.setItem(key,JSON.stringify({faixa:el('faixa').value,kdp:el('kdp').value}));
 }
 atualizar();el('faixa').onchange=el('kdp').onchange=atualizar;
 if(sessionStorage.getItem('worges-login')){el('comprar').disabled=true;el('comprar').textContent='Pagamento em ativação';el('compraStatus').textContent='A contratação online estará disponível após a liberação do termo e do pagamento.'}
 else el('comprar').onclick=()=>location.assign('/gestao.html?area=cliente&comprar='+encodeURIComponent(pack));
}else{el('comprar').disabled=true;el('title').textContent='Selecione um pacote na página de publicação.'}
