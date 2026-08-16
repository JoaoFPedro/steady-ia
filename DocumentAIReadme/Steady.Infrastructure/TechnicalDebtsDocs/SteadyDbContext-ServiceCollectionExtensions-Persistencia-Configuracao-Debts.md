# SteadyDbContext e ServiceCollectionExtensions - Persistencia-Configuracao - Debitos Tecnicos

## Indice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Acao](#3-plano-de-acao)
- [4. User Stories para Implementacao](#4-user-stories-para-implementacao)

## 1. Resumo Executivo
- **Estado Atual**: modelagem enxuta e consistente (uma unica migration, schema pequeno e coerente com o dominio atual). A decisao de resolver a connection string em tempo de DI (nao no boot sincrono) e deliberada e bem documentada no proprio codigo e na spec. Isolamento por `corredor_id` reforcado por indice em todas as tabelas dependentes de corredor.
- **Principais Problemas**: nenhum filtro global de isolamento (`HasQueryFilter`) configurado no `DbContext` -- o isolamento depende inteiramente da disciplina de cada metodo de repositorio incluir `Where(corredor_id == ...)" manualmente; ausencia de indices compostos para consultas por periodo; unica migration existente ainda nao foi testada quanto a reversibilidade (`Down`) em um banco com dados.
- **Impacto no Negocio**: o maior risco aqui e de natureza preventiva -- a ausencia de um filtro global de isolamento significa que um novo repositorio escrito no futuro sem o cuidado de filtrar por `corredor_id` compilaria e rodaria normalmente, vazando dados entre corredores, sem que o `DbContext` ofereca nenhuma rede de seguranca automatica.

## 2. Problemas por Criticidade

### Vermelho Criticos
- **Isolamento por corredor_id depende 100% de disciplina manual, sem rede de seguranca no DbContext**: o EF Core oferece `HasQueryFilter` para aplicar um filtro global automaticamente a toda query de uma entidade (ex.: filtrar sempre por um `CorredorId` de um "current user" resolvido via um servico de contexto). Essa base **nao usa esse recurso** -- cada repositorio inclui manualmente `Where(s => s.CorredorId == corredorId)` em cada metodo. Isso funciona hoje porque os quatro repositorios existentes foram escritos corretamente, mas e uma dependencia de disciplina humana, nao de garantia estrutural. Um novo metodo de repositorio (ou um novo repositorio inteiro) escrito no futuro sem esse cuidado compilaria, passaria em testes que nao verificam isolamento especificamente, e vazaria dados entre corredores em producao -- exatamente o risco que a ADR-002 e o item OWASP A01 do Playbook existem para prevenir.
  - **Acao Recomendada**: avaliar a introducao de `HasQueryFilter` global por `CorredorId` em `OnModelCreating` para as entidades `RunningSessionEntity`, `StrengthSessionEntity` e `PainLogEntity`, usando um servico de contexto (ex.: `ICurrentCorredorAccessor`) resolvido via `DbContext` construtor. Isso tornaria o isolamento uma garantia estrutural do `DbContext`, nao apenas uma convencao seguida em cada repositorio. Requer cuidado para nao quebrar cenarios legitimos de acesso sem corredor (ex.: eventual job administrativo), e deve ser tratado como uma decisao arquitetural formal (ADR), dado o impacto em toda a base.

### Amarelo Importantes
- **Sem indices compostos para consultas por periodo**: todas as tabelas de treino tem apenas indice simples em `corredor_id`. A medida que a regra de sobrecarga e o historico passarem a filtrar por data diretamente na query SQL (ver TechnicalDebtsDocs de `RunningSessionRepository` e `StrengthSessionRepository`), um indice composto `(corredor_id, date)` sera necessario para manter a performance.
  - **Acao Recomendada**: planejar a migration de indice composto junto com a implementacao do filtro de data na query (dependencia cruzada com os debitos ja registrados nos repositorios de treino).
- **Migration unica nunca testada quanto a reversibilidade em banco com dados**: `Down()` da migration `InitialCreate` remove as quatro tabelas -- correto para um banco vazio, mas nunca foi exercitado em um cenario de rollback com dados reais. Nao ha um processo documentado de teste de rollback de migration.
  - **Acao Recomendada**: incluir teste de rollback (`Up` -> inserir dados de teste -> `Down` -> validar limpeza) na suite de integracao, ou ao menos documentar o processo manual de validacao antes de aplicar migrations destrutivas em producao.

### Verde Menores
- **CreatedAt de CorredorEntity gerado em codigo, nao no banco**: ja mencionado em `CorredorRepository-Persistencia-Autenticacao-Debts.md`; mencionado aqui tambem porque a decisao de design pertence a esta camada de configuracao.
- **Sem particionamento/estrategia de crescimento de longo prazo documentada**: para um MVP o volume de dados e pequeno; nao ha, ainda, nenhuma decisao registrada sobre estrategia de crescimento de tabelas (particionamento por data, arquivamento de dados antigos, etc.).
  - **Acao Recomendada**: nenhuma acao imediata; revisitar quando o volume de dados justificar.

## 3. Plano de Acao
1. **Fase 1 - Criticos**: avaliar e decidir (com ADR) se `HasQueryFilter` global por `CorredorId` deve ser adotado como rede de seguranca estrutural para o isolamento de dados.
2. **Fase 2 - Importantes**: planejar indices compostos `(corredor_id, date)` em conjunto com a implementacao de filtro de data nas queries; adicionar teste de rollback de migration.
3. **Fase 3 - Menores**: avaliar `DEFAULT now()` no banco para `created_at`; revisitar estrategia de crescimento de dados quando relevante.

## 4. User Stories para Implementacao

### Story 1: Avaliar e, se aprovado, implementar filtro global de isolamento por CorredorId

**Contexto Atual**: o isolamento de dados por `corredor_id` (regra central de seguranca do produto, [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)) e garantido hoje exclusivamente pela disciplina de cada metodo de repositorio incluir manualmente a clausula `Where`. O `DbContext` nao oferece nenhuma garantia estrutural equivalente.

**Objetivo**: reduzir a dependencia de disciplina manual, tornando dificil (ou impossivel) escrever um metodo de repositorio que esqueca de filtrar por corredor.

**Regras de Negocio**:
- Nenhuma query de `RunningSessionEntity`, `StrengthSessionEntity` ou `PainLogEntity` deve retornar dados de um corredor diferente do corredor autenticado da requisicao atual, mesmo que um desenvolvedor futuro esqueca de aplicar o filtro manualmente.

**Especificacao Tecnica**:
- Investigar viabilidade de `modelBuilder.Entity<RunningSessionEntity>().HasQueryFilter(s => s.CorredorId == _currentCorredorAccessor.CorredorId)` (e equivalente para as demais entidades), usando um servico injetado no `SteadyDbContext` que expoe o `CorredorId` da requisicao atual (similar ao `CurrentCorredor` ja existente em `Steady.Api`).
- Avaliar como esse filtro coexiste com o `CorredorRepository` (que nao deve ser afetado, pois `CorredorEntity` nao tem `CorredorId` proprio) e com eventuais cenarios administrativos futuros que precisem ignorar o filtro (`IgnoreQueryFilters()`).
- Registrar a decisao final (adotar ou nao, e como) em um ADR, dado o impacto estrutural na base inteira.

**Criterios de Aceite**:
- [ ] ADR registrado com a decisao e a justificativa.
- [ ] Se aprovado: todas as queries de `RunningSessionEntity`, `StrengthSessionEntity` e `PainLogEntity` aplicam o filtro automaticamente, mesmo sem `Where` explicito no repositorio.
- [ ] Testes existentes (`Steady.Api.Tests`) continuam passando sem alteracao de comportamento observavel pela API.
- [ ] Um teste novo comprova que uma query hipotetica sem filtro manual ainda respeita o isolamento (prova de que a rede de seguranca funciona).

**Roteiro de Teste**:
1. **Teste 1**: Query sem filtro manual respeita isolamento.
   - **Entrada**: query direta ao `DbSet` sem `Where` de `corredor_id`, dentro de um contexto de corredor autenticado.
   - **Resultado Esperado**: apenas dados do corredor atual sao retornados.
2. **Teste 2**: Comportamento existente da API nao muda.
   - **Entrada**: suite completa de `Steady.Api.Tests`.
   - **Resultado Esperado**: todos os testes continuam verdes.

### Story 2: Adicionar teste de rollback para a migration inicial

**Contexto Atual**: a migration `InitialCreate` tem um metodo `Down()` que remove as quatro tabelas, mas nunca foi validado automaticamente em um cenario com dados presentes.

**Objetivo**: ter confianca de que a migration pode ser revertida com seguranca, caso necessario em produção.

**Regras de Negocio**:
- Nenhuma perda de dados inesperada deve ocorrer sem que a equipe esteja ciente -- reverter uma migration que remove tabelas e uma operacao destrutiva por natureza, mas o processo deve ser previsivel.

**Especificacao Tecnica**:
- Criar um teste de integracao (Testcontainers) que aplica `Up()`, insere dados de teste em cada tabela, aplica `Down()`, e verifica que as tabelas foram removidas sem erro.
- Documentar, no README de migrations ou em comentario, que `Down()` desta migration especifica e destrutivo (remove todas as tabelas) e nao deve ser usado em producao sem backup.

**Criterios de Aceite**:
- [ ] Teste de rollback roda no pipeline de CI.
- [ ] Documentacao explicita sobre a natureza destrutiva do rollback desta migration.

**Roteiro de Teste**:
1. **Teste 1**: Rollback com dados presentes.
   - **Entrada**: banco com `Up()` aplicado e dados de teste inseridos em todas as tabelas.
   - **Resultado Esperado**: `Down()` executa sem erro e remove as quatro tabelas.
