# Arquitetura do Steady

Fonte do esquema: `src/Steady.Infrastructure/Persistence/SteadyDbContext.cs` e as entidades ao lado. Decisões e justificativas vivem nos ADRs (`docs/adr/`).

## 1. Visão de contexto

```mermaid
flowchart LR
    corredor([Corredor]) --> app
    personal([Personal]) --> app
    app["steady-app<br/>Expo · React Native"] -- "HTTPS + ID token Google" --> api["Steady.Api<br/>ASP.NET Core"]
    app -- "login nativo" --> google[("Google Sign-In")]
    api -- "valida audiência" --> google
    api -- "EF Core / Npgsql" --> db[("PostgreSQL · Supabase<br/>12 tabelas")]
    api -- "só redige a explicação<br/>(ADR-016)" --> claude[("Claude API")]
```

## 2. Banco de dados — visão geral

12 tabelas em três grupos: **identidade e versões** (corredores, versões de plano e de política), **registros do corredor** (corridas, musculação, dor, pedidos de plano) e **coaching e revisão** (vínculo, ficha, execução, outbox, revisão).

```mermaid
erDiagram
    training_plan_versions ||--o{ corredores : "training_plan_version_id"
    corredores ||--o{ running_sessions : "corredor_id (CASCADE)"
    corredores ||--o{ strength_sessions : "corredor_id (CASCADE)"
    corredores ||--o{ pain_logs : "corredor_id (CASCADE)"
    corredores ||--o{ plan_requests : "corredor_id (CASCADE)"
    corredores ||--o{ coaching_links : "personal_id (RESTRICT)"
    corredores ||--o{ coaching_links : "corredor_id (RESTRICT)"
    corredores ||--o{ training_sheets : "personal_id (RESTRICT)"
    corredores ||--o{ training_sheets : "corredor_id (RESTRICT)"
    corredores ||--o{ strength_workout_executions : "corredor_id (RESTRICT)"
    training_sheets ||--o{ strength_workout_executions : "training_sheet_id (RESTRICT)"
    corredores ||--o{ review_outbox : "corredor_id (CASCADE)"
    corredores ||--o{ workout_reviews : "corredor_id (CASCADE)"
    strength_workout_executions ||..o| review_outbox : "execution_id (sem FK)"
    strength_workout_executions ||..o| workout_reviews : "execution_id (sem FK)"
    adherence_policy_versions ||..o{ workout_reviews : "policy_version (sem FK)"
    training_plan_versions ||..o{ workout_reviews : "plan_version (sem FK)"
```

Linha cheia = FK real no banco. Linha pontilhada = ligação lógica sem constraint (ver §4).

> `Corredor` é a conta de qualquer usuário. O personal também é uma linha em `corredores` com `roles` contendo `Personal` — por isso `coaching_links` e `training_sheets` apontam duas vezes para a mesma tabela (ADR-008).

## 3. Tabelas e colunas

Convenção: PK `id uuid`. Todas as colunas em `snake_case`. Enums gravados como texto. `PK` primary key · `FK` chave estrangeira · `UQ` índice único · `?` anulável.

### 3.1 Identidade e versões

```mermaid
erDiagram
    corredores {
        uuid id PK
        text google_sub UQ "identidade (ADR-002)"
        text email "cache, sem UQ"
        text name "cache, só exibição"
        text_array roles "default {Corredor}"
        uuid training_plan_version_id FK
        timestamp created_at
    }
    training_plan_versions {
        uuid id PK
        int version UQ
        jsonb definition "plano completo"
        bool is_current "UQ parcial: só uma TRUE"
        timestamp created_at
    }
    adherence_policy_versions {
        uuid id PK
        int version UQ
        decimal running_distance_percent "seed v1 = 0.10"
        decimal running_duration_percent "0.10"
        int perceived_effort_points "2"
        int sets_absolute "1"
        decimal repetitions_percent "0.20"
        decimal load_percent "0.10"
        bool is_current "UQ parcial: só uma TRUE"
        timestamp created_at
    }
    training_plan_versions ||--o{ corredores : fixa
```

| Tabela | Papel |
|---|---|
| `corredores` | Conta do usuário. A busca é sempre por `google_sub`; `email` e `name` são cache do Google, nunca identidade. `roles` é `text[]` provisionado administrativamente (nunca por endpoint público). `training_plan_version_id` fixa a versão do plano na criação — publicar versão nova não realoca quem já tem uma. |
| `training_plan_versions` | Versões **imutáveis** do plano do Steady (ADR-013). `definition` é o documento jsonb. Índice único parcial garante uma única `is_current`. |
| `adherence_policy_versions` | Tolerâncias usadas para dizer se o treino foi aderente (ADR-015). A v1 é semeada pela migration (`14000000-0000-0000-0000-000000000001`). |

### 3.2 Registros do corredor

