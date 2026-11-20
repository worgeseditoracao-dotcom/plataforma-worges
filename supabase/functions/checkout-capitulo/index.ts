import {createClient} from 'npm:@supabase/supabase-js@2';

const host = Deno.env.get('SUPABASE_URL')!;
const db = createClient(host,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const areas = new Set(["Educação","Ciências Exatas e Engenharias","Linguística, Letras e Artes","Saúde e Ciências Biológicas","Ciências Sociais Aplicadas e Humanas","Ciências Agrárias"]);
const prices = new Map([['regular',17990],['urgente',19790]]);
const files = db.storage.from('originais-coletaneas');
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type,apikey','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const reply = (data:unknown,status=200) => Response.json(data,{status,headers});
const validId = (id:unknown) => typeof id==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

async function provider(path:string,payload:unknown) {
 const key=Deno.env.get('INFINITEPAY_API_KEY');
 const response=await fetch('https://api.checkout.infinitepay.io/'+path,{
  method:'POST',headers:{'Content-Type':'application/json',...(key?{'X-Api-Key':key}:{})},
  body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)
 });
 if(!response.ok)throw Error('InfinitePay');
 return response.json();
}

async function confirmPayment(req:Request) {
 const body=await req.json();
 if(!validId(body.order_nsu)||typeof body.transaction_nsu!=='string'||typeof body.invoice_slug!=='string')return reply({error:'Referência inválida.'},400);
 const {data:order,error}=await db.from('pedidos_capitulo').select('id,valor,transacao').eq('id',body.order_nsu).maybeSingle();
 if(error)throw error;
 if(!order)return reply({error:'Pedido não encontrado.'},404);
 if(order.transacao===body.transaction_nsu)return reply({success:true});
 const check=await provider('payment_check',{handle:'worges_2723bank',order_nsu:order.id,transaction_nsu:body.transaction_nsu,slug:body.invoice_slug});
 if(check.success!==true||check.paid!==true||check.amount!==order.valor)return reply({error:'Pagamento não confirmado.'},400);
 const {error:save}=await db.from('pedidos_capitulo').update({transacao:body.transaction_nsu,pago_em:new Date().toISOString()}).eq('id',order.id).is('transacao',null);
 if(save)throw save;
 return reply({success:true});
}

async function createOrder(req:Request) {
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return reply({error:'Entre na Área do Autor para pagar.'},401);
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user?.email)return reply({error:'Sua sessão expirou. Entre novamente.'},401);
 if(Number(req.headers.get('content-length'))>11*1024*1024)return reply({error:'O limite do arquivo é de 10 MB.'},413);
 const data=await req.formData();
 const id=data.get('id'), area=String(data.get('coletanea')), mode=String(data.get('modalidade'));
 const title=String(data.get('titulo')??'').trim(), pages=Number(data.get('paginas'));
 const file=data.get('arquivo'), price=prices.get(mode);
 if(!validId(id)||!areas.has(area)||!price||!title||title.length>240||!Number.isInteger(pages)||pages<1||pages>30||data.get('a4')!=='on')
  return reply({error:'Confira os dados. O capítulo deve ter de 1 a 30 páginas em A4.'},400);
 if(!(file instanceof File)||!file.size||file.size>10485760)return reply({error:'Anexe um arquivo de até 10 MB.'},400);
 const ext=file.name.toLowerCase().split('.').pop();
 const types:Record<string,string>={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
 const bytes=await file.arrayBuffer();
 const sig=Array.from(new Uint8Array(bytes.slice(0,8)),b=>b.toString(16).padStart(2,'0')).join('');
 if(!ext||!(ext in types)||!sig.startsWith(({pdf:'255044462d',doc:'d0cf11e0a1b11ae1',docx:'504b0304'} as Record<string,string>)[ext]))
  return reply({error:'Envie um arquivo PDF, DOC ou DOCX válido.'},400);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 const arquivo=user.id+'/'+id+'/'+hash+'.'+ext;
 const abnt=data.get('abnt')==='on', revisao=data.get('revisao')==='on';
 const order={id,titular:user.id,email:user.email,titulo:title,coletanea:area,modalidade:mode,paginas:pages,abnt,revisao,arquivo,valor:price+3990*(Number(abnt)+Number(revisao))};
 const {error:insert}=await db.from('pedidos_capitulo').upsert(order,{onConflict:'id',ignoreDuplicates:true});
 if(insert)throw insert;
 const {data:saved,error:read}=await db.from('pedidos_capitulo').select('*').eq('id',id).single();
 if(read)throw read;
 if(Object.entries(order).some(([field,value])=>saved[field]!==value)||saved.pago_em)return reply({error:'Inicie um novo pedido.'},409);
 if(saved.link)return reply({url:saved.link});
 const {error:upload}=await files.upload(arquivo,bytes,{contentType:types[ext],upsert:true});
 if(upload)throw upload;
 const items=[{description:'Worges · Capítulo ('+mode+')',quantity:1,price}];
 if(abnt)items.push({description:'Normalização ABNT',quantity:1,price:3990});
 if(revisao)items.push({description:'Correção ortográfica',quantity:1,price:3990});
 const link=await provider('links',{handle:'worges_2723bank',order_nsu:id,items,
  customer:{email:user.email},webhook_url:host+'/functions/v1/checkout-capitulo?webhook=1'});
 const url=new URL(link.url);
 if(url.protocol!=='https:'||!/(^|\.)infinitepay\.io$/.test(url.hostname))throw Error('Link inválido');
 const {error:save}=await db.from('pedidos_capitulo').update({link:url.href}).eq('id',id);
 if(save)throw save;
 return reply({url:url.href});
}

Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Use POST.'},405);
 try {
  if(new URL(req.url).searchParams.has('webhook'))return await confirmPayment(req);
  return await createOrder(req);
 } catch {
  return reply({error:'Não foi possível continuar para o pagamento. Tente novamente.'},503);
 }
});