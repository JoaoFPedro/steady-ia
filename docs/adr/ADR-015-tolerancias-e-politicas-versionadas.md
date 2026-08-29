# ADR-015: Tolerâncias e políticas de aderência versionadas

> **Data**: 2026-08-28
> **Status**: Accepted
> **Story**: STORY-014
> **Decisores**: Produto e Engenharia Steady

## Contexto

A STORY-014 exige que somente divergências materiais gerem revisão, que as
tolerâncias sejam configuráveis e rastreáveis, e que alterar a configuração não
reclassifique revisões já calculadas. Exige também medir a coerência entre a
recomendação apresentada e o próximo treino elegível, o que é outra política
sujeita a calibração.

Os limiares não são conhecidos: o DISC-005 os coloca como calibração de piloto,
não como evidência. Eles vão mudar. O que não pode mudar é a leitura histórica.

## Opções Consideradas

### Opção A: Constantes no código

- **Prós**: nada a construir; muda com deploy.
- **Contras**: "configurável" vira mentira; revisões antigas passam a ser lidas
  sob limiares que não as produziram; contradiz o cenário
  `Alterar tolerâncias não reclassifica revisão existente`.

### Opção B: Configuração mutável em banco

- **Prós**: muda sem deploy.
- **Contras**: um UPDATE reescreve o passado; a revisão de ontem passa a
  referenciar um limiar que não existia quando foi calculada.

### Opção C: Conjuntos versionados e imutáveis, com um marcado como vigente

- **Prós**: preserva reprodutibilidade; a revisão aponta para a versão exata que
  a produziu; calibrar é publicar versão nova.
- **Contras**: mais uma tabela e um conceito de "vigente" a administrar.

## Decisão

Escolhemos **Opção C**.

- `AdherencePolicyVersion` é imutável e identificada por número inteiro
  crescente. Publicar uma calibração cria a versão seguinte; nenhuma versão é
  editada ou removida.
- Uma versão vigente por vez. A comparação sempre usa a vigente **no momento do
  cálculo**, e a `WorkoutReview` guarda o número da versão aplicada.
- Recalcular revisão existente não acontece nesta story. Não há reprocessamento
  histórico em massa (fora de escopo da STORY-014).
- A versão 1 nasce no seed da migration, com os valores abaixo. Eles são
  **calibração inicial de piloto**, explicitamente não evidência clínica, e é
  por isso que precisam ser versionados desde o primeiro dia.

**Tolerâncias da versão 1**

| Campo | Material acima de | Origem |
|---|---|---|
| Distância de corrida | 10% da faixa prescrita | Regra dos 10% (Lei do Domínio #1) |
| Duração de corrida | 10% da faixa prescrita | Idem |
| Esforço percebido | 2 pontos na escala RPE 1–10 | Foster 2001 — variação de 1 ponto está dentro do ruído de auto-relato |
| Séries | 1 série | Menor unidade observável |
| Repetições | 20% do prescrito | Faixas de repetição da ficha já são intervalares ("3x8–12") |
| Carga | 10% da referência comparável | Regra dos 10% |
| Exercício pulado | qualquer ocorrência | Não é variação de grau |

Prescrição em faixa é aderente em qualquer ponto dentro da faixa; a tolerância
se aplica às bordas, não ao ponto médio. Campo sem prescrição numérica é
`NãoComparável` e não entra na classificação (ADR-012).

A **referência comparável de carga** é a mediana das cargas do mesmo exercício
nas execuções anteriores do corredor — o histórico que a STORY-013 já
compartilha com o personal. Sem histórico do exercício, a carga é
`NãoComparável`: a ficha não prescreve carga e o código não inventa uma.

**Política de coerência da versão 1**

Comparando a recomendação com o próximo treino elegível — a próxima execução
sincronizada do corredor, de qualquer modalidade, com data posterior à execução
revisada:

| Recomendação | Coerente quando |
|---|---|
| `Manter` | O próximo treino ficou dentro da tolerância da sua própria prescrição |
| `ReduzirCarga` | A carga session-RPE do próximo treino ficou abaixo da carga da execução revisada |
| `PriorizarRecuperacao` | O próximo treino registrado teve carga abaixo da execução revisada, ou houve descanso registrado antes dele |

Enquanto não existir próximo treino sincronizado, a coerência é `Desconhecida`.
Ausência de registro nunca é lida como recuperação, descanso ou coerência — é
ausência de dado, na mesma linha da ADR-004. A avaliação registra a versão da
política usada.

## Consequências

### Positivas

- Calibrar limiares deixa de exigir deploy e deixa de corromper o histórico.
- Toda revisão é auditável: dá para reproduzir a classificação exata.
- A honestidade sobre a origem dos números fica no dado, não só no ADR.

### Negativas

- Duas tabelas e um conceito de vigência para administrar sem interface de
  administração no MVP — a publicação de versão é migration ou script.
- Revisões antigas convivem com limiares diferentes das novas, o que precisa
  aparecer na interface do personal para não parecer inconsistência.

### Riscos

- Versão vigente ausente ou duplicada → constraint de unicidade e teste de
  arranque que falha o serviço, no espírito da ADR-002.
- Tolerância inicial gerar ruído ou silêncio demais → métrica de proporção de
  execuções que viram revisão acompanhada no piloto, com recalibração por versão
  nova.
- Coerência mal medida punir o corredor → a coerência é métrica de produto; não
  altera plano, ficha nem treino, e é exibida como observação, nunca como nota.

## Referências

- `specs/STORY-014/spec.bdd.md` — cenários de tolerância, versionamento e coerência
- `.discovery/DISC-005-revisao-de-aderencia-pos-treino/hypothesis.md` — métricas de validação
- ADR-001 — session-RPE e regra dos 10%
- ADR-004 — estado desconhecido em vez de zero
- ADR-012 — campos não comparáveis
- ADR-014 — fronteira determinística