Todas carregam `idempotency_key` com **índice único `(corredor_id, idempotency_key)`**: reenviar o mesmo registro offline nunca duplica a linha (ADR-003).

```mermaid
erDiagram
    running_sessions {
        uuid id PK
        uuid corredor_id FK
        uuid idempotency_key
        date date
        double distance_km
        int duration_minutes
        double average_pace_min_per_km
        int perceived_effort
    }
    strength_sessions {
        uuid id PK
        uuid corredor_id FK
        uuid idempotency_key
        date date
        text muscle_group "PeitoTriceps, Ombro, PernaFrontal, PernaPosterior, BicepsCostas"
        text intensity "Leve, Moderado, Pesado"
        int duration_minutes
    }
    pain_logs {
        uuid id PK
        uuid corredor_id FK
        uuid idempotency_key
        date date
        text region "obrigatório"
    }
    plan_requests {
        uuid id PK
        uuid corredor_id FK
        uuid idempotency_key
        timestamp created_at
        text race_distance "FiveK, TenK, HalfMarathon, Marathon, Ultra"
        text race_date "ISO AAAA-MM-DD (texto)"
        bool race_is_first_time
        double longest_recent_run_km
        int training_days_per_week
        int current_weekly_running_days "?"
        double reference_distance_km "?"
        text reference_duration "?"
        int strength_session_minutes "?"
        text equipment_access "? AcademiaCompleta, HalteresCasa, PesoCorporal"
        text_array recurring_pain_areas "Canela, Joelho, ItBand, Lombar, Tornozelo, Panturrilha, Nenhuma"
        text prior_injuries "?"
    }
```

