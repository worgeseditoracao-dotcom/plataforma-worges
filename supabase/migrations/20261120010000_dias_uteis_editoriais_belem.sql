create or replace function editorial_privado.pascoa(ano integer) returns date language sql immutable strict set search_path='' as $$
-- Algoritmo gregoriano de Meeus/Jones/Butcher.
with partes as (select ano%19 a, ano/100 b, ano%100 c),
epacta as (select *, (19*a+b-b/4-(b-(b+8)/25+1)/3+15)%30 h from partes),
semana as (select *, (32+2*(b%4)+2*(c/4)-h-c%4)%7 l from epacta),
resultado as (select h+l-7*((a+11*h+22*l)/451)+114 n from semana)
select make_date(ano,n/31,n%31+1) from resultado
$$;
create or replace function editorial_privado.dia_editorial(inicio date,dias integer) returns date language plpgsql immutable strict set search_path='' as $$
declare data_atual date := inicio; restantes integer := dias; pascoa date; ano integer;
begin
 if dias < 1 then raise exception 'Prazo deve ser positivo'; end if;
 while restantes > 0 loop
  data_atual := data_atual+1;
  if ano is distinct from extract(year from data_atual)::int then
   ano := extract(year from data_atual)::int;
   pascoa := editorial_privado.pascoa(ano);
  end if;
  if extract(isodow from data_atual)<=5 and
   (extract(month from data_atual)*100+extract(day from data_atual)) not in (101,421,501,815,907,1012,1102,1115,1120,1208,1225)
   and data_atual not in (pascoa-2,pascoa+60) then restantes := restantes-1; end if;
 end loop;
 return data_atual;
end $$;
update public.projetos_painel set data_projeto=data_projeto where cronograma is not null and original_final_em is null;