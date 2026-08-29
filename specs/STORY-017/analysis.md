# Análise — STORY-017: Validação em tela e campos novos da ficha do personal

> `/analyze` em 2026-08-29. Escopo pedido:
> 1. avisar o personal quando ele tentar publicar ficha incompleta;
> 2. validar com **zod** e realçar o campo em **vermelho**, em vez do aviso no topo;
> 3. campo de **observação** na ficha de treino;
> 4. **tempo** como campo opcional nas séries.

## 1. Scan de código relevante

### Frontend — `src/steady-app`

| Arquivo | Papel hoje |
|---------|-----------|
| `app/personal/runner.tsx` | Tela única do personal. Monta os drafts (`DraftInput[]` para Empurrada/Puxada/Inferiores + `RunPrescriptionFormInput` para os 3 dias de corrida), chama `publish()` e exibe o resultado em `NoticeStrip` no topo |
| `src/coaching/runPrescriptionForm.ts` | Única validação de formulário existente. `buildRunPrescriptionDraft` devolve `{ok:false, message}` — **uma string, sem apontar o campo** |
| `src/coaching/types.ts` | `ExerciseDraft`, `RunPrescriptionDraft`, `TrainingSheetDraft`, `ExercisePrescription` |
| `src/ui/Field.tsx` | Campo de texto do DS. **Não tem prop de erro** nem estado visual de inválido |
| `src/ui/Nocturne.tsx` | `NoticeStrip` (o "pop-up no topo" que o pedido quer substituir) |
| `src/theme/nocturne.ts` | Tokens. **Não existe cor de erro/vermelho** — só a rampa accent (roxo) |
| `src/coaching/exercisePrescription.ts` | `formatExercisePrescription(sets, repetitions)` — string exibida ao corredor |
| `app/coaching/strength.tsx` | Registro da execução. Já tem "Observação opcional" **por exercício executado** |
| `src/coaching/workoutExecution.ts` | Valida a nota da execução (limite 200 caracteres) |
| `src/coaching/dailyPrescription.ts` · `src/planning/SemanaSection.tsx` | Exibem a prescrição do dia ao corredor |

### Backend

| Arquivo | Papel hoje |
|---------|-----------|
| `src/Steady.Domain/Coaching/TrainingSheet.cs` | `ExercisePrescription.Create(id, name, sets, repetitions)` — nome 2–100, séries 1–20, reps 1–100. `RunPrescription` (ADR-012) já é o modelo de campo opcional a copiar |
| `src/Steady.Api/Contracts/CoachingContracts.cs` | `ExercisePrescriptionBody/Response`, `PublishTrainingSheetBody` |
| `src/Steady.Api/Endpoints/TrainingSheetEndpoints.cs` | `TryCreateSheet` → `DomainFactory.TryCreate` → 400 com a mensagem da exceção de domínio |
| `src/Steady.Api/Endpoints/TrainingSheetMapping.cs` | Conversão contrato ↔ domínio |
| `src/Steady.Infrastructure/Repositories/TrainingSheetDocuments.cs` | Serializa a ficha como JSON (`ExerciseDocument`), com fallback para formatos legados |

### Padrões em uso na área

- **Validação em duas camadas com fonte da verdade única no domínio**: o app valida só *estrutura* (é número? o máximo é maior que o mínimo?); os *limites* (1–20 séries, esforço 1–10) vivem só no backend — decisão explícita e comentada em `runPrescriptionForm.ts`.
- **Campo opcional = ausente, nunca zero** (ADR-012): `null` no domínio, ausente no JSON, `?` no contrato.
- **Compatibilidade retroativa por documento**: `TrainingSheetDocuments` lê fichas antigas com campos ausentes sem migration.
- Ficha publicada é **imutável**; publicar cria versão nova (ADR-009/010).

## 2. Análise de domínio

### Conceitos existentes

- `ExercisePrescription` — nome, séries, repetições. Sem tempo, sem observação.
- `ExerciseExecution` — snapshot da execução, **já carrega `Note`** (observação do corredor, ≤200 caracteres).
- `RunPrescription` + `NumericRange<T>` — o precedente pronto de campo prescrito opcional.

### Conceitos novos

