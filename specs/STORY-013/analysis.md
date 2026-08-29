# Análise — mover Treinos para uma seção de Planejamento

> Data: 2026-08-25  
> Story relacionada: STORY-013  
> Escopo desta análise: navegação e composição da interface; sem alteração da lógica de coaching.

## 1. Scan de código relevante

### Pontos afetados

- `src/steady-app/app/(tabs)/_layout.tsx` declara `workouts` como aba principal
  ao lado de Dashboard, Planejamento e Personal.
- `src/steady-app/app/(tabs)/workouts.tsx` concentra a tela do corredor:
  carregamento da ficha com cache, solicitações e vínculo ativo, aceite e
  encerramento do vínculo, estados de loading/falha offline e navegação para a
  execução de corrida ou musculação.
- `src/steady-app/app/(tabs)/planning.tsx` é hoje a entrada da área de
  Planejamento e lista os planejamentos do corredor.
- `src/steady-app/app/planning/plan.tsx` e
  `src/steady-app/src/planning/PlanningDocument.tsx` representam um
  planejamento individual. Suas seções (`dados`, `fases`, `semana`,
  `mobilidade`, `regras`) dependem de um `PlanRequestSummary` selecionado.
- `src/steady-app/src/coaching/trainingSheetCache.ts`, `services.ts` e
  `httpCoachingApi.ts` fornecem a lógica já usada pela tela. Não precisam mudar
  para a realocação.
- As rotas de execução `/coaching/strength` e `/log/run` continuam válidas e
  não dependem de a origem ser uma aba principal.

### Dependências e padrões existentes

- Navegação por arquivos com Expo Router.
- Recarregamento ao focar a área por `useFocusEffect`.
- Composição de serviços no `services.ts`.
- Cache stale-while-offline da ficha via `TrainingSheetCache`.
- Separação já praticada entre tela/rota e lógica pura ou serviço de dados.

## 2. Análise de domínio

### Conceitos existentes

- **Planejamento do corredor**: na linguagem do produto, é a ficha ativa
  prescrita pelo personal, com exatamente quatro tipos de treino e substituível
  sem reescrever o histórico.
- **Pedido de plano de corrida (`PlanRequest`)**: estrutura legada que hoje
  alimenta a lista e o documento estático de corrida. O nome técnico não deve
  criar uma segunda noção concorrente de planejamento na interface.
- **Execução**: registro imutável e offline-first; musculação referencia a ficha
  e corrida reutiliza `RunningSession`.
- **Vínculo**: controla acesso e também é administrado hoje na tela Treinos.

### Conceitos novos

- **Prescrições de corrida por dia**: o único treino lógico `Run` continua
  representado por um card, mas contém três entradas distintas, destinadas a
  terça, quinta e sábado.

A decisão esclarecida pelo produto é: **a ficha do personal é o planejamento**.
Seus treinos passam a preencher o detalhamento diário da seção Semana; não
existe uma seção “Treinos” separada.

### Regras que devem permanecer

- A ficha continua acessível sem conexão quando houver cache.
- Solicitações de vínculo, aceite e encerramento mantêm o comportamento atual.
- O corredor pode escolher qualquer um dos quatro treinos; a sugestão do plano
  não restringe a escolha.
- Corrida continua abrindo `/log/run` com a prescrição daquele dia;
  musculação continua
  abrindo `/coaching/strength`.
- Autorização, cache e fila offline permanecem. O contrato e o documento JSON
  da ficha precisam evoluir para transportar as três prescrições de corrida.

## 3. Direção estratégica

### Abordagem recomendada

Não criar uma nova seção interna. A ficha ativa deve alimentar a seção existente
**Semana**, especificamente o bloco “Detalhamento de cada dia”. Os exercícios
estáticos de `TRAINING_PLAN_DOCUMENT.weekPlan[*].exercises` deixam de ser o
conteúdo apresentado e são substituídos pelas prescrições publicadas pelo
personal.

A composição recomendada é:

1. `app/planning/plan.tsx` carrega a ficha ativa usando o
   `TrainingSheetCache`, em paralelo às leituras já existentes.
2. `PlanningDocument` recebe a ficha como dado opcional e a encaminha para
   `SemanaSection`.
3. Uma função pura resolve qual `WorkoutPrescription` pertence a cada dia:
   segunda/sexta usam Inferiores, terça usa Empurrada + Corrida de terça,
   quarta usa Empurrada, quinta usa Puxada + Corrida de quinta, sábado usa
   Corrida de sábado e domingo permanece descanso.
4. `DayRow` exibe nome, séries e repetições da prescrição resolvida e abre a
   execução correspondente. A corrida usa a descrição específica do dia.
5. A aba principal `workouts` é removida porque o mesmo fluxo passa a nascer no
   detalhe do dia.
6. O card Corrida na tela do personal mantém um único agrupamento visual, com
   três campos obrigatórios: **Terça**, **Quinta** e **Sábado**.

