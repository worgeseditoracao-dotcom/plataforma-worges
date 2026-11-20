alter table public.projetos_painel
 add column etapa_editorial text check (etapa_editorial in (
  'aguardando_original','triagem','correcao','revisao','diagramacao','capa',
  'aguardando_autor','ajustes_finais','finalizada','publicada','pausada'
 )),
 add column finalizacao_prevista_em date,
 add column capa_enviada_em date,
 add column prova_enviada_em date,
 add column arquivos_finais_enviados_em date;
