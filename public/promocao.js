(async () => {
  const campaigns = await fetch('/promocoes.json',{cache:'no-store'}).then(r=>r.json());
  const bar = document.getElementById('promoMes');
  function update(){
    const now = Date.now();
    const current = campaigns.find(c => Date.parse(c.inicio)<=now && now<Date.parse(c.fim));
    bar.hidden = !current;
    if (!current) return;
    const minutes = Math.ceil((Date.parse(current.fim)-now)/60000);
    bar.querySelector('strong').textContent = current.nome;
    bar.querySelector('span').textContent = current.oferta;
    bar.querySelector('small').textContent = 'Termina em '+Math.floor(minutes/1440)+'d '+Math.floor(minutes%1440/60)+'h '+minutes%60+'min';
  }
  update(); setInterval(update,15000);
})().catch(()=>{});
