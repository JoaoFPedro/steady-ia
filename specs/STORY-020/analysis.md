# Análise — STORY-020: Mobilidade no início da aba Semana

> `/analyze` em 2026-08-29. Pedido: a seção hoje apresentada na aba
> **Mobilidade** deve passar a ser o início da aba **Semana**.

## 1. Scan de código relevante

### Frontend — `src/steady-app`

| Arquivo | Papel atual | Impacto esperado |
|---------|-------------|------------------|
| `src/planning/PlanningDocument.tsx` | Declara as cinco abas internas, escolhe a seção ativa e contém `MobilidadeSection` | Remover a aba visual `mobilidade` e compor seu conteúdo antes de `SemanaSection` |
| `src/planning/SemanaSection.tsx` | Renderiza estrutura semanal e detalhamento dos sete dias | Continua responsável pela semana; pode receber a mobilidade por composição no pai, sem incorporar outra responsabilidade |
| `src/planning/planDayParam.ts` | Define `SectionId` e valida `section` vindo da rota/deep link | Preservar compatibilidade convertendo o valor legado `mobilidade` em `semana` |
| `src/planning/__tests__/planDayParam.test.ts` | Cobre a validação das abas de entrada | Adicionar o caso de redirecionamento legado e manter o fallback de entradas inválidas |
| `src/planning/ExerciseList.tsx` | Lista compartilhada por Semana e Mobilidade | Sem alteração necessária |
| `app/planning/plan.tsx` | Lê `section` da URL e entrega `initialSection` ao documento | Sem alteração se a compatibilidade ficar centralizada em `sectionFromParam` |
| `app/(tabs)/index.tsx` | Dashboard abre o planejamento com `section=semana` e o dia atual | Sem alteração; a entrada principal já aponta para a seção que receberá Mobilidade |

### Dependências e padrões em uso

- Não há dependência nova, chamada de API, persistência ou alteração de contrato.
- `TrainingPlanDocument.mobility` já chega junto com `weekOverview` e
  `weekPlan`; trata-se somente de reorganização da apresentação.
- `PlanningDocument` atua como compositor das seções, enquanto
  `SemanaSection` concentra interação e estado dos dias. Manter essa fronteira
  evita misturar mobilidade com a lógica de expansão/registro diário.
- Parâmetros de rota são tratados como entrada externa por funções puras e
  cobertas por Jest (`planDayParam.ts`).

## 2. Análise de domínio

### Conceitos existentes

- **Mobilidade do plano**: dois blocos de conteúdo prescritos em
  `TrainingPlanDocument.mobility`, cada um com título e exercícios.
- **Semana do plano**: visão do split semanal e detalhamento dos sete dias,
  incluindo ficha do personal, corrida, estado de conclusão e registro de hoje.
- **Seção de navegação**: escolha de apresentação local; não é entidade de
  domínio nem dado persistido.

### Conceitos novos

Nenhum. A mudança não cria regra de treino, prescrição ou estado. Ela apenas
reagrupa conteúdo que já pertence ao mesmo plano.

### Regras explícitas e implícitas

1. Ao selecionar **Semana**, a mobilidade deve aparecer primeiro; abaixo dela
   continuam a estrutura semanal e o detalhamento dos dias.
2. **Mobilidade** deixa de existir como aba independente para evitar o mesmo
   conteúdo em dois lugares.
3. Um link antigo com `section=mobilidade` deve abrir **Semana**, não “Seus
   dados”. Links com valor realmente desconhecido continuam abrindo “Seus
   dados”, preservando a regra da STORY-012.
4. A entrada da Dashboard (`section=semana&day=N`) ainda precisa abrir o dia e
   rolá-lo para a posição correta, agora depois do conteúdo de mobilidade.

## 3. Direção estratégica

### Abordagem recomendada

1. Em `PlanningDocument.tsx`, retirar `mobilidade` da lista visual de abas.
2. No ramo `section === 'semana'`, renderizar `MobilidadeSection` imediatamente
   antes de `SemanaSection`.
3. Manter `MobilidadeSection` como componente separado no mesmo arquivo: a
   mudança é composição, não uma fusão das responsabilidades internas.
4. Em `planDayParam.ts`, retirar `mobilidade` do tipo canônico `SectionId`, mas
   aceitar esse texto como alias legado e devolvê-lo como `semana`.
5. Atualizar `planDayParam.test.ts` para fixar o contrato de compatibilidade.
6. Na implementação, validar também o fluxo da Dashboard com dia aberto, pois o
   cálculo de rolagem passa a incluir a altura da mobilidade precedente.

### Padrão de design

**Composição de componentes + normalização na fronteira.** O documento compõe
os dois blocos na mesma aba; `sectionFromParam` traduz a representação antiga
para o estado interno atual. Não há motivo para novo módulo, service, repository
ou ADR.

### Fronteiras

**Dentro do escopo:** remover a aba Mobilidade; colocar todo o conteúdo dela no
topo de Semana; preservar deep links antigos; ajustar testes unitários da rota;
verificar a abertura e rolagem automática do dia vindo da Dashboard.

**Fora do escopo:** mudar exercícios/textos de mobilidade; relacionar exercícios
a dias específicos; alterar o plano persistido ou seu endpoint; mudar a ordem
das demais abas; redesenhar a estrutura semanal; alterar registro de treino.

## 4. Riscos e edge cases

| # | Risco / caso de borda | Impacto | Mitigação |
|---|-----------------------|---------|-----------|
| R1 | Remover `mobilidade` sem alias quebra links/favoritos antigos, que cairiam em `dados` | Médio | `sectionFromParam('mobilidade')` deve retornar `semana` e ter teste dedicado |
| R2 | O dia aberto pela Dashboard fica mais abaixo depois da inclusão da mobilidade | Médio | Preservar o cálculo por `onLayout` já existente e validar que a rolagem alcança o dia expandido sem voltar ao topo |
| R3 | Duplicar Mobilidade no topo de Semana sem retirar a aba independente cria duas fontes visuais | Baixo | Remover a aba e o ramo isolado no mesmo change set |
| R4 | `useState(initialSection)` não reage se apenas o parâmetro mudar com a tela já montada | Baixo, preexistente | O fluxo normal remonta/focaliza a rota; não ampliar o escopo sem reproduzir falha real |
| R5 | A aba Semana fica longa e o conteúdo operacional do dia exige mais rolagem | Médio, consequência direta do pedido | Manter a rolagem automática para a entrada da Dashboard; entrada manual na Semana começa deliberadamente pela Mobilidade |
| R6 | Documento sem blocos de mobilidade por falha/versão futura mostraria um início vazio | Baixo | A versão vigente garante dois blocos; ainda assim, a composição naturalmente segue para a semana quando o array estiver vazio |

### Ambiguidade assumida nesta análise

“Ser o início da aba Semana” foi interpretado como: **todo o conteúdo atual de
Mobilidade aparece antes de “Estrutura semanal”, e a aba Mobilidade é removida**.
Manter a aba e apenas duplicar o conteúdo não é recomendado, porque cria duas
entradas para a mesma informação e reduz espaço no cabeçalho.
