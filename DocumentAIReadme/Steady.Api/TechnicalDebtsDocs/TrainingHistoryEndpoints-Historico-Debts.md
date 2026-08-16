# TrainingHistoryEndpoints - Historico - Debitos Tecnicos

## Indice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Acao](#3-plano-de-acao)
- [4. User Stories para Implementacao](#4-user-stories-para-implementacao)

## 1. Resumo Executivo
- **Estado Atual**: as duas rotas implementam corretamente o isolamento por corredor (mecanismo mais critico do ponto de vista de seguranca) e sao cobertas por testes de integracao (`TrainingHistoryEndpointTests`, `AuthorizationTests`). O principal debito e de escalabilidade: nenhuma paginacao na listagem e uma estrategia de busca ineficiente na consulta individual.
- **Principais Problemas**: `GET /api/training-sessions` nao pagina, retornando o historico inteiro do corredor em uma unica resposta, ordenado em memoria no processo da API (nao no banco); `GET /api/training-sessions/{id}` sempre consulta a tabela de corrida primeiro, custando uma query extra sempre que o recurso e de musculacao; e o registro de dor nao aparece no historico consolidado, apesar de fazer parte conceitualmente do "historico de treino" do corredor.
- **Impacto no Negocio**: baixo hoje, crescente com o tempo - corredores de longa data acumulam centenas/milhares de sessoes ao longo de anos de treino, tornando a resposta cada vez maior e mais lenta.

## 2. Problemas por Criticidade

### Criticos
- Nenhum problema critico identificado - o isolamento por corredor (o mandato mais sensivel do projeto) esta implementado corretamente em ambas as rotas, com filtro direto no banco (`WHERE corredor_id = ...`).

### Importantes
- **Ausencia de paginacao em `GET /api/training-sessions`**: a rota busca `IReadOnlyList<RunningSessionEntity>` e `IReadOnlyList<StrengthSessionEntity>` completos do corredor (sem `Skip`/`Take`), concatena e ordena em memoria no processo da API. Para um corredor com anos de historico, isso significa uma resposta HTTP cada vez maior e mais lenta, sem limite.
  - **Acao Recomendada**: adicionar paginacao (`page`/`pageSize` como query string, ou cursor-based) e mover a ordenacao/limitacao para o banco sempre que possivel.
- **Consulta individual ineficiente para sessoes de musculacao**: `GET /api/training-sessions/{id}` sempre tenta `RunningSessionRepository.GetByIdAsync` primeiro; se o recurso for de musculacao, isso custa uma consulta adicional ao banco antes de encontrar o resultado certo. Nao ha como saber o tipo pelo `id` isoladamente (ambos usam `Guid.NewGuid()` sem prefixo ou tabela unica).
  - **Acao Recomendada**: avaliar uma tabela unica de sessoes com coluna de discriminador (`SessionType`), ou aceitar o custo (baixo em volume absoluto, mas linear com o numero de consultas) documentando a decisao.

### Menores
- **Registro de dor fora do historico consolidado**: `PainLog` nao aparece em `GET /api/training-sessions`, apesar de logicamente fazer parte do "historico" do corredor sob a perspectiva de produto. Relacionado ao debito ja registrado em [PainLogEndpoints Debts](./PainLogEndpoints-Treino-Dor-Debts.md) (ausencia de rotas de leitura para dor).
  - **Acao Recomendada**: avaliar com produto se o historico consolidado deve incluir eventos de dor como um terceiro "tipo" na mesma lista, ou se deve permanecer em uma consulta separada.
- **`Type` como string livre (`"Corrida"`/`"Musculacao"`) em vez de enum tipado no contrato**: `TrainingSessionResponse.Type` e uma `string` construida manualmente em cada mapeamento (`"Corrida"`, `"Musculacao"`), sem uma constante ou enum compartilhado - risco de erro de digitacao silencioso se um terceiro tipo de sessao for adicionado no futuro.
  - **Acao Recomendada**: extrair para uma constante compartilhada ou enum serializado como string, reduzindo risco de inconsistencia entre os dois pontos de mapeamento no mesmo arquivo.

## 3. Plano de Acao
1. **Fase 1 - Criticos**: nao ha itens nesta fase.
2. **Fase 2 - Importantes**: implementar paginacao em `GET /api/training-sessions`; avaliar estrategia de consulta unificada (ou documentar o custo aceito) para `GET /api/training-sessions/{id}`.
3. **Fase 3 - Menores**: discutir com produto a inclusao de dor no historico consolidado; extrair `Type` para constante/enum compartilhado.

## 4. User Stories para Implementacao

### Story 1: Paginar a listagem do historico consolidado de treinos

**Contexto Atual**: `GET /api/training-sessions` retorna todas as sessoes do corredor de uma vez, sem paginacao, com ordenacao feita em memoria apos concatenar duas listas completas trazidas do banco.

**Objetivo**: limitar o volume de dados retornado por chamada, mantendo a ordenacao por data decrescente, sem quebrar clientes existentes de forma abrupta.

**Regras de Negocio**:
- A ordem de exibicao (mais recente primeiro) deve ser preservada.
- Um corredor sem sessoes continua recebendo uma resposta vazia (compativel com o comportamento atual), nao um erro de paginacao invalida.
- O isolamento por corredor (filtro por `CorredorId`) deve continuar valendo para qualquer pagina solicitada.

**Especificacao Tecnica**:
- Adicionar parametros de query `page` (default 1) e `pageSize` (default a definir, ex.: 20) a rota `GET /api/training-sessions`.
- Avaliar unificar a leitura de corrida e musculacao em nivel de banco (ex.: `UNION` via SQL bruto ou view) para permitir `ORDER BY` + `LIMIT`/`OFFSET` no banco, em vez de materializar tudo e ordenar em C#. Alternativa mais simples: paginar cada fonte separadamente e mesclar em memoria apenas o necessario para a pagina solicitada (mais complexo de acertar com duas fontes heterogeneas).
- Manter compatibilidade: se `page`/`pageSize` nao forem informados, decidir entre (a) retornar todo o historico como hoje (comportamento atual preservado) ou (b) aplicar um `pageSize` padrao razoavel - documentar a decisao escolhida.

**Criterios de Aceite**:
- [ ] `GET /api/training-sessions?page=1&pageSize=20` retorna no maximo 20 itens, ordenados por data decrescente.
- [ ] Metadados de paginacao (total de itens, pagina atual, etc.) estao presentes na resposta ou em headers, conforme convencao escolhida.
- [ ] Corredor sem sessoes continua recebendo lista vazia (nao erro) em qualquer pagina solicitada.
- [ ] Isolamento por corredor preservado em todas as paginas.

**Roteiro de Teste**:
1. **Teste 1**: corredor com 25 sessoes registradas (mistura de corrida e musculacao).
   - **Entrada**: `GET /api/training-sessions?page=1&pageSize=20`.
   - **Resultado Esperado**: 20 itens retornados, os mais recentes.
2. **Teste 2**: corredor sem nenhuma sessao.
   - **Entrada**: `GET /api/training-sessions?page=1&pageSize=20`.
   - **Resultado Esperado**: lista vazia, sem erro.

### Story 2: Reduzir custo de consulta individual para sessoes de musculacao

**Contexto Atual**: `GET /api/training-sessions/{id}` sempre consulta `RunningSessionRepository` primeiro; para sessoes de musculacao, isso implica uma consulta adicional ao banco (que retorna vazio) antes de encontrar o resultado correto na segunda tabela.

**Objetivo**: reduzir o numero de consultas ao banco por requisicao para o caso de sessoes de musculacao, sem alterar o contrato da rota.

**Regras de Negocio**:
- O comportamento observavel pelo cliente (200 com os dados corretos, ou 404 quando nao encontrado/nao pertence ao corredor) nao muda.
- O isolamento por corredor continua obrigatorio em qualquer estrategia escolhida.

**Especificacao Tecnica**:
- Opcao A (mais simples): aceitar o custo atual (uma query extra por consulta de sessao de musculacao) e documentar a decisao como aceitavel para o volume esperado do MVP.
- Opcao B: unificar corrida e musculacao em uma unica tabela com coluna `SessionType`, permitindo uma unica query por `Id` + `CorredorId`. Impacto maior (migracao de dados, mudanca de modelo em `Steady.Infrastructure`), avaliar custo-beneficio antes de priorizar.
- Opcao C: incluir no `id` (ou em uma tabela de indice leve `Id -> SessionType`) uma forma barata de saber onde buscar antes de fazer a query completa.

**Criterios de Aceite**:
- [ ] Decisao documentada (comentario, ADR leve, ou aceitacao explicita do custo atual).
- [ ] Se Opcao B ou C: numero de queries ao banco por consulta individual de sessao de musculacao reduzido de 2 para 1, sem regressao nos testes existentes de `AuthorizationTests` e `TrainingHistoryEndpointTests`.

**Roteiro de Teste**:
1. **Teste 1** (se Opcao B/C implementada): consultar uma sessao de musculacao existente pelo `Id`.
   - **Entrada**: `GET /api/training-sessions/{id-de-musculacao}`.
   - **Resultado Esperado**: `200` com os dados corretos, com apenas uma consulta ao banco (verificavel via log/profiling).
2. **Teste 2**: consultar sessao de outro corredor (regressao de seguranca, deve continuar valendo em qualquer opcao escolhida).
   - **Entrada**: `GET /api/training-sessions/{id}` de sessao pertencente a outro corredor.
   - **Resultado Esperado**: `404`, sem revelar existencia.
