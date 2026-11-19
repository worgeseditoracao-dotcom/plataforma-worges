create schema if not exists editorial_privado;
revoke all on schema editorial_privado from public;
grant usage on schema editorial_privado to authenticated;
create function editorial_privado.admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'worges_role'='admin');
$$;
create function editorial_privado.email() returns text language sql stable security definer set search_path='' as $$
 select lower(email) from auth.users where id=auth.uid() and email_confirmed_at is not null;
$$;
revoke all on all functions in schema editorial_privado from public;
grant execute on all functions in schema editorial_privado to authenticated;
create table public.projetos_painel (
 id uuid primary key default gen_random_uuid(), obra text not null check(length(trim(obra))>0), autor text not null,
 email text not null check(email=lower(trim(email))), whatsapp text not null default '', pacote text not null,
 data_projeto date not null default current_date, prazo date, andamento text not null default 'Recebido',
 pago_centavos integer not null default 0 check(pago_centavos>=0), checkout_id uuid unique references public.checkout_infinitepay(id)
);
alter table public.projetos_painel enable row level security;
revoke all on public.projetos_painel from public,anon,authenticated;
grant select,insert,update on public.projetos_painel to authenticated;
create policy visualizar on public.projetos_painel for select to authenticated using(editorial_privado.admin() or email=editorial_privado.email());
create policy cadastrar on public.projetos_painel for insert to authenticated with check(editorial_privado.admin() and checkout_id is null);
create policy editar on public.projetos_painel for update to authenticated using(editorial_privado.admin()) with check(editorial_privado.admin());
create table public.relato_projeto(id uuid primary key default gen_random_uuid(), projeto_id uuid not null references public.projetos_painel, texto text not null check(length(trim(texto)) between 1 and 16000), criado_em timestamptz not null default now(), remetente uuid not null default auth.uid());
alter table public.relato_projeto enable row level security;
revoke all on public.relato_projeto from public,anon,authenticated;
grant select,insert on public.relato_projeto to authenticated;
create policy ler on public.relato_projeto for select to authenticated using(exists(select 1 from public.projetos_painel p where p.id=relato_projeto.projeto_id and (editorial_privado.admin() or p.email=editorial_privado.email())));
create policy enviar on public.relato_projeto for insert to authenticated with check(remetente=auth.uid() and exists(select 1 from public.projetos_painel p where p.id=relato_projeto.projeto_id and (editorial_privado.admin() or p.email=editorial_privado.email())));
insert into storage.buckets(id,name,public) values('originais-worges','originais-worges',false);
create policy arquivos_worges_leitura on storage.objects for select to authenticated using(bucket_id='originais-worges' and exists(select 1 from public.projetos_painel p where p.id::text=(storage.foldername(storage.objects.name))[1] and (editorial_privado.admin() or p.email=editorial_privado.email())));
create policy arquivos_worges_envio on storage.objects for insert to authenticated with check(bucket_id='originais-worges' and array_length(storage.foldername(name),1)=1 and exists(select 1 from public.projetos_painel p where p.id::text=(storage.foldername(storage.objects.name))[1] and (editorial_privado.admin() or p.email=editorial_privado.email())));
create function editorial_privado.importar_pagamento() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.pago_em is not null and not new.teste then
 insert into public.projetos_painel(obra,autor,email,pacote,data_projeto,pago_centavos,checkout_id)
 values('Título a informar','Nome a informar',lower(trim(new.email)),new.pacote,(new.pago_em at time zone 'America/Sao_Paulo')::date,new.valor,new.id) on conflict(checkout_id) do nothing;
 end if;return new;
end;$$;
create trigger importar_pagamento after insert or update of pago_em on public.checkout_infinitepay for each row execute function editorial_privado.importar_pagamento();
insert into public.projetos_painel(obra,autor,email,pacote,data_projeto,pago_centavos,checkout_id) select 'Título a informar','Nome a informar',lower(trim(email)),pacote,(pago_em at time zone 'America/Sao_Paulo')::date,valor,id from public.checkout_infinitepay where pago_em is not null and not teste on conflict(checkout_id) do nothing;
