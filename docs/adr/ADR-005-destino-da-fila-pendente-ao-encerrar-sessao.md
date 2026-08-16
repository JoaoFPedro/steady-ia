# ADR-005: Destino da fila de registros pendentes ao encerrar a sessão

> **Data**: 2026-08-16
> **Status**: Accepted
> **Story**: STORY-004
> **Decisores**: Jefferson

## Contexto

A STORY-004 abre o primeiro caminho de saída da conta no app. Até aqui o app assumia **uma conta por
aparelho, para sempre**: o `_layout.tsx` reaproveita a credencial do Google a cada abertura e não
existe volta ao login.

Abrir esse caminho colide com a fila offline da STORY-003. A fila mora numa chave única e global do
AsyncStorage (`@steady/fila-de-registros`) e o item é `{ idempotencyKey, kind, payload, queuedAt }`
— **não carrega dono**. O token do Google só é anexado no momento do envio
(`HttpRecordApi.send` → `session.currentToken()`), e o backend deriva o Corredor do claim `sub`
desse token (ADR-002). Ou seja: **quem estiver autenticado quando a fila drenar é quem recebe os
registros**.

Com um botão de sair, a sequência abaixo passa a ser alcançável:

```
Corredor A registra 3 treinos sem sinal  →  ficam na fila do aparelho
Corredor A sai da conta                  →  tela de login
Corredor B entra no mesmo aparelho       →  home
A conexão volta  →  startAutoSync dispara  →  os 3 treinos de A são enviados
                                              com o token de B
```

O resultado viola o **mandato inviolável** da `PROJECT-CONSTITUTION.md` (dados de saúde e
localização nunca expostos entre usuários), cai em A01 (Broken Access Control) do checklist OWASP do
PLAYBOOK, e corrompe a avaliação de sobrecarga dos **dois** corredores — carga inflada em B gera
alerta falso, carga ausente em A mascara risco real (ADR-001).

Também é preciso decidir a **ordem** entre descartar a fila e encerrar a sessão no Google, e o que
fazer quando o encerramento falha.

## Opções Consideradas

### Opção A: Sincronizar antes de sair; se sobrar pendente, avisar e descartar mediante confirmação

- **Prós**: KISS — nenhuma estrutura nova de dados; nunca atribui registro ao corredor errado; na
  maioria das saídas (com conexão) a fila esvazia e o corredor não vê fricção nenhuma; a perda é
  escolha informada, com o número explícito na tela, em vez de efeito colateral invisível.
- **Contras**: descarta registro de treino feito na rua quando a saída acontece sem conexão. É o
  primeiro caminho do app que apaga dado de treino — até aqui a fila só perdia item por confirmação
  do servidor ou rejeição 400.

### Opção B: Bloquear a saída enquanto houver registros pendentes

- **Prós**: implementação trivial; nenhum dado é perdido.
- **Contras**: prende o corredor dentro da própria conta exatamente quando ele está offline — que é
  o cenário de uso central da STORY-003. "Sincronize antes de sair" é uma exigência que o corredor
  pode não ter como cumprir (sem sinal, viajando, emprestando o aparelho). Transforma uma feature de
  conveniência em um beco sem saída.

### Opção C: Carimbar cada item da fila com o `sub` do dono; o envio descarta o que não é do corredor atual

- **Prós**: nenhum dado é perdido e o isolamento é garantido estruturalmente, não por fluxo de tela.
- **Contras**: obriga o app a **armazenar identidade do corredor**, o que hoje ele deliberadamente
  não faz — o `sub` passaria a viver no AsyncStorage junto de dados de treino. Exige migração da
  fila existente (itens sem dono), muda `PendingRecord`, `RecordQueue` e `HttpRecordApi`, e cria a
  pergunta nova de por quanto tempo guardar a fila de um corredor que não volta. Custo
  desproporcional para um MVP cujo aparelho tem, na prática, um corredor só.

## Decisão

Escolhemos a **Opção A**.

Ao sair, nesta ordem:

1. O app tenta sincronizar a fila. Esvaziou → encerra a sessão direto, sem perguntar nada.
2. Sobrou item → informa **quantos** registros serão perdidos e aguarda confirmação explícita.
3. Confirmado → **descarta a fila** (`RecordQueue.clear()`), **depois** encerra a sessão no Google,
   e leva o corredor à tela de login.

