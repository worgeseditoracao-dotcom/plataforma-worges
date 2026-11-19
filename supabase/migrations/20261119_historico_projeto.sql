create table public.historico_projeto (
 id bigint generated always as identity primary key,
 projeto_id uuid not null references public.projetos_painel(id),
 andamento text not null,
 registrado_em timestamptz not null default now()
);
create index historico_projeto_ordem on public.historico_projeto(projeto_id,registrado_em,id);
alter table public.historico_projeto enable row level security;
revoke all on public.historico_projeto from public,anon,authenticated;
grant select on public.historico_projeto to authenticated;
create policy consultar_historico on public.historico_projeto for select to authenticated
 using (exists(select 1 from public.projetos_painel p where p.id=projeto_id and (p.email=editorial_privado.email() or editorial_privado.admin())));
create function editorial_privado.registrar_andamento() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' or new.andamento is distinct from old.andamento then
  insert into public.historico_projeto(projeto_id,andamento) values(new.id,new.andamento);
 end if;
 return new;
end;$$;
revoke all on function editorial_privado.registrar_andamento() from public,anon,authenticated;
create trigger registrar_andamento after insert or update of andamento on public.projetos_painel for each row execute function editorial_privado.registrar_andamento();
insert into public.historico_projeto(projeto_id,andamento) select id,andamento from public.projetos_painel;
