# ADR-007: Persistência do pedido de plano de treino

> **Data**: 2026-08-22
> **Status**: Accepted
> **Story**: STORY-010
> **Decisores**: Jefferson

## Contexto

A aba Planejamento coleta 13 campos do corredor (`PlanningForm.tsx`) e **descarta
11 deles no submit**: `generatedPlansStore.ts` é um singleton de módulo JS que
guarda `{id, raceDistance, raceDate, createdAt}` em memória, no processo do app.
Fechar o app perde a lista. Isso foi decisão consciente da STORY-008
(`specs/STORY-008/story.md`, "Nota de persistência"), que registrou a persistência
real como trabalho de outra story — esta.

O vocabulário dos campos já está fechado e versionado em
`.discovery/referencias/plano-treino-input-schema.md` (o `TrainingPlanRequest`),
espelhado em `src/steady-app/src/planning/trainingPlanRequest.ts`.

O banco é o PostgreSQL 16 já em uso (Constituição §5, ADR-000), rodando em Docker
com volume `steady-pgdata`. Onde o Postgres roda — local ou gerenciado — é
ortogonal a esta decisão: nenhuma coluna aqui muda por causa disso.

Três perguntas precisam de resposta antes de escrever migration:

1. O Objetivo de Corrida vira tabela própria agora, ou colunas do pedido?
2. O pedido entra na fila offline com chave de idempotência (ADR-003)?
3. Persistimos o plano gerado, ou só o input?

## Opções Consideradas

### Opção A: Uma tabela `plan_requests` com colunas tipadas

- **Prós**: os campos já têm JSON Schema fechado e estável; o gerador futuro vai
  ramificar sobre eles (`equipment_access` escolhe exercício, `recurring_pain_areas`
  escolhe prioridade) e colunas dão ajuda do compilador e do plano de query;
  migration vira sinal visível de mudança de contrato; arrays de enum ficam em
  `text[]` nativo, sem tabela filha que não pagaria seu custo.
- **Contras**: cada campo novo do schema exige migration; dois multi-select viram
  `text[]`, que EF Core mapeia mas não valida o conteúdo do array.

### Opção B: `plan_requests(id, corredor_id, created_at, payload jsonb)`

- **Prós**: campo novo no formulário não exige migration; o payload espelha
  literalmente o `TrainingPlanRequest`.
- **Contras**: drift de contrato fica **invisível** — sem compilador, sem migration,
  sem erro até alguém ler um campo que mudou de nome; consultar por campo exige
  operador de `jsonb` sem tipo; é exatamente a classe de bug que machuca dev solo,
  que não tem par para pegar em review.

### Opção C: Normalizar — `race_goals` + `plan_requests` + tabelas filhas dos arrays

- **Prós**: fiel à Lei do Domínio #3 no nível de tabela (Objetivo existe antes do
  Plano); arrays com integridade referencial.
- **Contras**: hoje o app cria uma entrada nova a cada toque em "Gerar plano", sem
  nenhuma noção de "mesmo objetivo, pedido novo" — separar agora obriga a responder
  "o que é o *mesmo* objetivo?", pergunta que o produto ainda não respondeu; duas
  tabelas filhas para conjuntos pequenos de enum é Abstração Prematura, anti-pattern
  crítico da Constituição §4.

## Decisão

Escolhemos **Opção A** — uma tabela `plan_requests` com colunas tipadas, arrays
nativos do Postgres para os dois multi-select, e enums como `text` com
`HasConversion<string>()` (mesmo padrão de `muscle_group` e `intensity`).

```
plan_requests
  id                          uuid PK
  corredor_id                 uuid     NOT NULL REFERENCES corredores(id)
  idempotency_key             uuid     NOT NULL
  created_at                  timestamptz NOT NULL

  -- Objetivo de Corrida (Lei do Domínio #3)
  race_distance               text     NOT NULL   -- 5|10|21.1|42.2|ultra
  race_date                   text     NOT NULL   -- AAAA-MM-DD (ver "Datas como texto")
  race_is_first_time          boolean  NOT NULL

  -- Base atual
  longest_recent_run_km       numeric  NOT NULL
  current_weekly_running_days smallint NULL
  reference_distance_km       numeric  NULL
  reference_duration          text     NULL       -- HH:MM:SS

  -- Disponibilidade
  training_days_per_week      smallint NOT NULL
  strength_session_minutes    smallint NULL

  -- Equipamento / saúde
  equipment_access            text     NULL
  recurring_pain_areas        text[]   NOT NULL DEFAULT '{}'
  prior_injuries              text     NULL

  UNIQUE (corredor_id, idempotency_key)
  INDEX  (corredor_id)
```

### Datas como texto ISO, não tipo `date`

Decisão de produto na sessão de `/spec` da STORY-010: as datas são guardadas
como **texto**, e o app valida a entrada em `dd/mm/aaaa` (ano com 4 dígitos),
normalizando para `AAAA-MM-DD` antes de enviar.

A normalização é o que torna a escolha barata: em ISO, texto ordena e compara
como data (`"2027-05-17" < "2027-11-03"`), então `order by race_date` e
"quantas semanas até a prova" continuam diretos. Guardar `17/05/2027` como
digitado teria custado exatamente isso — ordenação por dia em vez de por data.
O que se perde em relação ao tipo `date` é a validação do próprio Postgres:
`31/02/2027` só é barrado se app e API barrarem (regras 5 a 7 da spec).

