---
source: src/steady-app/src/planning/PlanningDocument.tsx
commit: ea9fcfa33fea1267443adf990b6b2950a8692c85
generated: 2026-10-10
layers: Tela (app/) -> Lógica (src/) -> Cliente HTTP (src/api) -> AsyncStorage / API
story: STORY-006, STORY-011, STORY-012, STORY-016, STORY-018, STORY-020
---

# PlanWeek - Plano - Débitos Técnicos

## Índice

- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: módulos de calendário puros, pequenos e testados; regras (estado derivado, janela de 168 dias) bem documentadas no código.
- **Principais Problemas**: o plano passou a ser do servidor (ADR-013), mas o app mantém uma cópia local e constantes de estrutura que podem divergir dele.
- **Impacto no Negócio**: uma nova versão do plano com outra estrutura quebraria cálculos de fase, janela e avanço sem erro visível.

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum comprovado nesta unidade.

### 🟡 Importantes

- **Estrutura do plano duplicada no cliente**: `PLAN_PHASES` e `PLAN_TOTAL_WEEKS = 24` são constantes locais, "espelhadas" do documento; o servidor agora publica versões do plano. Uma versão com outro número de semanas ou outras fases deixaria cabeçalho, janela e avanço inconsistentes com o documento exibido.
  - **Evidência**: `src/steady-app/src/planning/trainingProgress.ts:13-21`; `src/steady-app/src/planning/planWindow.ts` (usa `PLAN_TOTAL_WEEKS`).
  - **Ação Recomendada**: derivar fases e total de semanas do documento carregado, ou publicar esses valores no contrato do plano.
- **Título do dia por manipulação de texto**: `titleOf` faz `day.day.split(' — ')[1]`; se o texto publicado pelo servidor não tiver o separador, o título fica `undefined` na Dashboard.
  - **Evidência**: `src/steady-app/src/planning/todaysTraining.ts:25`.
  - **Ação Recomendada**: campo estruturado no contrato (`title`) e validação do documento ao ler da API.
- **Plano aceito da rede sem validação**: o documento chega como `as T` (ver [HttpClients](HttpClients-Integracao-Debts.md)); todos os módulos desta unidade assumem `weekPlan` com 7 itens e `exercises` presente.

### 🟢 Menores

- **Duas fontes do plano**: `TRAINING_PLAN_DOCUMENT` (286 linhas) continua no app e serve de valor padrão em `planDayParam` e `planProgress`, contra a decisão de nunca usar "a constante antiga como resposta silenciosa".
  - **Evidência**: `src/steady-app/src/planning/planDayParam.ts:16,26`; `src/steady-app/src/planning/planProgress.ts:42`.
- **"Editar dados" cria um pedido novo**: o link do cabeçalho abre o formulário vazio (`router.push('/planning/new')`); o rótulo sugere edição, mas pedidos são imutáveis.
  - **Evidência**: `src/steady-app/app/planning/plan.tsx:143`.
- **Componentes grandes**: `PlanningDocument.tsx` (386 linhas), `SemanaSection.tsx` (286) e `trainingPlanDocument.ts` (286) estão perto ou acima do limite de 300 linhas (FF-003).
- **`planProgress` divide por `total`** sem proteger `total = 0` (grade sem dia de treino).
  - **Evidência**: `src/steady-app/src/planning/planProgress.ts:74`.

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhum.
2. **Fase 2 - Importantes**: contrato do plano com estrutura e títulos, e validação na leitura.
3. **Fase 3 - Menores**: remover a constante local e renomear "Editar dados".

## 4. User Stories para Implementação

### Story 1: Estrutura do plano vinda do documento publicado

**Contexto Atual**: fases e total de semanas são constantes do app.

**Objetivo**: cabeçalho, janela e avanço sempre coerentes com a versão do plano que o corredor tem.

**Regras de Negócio**:

- Plano é versionado e imutável por versão (ADR-013).

**Especificação Técnica**:

- Incluir no documento o total de semanas e a faixa de cada fase; `trainingProgress` e `planWindow` passam a recebê-los.

**Critérios de Aceite**:

- [ ] Uma versão com 20 semanas mostra "Semana X de 20" e janela de 140 dias.
- [ ] Versão antiga continua exibindo as 24 semanas.

**Roteiro de Teste**:

1. **Teste 1**: documento com 20 semanas.
   - **Entrada**: prova daqui a 10 semanas.
   - **Resultado Esperado**: semana 11 de 20.
