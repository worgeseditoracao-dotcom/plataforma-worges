alter table public.projetos_painel
 add column pedido_capitulo_id uuid unique references public.pedidos_capitulo(id);

grant select on public.pedidos_capitulo to authenticated;
create policy pedidos_capitulo_equipe on public.pedidos_capitulo
 for select to authenticated using (editorial_privado.admin());

create policy originais_coletaneas_equipe on storage.objects
 for select to authenticated using (bucket_id = 'originais-coletaneas' and editorial_privado.admin());

create or replace function editorial_privado.calcular_cronograma() returns trigger language plpgsql set search_path='' as $$
declare base date; revisao boolean; envio date; retorno date; prevista date; diagrama date; saldo integer; saldo_final integer;
begin
 if new.tipo_projeto = 'capitulo' then
  new.cronograma = case when new.prazo is null then null else jsonb_build_object('publicacao',new.prazo) end;
  return new;
 end if;
 if new.pago_centavos<=0 and new.checkout_id is null then new.cronograma=null; return new; end if;
 base=greatest(new.data_projeto,new.original_final_em);
 revisao=lower(new.pacote) like 'ouro%' or new.revisao_adicional;
 diagrama=editorial_privado.dia_editorial(base,10);
 prevista=coalesce(new.prazo,editorial_privado.dia_editorial(base,case when revisao then 20 else 15 end));
 if revisao and new.revisao_enviada_em is not null then
  envio=new.revisao_enviada_em; retorno=new.revisao_devolvida_em;
  select count(*) filter(where envio+n<=diagrama),count(*) filter(where envio+n<=prevista) into saldo,saldo_final
  from generate_series(1,greatest(diagrama,prevista)-envio) n where editorial_privado.dia_editorial(envio+n-1,1)=envio+n;
  if retorno is null then diagrama=null; prevista=null;
  else
   diagrama=case when saldo=0 then editorial_privado.dia_editorial(retorno-1,1) else editorial_privado.dia_editorial(retorno,saldo) end;
   prevista=case when saldo_final=0 then editorial_privado.dia_editorial(retorno-1,1) else editorial_privado.dia_editorial(retorno,saldo_final) end;
  end if;
 end if;
 new.cronograma=jsonb_strip_nulls(jsonb_build_object('base',base,'provisorio',new.original_final_em is null,'capa',editorial_privado.dia_editorial(base,5),'revisao',case when revisao then coalesce(envio,editorial_privado.dia_editorial(base,7)) end,'pausado',envio is not null and retorno is null,'saldo_diagramacao',saldo,'diagramacao',diagrama,'publicacao',prevista));
 return new;
end $$;

create function editorial_privado.registrar_capitulo_pago() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
 data_pagamento date;
begin
 if new.pago_em is null then return new; end if;
 data_pagamento := (new.pago_em at time zone 'America/Sao_Paulo')::date;

 insert into public.projetos_painel
  (obra, autor, email, pacote, tipo_projeto, situacao_comercial, pago_centavos,
   data_projeto, original_final_em, prazo, andamento, revisao_adicional,
   titular_id, pedido_capitulo_id)
 values
  (new.titulo, 'Nome a confirmar', lower(trim(new.email)),
   new.coletanea || case when new.modalidade='urgente' then ' · Urgente' else ' · Regular' end,
   'capitulo', 'pago', new.valor, data_pagamento, data_pagamento,
   editorial_privado.dia_editorial(data_pagamento, case when new.modalidade='urgente' then 2 else 10 end),
   'Original recebido para conferência', new.revisao, new.titular, new.id)
 on conflict (pedido_capitulo_id) do nothing;
 return new;
end;
$$;
revoke all on function editorial_privado.registrar_capitulo_pago() from public, anon, authenticated;
create trigger registrar_capitulo_pago
 after insert or update of pago_em on public.pedidos_capitulo
 for each row execute function editorial_privado.registrar_capitulo_pago();

update public.pedidos_capitulo set pago_em = pago_em where pago_em is not null;