`reference_duration` segue o mesmo caminho — `text` com `HH:MM:SS` em vez de
`interval`, evitando a conversão que este ADR listava como risco.

### Obrigatoriedade segue o formulário, não o schema de referência

Só são `NOT NULL` os quatro campos que o botão "Gerar plano" já exige hoje
(`PlanningForm.tsx:53-57`): distância, data, maior corrida recente e dias de
treino por semana — mais o booleano de primeira vez, que sempre tem valor. O
`plano-treino-input-schema.md` pede mais campos como obrigatórios; apertar a
tela seria mudança de UX que ninguém pediu, e fica registrado na spec.

`preferred_weekdays` saiu da tabela: o input está comentado no formulário, e a
coluna nasceria sempre vazia.

### 1. Objetivo de Corrida fica como colunas `race_*`, não como tabela

A Lei do Domínio #3 ("um Objetivo de Corrida sempre define data-alvo e distância
antes de qualquer Plano de Treino existir") é satisfeita **no nível do campo**:
`race_distance` e `race_date` são `NOT NULL`, então não existe pedido sem objetivo.
O prefixo `race_` é deliberado — extrair para uma tabela `race_goals` depois vira
migration mecânica, quando o produto responder o que torna dois pedidos parte do
mesmo objetivo.

### 2. O pedido entra na fila offline, com chave de idempotência

`plan_requests` implementa `IIdempotentRecord` e reusa
`FindByIdempotencyKeyAsync` — mesmo caminho das três entidades existentes
(ADR-003). O formulário já funciona offline hoje (a geração é local e mockada), e a
chave impede que uma reconexão duplique o pedido. O `UNIQUE (corredor_id,
idempotency_key)` mantém a invariante do ADR-003: chave escopada por corredor,
nunca alcança registro de outro (A01, ADR-002).

### 3. Persistimos só o input, não o plano gerado

A saída é conteúdo estático — o mesmo documento sempre, vindo de
`plano-treino-24-semanas.md`. Persistir isso seria gravar a mesma constante N vezes.
Quando a geração deixar de ser mockada, entra uma tabela do plano gerado, e é
justamente o input persistido aqui que permitirá regerar e comparar.

### Imutabilidade

`plan_requests` segue a Lei do Domínio #2: sem `update`, sem `delete` no repositório.
"Editar dados" gera linha nova — que já é o comportamento da UI da STORY-008.

### Chave estrangeira

Este é o primeiro `REFERENCES corredores(id)` do projeto: `running_sessions`,
`strength_sessions` e `pain_logs` têm `corredor_id` como uuid indexado **sem**
constraint (ver `20260809210535_InitialCreate.cs`). Nada impede uma linha órfã
hoje. Adicionar a FK nas três existentes é trabalho pequeno e vale ir junto nesta
leva — mas é mudança nas tabelas de outra story, então fica como item explícito da
STORY-010, não como efeito colateral silencioso.

## Consequências

### Positivas

- O dado que o corredor digita para de ser descartado no submit
- A lista da aba Planejamento passa a sobreviver a fechar o app, e a ser a mesma em
  qualquer aparelho do mesmo corredor
- O input persistido é o insumo da geração real quando ela substituir o mock
- Consistência total com o que já existe: isolamento por `corredor_id` (ADR-002),
  idempotência (ADR-003), imutabilidade (Lei do Domínio #2)

### Negativas

- Campo novo no formulário passa a exigir migration — atrito aceito de propósito,
  é ele que torna a mudança de contrato visível
- **Datas sem validação do banco**: `race_date` é `text`, então `31/02/2027` só é
  barrado se app e API barrarem — o Postgres não ajuda como ajudaria com `date`.
  É o preço da decisão de produto de guardar datas como string

### Riscos

- **Dado de saúde em texto livre**: `prior_injuries` é campo aberto onde o corredor
  descreve lesão — dado sensível sob a LGPD, na mesma classe que o mandato
  inviolável da Constituição §3 protege → o isolamento por `corredor_id` na query
  (ADR-002) já cobre o acesso entre corredores; o `/review` deve confirmar que o
  campo não vaza em log, telemetria nem mensagem de erro
- **`text[]` sem validação no banco**: um valor fora do enum entra se o app mandar →
  validação com Guard Clause na borda da API, pattern prioritário da Constituição §4
- **Data guardada fora do padrão ISO**: se algum caminho gravar `17/05/2027` em vez
  de `2027-05-17`, a ordenação passa a mentir silenciosamente — nada quebra, a lista
  só fica na ordem errada → a normalização acontece num ponto só (na borda, antes de
  enfileirar) e a API rejeita 400 o que não casar com `AAAA-MM-DD`

## Referências

- `.discovery/referencias/plano-treino-input-schema.md` — o `TrainingPlanRequest`
- `.discovery/DISC-002-plano-de-treino-semanal/decision.md` — escopo mockado
- `specs/STORY-008/story.md` — a nota de persistência que originou esta decisão
- ADR-002 (isolamento por corredor) · ADR-003 (chave de idempotência)
- `.sdd/PROJECT-CONSTITUTION.md` — Lei do Domínio #2 e #3, anti-patterns §4
