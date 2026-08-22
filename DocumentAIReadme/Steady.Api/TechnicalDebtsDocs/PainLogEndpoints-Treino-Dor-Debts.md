# PainLogEndpoints - Treino-Dor - Debitos Tecnicos

## Indice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Acao](#3-plano-de-acao)
- [4. User Stories para Implementacao](#4-user-stories-para-implementacao)

## 1. Resumo Executivo
- **Estado Atual**: endpoint de escrita simples e correto (guard clause + persistencia escopada por corredor), coberto por `tests/Steady.Api.Tests/PainLogEndpointTests.cs`, `tests/Steady.Api.Tests/IdempotencyTests.cs`. E o endpoint com o maior gap funcional do conjunto: coleta um dado central para a proposta de valor do produto (dor recorrente pos-treino), mas nao expoe nenhuma forma de le-lo de volta nem o usa em nenhum calculo.
- **Risco de duplicata por reenvio - resolvido**: mesmo mecanismo documentado em [RunningSessionEndpoints Debts](./RunningSessionEndpoints-Treino-Corrida-Debts.md#1-resumo-executivo) - chave de idempotencia (ADR-003). Nao e mais um debito em aberto para esta rota.
- **Principais Problemas**: ausencia total de rotas de leitura (`GET`) para registros de dor - nem individual, nem em lista, nem no historico consolidado; `Location` do `201 Created` aponta para uma rota (`/api/pain-logs/{id}`) que nao existe; `region` e texto livre sem validacao de lista fechada, criando risco de dados inconsistentes (ex.: "canela", "Canela", "canela direita" tratados como valores distintos); e o dado de dor coletado nao alimenta a regra de deteccao de sobrecarga, apesar de ser citado no ADR-001 como fonte de calibracao futura.
- **Impacto no Negocio**: alto no medio prazo - a promessa central do Steady e reduzir dor recorrente. Sem consulta nem uso analitico do dado de dor, a funcionalidade fica limitada a "escrever no vazio", sem retorno de valor perceptivel para o corredor ainda.

## 2. Problemas por Criticidade

### Criticos
- **Nenhuma rota de leitura para registros de dor**: `IPainLogRepository` so expoe `AddAsync`. Nao ha `GetByCorredorIdAsync`/`GetByIdAsync`, nem rota `GET /api/pain-logs` ou `GET /api/pain-logs/{id}`. O `Location` do `201 Created` (`/api/pain-logs/{id}`) promete um recurso que nao pode ser lido de volta.
  - **Acao Recomendada**: adicionar `GET /api/pain-logs` (lista do corredor autenticado) e `GET /api/pain-logs/{id}` (com 404 para registro de outro corredor, mesmo padrao de `TrainingHistoryEndpoints`), seguindo o mesmo padrao de repositorio ja usado em `IRunningSessionRepository`.

### Importantes
- **`region` como texto livre sem normalizacao**: diferente de `MuscleGroup` (enum fechado), `PainLog.Region` aceita qualquer string nao vazia. Isso impede agregacao confiavel (ex.: "quantas vezes doeu a canela") porque variacoes de grafia ("Canela", "canela", "Canela direita") sao tratadas como valores distintos.
  - **Acao Recomendada**: avaliar migrar `Region` para uma lista fechada (enum ou catalogo de regioes do corpo), ou no minimo normalizar (trim + lowercase) antes de persistir, preservando o rotulo original para exibicao se necessario.
- **Dado de dor nao usado na deteccao de sobrecarga**: o `ADR-001` cita o registro de dor como sinal de calibracao para revisar a regra de sobrecarga caso "dor continuar ocorrendo sem alerta", mas nao existe hoje nenhum mecanismo (automatico ou manual) que cruze `PainLog` com `OverloadAssessment`.
  - **Acao Recomendada**: registrar como trabalho futuro explicito (nao e um bug, e uma lacuna de escopo da STORY-001/002) - possivelmente uma nova story de analytics/calibracao.
- **Sem tratamento para excecoes fora de `ArgumentException`**: mesmo debito ja identificado em `RunningSessionEndpoints`/`StrengthSessionEndpoints`.
  - **Acao Recomendada**: mesma acao recomendada la - middleware global de excecao com `ProblemDetails`.

### Menores
- **`Location` do `201 Created` sem rota correspondente**: distinto do problema em `RunningSessionEndpoints`/`StrengthSessionEndpoints` (que apontam para outra rota existente) - aqui o `Location` aponta para uma rota que simplesmente nao existe ainda. Sera resolvido naturalmente pela Story 1 desta secao.

## 3. Plano de Acao
1. **Fase 1 - Criticos**: implementar `GET /api/pain-logs` e `GET /api/pain-logs/{id}` com isolamento por corredor.
2. **Fase 2 - Importantes**: avaliar normalizacao/lista fechada para `region`; abrir discussao de produto sobre uso do `PainLog` na calibracao da regra de sobrecarga; aplicar middleware global de excecao (compartilhado com os demais endpoints).
3. **Fase 3 - Menores**: nenhuma acao isolada - resolvido junto com a Fase 1.

## 4. User Stories para Implementacao

### Story 1: Expor rotas de leitura para registros de dor

**Contexto Atual**: o corredor consegue registrar dor, mas nao existe nenhuma forma de consultar esse historico pelo app - nem individualmente, nem em lista. O `Location` do `201 Created` promete um recurso inacessivel.

**Objetivo**: permitir que o corredor (e futuramente o proprio sistema) consulte o historico de dor registrado, com o mesmo padrao de isolamento por corredor ja usado em `TrainingHistoryEndpoints`.

**Regras de Negocio**:
- Um corredor so pode consultar seus proprios registros de dor (mesmo mandato de isolamento do ADR-002).
- Tentativa de acessar o registro de dor de outro corredor por ID direto retorna 404, nao revela existencia (mesmo padrao de `AuthorizationTests`).
- Sem registros, a lista retorna vazia, nao erro (mesmo padrao de `TrainingHistoryEndpointTests.SemHistorico_RetornaListaVazia`).

**Especificacao Tecnica**:
- Adicionar `GetByCorredorIdAsync` e `GetByIdAsync` a `IPainLogRepository`/`PainLogRepository`, espelhando `IRunningSessionRepository`.
- Adicionar `GET /api/pain-logs` (lista) e `GET /api/pain-logs/{id:guid}` (individual, 404 se nao pertencer ao corredor) em `PainLogEndpoints`.
- Adicionar `PainLogResponse` como retorno de lista (ja existe o record, reaproveitar).

**Criterios de Aceite**:
- [ ] `GET /api/pain-logs` retorna somente os registros do corredor autenticado, vazio se nao houver nenhum.
- [ ] `GET /api/pain-logs/{id}` retorna `200` com o registro se pertencer ao corredor autenticado.
- [ ] `GET /api/pain-logs/{id}` retorna `404` se o registro pertencer a outro corredor ou nao existir.
- [ ] `Location` do `201 Created` em `POST /api/pain-logs` passa a resolver corretamente via `GET /api/pain-logs/{id}`.

**Roteiro de Teste**:
1. **Teste 1**: corredor registra dor e consulta a lista.
   - **Entrada**: `POST /api/pain-logs` seguido de `GET /api/pain-logs`.
   - **Resultado Esperado**: lista contem o registro criado.
2. **Teste 2**: corredor A tenta acessar registro de dor do corredor B por ID.
   - **Entrada**: `GET /api/pain-logs/{id-do-corredor-b}` autenticado como corredor A.
   - **Resultado Esperado**: `404`.

### Story 2: Normalizar ou restringir a regiao do corpo em PainLog

**Contexto Atual**: `region` e uma string livre, sem validacao de formato ou lista fechada, o que impede analises confiaveis de "quais regioes doem com mais frequencia" devido a variacoes de grafia.

**Objetivo**: tornar o dado de regiao consistente o suficiente para permitir agregacao futura (ex.: dashboard de regioes mais afetadas), sem impedir o corredor de descrever livremente se necessario.

**Regras de Negocio**:
- A regiao do corpo continua obrigatoria (regra de negocio ja existente, nao muda).
- Se adotada lista fechada: as opcoes devem cobrir as regioes mais comuns relatadas por corredores (ex.: canela, joelho, tornozelo, coxa, panturrilha, quadril) mais uma opcao "outra" com texto livre complementar.

**Especificacao Tecnica**:
- Avaliar com o produto se a solucao e (a) enum fechado como `MuscleGroup`, ou (b) normalizacao leve (trim + capitalizacao consistente) mantendo texto livre.
- Se enum: replicar o padrao ja usado em `StrengthSessionRequest` (`MuscleGroup?` nulavel no contrato, guard clause no dominio).
- Se normalizacao: aplicar no `PainLog.Create` antes de persistir.

**Criterios de Aceite**:
- [ ] Decisao registrada (comentario ou ADR leve) sobre a abordagem escolhida.
- [ ] Registros com a mesma regiao mas grafias diferentes (ex.: "canela" vs "Canela") passam a ser tratados de forma consistente para fins de consulta/agregacao.
- [ ] Nenhuma regressao nos testes existentes de `PainLogEndpointTests`.

**Roteiro de Teste**:
1. **Teste 1**: registrar dor com "canela" e "Canela" em requisicoes separadas.
   - **Entrada**: dois `POST /api/pain-logs` com grafias diferentes da mesma regiao.
   - **Resultado Esperado**: ambos tratados como a mesma regiao apos a normalizacao/lista fechada.
2. **Teste 2**: tentar registrar dor sem regiao (regressao).
   - **Entrada**: `POST /api/pain-logs` com `region: ""`.
   - **Resultado Esperado**: `400`, mensagem de dominio inalterada.
