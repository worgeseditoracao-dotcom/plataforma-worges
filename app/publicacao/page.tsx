/* eslint-disable @next/next/no-html-link-for-pages */
const bookPackages = [
  { name:"Bronze", up150:"R$ 309,00", up300:"R$ 338,90", over300:"Sob análise", items:["Diagramação digital — organização do texto e das páginas no PDF do e-book.", "Duas propostas de capa para escolha.", "ISBN digital para identificar a edição do e-book.", "Ficha catalográfica com os dados bibliográficos da obra.", "Conselho editorial."] },
  { name:"Prata", up150:"R$ 339,90", up300:"R$ 369,80", over300:"R$ 429,90", items:["Diagramação do e-book e preparação do PDF para impressão.", "Duas propostas de capa e capa física com orelhas.", "ISBN para as edições digital e física.", "Ficha catalográfica e conselho editorial.", "QR Code e código de barras para a edição física."] },
  { name:"Ouro", up150:"R$ 499,90", up300:"R$ 529,80", over300:"R$ 629,90", items:["Todos os itens do Prata, incluindo os arquivos para impressão.", "Revisão ortográfica e gramatical do texto.", "E-book para Amazon Kindle em EPUB refluível: o texto se adapta à tela e ao tamanho de letra escolhido pelo leitor.", "O serviço Kindle inclui a versão digital. A adaptação específica para o livro impresso na Amazon KDP é opcional e custa R$ 49,90 por obra."] },
];

const coletaneas = [
  {
    "area": "Educação",
    "capa": "https://static.wixstatic.com/media/5e2166_c1bd75de9b464501b6d0fe149579fea1~mv2.png"
  },
  {
    "area": "Ciências Exatas e Engenharias",
    "capa": "https://static.wixstatic.com/media/5e2166_4aef7a6db7a242408b17ff630dfbff93~mv2.png"
  },
  {
    "area": "Linguística, Letras e Artes",
    "capa": "https://static.wixstatic.com/media/5e2166_901507b95c0d4806bb6826509f5bd85e~mv2.png"
  },
  {
    "area": "Saúde e Ciências Biológicas",
    "capa": "https://static.wixstatic.com/media/5e2166_3fa96dbd1dd945b7a748ff75159f0851~mv2.png"
  },
  {
    "area": "Ciências Sociais Aplicadas e Humanas",
    "capa": "https://static.wixstatic.com/media/5e2166_6ccbcad7da8844d79928f086de9b0f06~mv2.jpg"
  },
  {
    "area": "Ciências Agrárias",
    "capa": null
  }
];
const adicionais = [["🔗","DOI para livro ou capítulo"],["📐","Normalização ABNT"],["✍️","Revisão ortográfica e gramatical"],["📝","Copidesque"],["📱","E-book Kindle"],["📖","Arquivo impresso para Amazon KDP"]];

export default function PublicationPage(){
  return <main className="publication-page">
    <header className="site-header publication-header"><a className="selo-worges" href="/" aria-label="Worges Editoração · início"/><nav><a href="#livros">Livros</a><a href="#capitulos">Capítulos</a><a href="#academico">Autor Acadêmico</a><a href="#comparacao">Comparação</a></nav><a className="header-cta" href="/checkout">Contratar <span>↗</span></a></header>

    <section className="publication-hero"><p className="eyebrow">PACOTES E VALORES</p><h1>Escolha com clareza.<br/><em>Publique com segurança.</em></h1><p>Você pode escolher o pacote agora e entregar seu livro em Word ou PDF em até um ano após a contratação. A capa também pode ser anexada.</p><div className="hero-actions"><a className="button primary" href="#comparacao">Comparar pacotes →</a><a className="button secondary" href="#capitulos">Publicar capítulo →</a></div></section>

    
    <section className="package-section" id="livros"><div className="package-heading"><div><p className="eyebrow">PUBLICAÇÃO DE LIVROS</p><h2>Pacotes por quantidade de páginas</h2></div><p>Na contratação, o sistema identifica automaticamente os registros incluídos no pacote. Quando houver DOI, o número será gerado sem preenchimento manual.</p></div><div className="package-cards">{bookPackages.map((pkg,index)=><article className={`package-card ${index===1?"featured":""}`} key={pkg.name}><span>0{index+1}</span><h3>{pkg.name==="Ouro"?"🏅 Ouro · Destaque da Black":pkg.name}</h3><div className="package-prices"><p><small>Até 150 páginas</small><small>40% de desconto · de <del>{["R$ 515,00","R$ 566,50","R$ 833,17"][index]}</del> por</small><strong>{pkg.up150}</strong></p><p><small>151 a 300 páginas · inclui acréscimo único de R$ 29,90 por obra</small><strong>{pkg.up300}</strong></p><p><small>Acima de 300 páginas</small><strong>{pkg.over300}</strong></p></div><ul>{pkg.items.map(item=><li key={item}>✓ {item}</li>)}</ul><a href={`/pedido.html?pacote=${encodeURIComponent(pkg.name)}`}>Contratar este pacote →</a></article>)}</div></section>

    <section className="package-section"><h2>Serviços adicionais</h2><p>Escolha os serviços ao contratar. No Ouro, a revisão e o e-book Kindle já estão incluídos.</p><ul style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,230px),1fr))",gap:"1rem",padding:0,listStyle:"none"}}>{adicionais.map(([icone,nome])=><li key={nome}><span aria-hidden="true">{icone}</span> {nome}</li>)}</ul></section>
