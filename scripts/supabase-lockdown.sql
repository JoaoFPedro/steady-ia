-- Fecha a exposição pública das tabelas do domínio no Supabase.
--
-- Por que existe: o Supabase publica o schema `public` numa API REST (PostgREST)
-- alcançável com a `anon key`, que é pública por design. As tabelas criadas por
-- migration do EF Core nascem com grants para `anon`/`authenticated` e sem RLS —
-- ou seja, legíveis e graváveis por qualquer um que tenha a chave, sem passar
-- pela API .NET e sem o isolamento por corredor_id do ADR-002. Isso violaria o
-- mandato inviolável da PROJECT-CONSTITUTION §3 (dado de saúde não se expõe
-- entre corredores) e a imutabilidade da Lei do Domínio #2 (UPDATE/DELETE).
--
-- O Steady nunca usa o PostgREST: a API conecta como `postgres`, que é dona das
-- tabelas e tem rolbypassrls — nada aqui afeta o acesso dela.
--
-- Rode DEPOIS DE CADA MIGRATION que crie tabela nova:
--   U="$(grep '^POSTGRES_URL_NON_POOLING=' .env | cut -d= -f2- | tr -d '"')"
--   docker exec -i -e U="$U" steady-db psql "$U" -v ON_ERROR_STOP=1 < scripts/supabase-lockdown.sql
--
-- É idempotente: pode rodar quantas vezes quiser.

begin;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Sem isto a próxima migration reabre o buraco: o Supabase tem default privileges
-- concedendo a anon/authenticated tudo que `postgres` criar no schema public.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- Defesa em profundidade: sem policy, RLS nega tudo. Genérico de propósito, para
-- cobrir tabela criada por migration futura sem precisar editar este arquivo.
do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and c.relname <> '__EFMigrationsHistory'
      and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', t.relname);
    raise notice 'RLS ligado em %', t.relname;
  end loop;
end $$;

commit;
