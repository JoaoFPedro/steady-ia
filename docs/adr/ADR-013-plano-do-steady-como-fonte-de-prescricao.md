# ADR-013: Plano do Steady persistido como fonte de prescrição

> **Data**: 2026-08-28
> **Status**: Accepted
> **Story**: STORY-016
> **Decisores**: Produto e Engenharia Steady

## Contexto

A STORY-014 exige que a revisão considere simultaneamente o plano do Steady e a
ficha ativa do personal, e que prescrições conflitantes entre as duas fontes
sejam mostradas como `ConflitoDePrescricao` sem que nenhuma prevaleça.

O plano do Steady, hoje, não é dado: é conteúdo estático em
`src/steady-app/src/planning/trainingPlanDocument.ts`, igual para todos os
corredores, existente apenas no aplicativo. O `PlanRequest` (ADR-007) persiste
o **pedido**, nunca um plano. `DOMAIN.md` registra "Plano de Treino (gerado) —
não implementado".

A comparação da STORY-014 roda no servidor, depois da sincronização. Ela não
alcança um arquivo TypeScript do bundle. Sem mover o plano para o servidor não
existe segunda fonte, e o conflito entre fontes é indetectável.

A decisão de produto de 2026-08-22 adiou a **geração** do plano. Este ADR não a
reverte: persistir um documento existente não é gerá-lo.

## Opções Consideradas

### Opção A: Manter o plano só no app e comparar apenas contra a ficha

- **Prós**: nenhuma migração de conteúdo; escopo menor.
- **Contras**: corredor sem personal — que é a maioria no piloto — nunca recebe
  revisão; `ConflitoDePrescricao` sai da story; contraria o critério de aceite
  que pede as duas fontes.

### Opção B: O app envia a prescrição do plano junto com a execução

- **Prós**: aproveita o documento estático sem mudar o banco.
- **Contras**: a prescrição passa a vir do cliente, que pode alterá-la; viola
  FF-004 (o app exibe, não decide) e destrói a reprodutibilidade da revisão.

### Opção C: Persistir o plano por corredor como documento versionado

- **Prós**: uma fonte de verdade no servidor para as duas prescrições; conflito
  detectável; abre caminho para a geração futura sem retrabalho de contrato.
- **Contras**: adiciona tabela, migration e um seed do documento atual; o app
  precisa passar a ler o plano da API em vez da constante local.

## Decisão

Escolhemos **Opção C**.

- Nasce `SteadyTrainingPlan`: documento de plano **por corredor**, versionado e
  imutável, com o mesmo formato do documento estático de hoje acrescido, nos
  dias de corrida, do mesmo `RunPrescription` opcional definido pela ADR-012.
- O corredor recebe uma versão do plano vigente ao ser provisionado ou ao ter um
  `PlanRequest` aceito. O conteúdo inicial é a **transcrição literal** do
  documento atual — nada é gerado.
- Os campos numéricos do seed só são preenchidos onde o texto-fonte sustenta um
  número **no nível do dia**. O documento só declara números no nível da
  **fase** (`longRunProgression`: uma faixa de distância do longão por fase,
  não por dia) — encaixar uma dessas faixas na terça, quinta ou sábado do
  `weekPlan` exigiria escolher uma fase, e escolher a fase de um corredor é
  cálculo de progressão, que esta story não faz. Por isso os três dias de
  corrida do `weekPlan` nascem só com descrição; `distanceKm`, `durationMinutes`
  e `perceivedEffort` ficam ausentes nos três, e cada campo permanece
  `NãoComparável` até uma story futura resolver a fase.
- `longRunProgression` é preservado como está — texto por fase, à parte do
  `weekPlan` — porque é exatamente essa a granularidade que a fonte sustenta.
  Nenhum número é interpolado nem promovido ao nível do dia — a ADR-006 já foi
  superada por exatamente esse tipo de erro.
- O app deixa de usar `TRAINING_PLAN_DOCUMENT` como fonte e passa a ler o plano
  do corredor pela API, com o mesmo cache offline da ficha ativa. A constante
  permanece apenas como conteúdo do seed no servidor.
- **Conflito**: plano e ficha têm a mesma autoridade. Quando ambos prescrevem
  corrida no mesmo dia e existe pelo menos um campo numérico comparável em cada
  um cujas faixas não se interceptam sob a tolerância vigente, o resultado é
  `ConflitoDePrescricao`: nenhuma fonte é escolhida e nenhuma recomendação é
  gerada. Divergência apenas textual **não** é conflito — o código não
  interpreta prosa.
- Só a ficha prescrevendo, ou só o plano, a comparação usa a fonte existente sem
  conflito.

## Consequências

### Positivas

- Corredor sem personal recebe revisão, que era o caso majoritário do piloto.
- A prescrição comparada é a que o servidor guardou, não a que o cliente enviou.
- O plano deixa de ser idêntico para todos por limitação técnica e passa a ser
  idêntico para todos por conteúdo — a diferença que a geração futura precisa.

### Negativas

- Migration com seed de conteúdo, que é mais pesada que uma migration de schema.
- A aba Planejamento passa a depender de leitura da API, com o estado de falha
  correspondente (ADR-004: falha de leitura nunca vira lista vazia).
- Escopo da STORY-014 cresce em uma frente inteira antes de qualquer revisão.

### Riscos

- Detecção de conflito ruidosa, disparando pop-up em dia normal → conflito
  exige campos numéricos em ambas as fontes e faixas disjuntas sob tolerância;
  na dúvida, não há conflito.
- Seed divergir do documento que o corredor já lê → teste comparando o seed com
  `TRAINING_PLAN_DOCUMENT` campo a campo.
- Confundir persistir com gerar → o plano é imutável por versão; nenhuma regra
  de progressão roda sobre ele nesta story.

## Referências

- `specs/STORY-014/spec.bdd.md` — `Plano e ficha possuem corridas conflitantes`
- ADR-006 — interpolação do longão semanal (superada; precedente de por que não interpolar)
- ADR-007 — persistência do pedido de plano de treino
- ADR-012 — prescrição de corrida estruturada na ficha do personal
- `.sdd/PROJECT-CONSTITUTION.md` — FF-004
