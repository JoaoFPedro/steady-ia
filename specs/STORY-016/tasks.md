# Tasks — STORY-016

> Spec: [spec.bdd.md](./spec.bdd.md) · ADR-013
> Requer a STORY-015 concluída: esta story reutiliza o `RunPrescription` que
> ela cria. Não comece antes.

## 1. Domínio

- [x] Modelar `SteadyTrainingPlan` como documento versionado e imutável.
- [x] Cobrir por TDD a estrutura do documento: fases, visão semanal, plano da
      semana, taper, longão, mobilidade e regras.
- [x] Reutilizar o `RunPrescription` da STORY-015 nos dias de corrida do plano,
      sem duplicar o value object.
- [x] Provar que nenhuma regra de progressão é executada sobre o plano.

## 2. Persistência

- [x] Criar entidade, repositório e a associação corredor → versão.
- [x] Criar migration com o seed da versão 1.
- [x] Preencher no seed apenas o que o texto-fonte sustenta **no nível do
      dia**: terça, quinta e sábado do `weekPlan` nascem só com descrição, já
      que a fonte só declara número por fase (`longRunProgression`), nunca por
      dia — promover exigiria escolher a fase, que é cálculo de progressão.
- [x] Testar equivalência campo a campo entre o seed e `TRAINING_PLAN_DOCUMENT`.
- [x] Testar que nenhum campo numérico é derivado de outros dois.
- [x] Provar que publicar a versão 2 não realoca corredor da versão 1.

## 3. API

- [x] Associar a versão vigente no provisionamento do corredor e no `PlanRequest`.
- [x] Expor endpoint de leitura do plano do corredor.
- [x] Filtrar por `CorredorId` na query, nunca em memória (ADR-002).
- [x] Falhar o arranque quando não houver versão vigente (padrão da ADR-002).

## 4. Aplicativo

- [x] Criar tipos e leitura do plano pela API.
- [x] Adicionar cache offline no padrão do cache da ficha ativa.
- [x] Substituir `TRAINING_PLAN_DOCUMENT` como fonte em `PlanningDocument`,
      `SemanaSection`, `todaysTraining` e nos consumidores da Dashboard.
- [x] Sinalizar falha de leitura sem exibir plano vazio (ADR-004).
- [x] Exibir os números do dia de corrida quando presentes, e só a descrição
      quando ausentes.

## 5. Fechamento

- [x] Executar testes .NET e Jest, typecheck e cobertura.
- [x] Preencher `mapping.md` com cenário → arquivo real e estado RED/GREEN.
- [x] Marcar os critérios de aceite de `story.md`.
- [x] Atualizar `.sdd/memory/DOMAIN.md` na entrada "Plano de Treino (gerado)".
- [x] Executar `/review` e `/sync`.
