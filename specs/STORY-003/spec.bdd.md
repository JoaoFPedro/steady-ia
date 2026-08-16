# Spec BDD: STORY-003 — App mobile: registrar treino offline-first e ver risco de sobrecarga

> **Story**: [story.md](./story.md)
> **Status**: Approved
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)

---

## Feature: Registro de treino offline-first com feedback de sobrecarga

App mobile (Expo/React Native) que autentica o corredor via Google, registra sessões de corrida, musculação e dor mesmo sem conexão, sincroniza com a API da STORY-002 e exibe a avaliação de sobrecarga calculada pelo domínio (ADR-001).

### Regras de Negócio

1. Autenticação é feita **exclusivamente** via Google Sign-In — o app nunca coleta nem armazena senha própria (mandato inviolável da Constituição).
2. Todo registro criado pelo corredor é **primeiro gravado na fila local** e só então enviado à API. O corredor recebe confirmação do registro independentemente do estado da conexão.
3. Cada item da fila carrega uma **chave de idempotência** gerada no app. Reenviar o mesmo item nunca cria um registro duplicado no servidor (ADR-003). Duplicata é inaceitável porque carga de corrida inflada gera alerta de sobrecarga falso.
4. Falha **transitória** no envio (sem rede, timeout, erro 5xx) mantém o item na fila para nova tentativa. Falha **permanente** (400 — validação de domínio) remove o item da fila e informa o corredor, para que a fila nunca entre em retry infinito.
5. Token do Google expirado é renovado silenciosamente e a requisição é repetida. O corredor só é levado à tela de login se a renovação falhar — e a fila permanece intacta nesse caso.
6. O app **nunca calcula risco de sobrecarga localmente**. A regra vive em `Steady.Domain` (ADR-001); o app apenas exibe o que `GET /api/overload-assessment` retorna (FF-004).
7. Após uma sessão de treino ser sincronizada com sucesso, o app consulta a avaliação de sobrecarga e a exibe imediatamente — o alerta chega no momento em que a decisão sobre o próximo treino ainda está em aberto.
8. Enquanto existirem itens pendentes na fila, a tela inicial indica quantos registros ainda não foram sincronizados, para que o corredor não leia a avaliação como completa.
9. A regra de sobrecarga exige no mínimo 14 dias de histórico (ADR-001). Antes disso a API sinaliza explicitamente que o histórico ainda é insuficiente (`hasSufficientHistory`, ADR-004) e o app comunica que está reunindo dados, em vez de afirmar que está tudo bem. O app não conhece o limiar de 14 dias — quem o conhece é o domínio.

---

### Cenários — Happy Path

```gherkin
Scenario: Corredor entra no app pela primeira vez com Google
  Given que ainda não estou autenticado no app
  When faço login com minha conta Google e autorizo o acesso
  Then sou levado à tela inicial do app
  And minhas requisições seguintes à API são autenticadas com o token do Google
```

```gherkin
Scenario: Corredor registra sessão de corrida com conexão disponível
  Given que estou autenticado e com conexão disponível
  When registro uma Sessão de Treino de Corrida válida
  Then o registro é confirmado para mim
  And é sincronizado com a API
  And deixa de constar como pendente
```

```gherkin
Scenario: Corredor registra sessão de musculação com conexão disponível
  Given que estou autenticado e com conexão disponível
  When registro uma Sessão de Treino de Musculação informando grupo muscular e intensidade
  Then o registro é confirmado para mim
  And é sincronizado com a API
```

```gherkin
Scenario: Corredor registra dor pós-treino
  Given que estou autenticado e com conexão disponível
  When registro uma dor informando a data e a região do corpo
  Then o registro é confirmado para mim
  And é sincronizado com a API
```

```gherkin
Scenario: Corredor vê alerta de sobrecarga logo após registrar um treino
  Given que estou autenticado e com conexão disponível
  And meu histórico persistido caracteriza risco de sobrecarga
  When registro uma nova Sessão de Treino e ela é sincronizada
  Then o app consulta a avaliação de sobrecarga
  And me exibe o alerta de risco com a sugestão de ajuste retornada pela API
```

```gherkin
Scenario: Corredor consulta seu histórico de treinos
  Given que estou autenticado e tenho sessões de treino sincronizadas
  When abro meu histórico de treinos
  Then vejo minhas sessões de corrida e de musculação registradas
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Corredor registra treino sem conexão
  Given que estou autenticado e sem conexão de rede
  When registro uma Sessão de Treino de Corrida válida
  Then o registro é confirmado para mim mesmo assim
  And fica pendente de sincronização
  And nenhum erro de conexão é apresentado como falha do meu registro
```