| Conceito | Onde nasce | Observação |
|----------|-----------|------------|
| **Tempo da série** | `ExercisePrescription` | Prescrição isométrica/por tempo ("prancha 3× 40s"). Opcional e independente de repetições |
| **Observação da ficha** | escopo a definir (ver §5) | **Colide semanticamente com `ExerciseExecution.Note`**: uma é do personal (prescrição), a outra do corredor (execução). Nomes precisam divergir para não confundir |
| **Erro por campo** | camada de formulário do app | Hoje só existe erro global em string |

### Regras de negócio implicadas

- Séries/repetições continuam obrigatórias; tempo entra como **terceiro eixo opcional** — a ausência não vira zero (ADR-012).
- Repetições hoje são obrigatórias (1–100). Um exercício puramente isométrico não tem repetição natural — ver ambiguidade §5.
- Observação é texto livre do personal: precisa de limite de tamanho, espelhando o `NormalizeNote` de 200 caracteres da execução.
- Ficha incompleta **já é rejeitada hoje** — mas só depois do round-trip HTTP, e com uma mensagem que não diz qual campo. Pior: `Number('')` é `0`, então "campo vazio" chega ao backend como série 0 e volta como "As séries devem estar entre 1 e 20" — mensagem certa, contexto errado.

## 3. Direção estratégica

### Abordagem — 3 blocos independentes, nesta ordem

**Bloco A — schema zod + erro por campo (frontend puro)**
1. `npm i zod` em `src/steady-app` (hoje **não é dependência**).
2. Novo `src/coaching/trainingSheetSchema.ts`: schema zod do formulário inteiro (3 listas de exercícios + 3 corridas), produzindo `TrainingSheetDraft`.
3. `safeParse` → `z.treeifyError`/`flattenError` → mapa `{ caminho: mensagem }` consumido pela tela.
4. `Field` ganha `error?: string`: borda e rótulo em cor de erro + mensagem sob o campo. **Um único ponto de mudança visual** para todos os formulários do app.
5. `publish()` deixa de escrever no `NoticeStrip` para erro de preenchimento (o strip continua para falha de rede/conflito da API — que não pertence a nenhum campo).
6. `runPrescriptionForm.ts` é absorvido pelo schema ou passa a delegar a ele — não devem coexistir duas validações da mesma corrida.

**Bloco B — tempo opcional na série (full-stack, vertical)**
Domínio → documento JSON → contrato → app, na trilha já aberta pela STORY-015:
`ExercisePrescription.Create(..., int? durationSeconds)` → `ExerciseDocument` com campo novo opcional (fichas antigas leem `null`, sem migration) → `ExercisePrescriptionBody/Response` → `ExerciseDraft`/`ExercisePrescription` no app → `formatExercisePrescription` exibe "3 séries de 40s" → `app/coaching/strength.tsx` mostra ao corredor.

**Bloco C — observação (mesma trilha vertical do Bloco B)**, depois de fechada a ambiguidade de escopo (§5).

### Padrão de design

- **Schema como fonte única do formulário** (zod), no lugar do parser artesanal — `RunPrescriptionFormResult` vira `z.ZodError`.
- **Value object opcional** para o tempo: reusar `NumericRange<int>`? Só se o personal puder prescrever faixa ("30–45s"). Caso contrário, `int?` puro é mais simples — KISS antes de DRY.
- **Extensão do DS, não bypass**: a cor de erro precisa virar token em `nocturne.ts`. Nenhum hex solto na tela (regra do STACK.md).

### Fronteiras

**Dentro**: validação de formulário no app do personal; token de erro + `Field` com estado inválido; tempo opcional na prescrição de exercício; observação na ficha; exibição dos dois campos novos ao corredor.

**Fora**: validar os outros formulários do app (registro de corrida, plano) — o `Field` fica pronto para eles, mas migrar cada tela é outra story; comparar tempo prescrito × executado (é STORY-014); prescrever carga de musculação; tornar qualquer campo hoje opcional em obrigatório.

