# ADR-016: Claude API como provedor da explicação da revisão

> **Data**: 2026-08-28
> **Status**: Accepted
> **Story**: STORY-014
> **Decisores**: Produto e Engenharia Steady

## Contexto

A ADR-014 reduz o papel do modelo a redigir uma explicação a partir de fatos já
calculados e de uma ação já autorizada. Falta definir provedor, formato de
saída, tempo limite, minimização de contexto e retenção.

Os dados envolvidos são de saúde e desempenho físico. O mandato inviolável da
Constituição diz que eles nunca são expostos a outro usuário; enviá-los a um
terceiro exige o mesmo cuidado, agravado por ser uma fronteira externa nova.

## Opções Consideradas

### Opção A: Modelo local

- **Prós**: nenhum dado sai do servidor.
- **Contras**: infraestrutura e custo desproporcionais para um MVP solo de 2–3
  meses; qualidade de texto em português abaixo do necessário nos modelos que
  caberiam no orçamento.

### Opção B: Provedor externo sem saída estruturada, texto livre

- **Prós**: integração trivial.
- **Contras**: a validação da ADR-014 teria de interpretar prosa para verificar
  se a ação foi respeitada — exatamente o que a fronteira determinística evita.

### Opção C: Claude API com saída estruturada

- **Prós**: schema tipado torna a validação mecânica; SDK oficial; alinhado ao
  ecossistema em que o projeto já é desenvolvido.
- **Contras**: dependência externa paga, com latência e indisponibilidade
  próprias; exige contrato explícito de retenção e redaction.

## Decisão

Escolhemos **Opção C**.

**Porta e adaptador**

- `IExplanationProvider` no domínio/aplicação, com uma operação: fatos + ação
  autorizada → explicação estruturada ou falha. O domínio não conhece Anthropic.
- `ClaudeExplanationProvider` na camada de infraestrutura/API, usando o SDK
  oficial. Um teste em memória cobre todos os cenários da spec sem rede.

**Saída estruturada**

Schema fechado, sem campo de texto livre fora dele:

| Campo | Conteúdo |
|---|---|
| `divergencias` | lista de frases, uma por campo divergente já calculado |
| `possiveisImpactos` | lista de frases sobre o treino seguinte, sem causalidade afirmada |
| `acao` | enum, obrigatoriamente igual à ação autorizada recebida |
| `observacaoDeDor` | presente somente quando há `PainLog` na data; sem causa nem diagnóstico |

A validação da ADR-014 roda sobre esse objeto antes de qualquer persistência.

**Contexto enviado — minimização**

Enviado: a comparação calculada (prescrito, executado, diferença, estado por
campo), a modalidade, a data relativa, a ação autorizada, e um booleano
indicando dor registrada na data.

Nunca enviado: identificadores do corredor, e-mail, `sub` do Google, nome,
região da dor, dados de qualquer outro corredor, histórico além do necessário
para a comparação, ou qualquer texto livre digitado pelo corredor ou pelo
personal. As descrições de prescrição vão apenas quando o campo correspondente
é comparável, e como contexto do número, nunca no lugar dele.

Um teste de privacidade percorre o payload montado e falha se encontrar qualquer
campo fora da lista permitida — a lista é positiva, não uma lista de proibições.

**Operação**

- Tempo limite de 15 segundos por chamada. Estouro é falha, e falha deixa a
  revisão com explicação `Indisponivel`.
- Nenhuma retentativa automática, em nenhum nível. Só `Tentar novamente` do
  corredor, uma requisição por toque (ADR-014).
- A chamada acontece fora da transação que persiste a execução. Falhar nela
  nunca desfaz, duplica ou invalida o registro do treino.
- Retenção: o Steady persiste apenas a explicação validada, dentro da própria
  `WorkoutReview`. Prompt e resposta bruta não são armazenados. O log de
  incidente registra motivo da rejeição, versão da política e id da revisão —
  nunca o conteúdo rejeitado nem dado do corredor, seguindo o padrão de
  `CoachingAuditLog`.
- Credencial em variável de ambiente, validada no arranque como
  `Google__ClientId` já é (ADR-002). Sem chave, a API sobe e as revisões nascem
  com explicação `Indisponivel` — a comparação e a ação determinísticas
  continuam funcionando, porque não dependem do provedor.

## Consequências

### Positivas

- A validação da saída é mecânica, não interpretativa.
- O dado que sai do servidor é o mínimo, e isso é verificado por teste.
- O Steady continua entregando comparação e recomendação sem o provedor.

### Negativas

- Custo por revisão e latência de rede em um caminho que antes não existia.
- Mais uma credencial e uma fronteira externa a operar.
- O schema fechado limita a qualidade do texto — trade-off aceito na ADR-014.

### Riscos

- Vazamento por evolução descuidada do payload → lista permitida positiva com
  teste que falha ao encontrar campo novo.
- Custo crescer com o uso → só execução divergente chama o provedor, e apenas
  uma vez por revisão, com retentativa manual.
- Indisponibilidade prolongada deixar muitas revisões sem texto → a ação e a
  comparação continuam visíveis; a explicação é acréscimo, não requisito.
- Mudança de modelo alterar o estilo das explicações → o modelo é configuração,
  e a versão usada fica registrada na revisão.

## Referências

- `specs/STORY-014/spec.bdd.md` — cenários de falha, retry e privacidade do provedor
- ADR-002 — validação de configuração obrigatória no arranque
- ADR-003 — idempotência do registro
- ADR-014 — fronteira determinística entre comparação, política e explicação
- ADR-015 — versionamento das políticas
- `.sdd/PROJECT-CONSTITUTION.md` — mandato inviolável sobre dados de saúde
