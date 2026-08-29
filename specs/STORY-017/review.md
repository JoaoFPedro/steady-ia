# Review — STORY-017

> Fase de fechamento do `/implement`. Data: 2026-08-29.
> Suítes: **105** domínio · **110** API · **323** app = **538 verdes**.

## 1. Código × spec

| Grupo de cenários | Situação |
|---|---|
| Validação em tela (9) | Schema coberto por 22 testes; a **fiação da tela** (realce, momento do erro, bloqueio do envio) é verificada por construção, não por teste — o app não tem renderizador de componente |
| Rejeição do backend (2) | `setErrors({})` antes da chamada garante que falha de rede e 400 não realçam campo; mensagem segue no `NoticeStrip` |
| Remoção de exercício (4) | `removeExercise` / `canRemoveExercise` / `dropExerciseErrors` cobertos por 7 testes |
| Tempo opcional (7) | Domínio, documento, API e formatação cobertos ponta a ponta |
| Observação (4) | Idem; exibição ao corredor com borda lateral distinguindo da nota dele |
| Compatibilidade (2) | `Ficha_legada_sem_os_campos_novos_continua_legivel` + `Falha_ao_publicar_preserva_a_ficha_ativa` |
| Segurança (3) | Role e vínculo cobertos por `AuthorizationTests`; marcação literal por construção (RN `Text` não interpreta markup) |

**Lacuna assumida**: os cenários de comportamento de tela não têm teste
automatizado. O projeto não tem `@testing-library/react-native`, e adicioná-lo
era mudança de infraestrutura fora do escopo desta story. A lógica foi extraída
para módulos puros justamente para minimizar o que fica sem cobertura.

## 2. Achado corrigido durante o review

**Valor fracionário em campo inteiro produzia 400 opaco.** `4.5` séries ou
`40.5` segundos passavam pelo schema, chegavam ao `int` do contrato e quebravam
na desserialização do System.Text.Json — o personal via uma mensagem genérica
de payload inválido, sem campo apontado, exatamente o que esta story existe para
eliminar. Corrigido com `isInteger` em séries, repetições, tempo, duração e
esforço; distância segue aceitando decimal, porque é `double` no domínio.
Coberto por 3 testes novos.

## 3. OWASP Top 10

| # | Categoria | Situação |
|---|---|---|
| A01 | Broken Access Control | Publicação inalterada: role `Personal` + `PublishAsync` valida vínculo ativo. Nenhum caminho novo de leitura foi aberto |
| A02 | Cryptographic Failures | Nenhum dado sensível novo. Observação é texto de treino |
| A03 | Injection | Observação persistida por `System.Text.Json` (escape nativo) e exibida em `<Text>` do RN, que não interpreta markup. Sem `WebView`, `dangerouslySetInnerHTML` ou `eval` no projeto |
| A04 | Insecure Design | Tamanho da observação limitado a 200 caracteres **nas duas camadas**; tempo limitado a > 0 no domínio |
| A05 | Security Misconfiguration | Sem mudança de configuração |
| A06 | Vulnerable Components | `zod@4.5.2`. `npm audit --omit=dev`: **16 vulnerabilidades antes e depois** — o zod não introduz nenhuma. As 16 são pré-existentes e ficam como dívida |
| A07 | Auth Failures | Inalterado |
| A08 | Integrity Failures | Ficha segue imutável; publicar cria versão nova |
| A09 | Logging Failures | `coaching.sheet_published` continua logando só ids. Observação **não** é logada |
| A10 | SSRF | Não aplicável |

## 4. Anti-patterns e overengineering

- **Sem duplicação da fonte da verdade**: o schema valida estrutura; os limites
  (séries 1–20, repetições 1–100, esforço 1–10) seguem só no backend. Teste
  explícito prova que 40 séries passam no formulário e são recusadas pela API.
- **Sem validador duplicado**: `runPrescriptionForm.ts` foi removido, não
  deixado ao lado do schema.
- **KISS respeitado no tempo**: `int?` puro, sem `NumericRange` — a faixa não
  foi pedida e não seria usada.
- **DRY não forçado**: `NormalizeObservation` (prescrição) e `NormalizeNote`
  (execução) são parecidos mas têm donos diferentes; o padrão apareceu 2×, não
  3×, então não foi extraído.

## 5. Dívidas registradas

1. **Tempo não entra no snapshot da execução.** `ExerciseExecution` copia
   `Sets`/`Repetitions` da prescrição, mas não `DurationSeconds`. Nenhum cenário
   da spec exige isso, então não foi implementado — mas a STORY-014 vai precisar,
   e o histórico do personal hoje mostra `3x1 repetições` sem o `40s`.
2. **Nenhum limite na quantidade de exercícios por treino.** Pré-existente: uma
   ficha com 10.000 exercícios é aceita. Vale um teto no contrato.
3. **`styles.css` do design system** em `Marathon training app design/_ds/` está
   defasado em relação à rampa `danger` do `nocturne.ts` (ADR-017).
4. **16 vulnerabilidades de dependência** pré-existentes no app.
