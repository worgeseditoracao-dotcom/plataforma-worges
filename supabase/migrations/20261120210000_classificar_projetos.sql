alter table public.projetos_painel
  add column if not exists tipo_projeto text not null default 'livro'
    check (tipo_projeto in ('livro', 'capitulo')),
  add column if not exists situacao_comercial text not null default 'pago'
    check (situacao_comercial in ('pago', 'proposta', 'em_andamento_anterior', 'a_conferir')),
  add column if not exists valor_orcado_centavos integer
    check (valor_orcado_centavos is null or valor_orcado_centavos >= 0),
  add column if not exists referencia_origem text;

comment on column public.projetos_painel.data_projeto is
  'Data da contratação ou, em importações históricas sem essa data, da atividade documentada indicada em andamento.';
