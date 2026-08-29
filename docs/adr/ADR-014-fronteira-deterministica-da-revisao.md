# ADR-014: Fronteira determinística entre comparação, política de segurança e explicação por IA

> **Data**: 2026-08-28
> **Status**: Accepted
> **Story**: STORY-014
> **Decisores**: Produto e Engenharia Steady

## Contexto

A STORY-014 apresenta ao corredor uma recomendação — `Manter`, `ReduzirCarga`
ou `PriorizarRecuperacao` — depois de um treino que divergiu da prescrição. O
maior risco do DISC-005 é a suposição #1: uma explicação convincente e errada
gera mais confiança que o fluxo atual e influencia carga e fadiga.

A Lei do Domínio #4 é inviolável: toda regra de progressão ou prevenção de
lesão é rastreável a uma fonte reconhecida, via ADR. Um modelo de linguagem não
é fonte reconhecida de fisiologia esportiva.

Ao mesmo tempo, a execução registrada é imutável (Lei do Domínio #2) e a
revisão nasce depois dela, de forma assíncrona, podendo falhar, ser repetida ou
nunca ser lida.

## Opções Consideradas

### Opção A: A IA analisa os dados e escolhe a ação

- **Prós**: implementação curta; um prompt resolve.
- **Contras**: a ação passa a não ter fonte rastreável; irreprodutível; a mesma
  execução pode gerar recomendações diferentes; inaceitável sob a Lei #4.

### Opção B: A IA propõe e o código valida a proposta

- **Prós**: aproveita o modelo mantendo um limite.
- **Contras**: se o código sabe validar, ele sabe decidir; a proposta do modelo
  só adiciona um caminho de falha e a tentação de aceitar o que passa raspando.

### Opção C: O código decide, a IA redige

- **Prós**: ação sempre rastreável e reprodutível; a saída do modelo é
  verificável contra fatos já calculados; falha do provedor degrada o texto, não
  a recomendação.
- **Contras**: o texto fica limitado ao que os fatos sustentam; exige validação
  estrutural e semântica da saída antes de exibir.

## Decisão

Escolhemos **Opção C**. A fronteira é a seguinte, e nada a atravessa:

**Determinístico (domínio C# puro, `Steady.Domain/Adherence`)**

1. Resolver a prescrição aplicável à data da execução, a partir do plano do
   corredor e da ficha ativa (ADR-012, ADR-013), preservando referência imutável
   à versão usada.
2. Comparar campo a campo. Cada campo produz `Aderente`, `Divergente` ou
   `NãoComparável`, com valor prescrito, valor executado e diferença.
3. Classificar a execução: `Aderente`, `Divergente` ou `ConflitoDePrescricao`.
4. Aplicar a política de segurança e produzir **uma** ação autorizada.

**Ação autorizada — regras e fontes**

Todas reaproveitam as fontes já aceitas pela ADR-001 (Foster 2001, session-RPE;
Gabbett 2016, ACWR; Daniels, hard/easy) e a regra dos 10% da Lei do Domínio #1.

| Condição (avaliada nesta ordem) | Ação | Fonte |
|---|---|---|
| Existe `PainLog` do corredor na data da execução | `PriorizarRecuperacao` | Lei do Domínio #4; dor é sinal de calibração da ADR-001. O domínio não guarda intensidade da dor, então qualquer dor tem precedência |
| `ConflitoDePrescricao` | Nenhuma ação | Não há prescrição única contra a qual decidir |
| Nenhum campo comparável, ou nenhuma regra abaixo se aplica | Nenhuma ação — `DadosInsuficientes` | ADR-004: "não sei" é um estado, não um zero |
| Carga da execução ≥ 110% da carga prescrita, ou sobrecarga combinada já sinalizada pela ADR-001 na janela | `ReduzirCarga` | Regra dos 10% (Lei #1); ACWR (Gabbett 2016) |
| Execução abaixo da prescrição, ou divergência sem excesso de carga | `Manter` | Hard/easy (Daniels): um treino curto não justifica compensar no seguinte |

Carga usa a mesma escala session-RPE já definida pela ADR-001 — duração ×
esforço para corrida, duração × peso da intensidade para musculação — para que
prescrito e executado sejam comparáveis na mesma unidade.

**Não determinístico (`IExplanationProvider`, ADR-016)**

5. O modelo recebe apenas os fatos calculados nos passos 1–4 e a ação já
   autorizada. Ele redige a explicação das divergências e dos possíveis
   impactos.
6. A saída é rejeitada quando: nomeia ação diferente da autorizada; afirma
   diagnóstico, lesão ou causa para a dor; introduz número que não está nos
   fatos; ou não satisfaz o schema. Saída rejeitada não é persistida nem
   exibida — a revisão fica com explicação `Indisponivel` e o botão
   `Tentar novamente`.
7. Não há retentativa automática. `Tentar novamente` é uma ação do corredor e
   reutiliza os mesmos fatos e as mesmas versões de regra.

**A revisão é um fato próprio**

- `WorkoutReview` é uma entidade nova, vinculada à execução por id. Nada é
  escrito na execução, que permanece imutável.
- Ela guarda o snapshot da comparação, as versões de prescrição e de política
  aplicadas, a ação autorizada, o estado da explicação, a confirmação `Entendi`
  e a coerência. Guardar o snapshot é o que torna a revisão reproduzível depois
  de a ficha ou as tolerâncias mudarem.
- A revisão nunca altera plano, ficha ou treino futuro.
- Uma execução tem no máximo uma revisão. A chave de idempotência da execução
  (ADR-003) governa isso: reenvio não cria segunda revisão.
- Execução `Aderente` não cria revisão nem chama o provedor.

## Consequências

### Positivas

- A recomendação é reprodutível, testável sem rede e rastreável a fontes.
- Falha, lentidão ou indisponibilidade do provedor não afetam registro nem ação.
- A auditoria de um caso perigoso examina dados, não um prompt.

### Negativas

- A explicação é mais pobre do que um modelo livre produziria, por construção.
- A validação da saída é código a mais, com casos de teste próprios.
- Toda ação nova exige ADR novo — o custo pretendido da Lei #4.

### Riscos

- Explicação verdadeira nos fatos mas alarmante no tom → o schema fixa o
  vocabulário da ação e proíbe termos diagnósticos; casos perigosos entram na
  bateria de avaliação antes da liberação.
- Validador aceitar paráfrase que contradiz a ação → a ação é campo estruturado
  da saída, não texto; o texto é verificado contra lista de termos proibidos.
- Regra da tabela envelhecer com o uso → versionada pela ADR-015; mudança gera
  versão nova, nunca reescreve revisão existente.

## Referências

- `specs/STORY-014/spec.bdd.md` — cenários de segurança, autorização e erros
- `.discovery/DISC-005-revisao-de-aderencia-pos-treino/hypothesis.md` — suposição #1 e maior risco
- ADR-001 — regra de detecção de sobrecarga combinada (session-RPE, ACWR, 10%)
- ADR-003 — chave de idempotência para sincronização offline
- ADR-004 — estado de histórico insuficiente no contrato da avaliação
- ADR-015 — tolerâncias e políticas versionadas
- ADR-016 — provedor da explicação
- `.sdd/PROJECT-CONSTITUTION.md` — Lei do Domínio #1, #2 e #4
