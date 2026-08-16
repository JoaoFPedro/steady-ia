# RunningSession - Treino-Corrida - Débitos Técnicos

## Índice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: código pequeno, coeso e bem coberto por testes (`tests/Steady.Domain.Tests/RunningSessionTests.cs`). Os 3 guard clauses centrais (distância, duração, escala de esforço) estão implementados e testados exatamente como descrito na spec. Não há débito estrutural relevante.
- **Principais Problemas**: gaps de validação em campos não cobertos pela spec original (ritmo médio, data futura) e ausência de semântica de igualdade (`Equals`/`GetHashCode`) para uma entidade que hoje só é comparável por referência.
- **Impacto no Negócio**: baixo — nenhum dos pontos abaixo compromete a regra de sobrecarga (ADR-001) hoje. São lacunas de robustez, não bugs ativos.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum problema crítico identificado.

### 🟡 Importantes

- **`averagePaceMinPerKm` sem validação de negócio**: `Create` aceita qualquer valor para o ritmo médio, incluindo zero ou negativo, sem lançar exceção. Diferente de `distanceKm` e `durationMinutes`, que têm guard clause explícita.
  - **Ação Recomendada**: confirmar com produto se ritmo negativo/zero é um estado válido (ex: campo opcional/calculado futuramente) ou se deve ganhar guard clause simétrica às demais (`averagePaceMinPerKm <= 0` → `ArgumentOutOfRangeException`). Não é um débito "óbvio" — é uma decisão de negócio ainda não tomada explicitamente na spec (`specs/STORY-001/spec.bdd.md` não menciona validação de ritmo).

### 🟢 Menores

- **Sem validação de data futura**: `Create` não rejeita `date` no futuro (ex: registrar uma corrida "de amanhã"). Pode ser intencional (permitir correção de fuso/backfill), mas não há teste nem comentário confirmando a intenção.
  - **Ação Recomendada**: se for regra de negócio real, adicionar guard clause e cenário BDD correspondente; se for intencional, registrar a decisão em comentário ou ADR curto para não virar dúvida recorrente em code review.
- **Ausência de `Equals`/`GetHashCode`/`ToString`**: `RunningSession` é comparada apenas por referência. Testes atuais contornam isso comparando propriedade a propriedade (`Assert.Equal(date, session.Date)` etc.), o que funciona mas é verboso e frágil a novos campos.
  - **Ação Recomendada**: se a entidade crescer ou passar a ser usada em coleções/comparações (ex: deduplicação), considerar `record class` ou overrides manuais. Baixa prioridade — não há uso atual que dependa disso.

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhuma ação necessária.
2. **Fase 2 - Importantes**: levar a validação (ou não) de `averagePaceMinPerKm` para discussão de produto; se confirmada como regra, tratar como uma pequena extensão de spec (`spec.bdd.md`) antes de tocar no código, conforme o fluxo `/spec` → `/implement` do projeto.
3. **Fase 3 - Menores**: revisar necessidade de validação de data futura; avaliar `Equals`/`GetHashCode` apenas se surgir um caso de uso real que precise de comparação por valor.

## 4. User Stories para Implementação

### Story 1: Validar ritmo médio da corrida

**Contexto Atual**: `RunningSession.Create` não valida `averagePaceMinPerKm`, permitindo valores zero ou negativos, inconsistente com o tratamento dado a `distanceKm` e `durationMinutes`.

**Objetivo**: decidir e, se aplicável, implementar uma regra de validação para o ritmo médio, alinhando o campo ao mesmo padrão de robustez dos demais.

**Regras de Negócio**:
- A confirmar com produto: ritmo médio deve ser maior que zero (não pode existir ritmo negativo ou nulo fisicamente).

**Especificação Técnica**:
- Se aprovado, adicionar guard clause em `RunningSession.Create`: `if (averagePaceMinPerKm <= 0) throw new ArgumentOutOfRangeException(nameof(averagePaceMinPerKm), averagePaceMinPerKm, "O ritmo médio deve ser maior que zero.")`.
- Atualizar `specs/STORY-001/spec.bdd.md` com o novo cenário de erro antes de implementar (conforme fluxo `/spec` do projeto).

**Critérios de Aceite**:
- [ ] Registrar sessão com `averagePaceMinPerKm` <= 0 é rejeitado com mensagem clara.
- [ ] Sessões válidas continuam sendo aceitas sem alteração de comportamento.
- [ ] Cenário correspondente documentado em `spec.bdd.md` e mapeado em `RunningSessionTests.cs`.

**Roteiro de Teste**:
1. **Teste 1**: registrar corrida com `averagePaceMinPerKm = 0`.
   - **Entrada**: demais campos válidos, ritmo = 0.
   - **Resultado Esperado**: `ArgumentOutOfRangeException` com mensagem sobre ritmo inválido.
2. **Teste 2**: registrar corrida com `averagePaceMinPerKm = 5.5` (valor válido).
   - **Entrada**: demais campos válidos, ritmo = 5.5.
   - **Resultado Esperado**: sessão criada normalmente, sem exceção.

### Story 2: Definir política para datas futuras

**Contexto Atual**: `RunningSession.Create` aceita qualquer `DateOnly`, incluindo datas futuras, sem guard clause nem documentação da intenção.

**Objetivo**: eliminar a ambiguidade — decidir explicitamente se datas futuras são permitidas e por quê.

**Regras de Negócio**:
- A confirmar com produto: sessão de corrida não pode ter `date` posterior à data atual do sistema.

**Especificação Técnica**:
- Se aprovado, adicionar guard clause comparando `date` com `DateOnly.FromDateTime(DateTime.UtcNow)` (ou injetar um `IClock`/parâmetro de "hoje" para manter a testabilidade determinística, seguindo o padrão já usado em `OverloadDetectionService.Evaluate`, que recebe `today` como parâmetro em vez de ler o relógio internamente).

**Critérios de Aceite**:
- [ ] Decisão de produto registrada (aceitar ou rejeitar datas futuras), com justificativa.
- [ ] Se rejeitar: guard clause implementada e testada.
- [ ] Se aceitar: comentário no código explicando o motivo, para não virar dúvida recorrente.

**Roteiro de Teste**:
1. **Teste 1**: registrar corrida com `date` = amanhã.
   - **Entrada**: `date` no futuro, demais campos válidos.
   - **Resultado Esperado**: conforme decisão de produto (exceção ou sucesso).
2. **Teste 2**: registrar corrida com `date` = hoje.
   - **Entrada**: `date` = hoje, demais campos válidos.
   - **Resultado Esperado**: sessão criada normalmente, sem exceção.
