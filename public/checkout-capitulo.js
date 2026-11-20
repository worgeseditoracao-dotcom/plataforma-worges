const form = document.querySelector('#submission');
const status = document.querySelector('#status');
const button = form.querySelector('button');
const format = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'});
let orderId;
let session;
try { session = JSON.parse(sessionStorage.getItem('worges-login') || 'null'); } catch { session = null; }
if (session?.access_token) document.querySelector('#account').hidden = true;

if (new URLSearchParams(location.search).get('modalidade') === 'urgente') {
 form.elements.modalidade.value = 'urgente';
 document.querySelector('#total').textContent = format.format(197.90);
}
form.addEventListener('change', () => {
 orderId = undefined;
 const {modalidade, abnt, revisao} = form.elements;
 const base = modalidade.value === 'urgente' ? 19790 : 17990;
 document.querySelector('#total').textContent = format.format((base + 3990 * (Number(abnt.checked) + Number(revisao.checked))) / 100);
});

form.addEventListener('submit', async event => {
 event.preventDefault();
 if (!session?.access_token) {
  status.textContent = 'Entre na Área do Autor antes de continuar.';
  document.querySelector('#account a').focus();
  return;
 }
 const data = new FormData(form);
 if (data.get('arquivo').size > 10485760) {
  status.textContent = 'O arquivo deve ter até 10 MB.';
  return;
 }
 orderId ||= crypto.randomUUID();
 data.append('id', orderId);
 button.disabled = true;
 status.textContent = 'Registrando o capítulo e preparando o pagamento…';
 try {
  const response = await fetch('https://rraitizanntzdurqdqkm.supabase.co/functions/v1/checkout-capitulo',{
   method:'POST',headers:{Authorization:'Bearer '+session.access_token},body:data
  });
  const result = await response.json();
  if (response.status === 401) document.querySelector('#account').hidden = false;
  if (!response.ok || !result.url) throw new Error(result.error || 'Pagamento indisponível.');
  location.assign(result.url);
 } catch (error) {
  status.textContent = error.message;
  button.disabled = false;
 }
});