```gherkin
Scenario: Fila sincroniza sozinha quando a conexão volta
  Given que tenho registros pendentes criados sem conexão
  When a conexão de rede volta
  Then os registros pendentes são enviados à API automaticamente
  And deixam de constar como pendentes
```

```gherkin
Scenario: Reenvio do mesmo registro não cria duplicata
  Given que um registro foi enviado à API mas o app não recebeu a confirmação
  When o app tenta enviar esse mesmo registro novamente
  Then a API reconhece a chave de idempotência já processada
  And nenhum registro duplicado é criado
  And o item é considerado sincronizado
```

```gherkin
Scenario: Tela inicial sinaliza registros pendentes
  Given que estou autenticado
  And tenho registros pendentes de sincronização
  When abro a tela inicial
  Then vejo a avaliação de sobrecarga retornada pela API
  And vejo a indicação de quantos registros ainda não foram sincronizados
```

```gherkin
Scenario: Corredor com menos de 14 dias de histórico
  Given que estou autenticado
  And meu histórico de treino tem menos de 14 dias
  When abro a tela inicial
  Then não recebo alerta de risco
  And vejo que o app ainda está reunindo dados para avaliar sobrecarga
```

```gherkin
Scenario: Corredor sem nenhum treino registrado
  Given que estou autenticado e nunca registrei um treino
  When abro meu histórico de treinos
  Then vejo um estado inicial orientando a registrar meu primeiro treino
  And nenhum erro é apresentado
```

```gherkin
Scenario: Token do Google expira durante o uso
  Given que estou autenticado e meu token do Google expirou
  When realizo uma ação que consulta a API
  Then o app obtém um token novo silenciosamente
  And a ação é concluída sem que eu precise fazer login de novo
```

---

### Cenários — Error Cases

```gherkin
Scenario: Login com Google é cancelado ou falha
  Given que ainda não estou autenticado
  When inicio o login com Google e ele é cancelado ou falha
  Then permaneço na tela de login
  And vejo que não foi possível entrar, podendo tentar novamente
```

```gherkin
Scenario: Renovação do token falha
  Given que estou autenticado e meu token do Google expirou
  And a renovação silenciosa do token falha
  When realizo uma ação que consulta a API
  Then sou levado à tela de login
  And meus registros pendentes permanecem na fila, sem perda
```

```gherkin
Scenario: Registro rejeitado pela validação de domínio
  Given que tenho um registro pendente que a API rejeita por dado inválido
  When o app tenta sincronizar esse registro
  Then a API responde 400 com a mensagem de validação do domínio
  And o registro é removido da fila
  And sou informado de que aquele registro não pôde ser salvo
```

```gherkin
Scenario: Falha transitória do servidor durante a sincronização
  Given que tenho um registro pendente
  When o app tenta sincronizar e o servidor responde com erro transitório
  Then o registro permanece pendente na fila
  And será reenviado em uma tentativa posterior
```

---

## Mapping: Cenário → Teste

> Caminhos propostos — a estrutura do app é criada no `/implement`. Test runner: Jest (conforme `.sdd/STACK.md`).

| Cenário | Arquivo de Teste | Status |
|---------|-----------------|--------|
| Primeiro login com Google | `auth/__tests__/googleSignInSession.test.ts` | 🟢 Green |
| Registrar corrida com conexão | `overload/__tests__/assessmentAfterLog.test.ts` | 🟢 Green |
| Registrar musculação com conexão | `overload/__tests__/assessmentAfterLog.test.ts` · `sync/__tests__/offlineQueue.test.ts` | 🟢 Green |
| Registrar dor | `overload/__tests__/assessmentAfterLog.test.ts` · `sync/__tests__/offlineQueue.test.ts` | 🟢 Green |
| Alerta de sobrecarga após registrar treino | `overload/__tests__/assessmentAfterLog.test.ts` | 🟢 Green |
| Consultar histórico de treinos | `training/__tests__/trainingHistory.test.ts` · `api/__tests__/httpQueryApi.test.ts` | 🟢 Green |
| Registrar treino sem conexão | `sync/__tests__/offlineQueue.test.ts` | 🟢 Green |
| Fila sincroniza quando a conexão volta | `sync/__tests__/autoSync.test.ts` · `sync/__tests__/transientFailure.test.ts` | 🟢 Green |
| Reenvio não cria duplicata | `sync/__tests__/idempotency.test.ts` | 🟢 Green |
| Tela inicial sinaliza pendentes | `home/__tests__/pendingIndicator.test.ts` | 🟢 Green |
| Menos de 14 dias de histórico | `home/__tests__/insufficientHistory.test.ts` · `api/__tests__/httpQueryApi.test.ts` | 🟢 Green |
| Sem nenhum treino registrado | `training/__tests__/trainingHistory.test.ts` | 🟢 Green |
| Token expira durante o uso | `auth/__tests__/tokenRefresh.test.ts` · `api/__tests__/httpQueryApi.test.ts` | 🟢 Green |
| Login cancelado ou falho | `auth/__tests__/googleSignInSession.test.ts` | 🟢 Green |
| Renovação de token falha | `auth/__tests__/tokenRefresh.test.ts` · `api/__tests__/httpQueryApi.test.ts` | 🟢 Green |
| Registro rejeitado — 400 | `sync/__tests__/permanentFailure.test.ts` · `overload/__tests__/assessmentAfterLog.test.ts` | 🟢 Green |
| Falha transitória durante sync | `sync/__tests__/transientFailure.test.ts` | 🟢 Green |

