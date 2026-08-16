# ADR-003: Chave de idempotência para sincronização offline

> **Data**: 2026-08-15
> **Status**: Accepted
> **Story**: STORY-003
> **Decisores**: Jefferson

## Contexto

A STORY-003 registra treinos de forma **offline-first**: o app grava o registro numa fila local e envia à API quando há conexão. Uma fila com reenvio introduz um risco que a API atual não trata — os endpoints `POST /api/running-sessions`, `/strength-sessions` e `/pain-logs` criam um registro novo a cada chamada, sem qualquer proteção contra reprocessamento.

O cenário de falha é comum, não hipotético: o app envia o registro, o servidor o persiste, e a resposta se perde (timeout, rede caindo, app morto pelo sistema operacional). Do ponto de vista do app o envio falhou, então ele reenvia — e o treino é gravado duas vezes.

O impacto não é cosmético. `OverloadDetectionService` (ADR-001) soma a carga das corridas dos últimos 7 dias e compara com os 7 dias anteriores, sinalizando risco quando o aumento é ≥ 10%. Uma corrida duplicada infla a carga da janela recente e **dispara um alerta de sobrecarga falso** — ou, se a duplicata cair na janela anterior, mascara um alerta verdadeiro. Ou seja: uma falha de transporte corromperia exatamente a regra que é o coração do produto, e o corredor tomaria decisão de treino sobre um número errado. Isso conflita diretamente com a Lei do Domínio #4 (toda regra de prevenção de lesão é rastreável e confiável).

## Opções Consideradas

### Opção A: Chave de idempotência gerada pelo cliente

O app gera um identificador único no momento em que **enfileira** o registro e o envia junto em toda tentativa. O servidor persiste a chave com a linha e, ao receber uma chave já conhecida, devolve o registro existente em vez de criar outro.

- **Prós**: Resolve o caso real (resposta perdida) de forma determinística; sobrevive a crash do app, porque a chave é persistida na fila local antes do primeiro envio; padrão consolidado da indústria (Stripe, IETF `Idempotency-Key`); não depende de o cliente adivinhar se o envio anterior deu certo.
- **Contras**: Exige coluna nova e migration nas três tabelas de registro; a API ganha um caminho de conflito para tratar; o cliente precisa respeitar a regra de gerar a chave **uma vez**, na criação do item.

### Opção B: Deduplicação por conteúdo natural

O servidor recusa um registro cujos campos coincidam com um já existente do mesmo corredor (mesma data, distância, duração...).

- **Prós**: Nenhuma mudança no contrato com o cliente.
- **Contras**: **Semanticamente errado.** Duplicatas legítimas existem — um corredor pode fazer dois treinos parecidos no mesmo dia, e dois treinos de musculação do mesmo grupo com a mesma intensidade e duração são absolutamente plausíveis. Descartar silenciosamente o segundo subestima a carga real e corrompe a avaliação na direção oposta. Troca um erro por outro.

### Opção C: Deduplicação apenas no cliente

O app marca o item como enviado e nunca reenvia.

- **Prós**: Zero mudança no backend; custo de implementação mínimo.
- **Contras**: Não cobre o caso que motiva a decisão — se o app morre entre enviar e marcar, o item continua pendente e será reenviado. A janela é pequena, mas é exatamente a janela em que a rede está instável, ou seja, quando o problema é mais provável.

## Decisão

Escolhemos **Opção A**.

**Contrato**: o app envia o header `Idempotency-Key` com um `Guid` (v4) nas requisições `POST` de registro. A chave é gerada **no momento em que o item entra na fila local**, nunca no momento do envio — gerar por tentativa anularia todo o mecanismo. Requisições de registro sem o header são rejeitadas com **400**, para que a garantia não dependa da disciplina do cliente.

**Persistência**: cada uma das três tabelas de registro (`RunningSession`, `StrengthSession`, `PainLog`) ganha uma coluna `idempotency_key` com **índice único composto `(corredor_id, idempotency_key)`**. O escopo por corredor é deliberado: além de isolar corredores entre si, impede que um cliente use chaves alheias para inferir a existência de registros de outro corredor — a mesma preocupação de A01 já registrada no ADR-002.

**Comportamento no reenvio**: ao receber uma chave já processada para aquele corredor, a API devolve o registro existente com **200 OK**, em vez de criar um novo e retornar 201. O app trata ambos como sucesso e remove o item da fila.

**Sem tabela de chaves separada**: a chave vive na própria linha do registro, o que dispensa uma tabela auxiliar com TTL e rotina de limpeza — complexidade que não se justifica na escala de dezenas a centenas de usuários deste MVP.

## Consequências

### Positivas

- A avaliação de sobrecarga passa a ser confiável mesmo com rede instável — o dado que alimenta ADR-001 fica protegido de inflação por reenvio
- A fila offline pode reenviar livremente, sem precisar saber se o envio anterior chegou; simplifica a lógica do cliente
- Chave na própria linha elimina tabela auxiliar, TTL e job de limpeza
- Índice único é a garantia final: mesmo com uma corrida (race) entre dois envios simultâneos, o banco recusa a segunda inserção

### Negativas

- Migration em três tabelas e mudança no contrato dos três endpoints de registro
- Registros criados por qualquer outro cliente futuro também terão de fornecer a chave — o header passa a ser obrigatório, não opcional
- O caminho de conflito precisa de teste próprio, que só é exercitado em situação de falha (fácil de esquecer de manter)

### Riscos

- **Cliente gerar a chave por tentativa de envio, em vez de na criação do item** → anula completamente a proteção e o bug fica invisível em condições normais de rede. Mitigação: a chave é gravada junto do item na fila local e o teste `sync/__tests__/idempotency.test.ts` cobre explicitamente o reenvio após falha de resposta.
- **Colisão de chave entre corredores diferentes** → mitigada pelo escopo `(corredor_id, idempotency_key)`; uma chave de outro corredor nunca colide nem revela informação.
- **Registro legítimo descartado por engano** → não se aplica: a chave é por item da fila, então dois treinos genuinamente parecidos têm chaves distintas e ambos são persistidos (é justamente a falha da Opção B, evitada aqui).

## Referências

- [ADR-001](./ADR-001-regra-sobrecarga-combinada.md) — regra de sobrecarga que consome a carga de treino e seria corrompida por duplicatas
- [ADR-002](./ADR-002-autenticacao-e-isolamento-de-dados.md) — isolamento por corredor, base do escopo do índice único
- `specs/STORY-003/spec.bdd.md` — cenário "Reenvio do mesmo registro não cria duplicata"
- `.sdd/PROJECT-CONSTITUTION.md` §6 — mudança que afeta 2+ módulos exige ADR
- [Stripe — Idempotent requests](https://docs.stripe.com/api/idempotent_requests) · [IETF draft — The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)
