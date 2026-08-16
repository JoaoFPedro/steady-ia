# StrengthSessionEndpoints - Treino-Forca - Debitos Tecnicos

## Indice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Acao](#3-plano-de-acao)
- [4. User Stories para Implementacao](#4-user-stories-para-implementacao)

## 1. Resumo Executivo
- **Estado Atual**: mesma estrutura e mesmo nivel de maturidade de `RunningSessionEndpoints` - guard clause no dominio + `DomainFactory.TryCreate` + repository escopado por corredor. Coberto por `tests/Steady.Api.Tests/StrengthSessionEndpointTests.cs`.
- **Principais Problemas**: mesma inconsistencia de `Location` no `201 Created` observada em `RunningSessionEndpoints`; ausencia de tratamento de excecao generica; e um risco especifico desta rota - os enums `MuscleGroup`/`Intensity` sao persistidos como `string` no banco (`HasConversion<string>()`), o que cria acoplamento silencioso entre o nome do enum em C# e o dado ja gravado no PostgreSQL.
- **Impacto no Negocio**: risco medio de longo prazo - renomear um valor de enum (`MuscleGroup`/`Intensity`) sem migracao de dados quebra silenciosamente a leitura de sessoes ja persistidas (o valor salvo como texto deixa de bater com o enum em C#).

## 2. Problemas por Criticidade

### Criticos
- Nenhum problema critico identificado nesta rota especifica.

### Importantes
- **Acoplamento entre nome do enum em C# e dado persistido como string**: `SteadyDbContext.OnModelCreating` configura `MuscleGroup` e `Intensity` com `.HasConversion<string>()`. Isso e mais legivel no banco do que gravar o inteiro do enum, mas significa que renomear um membro do enum (ex.: `PernaFrontal` -> `PernaAnterior`) quebra silenciosamente a leitura de registros ja gravados, sem erro de compilacao para avisar.
  - **Acao Recomendada**: documentar essa decisao no codigo (comentario proximo ao `HasConversion<string>()`) e tratar qualquer rename de `MuscleGroup`/`Intensity` como uma migracao de dados obrigatoria, nao apenas uma mudanca de codigo.
- **Sem tratamento para excecoes fora de `ArgumentException`**: mesmo debito identificado em [RunningSessionEndpoints Debts](./RunningSessionEndpoints-Treino-Corrida-Debts.md) - falha de persistencia nao tratada retorna 500 sem padronizacao.
  - **Acao Recomendada**: mesma acao recomendada la - middleware global de excecao com `ProblemDetails`.

### Menores
- **`Location` do `201 Created` aponta para `/api/training-sessions/{id}`**, nao para uma rota propria de `strength-sessions/{id}` (que nao existe). Mesmo padrao observado em `RunningSessionEndpoints`.
  - **Acao Recomendada**: resolver em conjunto com a Story 2 de [RunningSessionEndpoints Debts](./RunningSessionEndpoints-Treino-Corrida-Debts.md#story-2-resolver-a-inconsistencia-do-header-location-no-201-created), aplicando a mesma decisao a todos os tipos de sessao.
- **Duplicacao de padrao de criacao entre endpoints**: mesmo ponto ja registrado em `RunningSessionEndpoints Debts` - a estrutura `TryCreate -> AddAsync -> Results.Created` se repete em tres arquivos.
  - **Acao Recomendada**: mesma recomendacao - so extrair um helper generico se um quarto tipo de sessao surgir (regra DRY 3x).

## 3. Plano de Acao
1. **Fase 1 - Criticos**: nao ha itens nesta fase.
2. **Fase 2 - Importantes**: documentar o acoplamento enum-string no banco e o processo obrigatorio de migracao para renames; aplicar o middleware global de excecao (compartilhado com a Story 1 de `RunningSessionEndpoints Debts`).
3. **Fase 3 - Menores**: resolver o `Location` do `201` em conjunto com os demais endpoints de criacao de sessao; monitorar necessidade de extracao de helper de criacao.

## 4. User Stories para Implementacao

### Story 1: Documentar e proteger o acoplamento enum-string em MuscleGroup e Intensity

**Contexto Atual**: `MuscleGroup` e `Intensity` sao persistidos como `string` via `HasConversion<string>()`, criando dependencia implicita entre o nome do membro do enum em C# e o valor ja salvo no banco, sem qualquer teste ou processo formal que proteja contra rename acidental.

**Objetivo**: garantir que qualquer alteracao futura nos enums `MuscleGroup`/`Intensity` passe por um processo consciente de migracao de dados, evitando corrupcao silenciosa de registros historicos.

**Regras de Negocio**:
- Nenhum valor de `MuscleGroup` ou `Intensity` pode ser renomeado sem uma migracao de dados que atualize os registros existentes na tabela `strength_sessions`.
- A adicao de novos valores ao enum e segura (nao quebra dados existentes); apenas rename/remocao e o risco.

**Especificacao Tecnica**:
- Adicionar comentario XML no `SteadyDbContext.OnModelCreating`, proximo as linhas de `HasConversion<string>()`, explicando o risco.
- Adicionar um teste de regressao (`Steady.Infrastructure.Tests` ou equivalente) que falhe se os valores de `MuscleGroup`/`Intensity` mudarem sem atualizacao explicita do teste (snapshot dos nomes esperados).

**Criterios de Aceite**:
- [ ] Comentario explicativo presente no `SteadyDbContext`.
- [ ] Teste de regressao cobrindo os nomes atuais de `MuscleGroup` e `Intensity` existe e falha propositalmente se um nome for alterado sem atualizacao do teste.
- [ ] Processo de rename documentado (ex.: checklist no PLAYBOOK ou ADR leve) exigindo migracao de dados.

**Roteiro de Teste**:
1. **Teste 1**: renomear temporariamente um valor do enum `MuscleGroup` em um branch de teste local e confirmar que o teste de regressao falha.
   - **Entrada**: `PernaFrontal` renomeado para `PernaAnterior` sem migracao.
   - **Resultado Esperado**: teste de regressao falha, alertando o desenvolvedor antes do merge.
2. **Teste 2**: adicionar um novo valor ao enum (ex.: `Antebraco`) sem alterar os existentes.
   - **Entrada**: novo membro de enum adicionado.
   - **Resultado Esperado**: teste de regressao nao falha (adicao e segura).

### Story 2: Middleware global de tratamento de excecao (compartilhada com RunningSessionEndpoints)

**Contexto Atual**: identico ao descrito em [RunningSessionEndpoints Debts - Story 1](./RunningSessionEndpoints-Treino-Corrida-Debts.md#story-1-padronizar-respostas-de-erro-500-com-problemdetails). Esta rota tambem se beneficia diretamente da mesma solucao.

**Objetivo**: garantir que uma falha de persistencia ao registrar musculacao tambem retorne um `500` padronizado, sem vazar detalhes internos.

**Regras de Negocio**: identicas a Story 1 de `RunningSessionEndpoints Debts` - nao ha regra de negocio especifica a musculacao aqui, e um debito de infraestrutura compartilhado.

**Especificacao Tecnica**: mesma implementacao do middleware global - nao ha trabalho adicional especifico para `strength-sessions` alem de garantir cobertura de teste para este endpoint tambem.

**Criterios de Aceite**:
- [ ] `POST /api/strength-sessions` retorna `500` com `ProblemDetails` quando a persistencia falha.
- [ ] Erros `400` de guard clause de musculacao continuam com o formato atual, sem regressao.

**Roteiro de Teste**:
1. **Teste 1**: forcar falha de persistencia com dados de musculacao validos.
   - **Entrada**: `POST /api/strength-sessions` valido, banco indisponivel.
   - **Resultado Esperado**: `500`, corpo `ProblemDetails`.
2. **Teste 2**: reenviar cenario existente de grupo muscular ausente.
   - **Entrada**: `POST /api/strength-sessions` com `muscleGroup: null`.
   - **Resultado Esperado**: `400`, mensagem de dominio inalterada.