> **Sem teste de renderização de tela.** `@testing-library/react-native` não instala:
> exige `react-dom@19.2.8`, incompatível com o `react@19.2.3` que o Expo SDK 57 fixa.
> Os cenários acima estão cobertos na camada de lógica — fila, sincronização, sessão,
> leitura da API e os estados que cada tela exibe (`home/homeState`,
> `training/trainingHistory`, `features/logRecord`). O que fica sem cobertura
> automatizada é a renderização em si e a montagem do payload nos formulários de
> registro: só verificáveis manualmente por enquanto.

**Backend (mudança desta story):**

| Cenário | Arquivo de Teste | Status |
|---------|-----------------|--------|
| Reenvio não cria duplicata (lado API) | `tests/Steady.Api.Tests/IdempotencyTests.cs` | 🟢 Green |
| API não sobe sem client ID do Google (ADR-002) | `tests/Steady.Api.Tests/GoogleClientIdConfigurationTests.cs` | 🟢 Green |
| Registro sem chave — 400 (ADR-003) | `tests/Steady.Api.Tests/IdempotencyTests.cs` | 🟢 Green |
| Mesma chave, corredores diferentes — escopo por corredor | `tests/Steady.Api.Tests/IdempotencyTests.cs` | 🟢 Green |
| Treinos idênticos com chaves distintas — ambos persistidos | `tests/Steady.Api.Tests/IdempotencyTests.cs` | 🟢 Green |
| Histórico insuficiente é estado próprio, não "sem risco" (ADR-004) | `tests/Steady.Domain.Tests/OverloadDetectionTests.cs` · `tests/Steady.Api.Tests/OverloadAssessmentEndpointTests.cs` | 🟢 Green |

---

## Notas de Especificação

- **ADR-003 é pré-requisito do `/implement`**: a chave de idempotência altera API, Infrastructure e exige migration — mudança que afeta 2+ módulos, portanto ADR obrigatório (Acordos do Time, §6 da Constituição do projeto).
- **Fora do escopo**: geração de Plano de Treino / plano de 20 semanas e GPS ao vivo, ambos presentes em `Marathon training app design/`. Justificativa em [story.md](./story.md).
- **Sem lógica de domínio no cliente**: o app não replica a regra do ADR-001. Qualquer cálculo de risco no app seria uma segunda fonte de verdade e violaria FF-004.
- **A fila é o coração do risco**: a suposição crítica #2 da DISC-001 (registro consistente) depende dela. Foi o motivo de escolher fila offline em vez de erro-com-retry, aceitando a complexidade adicional apesar do anti-pattern "Abstração Prematura" — aqui a necessidade é presente, não hipotética.
- **Divergência herdada de `PainLog`** (dor não vinculada a sessão): registrada em [story.md](./story.md). **Resolvida pelo `/sync` em 2026-08-16** — o critério de aceite da STORY-001 foi alinhado ao modelo real, que fica como está.
- **Ida ao login esvazia a pilha de navegação** (`/sync`, 2026-08-16): o cenário "Renovação do token falha" descreve o redirecionamento, mas `replace` sozinho deixava a home alcançável pelo gesto de voltar quando a sessão caía a partir de uma tela empilhada. Corrigido em `auth/goToLogin.ts`; o comportamento está especificado na [STORY-004](../STORY-004/spec.bdd.md), cenário "Corredor não retorna a telas autenticadas pelo histórico de navegação".
