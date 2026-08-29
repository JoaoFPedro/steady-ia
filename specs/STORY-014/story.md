# Story: STORY-014 — Revisão de aderência após o treino com IA

Discovery: `.discovery/DISC-005-revisao-de-aderencia-pos-treino/`

## Descrição

Como **corredor que segue o plano do Steady, uma ficha publicada pelo personal
ou ambos**,
Quero **receber uma revisão do treino executado em relação ao que estava
prescrito**,
Para que **eu entenda as divergências e decida conscientemente entre manter o
próximo treino, reduzir carga ou priorizar recuperação**.

## Contexto

O Steady já registra execuções de corrida e musculação, exibe o planejamento do
dia e deriva conclusão total ou parcial por modalidade. Contudo, depois de uma
execução diferente da prescrição, o corredor não recebe uma análise detalhada e
segue o próximo treino normalmente.

A revisão cruza o plano de corrida do Steady e a ficha ativa do personal com a
execução imutável registrada. Comparações e limites de segurança pertencem ao
código e devem ser rastreáveis a fontes reconhecidas. A IA recebe somente fatos
estruturados e contexto autorizado para produzir uma explicação limitada. Sua
saída não altera plano ou ficha.

Como o registro é offline-first, a indisponibilidade de rede nunca impede o
salvamento. Nessa situação, a revisão fica pendente e aparece depois da
sincronização.

## Critérios de Aceite

- [ ] Depois de uma execução sincronizada, o corredor recebe uma revisão vinculada ao treino e à prescrição aplicável daquele dia.
- [ ] Somente divergências acima das tolerâncias configuradas geram revisão; aderência integral e pequenas variações não geram alerta.
- [ ] As tolerâncias são configuráveis, versionadas e rastreáveis na revisão.
- [ ] A revisão considera simultaneamente o plano do Steady e a ficha ativa do personal quando ambos estiverem presentes.
- [ ] Prescrições conflitantes são mostradas ao corredor em um pop-up na Dashboard e não produzem recomendação.
- [ ] Para corrida, a comparação considera conclusão, distância, duração e esforço percebido.
- [ ] Para musculação, a comparação considera conclusão, exercícios, séries, repetições e cargas.
- [ ] Dias combinados distinguem a aderência de corrida e musculação sem ocultar execução parcial.
- [ ] Fatos, diferenças numéricas e limites de segurança são calculados deterministicamente antes da explicação por IA.
- [ ] A explicação identifica divergências e possíveis impactos sem diagnosticar, inventar causalidade ou apresentar certeza não sustentada.
- [ ] A revisão recomenda, de forma informativa, uma ação entre manter o próximo treino, reduzir carga ou priorizar recuperação.
- [ ] O plano do Steady e a ficha do personal nunca são alterados pela revisão do MVP.
- [ ] Dor relevante, dados insuficientes ou conflito com limites de segurança produzem uma saída segura e não uma recomendação esportiva inventada.
- [ ] O corredor pode informar que não entendeu ou que a revisão não fez sentido.
- [ ] O corredor confirma a leitura por meio da ação `Entendi` e o sistema mede a coerência do próximo treino elegível com a recomendação apresentada.
- [ ] Ausência do próximo registro permanece desconhecida e não é classificada como recuperação.
- [ ] Um treino salvo offline mantém o comportamento atual da fila; sua revisão fica pendente e aparece depois da sincronização.
- [ ] Falha ou indisponibilidade do provedor de IA não perde, duplica nem invalida o registro do treino.
- [ ] Dados de outro corredor ou de vínculo não autorizado nunca entram no contexto enviado à IA.
- [ ] A Dashboard mostra somente a revisão mais recente; todas as revisões permanecem no histórico dos respectivos treinos.
- [ ] O personal com vínculo ativo vê a revisão completa, a recomendação, a confirmação `Entendi` e a coerência com o treino seguinte.
- [ ] Qualquer dor registrada no mesmo dia força a recomendação `priorizar recuperação`.
- [ ] Se a IA falhar, uma nova tentativa ocorre somente quando o corredor tocar em `Tentar novamente`.
- [ ] Casos comuns, incompletos, contraditórios e perigosos são avaliados antes da liberação da feature.

## Estimativa

- **Tamanho**: G (sem as habilitadoras STORY-015 e STORY-016, separadas)
- **Complexidade**: Alta

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-003 — registro offline-first e idempotente | Concluída |
| Story | STORY-012 — vínculo entre planejamento e execução | Concluída |
| Story | STORY-013 — ficha e execução detalhada do personal | Concluída |
| Domínio | Regras, tolerâncias versionadas e fontes para comparação e limites de segurança | Decidido — ADR-014 e ADR-015 |
| Serviço | Provedor de IA com saída estruturada | Decidido — ADR-016 (Claude API) |
| Story | STORY-015 — prescrição de corrida estruturada na ficha (ADR-012) | Planejada — bloqueia, entra primeiro |
| Story | STORY-016 — plano do Steady como prescrição no servidor (ADR-013) | Planejada — bloqueia, depende da STORY-015 |

> Última da sequência **STORY-015 → STORY-016 → STORY-014**.

## Decisões arquiteturais

| ADR | Assunto |
|-----|---------|
| ADR-012 | Prescrição de corrida estruturada na ficha do personal |
| ADR-013 | Plano do Steady persistido como fonte de prescrição |
| ADR-014 | Fronteira determinística entre comparação, política de segurança e explicação por IA |
| ADR-015 | Tolerâncias e políticas de aderência versionadas |
| ADR-016 | Claude API como provedor da explicação da revisão |

## Fora de Escopo

- Alterar automaticamente o próximo treino, a ficha ou o plano.
- Gerar plano de corrida ou ficha de musculação.
- Diagnosticar lesão ou substituir avaliação profissional.
- Chat aberto com a IA.
- Integração com wearables, sono, HRV ou frequência cardíaca.
- Reprocessamento histórico em massa.

## Notas

- A revisão completa é compartilhada somente com o personal que possuir
  vínculo ativo; ao encerrar o vínculo, o acesso é removido.
- A evolução para adaptar automaticamente um treino futuro exige um novo
  discovery e autorização explícita do corredor e, quando aplicável, do
  personal.
- As métricas e suposições completas estão em `hypothesis.md` no discovery.
