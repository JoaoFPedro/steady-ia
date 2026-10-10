# Análise — STORY-014: Revisão de aderência após o treino com IA

> Análise de lacunas em 2026-08-30. Escopo: comparar o planejamento versionado
> da STORY-014 com o código e os testes existentes; nenhuma implementação foi
> realizada.

## 1. Scan de código relevante

### Base já disponível

- `Steady.Domain/Coaching`: `TrainingSheet`, `RunPrescription` e
  `StrengthWorkoutExecution` fornecem prescrição e execução da ficha. As
  STORIES 013, 015, 017 e 018 já entregaram esse caminho.
- `Steady.Domain/Planning/SteadyTrainingPlan`: fornece o plano versionado do
  Steady e seus sete dias. A STORY-016 já entregou domínio, seed, persistência,
  endpoint e cache no aplicativo.
- `Steady.Domain/Overload/OverloadDetectionService`: já calcula risco de
  sobrecarga com session-RPE, mas não compara execução com prescrição.
- `Steady.Infrastructure/Repositories`: já persiste e consulta plano, ficha,
  execuções, sessões e dor com isolamento por `CorredorId`.
- `Steady.Api/Endpoints/TrainingSheetEndpoints`: os endpoints de execução
  isolada e combinada são idempotentes; são o ponto após o qual a revisão deve
  ser criada, fora da transação do registro.
- O aplicativo já possui Dashboard, histórico, cache offline e visualizações
  de corredor/personal que podem receber a revisão.

### Lacunas confirmadas

Não existem símbolos, arquivos, entidades, tabelas, contratos, endpoints ou
testes para `AdherencePolicyVersion`, `WorkoutReview`, comparação de aderência,
`IExplanationProvider` ou `ClaudeExplanationProvider`. Portanto, os itens 2 a
10 de `tasks.md` permanecem sem implementação. Os seis itens marcados são
somente ADRs e atualização de decisões.

Também há dois drifts no plano:

1. `tasks.md` ainda marca STORY-015 e STORY-016 como pendentes, embora ambas
   estejam implementadas, revisadas e com todos os seus critérios fechados.
2. A dívida da STORY-017 informa que `DurationSeconds` ainda não é copiado para
   o snapshot de `ExerciseExecution`. Isso precisa ser resolvido antes de a
   STORY-014 comparar corretamente exercícios prescritos por tempo.

## 2. Análise de domínio

### Conceitos existentes

- Prescrição imutável: plano do Steady e versões de ficha do personal.
- Execução imutável e idempotente: corrida, musculação e execução combinada.
- Dor independente (`PainLog`) e avaliação de sobrecarga já calculada no
  servidor.
- Autorização por `CorredorId`, roles e vínculo ativo.

### Conceitos novos ainda ausentes

- `AdherencePolicyVersion`: tolerâncias e política de coerência imutáveis e
  versionadas.
- Resultado determinístico por campo: `Aderente`, `Divergente` ou
  `NaoComparavel`.
- Classificação consolidada, inclusive `ConflitoDePrescricao` e dia combinado.
- `WorkoutReview`: snapshot próprio, vinculado à execução, com versões,
  recomendação, explicação, confirmação e coerência.
- Porta `IExplanationProvider`, adaptador Claude, payload permitido e validação
  estrutural/semântica da resposta.

### Regras de negócio que governam a implementação

- Execução aderente não cria revisão nem chama IA.
- Dor na mesma data tem precedência e força `PriorizarRecuperacao`.
- Conflito ou dados insuficientes não produzem recomendação.
- A IA só explica fatos e a ação já calculados; nunca escolhe ação nem altera
  plano, ficha ou execução.
- Uma execução gera no máximo uma revisão; falha da IA não invalida o treino e
  não causa retentativa automática.
- A revisão e sua política preservam as versões usadas, sem reclassificação
  retroativa.
- O personal só lê a revisão enquanto houver vínculo ativo.

## 3. Direção estratégica

### Abordagem

Implementar a STORY-014 em fatias verticais, preservando a fronteira dos
ADRs 014–016:

1. Fechar o snapshot temporal da execução (`DurationSeconds`) e modelar/semear
   `AdherencePolicyVersion`.
2. Criar em `Steady.Domain/Adherence` o comparador puro e a política de
   segurança, com bateria TDD completa antes de qualquer IA.
3. Modelar e persistir `WorkoutReview` como fato separado, com unicidade por
   execução e snapshot das versões aplicadas.
