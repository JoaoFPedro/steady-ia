# Input Schema — Solicitação de Plano de Treino

> Material de apoio (`referencias/`). Mapeia os campos de entrada que,
> combinados, gerariam um output no formato de
> [`plano-treino-24-semanas.md`](./plano-treino-24-semanas.md).
>
> **Ainda não é uma spec.** `DISC-002` (`../DISC-002-plano-de-treino-semanal/`)
> consumiu o suficiente deste material para justificar uma primeira versão —
> `plano-treino-24-semanas.md` como conteúdo **mockado/estático** numa aba
> Planejamento, sem geração dinâmica. Este schema continua em aberto para o
> discovery seguinte, o que geraria o plano a partir destes campos em vez de um
> único plano fixo.

---

## 1. Campos de input (variam por corredor)

### Prova-alvo

| Campo | Tipo | Exemplo | Mapeia para |
|---|---|---|---|
| `targetRace.distanceKm` | enum: `5`, `10`, `21.1`, `42.2`, `ultra` | `42.2` | Título do plano, volume-alvo do longão de pico |
| `targetRace.isFirstTimeAtDistance` | boolean | `true` | Agressividade da progressão (1ª vez = mais conservador) |
| `targetRace.date` | date | `2027-05-17` | Ponto de partida da contagem regressiva — define em que semana cai cada fase |

### Perfil / base atual

| Campo | Tipo | Exemplo | Mapeia para |
|---|---|---|---|
| `currentFitness.longestRecentRunKm` | number | `21` | Km inicial do longão na fase Base (linha 91 do plano-referência) |
| `currentFitness.referenceTime.distanceKm` | number | `21.1` | Base para conversão esforço percebido → pace |
| `currentFitness.referenceTime.duration` | `HH:MM:SS` | `01:52:00` | Idem — cálculo das zonas de ritmo (nota final do plano-referência) |
| `currentFitness.currentWeeklyRunningDays` | integer (opcional) | `3` | Calibra se a fase Base precisa de rampa mais longa |

### Disponibilidade

| Campo | Tipo | Exemplo | Mapeia para |
|---|---|---|---|
| `availability.trainingDaysPerWeek` | integer (3–6) | `4` | Define a estrutura semanal (A/B/C/D no plano-referência assume 4) |
| `availability.preferredWeekdays` | array de `seg`..`dom` | `[ter, qui, sáb, dom]` | Calendário real por semana, não só rótulos de dia |
| `availability.strengthSessionMinutes` | integer | `50` | Volume/nº de exercícios no dia de força principal |

### Equipamento

| Campo | Tipo | Exemplo | Mapeia para |
|---|---|---|---|
| `equipment.access` | enum: `academia_completa`, `halteres_casa`, `peso_corporal` | `academia_completa` | Quais exercícios do dia B/D são viáveis (RDL e hip thrust exigem carga externa) |

### Histórico de saúde

| Campo | Tipo | Exemplo | Mapeia para |
|---|---|---|---|
| `healthHistory.recurringPainAreas` | array de enum: `canela`, `joelho`, `it_band`, `lombar`, `tornozelo`, `panturrilha`, `nenhuma` | `[canela]` | Prioriza exercícios de força/mobilidade específicos (ex: canela → panturrilha unilateral + dorsiflexão) |
| `healthHistory.priorInjuries` | texto livre (opcional) | — | Contexto adicional, não estruturado |

---

## 2. JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "TrainingPlanRequest",
  "type": "object",
  "required": ["targetRace", "currentFitness", "availability", "equipment"],
  "properties": {
    "targetRace": {
      "type": "object",
      "required": ["distanceKm", "isFirstTimeAtDistance", "date"],
      "properties": {
        "distanceKm": { "enum": [5, 10, 21.1, 42.2, "ultra"] },
        "isFirstTimeAtDistance": { "type": "boolean" },
        "date": { "type": "string", "format": "date" }
      }
    },
    "currentFitness": {
      "type": "object",
      "required": ["longestRecentRunKm", "referenceTime"],
      "properties": {
        "longestRecentRunKm": { "type": "number", "minimum": 0 },
        "referenceTime": {
          "type": "object",
          "required": ["distanceKm", "duration"],
          "properties": {
            "distanceKm": { "type": "number" },
            "duration": { "type": "string", "pattern": "^[0-9]{2}:[0-9]{2}:[0-9]{2}$" }
          }
        },
        "currentWeeklyRunningDays": { "type": "integer", "minimum": 0, "maximum": 7 }
      }
    },
    "availability": {
      "type": "object",
      "required": ["trainingDaysPerWeek", "strengthSessionMinutes"],
      "properties": {
        "trainingDaysPerWeek": { "type": "integer", "minimum": 3, "maximum": 6 },
        "preferredWeekdays": {
          "type": "array",
          "items": { "enum": ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"] }
        },
        "strengthSessionMinutes": { "type": "integer", "minimum": 20, "maximum": 90 }
      }
    },
    "equipment": {
      "type": "object",
      "required": ["access"],
      "properties": {
        "access": { "enum": ["academia_completa", "halteres_casa", "peso_corporal"] }
      }
    },
    "healthHistory": {
      "type": "object",
      "properties": {
        "recurringPainAreas": {
          "type": "array",
          "items": { "enum": ["canela", "joelho", "it_band", "lombar", "tornozelo", "panturrilha", "nenhuma"] }
        },
        "priorInjuries": { "type": "string" }
      }
    }
  }
}
```

---

## 3. Campos derivados (calculados, não pedidos ao usuário)

Estes saem do cruzamento dos inputs acima com as regras fixas da seção 4 —
não devem virar pergunta ao usuário:

- Duração total do plano e limites de cada fase (Base/Construção/Pico/Taper) — calculado de trás para frente a partir de `targetRace.date`.
- Progressão semanal do longão (km por semana) — calculado a partir de `currentFitness.longestRecentRunKm` + regra dos 10% + volume-alvo do pico.
- Zonas de ritmo (fácil/moderado/forte) — calculado a partir de `currentFitness.referenceTime`.
- Semanas de recuo (a cada 3 semanas de progressão) — posição fixa dentro do ciclo, não depende do usuário.

---

## 4. Regras fixas de domínio (não são input)

Constantes de periodização clássica — segundo a Lei do Domínio #4
(`.sdd/PROJECT-CONSTITUTION.md:25`), toda regra de progressão/prevenção de
lesão precisa ser rastreável a uma fonte reconhecida via ADR, não a um
julgamento ad-hoc do código:

- Regra dos 10% (aumento máximo de volume semanal de corrida).
- Ciclo de 3 semanas de progressão + 1 de recuo.
- Nunca subir carga de força e volume de corrida na mesma semana.
- Cargas/séries/reps específicas do dia B e D — **fora do escopo atual**
  (`DISC-001`), ficam como placeholder no output até uma fonte ser anexada
  aqui em `referencias/`.

---

## 5. Em aberto

- Se `trainingDaysPerWeek` variar (3, 5, 6), a estrutura A/B/C/D do
  plano-referência (pensada para 4 dias) precisa de uma regra de adaptação —
  não coberta ainda por nenhuma fonte em `referencias/`.
- Nenhuma decisão tomada sobre se isso vira feature do produto ou fica como
  prompt/ferramenta de uso pessoal — depende de um `/discover` novo.