<section className="package-section chapter-packages" id="capitulos"><div className="package-heading"><div><p className="eyebrow">PUBLICAÇÃO DE CAPÍTULOS</p><h2>Envie seu capítulo para a coleção Perspectivas em Pesquisa</h2></div><p>Escolha a área do seu trabalho. O formulário da Worges aceita o capítulo em Word ou PDF.</p></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,190px),1fr))",gap:"1.25rem"}}>{coletaneas.map(({area,capa})=><article key={area} className="chapter-package-card">{capa && <img src={capa} alt={"Capa da coletânea de "+area} loading="lazy" style={{width:"100%",height:230,objectFit:"contain"}}/>}<h3>{area}</h3></article>)}</div><div className="chapter-package-grid"><article className="chapter-package-card"><h3>Publicação regular</h3><strong>R$ 179,90</strong><p>Prazo anunciado de 10 dias.</p><a className="button primary" href="https://www.worgeseditoracao.com/about-8">Submeter capítulo</a></article><article className="chapter-package-card"><h3>Publicação urgente</h3><strong>R$ 197,90</strong><p>Prazo anunciado de 2 dias.</p><a className="button primary" href="https://www.worgeseditoracao.com/about-8">Submeter com urgência</a></article><aside className="template-card"><p className="eyebrow">TEMPLATE GRATUITO</p><h3>Prepare seu capítulo no padrão editorial</h3><p>Baixe o arquivo editável com estrutura de título, autores, resumo, abstract, introdução, revisão de literatura, metodologia, resultados, considerações finais e referências.</p><a className="button secondary" href="/template-capitulo-worges.docx" download>Baixar template em Word ↓</a></aside></div></section>

    <section className="package-section academic-package" id="academico"><div><p className="eyebrow">AUTOR ACADÊMICO</p><h2>Combo Autor Acadêmico</h2><p>Ideal para TCC, dissertação, tese ou livro acadêmico com publicação editorial completa.</p><strong>R$ 629,90 <small>até 300 páginas</small></strong></div><ul><li>✓ Diagramação profissional e normalização ABNT</li><li>✓ Revisão ortográfica e gramatical</li><li>✓ Registro DOI e ISBN</li><li>✓ Ficha catalográfica (CIP), QR Code e conselho editorial</li><li>✓ Arquivo Kindle para Amazon KDP</li></ul><a className="button primary" href="/checkout?tipo=livro&pacote=Autor%20Acadêmico">Contratar pacote →</a></section>

    <section className="package-section comparison" id="comparacao"><div className="package-heading"><div><p className="eyebrow">COMPARAÇÃO</p><h2>Veja o que cada pacote possui</h2></div><p>Os valores ficam visíveis para todos. O formulário aparece somente quando o autor decide contratar.</p></div><div className="comparison-table"><table><thead><tr><th>Item</th><th>E-book</th><th>Essencial</th><th>Completo</th><th>Acadêmico</th><th>Capítulo</th></tr></thead><tbody><tr><td>Diagramação</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr><tr><td>ISBN</td><td>Digital</td><td>Digital ou impresso</td><td>Digital ou impresso</td><td>✓</td><td>Da coletânea</td></tr><tr><td>Ficha e conselho editorial</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr><tr><td>Revisão</td><td>—</td><td>—</td><td>✓</td><td>✓</td><td>Consultar a editora</td></tr><tr><td>DOI automático</td><td>Quando contratado</td><td>Quando incluído</td><td>Quando incluído</td><td>✓</td><td>Quando incluído</td></tr><tr><td>Download público</td><td colSpan={5}>Somente quando o autor autorizar durante a contratação</td></tr></tbody></table></div></section>

    <section className="publication-note"><strong>Entrega e registro da edição</strong><p>Ao enviar o original final, você tem até dois dias para entregar o questionário editorial preenchido. A edição Worges recebe um novo ISBN registrado pela editora. O ISBN de uma edição anterior permanece associado àquela edição.</p><strong>Publicação e privacidade</strong><p>A página pública da obra é criada automaticamente. O arquivo para download só aparece quando o autor marca essa autorização na contratação; caso contrário, apenas o perfil e as informações bibliográficas ficam visíveis.</p></section>
  </main>
}
