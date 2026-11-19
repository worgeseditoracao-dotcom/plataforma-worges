import {createClient} from 'npm:@supabase/supabase-js@2';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const prices=new Map([['Bronze',30900],['Prata',33990],['Ouro',49990]]);
const end='2026-12-01T02:59:59Z';
const base='https://api.checkout.infinitepay.io/';
const handle='worges_2723bank';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,apikey,authorization','Cache-Control':'no-store'};
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers});
async function provider(path:string,payload:unknown){
 const key=Deno.env.get('INFINITEPAY_API_KEY');
 if(!key)throw Error('config');
 const res=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','X-Api-Key':key},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
 if(!res.ok)throw Error('provider');
 return await res.json();
}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Use POST.'},405);
 try{
 const b=await req.json();
 if(new URL(req.url).searchParams.has('webhook')){
 const {data:o,error}=await db.from('checkout_infinitepay').select('*').eq('id',b.order_nsu).single();
 if(error||!o||o.teste||!b.transaction_nsu||!b.invoice_slug)return reply({error:'Referência inválida'},400);
 const v=await provider('payment_check',{handle,order_nsu:o.id,transaction_nsu:b.transaction_nsu,slug:b.invoice_slug});
 if(v.success!==true||v.paid!==true||v.amount!==o.valor)return reply({error:'Pagamento não confirmado'},400);
 if(o.transacao===b.transaction_nsu)return reply({success:true});
 const {data,error:e}=await db.from('checkout_infinitepay').update({transacao:b.transaction_nsu,pago_em:new Date().toISOString()}).eq('id',o.id).is('transacao',null).select('id');
 if(e||!data?.length)return reply({error:'Conferir transação'},409);
 return reply({success:true});
 }
 const price=prices.get(b.pacote);
 if(!price||Date.now()>Date.parse(end))return reply({error:'Oferta indisponível.'},400);
 const coupon=String(b.cupom||'').trim().toUpperCase();
 let total=price,test=false;
 if(coupon){
 const {data:c,error}=await db.from('cupons_worges').select('*').eq('codigo',coupon).gt('valido_ate',new Date().toISOString()).maybeSingle();
 if(error)throw error;
 if(!c)return reply({error:'Cupom inválido ou vencido.'},400);
 total=Math.round(price*(100-c.percentual)/100);test=c.teste;
 }
 if(b.acao==='consultar')return reply({total,teste:test});
 if(b.acao!=='confirmar'||!/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(b.id))return reply({error:'Pedido inválido.'},400);
 if(!test&&!Deno.env.get('INFINITEPAY_API_KEY'))return reply({error:'Pagamento em ativação. Nenhuma cobrança foi iniciada.'},503);
 if(test&&total!==0||!test&&total<100)return reply({error:'Valor indisponível.'},400);
 const email=test?null:String(b.email||'').trim().toLowerCase();
 if(!test&&(!email||email.length>254||!/^\S+@\S+\.\S+$/.test(email)))return reply({error:'Informe um e-mail válido.'},400);
 const {error:e}=await db.from('checkout_infinitepay').upsert({id:b.id,pacote:b.pacote,valor:total,email,cupom:coupon||null,teste:test},{onConflict:'id',ignoreDuplicates:true});
 if(e)throw e;
 const {data:o,error:read}=await db.from('checkout_infinitepay').select('*').eq('id',b.id).single();
 if(read||!o)throw Error('db');
 if(o.valor!==total||o.pacote!==b.pacote||o.email!==email||o.cupom!==(coupon||null)||o.teste!==test||o.pago_em)return reply({error:'Inicie outro pedido.'},409);
 if(test)return reply({teste:true,total,id:o.id});
 if(o.link)return reply({url:o.link});
 const link=await provider('links',{handle,order_nsu:o.id,customer:{email},items:[{description:'Worges · Pacote '+o.pacote,quantity:1,price:total}],webhook_url:Deno.env.get('SUPABASE_URL')+'/functions/v1/worges-checkout?webhook=1',options:{assured_installments:5,single_payment:true,valid_until:end,payment_methods_enabled:['credit_card','pix']}});
 const url=new URL(link.url);
 if(url.protocol!=='https:'||!/(^|\.)infinitepay\.io$/.test(url.hostname))throw Error('url');
 const {error:save}=await db.from('checkout_infinitepay').update({link:url.href}).eq('id',o.id);
 if(save)throw save;
 return reply({url:url.href});
 }catch{return reply({error:'Não foi possível concluir. Tente novamente.'},503)}
});