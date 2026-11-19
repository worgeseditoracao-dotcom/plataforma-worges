create function public.registrar_orcamento(referencia uuid,titulo text,responsavel text,telefone text,modalidade text,ficha text) returns uuid
language plpgsql security definer set search_path='' as $$
declare contato text := editorial_privado.email();
begin
 if contato is null or referencia is null or modalidade not in ('Bronze','Prata','Ouro') or length(trim(titulo)) not between 1 and 240 or length(trim(responsavel)) not between 1 and 240 or telefone !~ '^[+0-9 ()-]{8,25}$' or length(ficha) not between 1 and 16000 then raise exception 'Confira os dados do pedido'; end if;
 insert into public.projetos_painel(id,obra,autor,email,whatsapp,pacote,andamento) values(referencia,titulo,responsavel,contato,telefone,modalidade,'Orçamento recebido') on conflict(id) do nothing;
 if found then insert into public.relato_projeto(projeto_id,texto) values(referencia,ficha);
 elsif not exists(select 1 from public.projetos_painel where id=referencia and email=contato) then raise exception 'Referência indisponível'; end if;
 return referencia;
end $$;
revoke all on function public.registrar_orcamento(uuid,text,text,text,text,text) from public,anon;
grant execute on function public.registrar_orcamento(uuid,text,text,text,text,text) to authenticated;
