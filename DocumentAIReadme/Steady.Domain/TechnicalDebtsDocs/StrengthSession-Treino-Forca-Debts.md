# StrengthSession - Treino-Forca - Débitos Técnicos

## Índice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: código pequeno e coeso, com boa cobertura de teste (`tests/Steady.Domain.Tests/StrengthSessionTests.cs`). Os guard clauses de obrigatoriedade (grupo muscular, intensidade) e de duração estão implementados e testados. O mapeamento `IntensityWeight` (Leve=3/Moderado=6/Pesado=9) é uma regra de negócio complexa, mas correta e rastreável a ADR-001 - não é débito técnico.
- **Principais Problemas**: uso de `Nullable<T>` para representar campo obrigatório ausente é funcional, mas é um padrão que pode confundir quem lê a assinatura pela primeira vez sem o contexto do guard clause; a mesma lacuna de "sem validação de data futura" observada em `RunningSession` também existe aqui.
- **Impacto no Negócio**: baixo - nenhum ponto abaixo compromete a regra de sobrecarga hoje.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum problema crítico identificado.

### 🟡 Importantes

- **Guard defensivo em `IntensityWeight` para "intensidade desconhecida" nunca exercitado por teste**: o `switch` de `IntensityWeight` tem um branch `_ => throw new ArgumentOutOfRangeException(...)` para lidar com um valor de `Intensity` fora do `enum` conhecido - cenário só alcançável via cast explícito inválido (ex: `(Intensity)99`), já que `Create` sempre recebe um `Intensity` do `enum` real quando não é nulo. Não há teste cobrindo esse branch.
  - **Ação Recomendada**: é defensive coding legítimo (enums em C# não são fechados), então não precisa virar guard clause de negócio. Se quiser fechar a cobertura, adicionar um teste unitário explícito exercitando o cast inválido - baixo risco, baixa prioridade.

### 🟢 Menores

- **Sem validação de data futura**: mesma lacuna de `RunningSession` - `Create` não rejeita `date` no futuro. Ver a análise equivalente em [`RunningSession-Treino-Corrida-Debts.md`](./RunningSession-Treino-Corrida-Debts.md); recomenda-se tratar as duas entidades juntas caso a decisão de produto seja "sim, validar".
  - **Ação Recomendada**: mesma recomendação de `RunningSession` - confirmar com produto e, se aprovado, aplicar a mesma regra nas duas entidades para manter consistência.
- **`Nullable<MuscleGroup>`/`Nullable<Intensity>` como sinalizador de obrigatoriedade**: funciona, mas é um padrão que exige conhecer o guard clause para entender por que os parâmetros são anuláveis (um `enum` já tem um valor padrão implícito, então a nulidade aqui é 100% intencional para forçar quem chama a lidar com "não informado"). Não é incorreto, mas merece um comentário XML no método explicando a escolha, para reduzir a curva de entendimento de quem lê o código pela primeira vez.
  - **Ação Recomendada**: adicionar `/// <param>` ou comentário curto acima de `Create` explicando que `null` representa "campo não informado" deliberadamente. Melhoria de legibilidade, sem urgência.

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhuma ação necessária.
2. **Fase 2 - Importantes**: opcionalmente, adicionar teste de cast inválido em `IntensityWeight` para fechar a cobertura defensiva.
3. **Fase 3 - Menores**: alinhar com a decisão de produto sobre data futura (junto com `RunningSession`, ver Story 2 daquele documento); adicionar comentário explicando o uso de `Nullable<T>` como sinalizador de obrigatoriedade.

## 4. User Stories para Implementação

### Story 1: Cobrir o guard defensivo de intensidade desconhecida com teste

**Contexto Atual**: `IntensityWeight` tem um branch de exceção para um valor de `Intensity` fora do `enum` conhecido, mas nenhum teste exercita esse caminho.

**Objetivo**: fechar a cobertura de teste do método privado `IntensityWeight`, documentando explicitamente que o comportamento é intencional (defesa contra cast inválido).

**Regras de Negócio**:
- Nenhuma regra de negócio nova - é hardening técnico de um caminho já implementado.

**Especificação Técnica**:
- Adicionar teste que force um valor de `Intensity` fora da faixa via cast explícito (ex: `(Intensity)99`) e verifique que `StrengthSession.Create` propaga a `ArgumentOutOfRangeException` de `IntensityWeight` ao acessar `Load`.
- Nota técnica: como `IntensityWeight` só é chamado dentro do getter de `Load` (calculado sob demanda), o teste precisa acessar a propriedade `Load`, não apenas chamar `Create` - a validação de intensidade desconhecida não acontece na criação, e sim no primeiro acesso a `Load`.

**Critérios de Aceite**:
- [ ] Teste unitário cobre o branch `_ => throw` de `IntensityWeight`.
- [ ] Nenhuma mudança de comportamento em produção - é teste puro.

**Roteiro de Teste**:
1. **Teste 1**: criar `StrengthSession` com `Intensity` válido, depois forçar um valor inválido via reflexão ou construir o cenário via cast antes de passar para `Create` (ex: `(Intensity)99` como argumento).
   - **Entrada**: `intensity = (Intensity)99`.
   - **Resultado Esperado**: acessar `session.Load` lança `ArgumentOutOfRangeException` com mensagem "Intensidade desconhecida.".

### Story 2: Documentar o uso de Nullable como sinalizador de campo obrigatório

**Contexto Atual**: `Create(DateOnly date, MuscleGroup? muscleGroup, Intensity? intensity, int durationMinutes)` usa tipos anuláveis para representar "campo obrigatório ausente", sem comentário explicando a escolha.

**Objetivo**: reduzir a curva de entendimento de quem lê o código pela primeira vez, deixando explícita a intenção de design.

**Regras de Negócio**:
- Nenhuma - é melhoria de documentação inline, sem impacto de comportamento.

**Especificação Técnica**:
- Adicionar comentário XML (`/// <summary>` ou `/// <param>`) acima de `Create` explicando: "muscleGroup e intensity são anuláveis para representar explicitamente 'campo não informado' na origem (ex: request HTTP), distinto do valor padrão do enum."

**Critérios de Aceite**:
- [ ] Comentário adicionado ao método `Create`.
- [ ] Nenhuma mudança de comportamento em produção.

**Roteiro de Teste**:
1. **Teste 1**: não aplicável - mudança é apenas documentação inline; validado por revisão de código, não por teste automatizado.