O conteúdo estático pode permanecer temporariamente como estrutura de
calendário (`day`, ordem, presença de corrida e textos de fase), mas não como
fonte dos exercícios. A ficha do personal se torna a fonte canônica do treino
prescrito.

### Padrão de design

- **Adapter/selector puro**: uma função converte dia do calendário + ficha ativa
  no treino que será exibido. Isso isola a regra de encaixe e permite BDD/Jest
  sem teste de renderização.
- Não introduzir novo service, facade ou estado global. O cache e a API atuais
  permanecem.
- `SemanaSection` continua sendo componente de apresentação e recebe a
  prescrição já resolvida ou dados suficientes para resolvê-la sem rede.

### Dentro do escopo

- Remover Treinos da barra inferior.
- Substituir os exercícios estáticos no detalhamento diário pelos treinos da
  ficha ativa.
- Preservar integralmente carregamento, cache, vínculo e abertura de execução.
- Remover a aba principal Treinos e ajustar testes de navegação/apresentação.
- Exibir estado explícito quando não houver ficha ativa ou ela não puder ser
  carregada.

### Fora do escopo

- Alterar autorização, vínculo, execução, histórico ou tabelas relacionais.
- Mudar regras de carga, notas, histórico ou sincronização.
- Redesenhar a área Personal do profissional.

## 4. Riscos, edge cases e ambiguidades

### Riscos técnicos

- **Contrato incompatível**: `PublishTrainingSheetBody`, `TrainingSheetDraft`,
  `RunningWorkout`, `WorkoutPrescriptionResponse` e o documento JSON hoje
  possuem apenas `RunDescription`. Todos precisam representar as três entradas
  sem criar três workouts do tipo `Run`, pois a invariável continua sendo uma
  ficha com quatro cards/tipos.
- **Compatibilidade do JSON existente**: fichas já persistidas contêm somente
  `runDescription`. A desserialização deve aceitar o formato anterior durante
  a transição, ou a migration precisa transformar os documentos existentes.
  Como a coluna é `jsonb`, não é necessária mudança de tabela, mas o formato é
  persistência e exige estratégia explícita.
- **Quarta-feira/Empurrada**: o calendário atual chama o dia de “Ombro”. A
  direção consolidada usa a ficha Empurrada nesse dia; os títulos estáticos
  precisam deixar de contradizer a prescrição recebida.
- **Progresso diário**: `dayRequirements` usa `day.exercises.length` para
  concluir que existe musculação. Depois da substituição, essa regra deve usar
  a prescrição resolvida; manter a lista estática apenas para esse cálculo
  produziria dias “previstos” sem treino real.
- **Registro legado versus execução da ficha**: o botão atual da Semana abre
  `/log/strength`, que grava `StrengthSession`. A ficha usa
  `/coaching/strength`, que grava a execução com cargas e snapshot. O botão deve
  migrar para o segundo fluxo quando houver prescrição da ficha, preservando o
  primeiro apenas se houver fallback explicitamente aprovado.
- **Estado ao voltar da execução**: a ficha deve ser relida ao focar novamente
  o planejamento, preservando o comportamento atual de `useFocusEffect`; o
  cache reduz o custo e mantém o funcionamento offline.
- **Rota antiga**: links ou navegações para `/(tabs)/workouts` quebram se a rota
  for removida. O repositório não possui outras referências além do layout,
  mas convém testar o novo destino e, se houver links externos já distribuídos,
  manter um redirect temporário.
- **Barra com rota fantasma**: apenas esconder o `Tabs.Screen` sem remover ou
  redirecionar o arquivo pode deixar uma rota acessível fora da hierarquia
  visual pretendida.

### Edge cases

- Corredor sem ficha ativa precisa ver que o dia ainda não recebeu treino do
  personal; exercícios estáticos não podem reaparecer como se fossem a ficha.
- Ficha em cache e API indisponível deve exibir os exercícios com aviso de
  conteúdo offline, como a tela atual já faz.
- Falha ao carregar a ficha não deve esconder o restante do documento; o
  detalhamento diário mostra um estado indisponível em vez de exercícios falsos.
- `unauthenticated` em qualquer seção continua levando ao login.
- Personal que também possui papel de corredor continua vendo sua área Personal
  separada; esta mudança afeta somente a antiga aba Treinos.
- Ao voltar de uma execução, o planejamento deve reabrir na Semana e no dia de
  origem.

### Decisão esclarecida

O produto definiu que **o planejamento é a ficha do personal** e esclareceu que
os treinos criados devem aparecer em **Semana → Detalhamento de cada dia**,
substituindo os exercícios atuais. O card Corrida permanece único, com três
inputs independentes para terça, quinta e sábado. Com isso, o mapeamento diário
fica definido; a implementação precisa apenas preservar compatibilidade com
fichas gravadas no formato anterior.