4. Disparar a revisão depois do commit idempotente das execuções isolada e
   combinada. Não incluir a chamada externa na transação do treino.
5. Adicionar a porta do provedor, um duplo em memória e só então o adaptador
   Claude com timeout, allowlist de payload e validação de saída.
6. Expor consulta, `Entendi` e retentativa manual na API; depois integrar
   Dashboard, histórico do corredor e histórico autorizado do personal.
7. Avaliar coerência ao sincronizar o próximo treino elegível.

### Padrões

- **Domain Service/Strategy** para comparação e política versionada.
- **Repository** para política e revisão, seguindo o padrão existente.
- **Ports and Adapters** para `IExplanationProvider` e Claude.
- **Outbox transacional no PostgreSQL**, processada por worker idempotente, para
  evitar que uma queda entre salvar a execução e criar a revisão perca o
  trabalho.

### Fronteiras

Dentro: comparação, segurança determinística, persistência da revisão,
explicação limitada, APIs, telas e coerência. Fora: alterar automaticamente
treinos, diagnóstico, chat, wearables e reprocessamento histórico em massa.

## 4. Riscos e edge cases

- **Lacuna de atomicidade pós-commit — decisão:** usar outbox transacional no
  PostgreSQL. A mesma transação grava a execução e um evento `WorkoutRecorded`;
  um worker processa eventos pendentes com idempotência e registra sucesso ou
  falha. Assim, queda após o commit não perde a criação da revisão e a chamada
  ao provedor continua fora da transação do treino.
- **Prescrição histórica:** buscar apenas a ficha ativa atual compararia um
  treino antigo com a versão errada. A execução precisa guardar/resolver a
  referência imutável aplicável.
- **Identidade heterogênea:** corrida e musculação ficam em tabelas/tipos
  distintos; a unicidade de uma revisão por execução precisa de chave estável
  que também represente a execução combinada como uma unidade.
- **Tempo de exercício ausente no snapshot:** impede comparação fiel de
  prescrições temporizadas até a dívida da STORY-017 ser fechada.
- **Carga de musculação — direção proposta:** o `ExerciseId` atual não é uma
  identidade histórica, pois `TrainingSheetMapping.CreateExercises` gera um
  `Guid` novo em toda publicação. Introduzir `ExerciseKey`, estável entre
  versões quando o personal mantém/edita a mesma linha. A prescrição continua
  com seu id próprio e referencia a chave; exercício realmente novo recebe
  chave nova. A mediana é agrupada por `CorredorId + ExerciseKey`. Nome
  normalizado pode auxiliar migração/apresentação, mas não deve ser a chave.
- **Dor assíncrona — decisão de produto:** a pergunta sobre dor entra no
  encerramento e acompanha a execução na mesma unidade lógica. Essa resposta
  participa da revisão inicial, embora `PainLog` continue independente no
  domínio. Um registro avulso posterior não reabre nem reclassifica uma revisão
  já publicada.
- **Ordem temporal offline — decisão:** sincronização tardia pode recalcular a
  coerência já apresentada. O snapshot da comparação, a ação e a explicação da
  revisão permanecem imutáveis; apenas o estado derivado de coerência e sua
  `evaluatedAt`/versão são atualizados. O cálculo deve ordenar pela data real da
  execução, não pela data de sincronização.
- **Privacidade e fornecedor externo:** payload deve ser construído por
  allowlist e não pode conter ids, nome, e-mail, região da dor ou textos livres.
- **Disponibilidade/custo:** somente divergências chamam o provedor; timeout e
  falha mantêm comparação e ação disponíveis, sem retry automático.
- **Testes visuais:** o app ainda não possui harness de renderização compatível;
  Dashboard, pop-up, histórico e área do personal exigirão smoke test em
  aparelho além dos testes de lógica pura.

### Ambiguidades a fechar antes do RED

1. **Dor tardia:** resolvida pela pergunta no encerramento e envio na mesma
   unidade lógica; registro avulso posterior não altera revisão publicada.
2. **Processamento pós-commit:** outbox transacional no PostgreSQL com worker
   idempotente.
3. **Identidade do exercício:** `ExerciseKey` estável separado do id da
   prescrição. Falta decidir a UX/contrato que preserva a chave ao publicar uma
   nova ficha e a estratégia para fichas legadas.
4. **Coerência tardia:** pode ser recalculada; preservar histórico mínimo da
   avaliação (`evaluatedAt`, versão e execução considerada) para auditoria.
