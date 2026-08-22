# OverloadDetectionService - Sobrecarga - Débitos Técnicos

## Índice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Ação](#3-plano-de-ação)
- [4. User Stories para Implementação](#4-user-stories-para-implementação)

## 1. Resumo Executivo

- **Estado Atual**: código curto (< 75 linhas), bem fatorado em métodos privados pequenos e nomeados, com constantes de negócio nomeadas (`OverloadThreshold`, `MinimumHistoryDays`) e comentário XML citando explicitamente a ADR-001. Coberto por 8 testes (`tests/Steady.Domain.Tests/OverloadDetectionTests.cs`) que exercitam os principais caminhos: sobrecarga detectada, histórico insuficiente (incluindo os três testes dedicados ao estado `HasSufficientHistory` introduzido pelo [ADR-004](../../../docs/adr/ADR-004-estado-de-historico-insuficiente-no-contrato-de-avaliacao.md)), perna leve/moderada não dispara, carga estável não dispara, e não-bloqueio de registro.
- **Distinção importante**: a maior parte da complexidade deste serviço é **regra de negócio densa, mas correta e rastreável** — cada threshold e cada guard clause tem origem documentada em [ADR-001](../../../docs/adr/ADR-001-regra-sobrecarga-combinada.md). Os itens abaixo não questionam a regra em si, apenas riscos e lacunas de implementação/observabilidade em torno dela.
- **Principais Problemas**: mensagem de sugestão fixa e não personalizada (assumida como aproximação no próprio ADR-001); ausência de teste cobrindo o caso "sem carga de corrida na janela anterior" (`previousRunningLoad == 0`); a própria ADR-001 já documenta que o threshold de 110% e os pesos leve/moderado/pesado não foram validados especificamente para o usuário real, sujeitos a calibração.
- **Impacto no Negócio**: baixo a médio. Os riscos de calibração já são conhecidos e mitigados no desenho do produto (o registro de dor serve como sinal de recalibração, e o alerta nunca bloqueia — ver ADR-001, seção Riscos).

## 2. Problemas por Criticidade

### 🔴 Críticos

Nenhum problema crítico identificado.

### 🟡 Importantes

- **Mensagem de sugestão é fixa e genérica, independente dos números reais do corredor**: `SuggestionMessage` é uma `const string` única, igual para qualquer combinação de dados que dispare `isOverloaded = true`. Ela não referencia a carga real (ex: "sua carga aumentou 25%"), nem qual grupo muscular específico foi treinado pesado, nem a distância/duração sugerida. Isso é uma **simplificação deliberada do MVP** (ver `specs/STORY-001/spec.bdd.md`, regra de negócio #5: "uma sugestão concreta de ajuste, não um aviso genérico" — a mensagem atual já cita ações concretas, mas não é personalizada aos dados do usuário), não um bug, mas vale registrar como próximo passo de evolução do produto.
  - **Ação Recomendada**: se o time de produto priorizar personalização, evoluir `Risk()` para aceitar parâmetros (ex: percentual real de aumento, grupo muscular envolvido) e montar a mensagem dinamicamente. Isso é uma mudança de escopo de produto, não uma correção de bug — não deve ser feita sem uma conversa com produto/spec.
- **Nenhum teste cobre explicitamente o caso `previousRunningLoad == 0`**: a condição `previousRunningLoad > 0 && recentRunningLoad >= previousRunningLoad * OverloadThreshold` na linha da regra existe especificamente para impedir que "nenhuma carga na semana anterior" seja tratado como "aumento infinito". Esse ramo de decisão não tem teste dedicado — os testes atuais sempre têm carga de corrida positiva em ambas as janelas.
  - **Ação Recomendada**: adicionar teste unitário isolando esse caso (musculação pesada de perna nos últimos 7 dias + zero sessões de corrida na janela anterior + alguma carga de corrida na janela recente) para fixar o comportamento esperado (`HasRisk = false`) e proteger contra regressão futura.

### 🟢 Menores

- **`HasSufficientHistory` (método privado do serviço) mede span de calendário, não densidade de dados**: a checagem de 14 dias usa a distância entre a sessão mais antiga e hoje, não a quantidade de sessões registradas no período. Não confundir com a propriedade pública `OverloadAssessment.HasSufficientHistory` (introduzida pelo [ADR-004](../../../docs/adr/ADR-004-estado-de-historico-insuficiente-no-contrato-de-avaliacao.md)) — mesmo nome, coisas diferentes: o método aqui é a lógica interna que decide o valor que acaba exposto naquela propriedade. Um corredor com apenas 2 sessões (uma há 14 dias, outra hoje) já passa nessa checagem, mesmo que os "7 dias anteriores" e "7 dias recentes" estejam quase vazios de dados. Isso é uma consequência aceitável da regra definida em ADR-001 (que fala em "período anterior completo de 7 dias", não em quantidade mínima de sessões) — **não é um bug**, mas é uma característica que pode gerar avaliações com pouca base estatística em cenários de uso esporádico do app.
  - **Ação Recomendada**: nenhuma ação corretiva necessária agora — a regra está implementada exatamente como especificada. Se, na prática, surgirem casos de avaliação com dados esparsos causando ruído, revisitar via novo ADR (a própria ADR-001 já prevê esse tipo de recalibração).
- **Ausência de logging/observabilidade no resultado da avaliação**: `Evaluate` é uma função pura sem nenhum ponto de instrumentação (não expõe, por exemplo, os valores intermediários de `recentRunningLoad`/`previousRunningLoad` para quem queira auditar por que um determinado veredito foi dado). Isso é esperado para uma camada de domínio isolada de infraestrutura (logging é preocupação de camada externa), mas dificulta debugging e a futura calibração mencionada na ADR-001, que dependeria de conseguir inspecionar os números reais que geraram (ou não) um alerta.
  - **Ação Recomendada**: se a calibração da regra virar trabalho ativo, considerar expor os valores intermediários no próprio `OverloadAssessment` (ex: campos adicionais `RecentRunningLoad`/`PreviousRunningLoad`) para que a camada de API possa logar/expor esses dados sem duplicar o cálculo. Não é urgente hoje.

## 3. Plano de Ação

1. **Fase 1 - Críticos**: nenhuma ação necessária.
2. **Fase 2 - Importantes**: adicionar teste unitário para o caso `previousRunningLoad == 0`; levar a discussão de personalização da mensagem de sugestão para o backlog de produto (não é débito técnico a ser corrigido unilateralmente pelo time de engenharia).
3. **Fase 3 - Menores**: nenhuma ação imediata — ambos os pontos são candidatos a revisão apenas se a calibração da regra (já prevista na ADR-001) virar trabalho ativo.

## 4. User Stories para Implementação

### Story 1: Cobrir com teste o caso de ausência de carga de corrida na janela anterior

**Contexto Atual**: a guard `previousRunningLoad > 0` na expressão de `isOverloaded` não tem teste unitário dedicado, apesar de proteger um caso de borda real (corredor sem nenhuma corrida na janela de comparação).

**Objetivo**: fechar a cobertura de teste desse ramo de decisão, documentando explicitamente o comportamento esperado.

**Regras de Negócio**:
- Sem carga de corrida registrada na janela anterior (7 dias antes dos últimos 7 dias), a regra não deve sinalizar sobrecarga, mesmo que exista musculação pesada de perna e alguma carga de corrida na janela recente — não há base de comparação válida.

**Especificação Técnica**:
- Adicionar teste em `tests/Steady.Domain.Tests/OverloadDetectionTests.cs` com: histórico >= 14 dias, `StrengthSession` de perna pesada nos últimos 7 dias, `RunningSession` apenas na janela recente (nenhuma na janela anterior).
- Nenhuma mudança de código de produção esperada — o comportamento já existe, é a cobertura de teste que está faltando.

**Critérios de Aceite**:
- [ ] Novo teste unitário cobre o cenário `previousRunningLoad == 0`.
- [ ] Teste confirma `HasRisk = false` e `Suggestion = null`.
- [ ] Nenhuma alteração de comportamento em `OverloadDetectionService.cs`.

**Roteiro de Teste**:
1. **Teste 1**: musculação pesada de perna nos últimos 7 dias, corrida apenas nos últimos 7 dias (nenhuma na janela anterior), histórico total >= 14 dias.
   - **Entrada**: `strengthSessions` com 1 sessão de `PernaPosterior`/`Pesado` na janela recente; `runningSessions` apenas dentro de `recentWindow`.
   - **Resultado Esperado**: `assessment.HasRisk == false` e `assessment.Suggestion == null`.

### Story 2: Avaliar personalização da mensagem de sugestão (backlog de produto)

**Contexto Atual**: `SuggestionMessage` é um texto único e fixo, sem referência aos valores reais de carga, datas ou grupo muscular envolvido no alerta específico.

**Objetivo**: aumentar a utilidade percebida da sugestão, tornando-a mais específica ao padrão de treino real que a disparou — **sujeito a validação de produto antes de qualquer implementação**, já que a spec atual (regra de negócio #5) já é atendida pela mensagem fixa (ela é "concreta" no sentido de sugerir uma ação, ainda que não seja personalizada aos números do usuário).

**Regras de Negócio**:
- A definir com produto: quais dados devem aparecer na mensagem personalizada (ex: percentual de aumento de carga, grupo muscular treinado, data da sessão de musculação que disparou o alerta).

**Especificação Técnica**:
- Se aprovado, evoluir `OverloadAssessment.Risk(string suggestion)` para aceitar dados estruturados em vez de (ou além de) uma string pronta, e mover a montagem do texto final para fora do domínio (ex: camada de apresentação em `Steady.Api`), mantendo `Steady.Domain` livre de responsabilidade de formatação de texto para o usuário final.
- Alternativa mais simples: parametrizar a `const string` atual com os valores calculados (`recentRunningLoad`, `previousRunningLoad`, percentual), usando interpolação, sem alterar a estrutura de `OverloadAssessment`.

**Critérios de Aceite**:
- [ ] Decisão de produto registrada sobre quais dados devem compor a mensagem personalizada.
- [ ] Testes existentes continuam passando sem alteração de veredito (`HasRisk`), apenas o conteúdo de `Suggestion` muda.
- [ ] Nova spec BDD ou atualização de `specs/STORY-001/spec.bdd.md` refletindo o novo formato de mensagem, antes da implementação.

**Roteiro de Teste**:
1. **Teste 1**: sobrecarga detectada com um conjunto conhecido de cargas.
   - **Entrada**: cenário do teste `Sugere_ajuste_quando_perna_pesada_coincide_com_aumento_de_carga_de_corrida` já existente.
   - **Resultado Esperado**: `Suggestion` contém os valores esperados de acordo com a nova especificação de personalização (a definir).
