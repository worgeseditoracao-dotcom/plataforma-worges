alter table public.projetos_painel add column revisao_enviada_em date, add column revisao_devolvida_em date,
 add constraint ordem_revisao check ((revisao_enviada_em is null or revisao_enviada_em >= greatest(data_projeto,original_final_em)) and (revisao_devolvida_em is null or (revisao_enviada_em is not null and revisao_devolvida_em >= revisao_enviada_em)));
create or replace function editorial_privado.calcular_cronograma() returns trigger language plpgsql set search_path='' as $$
declare base date; revisao boolean; envio date; retorno date; prevista date; diagrama date; saldo integer; saldo_final integer;
begin
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
update public.projetos_painel set data_projeto=data_projeto where cronograma is not null and lower(andamento) not in ('publicado','publicada','obra publicada','livro publicado');