Cancelar é inerte: sessão ativa, fila intacta.

**A ordem descarte → `signOut()` é deliberada.** As duas falhas possíveis não são simétricas:

| Falha | Resultado |
|-------|-----------|
| Descarte falha, sessão ainda ativa | Fila preservada com o dono certo ainda logado — ruim, mas **seguro** |
| Sessão encerrada, descarte falha depois | Fila **órfã** exposta ao próximo corredor — exatamente o dano que este ADR existe para impedir |

Descartar primeiro faz o app falhar para o lado seguro.

**Falha ao encerrar a sessão**: o corredor é informado e **permanece autenticado**. O
`GoogleSignInSession.signOut()` atual captura a exceção com o comentário *"Sair localmente basta: se
o Google falhar, a sessão daqui já se foi"* — a premissa é falsa. Não existe sessão do lado do app:
o único estado de identidade é o cache do módulo nativo. Se o `signOut` nativo falha, a credencial
continua no aparelho e o `signInSilently` do `_layout.tsx` reautentica o corredor na próxima
abertura. Anunciar "você saiu" nesse caso é uma falsa sensação de saída — pior que a falha.

**Segunda linha de defesa**: mesmo que o descarte falhasse, o `startAutoSync` continua montado após
a saída, e sem sessão o `HttpRecordApi` devolve `unauthenticated`, fazendo o `SyncEngine` parar no
primeiro item sem esvaziar a fila. Isso hoje é consequência não intencional do design da STORY-003 —
passa a ser comportamento fixado em teste.

## Consequências

### Positivas

- Nenhum registro de treino é atribuído ao corredor errado, em nenhuma ordem de eventos
- Nenhuma estrutura de dados nova: `PendingRecord` e o formato da fila continuam iguais, sem migração
- O app continua sem armazenar identidade do corredor localmente — menos dado sensível em repouso
- Na saída com conexão (o caso comum) o corredor não vê fricção alguma
- O modo de falha do encerramento passa a ser honesto em vez de silencioso

### Negativas

- Registros feitos sem conexão **são perdidos** se o corredor sair antes de sincronizar. Aceito
  conscientemente: é perda de registro de um corredor que escolheu sair, não vazamento de dado de
  saúde entre corredores
- O app ganha seu primeiro caminho destrutivo de dado de treino, o que exige a confirmação explícita
  como parte inseparável da feature — nunca um descarte silencioso
- Um corredor que sai e volta na mesma conta sem sincronizar também perde a fila, embora nesse caso
  os dados voltassem para o dono certo

### Riscos

- **Corredor confirma sem ler e perde treinos** → mitigação: a confirmação declara a quantidade
  exata ("3 registros ainda não foram enviados") e só aparece quando há o que perder; saída com fila
  vazia não pergunta nada, então o aviso nunca vira ruído habitual
- **Descarte falha e a sessão é encerrada mesmo assim** → mitigação: ordem descarte → `signOut()`, e
  o `SyncEngine` parando em `unauthenticated` como segunda barreira
- **`RecordQueue.clear()` usado por engano em outro fluxo no futuro** → mitigação: método existe
  exclusivamente para esta regra e é referenciado por este ADR; `/review` cobre A01 explicitamente

## Evolução

A **Opção C** (carimbar o `sub` do dono em cada item da fila) continua sendo a solução estruturalmente
correta e deve ser reavaliada quando **um aparelho passar a ter mais de um corredor de verdade** —
por exemplo, se o Steady sair do dogfooding solo para uso em grupo de corrida. Nesse momento a perda
de registro deixa de ser aceitável e o custo da identidade local se justifica.

## Referências

- `.sdd/PROJECT-CONSTITUTION.md` — mandato inviolável: dados de saúde/localização nunca expostos entre usuários
- `.sdd/PLAYBOOK.md` — seção A01 (Broken Access Control)
- [ADR-001](./ADR-001-regra-sobrecarga-combinada.md) — carga inflada gera alerta de sobrecarga falso
- [ADR-002](./ADR-002-autenticacao-e-isolamento-de-dados.md) — Corredor derivado do claim `sub` do token
- [ADR-003](./ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md) — chave de idempotência da fila
- `specs/STORY-004/analysis.md` — saídas A/B/C e o cenário de troca de corredor
- `specs/STORY-004/spec.bdd.md` — regras de negócio 4, 6 e 9