| Tabela | Observações |
|---|---|
| `running_sessions` | Corrida registrada. Imutável após gravada (Lei do Domínio #2). Também é gravada junto da musculação nos registros combinados. |
| `strength_sessions` | Musculação do fluxo livre (sem ficha de personal). |
| `pain_logs` | Dor por região e data. Também recebe linha automática quando uma execução é concluída com dor (`painReportedAtCompletion`). |
| `plan_requests` | Pedido de plano — o **Objetivo de Corrida** (`race_distance` + `race_date`) é obrigatório (Lei do Domínio #3). Data como texto ISO para `order by` honesto (ADR-007). Pedido imutável. |

### 3.3 Coaching, execução e revisão

```mermaid
erDiagram
    coaching_links {
        uuid id PK
        uuid personal_id FK
        uuid corredor_id FK
        text status "Pending, Active, Ended, Expired"
        timestamp requested_at
        timestamp accepted_at "?"
        timestamp ended_at "?"
    }
    training_sheets {
        uuid id PK
        uuid personal_id FK
        uuid corredor_id FK
        jsonb definition "ficha: dias, exercícios, corrida"
        bool is_active "UQ parcial por corredor"
        timestamp created_at
    }
    strength_workout_executions {
        uuid id PK
        uuid corredor_id FK
        uuid training_sheet_id FK
        text workout_type "Push, Pull, Lower, Run"
        text date "ISO AAAA-MM-DD (texto)"
        jsonb details "execução por exercício"
        uuid idempotency_key
        timestamp created_at
    }
    review_outbox {
        uuid id PK
        uuid corredor_id FK
        uuid execution_id "lógica, sem FK"
        uuid training_sheet_id "? lógica"
        text execution_kind "Running, Strength, Combined"
        uuid idempotency_key
        date execution_date
        bool pain_reported_at_completion
        text status "Pending, Processing, Completed"
        int attempts
        timestamp lease_until "?"
        timestamp next_attempt_at "?"
        timestamp created_at
        timestamp completed_at "?"
    }
    workout_reviews {
        uuid id PK
        uuid corredor_id FK
        uuid execution_id "lógica, sem FK"
        text execution_kind "Running, Strength, Combined"
        date execution_date
        text status "Adherent, Divergent, PrescriptionConflict, InsufficientData"
        text action "? Maintain, ReduceLoad, PrioritizeRecovery"
        int policy_version "lógica"
        int plan_version "? lógica"
        uuid training_sheet_id "? lógica"
        jsonb comparison "fatos prescrito x executado"
        text explanation_status "Pending, Available, Unavailable"
        jsonb explanation "? texto da IA"
        timestamp understood_at "?"
        bool contested
        text coherence_status "Unknown, Coherent, NotCoherent"
        uuid next_execution_id "?"
        int coherence_policy_version "?"
        timestamp coherence_evaluated_at "?"
        timestamp created_at
    }
    coaching_links ||..o{ training_sheets : "mesmo par personal/corredor"
    training_sheets ||--o{ strength_workout_executions : "training_sheet_id"
    strength_workout_executions ||..o| review_outbox : "gera"
    review_outbox ||..o| workout_reviews : "processa"
```

| Tabela | Observações |
|---|---|
| `coaching_links` | Vínculo personal ↔ corredor. UQ parcial `corredor_id WHERE status='Active'` → no máximo **um vínculo ativo por corredor**. UQ parcial `(personal_id, corredor_id) WHERE status='Pending'` → sem solicitação pendente duplicada. |
| `training_sheets` | Ficha prescrita pelo personal. UQ parcial `corredor_id WHERE is_active` → **uma ficha ativa por corredor**; nova ficha desativa a anterior, nunca apaga (ADR-009). |
| `strength_workout_executions` | Execução da ficha — imutável (ADR-009). `details` guarda o realizado exercício a exercício. Índice `(corredor_id, training_sheet_id)` para o histórico. |
| `review_outbox` | Fila transacional: nasce **na mesma transação** da execução (ADR-018). `lease_until`/`next_attempt_at`/`attempts` controlam reserva e retentativa. UQ `(execution_kind, execution_id)` e `(corredor_id, idempotency_key)`. Índice `(status, next_attempt_at)` para o worker. |
| `workout_reviews` | Resultado da revisão. `status`/`action`/`comparison` são determinísticos; `explanation*` é a parte da IA e pode ficar `Unavailable` sem invalidar o resto (ADR-014). UQ `(execution_kind, execution_id)`; índice `(corredor_id, execution_date)`. |

## 4. Como as tabelas se comunicam

### 4.1 Integridade: o que o banco garante e o que é lógico

| Ligação | Tipo | Comportamento |
|---|---|---|
| `running_sessions`, `strength_sessions`, `pain_logs`, `plan_requests`, `review_outbox`, `workout_reviews` → `corredores` | FK `CASCADE` | Apagar o corredor leva junto os registros dele. |
| `coaching_links`, `training_sheets`, `strength_workout_executions` → `corredores` | FK `RESTRICT` | Não se apaga conta com vínculo, ficha ou execução: o histórico é preservado. |
| `strength_workout_executions` → `training_sheets` | FK `RESTRICT` | A execução sempre aponta para a ficha que a prescreveu. |
| `corredores` → `training_plan_versions` | FK `RESTRICT` | Uma versão de plano em uso não pode ser removida. |
| `review_outbox.execution_id` / `workout_reviews.execution_id` | **lógica** | `execution_kind` diz em qual tabela olhar: `Strength` e `Combined` → `strength_workout_executions.id`; `Running` → `running_sessions.id`. Como o alvo varia, não há FK. |
| `workout_reviews.policy_version` / `plan_version` | **lógica** | Guardam o **número** da versão aplicada na época, não o id — a revisão continua explicável mesmo se a versão corrente mudar (ADR-015). |
| `workout_reviews.training_sheet_id`, `review_outbox.training_sheet_id` | **lógica** | Sem FK; anulável (corrida solta não tem ficha). |

### 4.2 Quem escreve em quê

| Endpoint | Tabelas escritas | Detalhe |
|---|---|---|
| `POST /running-sessions` | `running_sessions`, `review_outbox` | Revisão nasce do registro (`RunningSessionRepository`). |
| `POST /strength-sessions` | `strength_sessions` | Fluxo livre, sem revisão. |
| `POST /pain-logs` | `pain_logs` | |
| `POST /plan-requests` | `plan_requests` | Idempotente por `(corredor_id, idempotency_key)`. |
| `POST /coaching/links` · `…/accept` · `DELETE …/{id}` | `coaching_links` | `Pending → Active → Ended`; também `Expired`. |
| `POST /coaching/runners/{id}/training-sheets` | `training_sheets` | Desativa a ficha ativa anterior e insere a nova. Exige vínculo `Active`. |
| `POST /coaching/strength-executions` | `strength_workout_executions`, `review_outbox`, `pain_logs` (se houve dor) | Uma transação. |
| `POST /coaching/combined-executions` | `strength_workout_executions`, `running_sessions`, `review_outbox`, `pain_logs` (se houve dor) | Uma transação; musculação e corrida compartilham a `idempotency_key`; `execution_kind = Combined`. |
| `POST /workout-reviews/{id}/retry · contest · understood` | `workout_reviews` | Atualiza `explanation_status`, `contested`, `understood_at`. |
| *(worker, a cada 2 s)* | `review_outbox`, `workout_reviews` | Consome a outbox e grava a revisão. |

Leituras: `GET /training-sessions`, `/overload-assessment`, `/coaching/runners/{id}/history` leem `running_sessions` + `strength_sessions` + `strength_workout_executions` + `pain_logs`; `GET /planning/steady-plan` lê `corredores` → `training_plan_versions`.

### 4.3 Isolamento de dados

Toda consulta de dado do corredor filtra por `corredor_id` derivado do `sub` do Google. O personal só alcança dados de um corredor se existir `coaching_links` com `status = 'Active'` entre os dois (ADR-002, ADR-008).

### 4.4 Fluxo de escrita de uma execução da ficha

```mermaid
flowchart TB
    req["POST /coaching/strength-executions<br/>(idempotency_key)"] --> chk{"já existe<br/>(corredor_id, idempotency_key)?"}
    chk -- sim --> dup["devolve o registro existente<br/>Created = false"]
    chk -- não --> tx

    subgraph tx["uma transação"]
        e["INSERT strength_workout_executions"]
        o["INSERT review_outbox<br/>status = Pending"]
        p["INSERT pain_logs<br/>(só se reportou dor)"]
        e --> o --> p
    end

    tx --> w["ReviewOutboxWorker<br/>Pending → Processing (lease_until)"]
    w --> cmp["compara prescrito × executado<br/>usando adherence_policy_versions"]
    cmp --> rv["INSERT workout_reviews<br/>status + action + comparison"]
    rv --> ia{"IA disponível?"}
    ia -- sim --> ok["explanation_status = Available<br/>explanation (jsonb)"]
    ia -- não --> un["explanation_status = Unavailable<br/>retry manual via /retry"]
    ok --> done["outbox → Completed"]
    un --> done
```

### 4.5 Ciclo de vida do vínculo

```mermaid
stateDiagram-v2
    [*] --> Pending: personal solicita (POST /coaching/links)
    Pending --> Active: corredor aceita
    Pending --> Expired: corredor aceita outro vínculo
    Active --> Ended: DELETE do vínculo
    Ended --> [*]
    Expired --> [*]
    note right of Active
        Só com vínculo Active o personal lê
        ficha e histórico do corredor.
        Índice único parcial: 1 Active por corredor.
    end note
```

## 5. Frontend (`src/steady-app`)

```mermaid
flowchart TB
    subgraph Rotas["app/ — expo-router"]
        l["_layout · login"]
        tabs["(tabs): index · planning · personal"]
        log["log/: run · strength · pain"]
        co["coaching/ · personal/ · planning/ · history"]
    end

    subgraph Src["src/"]
        ui["ui/ + theme/nocturne"]
        feat["features/ · home/ · planning/ · coaching/"]
        acc["account/ · auth/"]
        sync["sync/<br/>fila offline + SyncEngine"]
        api["api/<br/>clients HTTP"]
        svc["services.ts<br/>composition root"]
    end

    Rotas --> ui
    Rotas --> feat
    Rotas --> acc
    feat --> svc
    acc --> svc
    svc --> sync
    svc --> api
    sync --> api
    api -- "Bearer ID token" --> bk[("Steady.Api")]
    sync --> st[("AsyncStorage")]
    feat --> st
```

`services.ts` é o único lugar onde peças de plataforma (AsyncStorage, NetInfo, Google Sign-In) são ligadas; o resto é testável com Jest.

## 6. Registro offline-first

```mermaid
sequenceDiagram
    participant U as Usuário
    participant Q as RecordQueue (AsyncStorage)
    participant S as SyncEngine
    participant A as Steady.Api
    participant DB as PostgreSQL

    U->>Q: registra corrida (gera idempotency_key)
    Q-->>U: aceito, home mostra "1 registro pendente"
    Note over Q,S: sem conexão — espera na fila
    S->>S: NetInfo: conexão voltou
    S->>A: POST /api/running-sessions (mesma chave)
    A->>DB: INSERT (UQ corredor_id + idempotency_key)
    A-->>S: 201 ou duplicado reconhecido
    S->>Q: remove da fila
```

## 7. Ambiente de desenvolvimento

```mermaid
flowchart LR
    subgraph Win["Windows"]
        emu["Emulador / celular"]
        proxy["port proxy 5050 e 8081"]
    end
    subgraph WSL["WSL2 (NAT)"]
        tmux["tmux 'steady' · dev.sh"]
        api2["API :5050"]
        metro["Metro :8081"]
    end
    sdb[("Supabase PostgreSQL")]
    tmux --> api2
    tmux --> metro
    emu -- "192.168.0.18" --> proxy
    proxy --> api2
    proxy --> metro
    api2 --> sdb
```

Roteiro completo em `CLAUDE.md` (Ambiente Local) e `docs/SETUP-LOGIN-GOOGLE.md`.

## 8. Mapa de ADRs

| Tema | ADRs |
|---|---|
| Fundação | 000 |
| Autenticação e isolamento | 002, 008 |
| Sincronização offline e idempotência | 003, 005 |
| Regras de domínio (sobrecarga, longão) | 001, 006 |
| Planejamento e versões do plano | 007, 012, 013 |
| Ficha e execução | 009, 010, 011, 019 |
| Revisão com IA, políticas, outbox | 014, 015, 016, 018 |
| Contrato e UI | 004, 017 |