## 4. Riscos e edge cases

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| R1 | **Nocturne não tem vermelho.** O DS é declaradamente "accent como linha e brilho"; vermelho é cor nova no sistema | Alto — decisão de design, não de código | Adicionar rampa `danger` aos tokens e registrar em ADR. Alternativa dentro do DS: borda `accentRamp[400]` + ícone. Decisão do usuário (§5) |
| R2 | **Duplicação da fonte da verdade.** Se o zod replicar os limites do domínio (1–20 séries), a regra passa a existir em dois lugares — exatamente o que `runPrescriptionForm.ts` evita hoje de propósito | Médio — divergência silenciosa na próxima mudança de regra | Zod valida presença/formato/estrutura; limites continuam no backend. Erro 400 do backend precisa continuar visível (no strip) |
| R3 | **`Number('')` é `0`, `Number('abc')` é `NaN`.** Hoje campo vazio chega ao backend como `0` e NaN vira `null` no JSON → 400 opaco | Já é bug hoje | O schema resolve: string vazia é erro de campo antes do envio |
| R4 | **Contrato adiciona campos** — app antigo × API nova e vice-versa | Baixo (campos opcionais, sem migration) | Campos `?` em todo o caminho; `TrainingSheetDocuments` já tem o padrão de fallback |
| R5 | **Snapshot da execução.** `ExerciseExecution` copia `Sets`/`Repetitions` da prescrição. Se tempo/observação forem prescrição, o snapshot precisa decidir se os copia | Médio — afeta histórico e a STORY-014 | Copiar o tempo (é alvo, comparável); a observação provavelmente não (é instrução, não medida) |
| R6 | **Tamanho do formulário.** A tela já pede ~15 campos por exercício × N exercícios. Dois campos novos + mensagens de erro empurram o botão para longe | Médio — UX | Rolar até o primeiro campo inválido; erro só após tentativa de publicar, nunca durante a digitação |
| R7 | **zod + jest-expo.** Dependência nova precisa passar no transform do Jest e no bundle do Expo 57 | Baixo | zod é ESM/CJS puro sem nativo; validar com `npm test` no primeiro commit |
| R8 | **Edge case: lista de exercícios vazia.** A tela começa com 1 exercício em branco e o `+ Adicionar` nunca remove. Não há como remover um exercício sobrando | Médio — o personal fica travado com um exercício em branco que invalida a ficha | Adicionar remoção de exercício, ou tratar como fora de escopo explicitamente |

## 5. Ambiguidades — resolvidas (2026-08-29)

| # | Pergunta | Decisão |
|---|----------|---------|
| 1 | Escopo da observação | **Por exercício.** `ExercisePrescription` ganha o campo; não há observação por treino nem por ficha |
| 2 | Nome do campo | Prescrição usa nome próprio para não colidir com `ExerciseExecution.Note` (observação do corredor). Sugestão: `Observation` na prescrição × `Note` na execução |
| 3 | Unidade e forma do tempo | **Segundos, valor exato** (`int?`), não faixa. Sem `NumericRange` aqui — KISS antes de DRY |
| 4 | Repetições com tempo | **Continuam obrigatórias** (1–100). O tempo é um eixo adicional, nunca substitui repetição |
| 5 | Vermelho vs. Nocturne | **Criar rampa `danger` em `nocturne.ts`** (300 texto · 500 borda · 900 fundo sutil) + ADR registrando a entrada do vermelho no DS. Vira a cor de erro oficial do app |
| 6 | "Sem preencher tudo" | **Bloquear a publicação** — o domínio já exige os quatro treinos |

### Consequências para os blocos

- **Bloco B (tempo)** fica `int? DurationSeconds` em `ExercisePrescription`, ausente = não prescrito (ADR-012). Entra no snapshot `ExerciseExecution` (R5), porque é alvo comparável pela STORY-014.
- **Bloco C (observação)** fica `string? Observation` por exercício, limite de 200 caracteres espelhando `NormalizeNote`. **Não** entra no snapshot da execução — é instrução, não medida.
- **Bloco A** ganha um item: a rampa `danger` em `src/theme/nocturne.ts` antes do `Field` com `error?: string`.
- R1 deixa de ser risco aberto e vira tarefa (token + ADR). R8 (não dá para remover exercício em branco) **continua aberto** — decidir na spec se entra no escopo.
