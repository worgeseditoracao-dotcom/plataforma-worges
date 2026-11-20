create table public.pedidos_capitulo (
 id uuid primary key,
 titular uuid not null references auth.users(id),
 email text not null,
 titulo text not null,
 coletanea text not null,
 modalidade text not null check (modalidade in ('regular','urgente')),
 paginas integer not null check (paginas between 1 and 30),
 abnt boolean not null,
 revisao boolean not null,
 arquivo text not null,
 valor integer not null check (valor = (case modalidade when 'regular' then 17990 else 19790 end) + (case when abnt then 3990 else 0 end) + (case when revisao then 3990 else 0 end)),
 criado_em timestamptz not null default now(),
 link text,
 transacao text unique,
 pago_em timestamptz
);
alter table public.pedidos_capitulo enable row level security;
revoke all on public.pedidos_capitulo from anon, authenticated;
insert into storage.buckets (id,name,public,file_size_limit)
values ('originais-coletaneas','originais-coletaneas',false,10485760)
on conflict (id) do nothing;