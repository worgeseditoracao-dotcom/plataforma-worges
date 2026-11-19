const ui = Object.fromEntries(['title','faixa','coupon','apply','total','contact','email','finish','status'].map(id=>[id,document.getElementById(id)]));
const pacote = new URLSearchParams(location.search).get('pacote');
const endpoint = 'https://rraitizanntzdurqdqkm.supabase.co/functions/v1/worges-checkout';
let id = crypto.randomUUID(), version = 0, test = false;
async function send(acao){
 const r = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({acao,pacote,faixa:Number(ui.faixa.value),cupom:ui.coupon.value,email:ui.email.value,id})});
 const data=await r.json();
 if(!r.ok)throw new Error(data.error||'Serviço indisponível.');
 return data;
}
async function quote(){
 const n=++version;
 ui.finish.disabled=true;
 try{
  const data=await send('consultar');
  if(n!==version)return;
  if(ui.faixa.value==='300' && data.faixa!==300){ui.total.textContent='—';ui.status.textContent='A contratação para 151 a 300 páginas aguarda ativação.';return}
  test=data.teste;
  ui.total.textContent=(data.total/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  ui.contact.hidden=test;
  ui.finish.textContent=test?'Concluir teste gratuito':'Continuar para pagamento';
  ui.status.textContent=test?'Simulação sem cobrança e sem contratação.':'';
  ui.finish.disabled=false;
 }catch(e){if(n===version){ui.total.textContent='—';ui.status.textContent=e.message;}}
}
ui.title.textContent='Pacote '+(pacote||'não selecionado');
ui.coupon.oninput=()=>{version++;id=crypto.randomUUID();ui.finish.disabled=true;ui.total.textContent='—';ui.status.textContent='Aplique o cupom para recalcular.'};
ui.email.oninput=()=>{id=crypto.randomUUID()};
ui.faixa.onchange=()=>{id=crypto.randomUUID();quote()};
ui.apply.onclick=quote;
ui.finish.onclick=async()=>{
 if(!test&&(!ui.email.value||!ui.email.reportValidity())){ui.email.focus();return}
 ui.finish.disabled=true;ui.faixa.disabled=true;ui.apply.disabled=true;ui.coupon.disabled=true;ui.email.disabled=true;
 try{const data=await send('confirmar');if(data.url){location.assign(data.url);return}ui.status.textContent='Teste concluído. Total R$ 0,00. Nenhum pagamento realizado.';}
 catch(e){ui.status.textContent=e.message;ui.finish.disabled=false;ui.faixa.disabled=false;ui.apply.disabled=false;ui.coupon.disabled=false;ui.email.disabled=false}
};
quote();
