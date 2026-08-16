# OverloadAssessmentEndpoints - Sobrecarga - Debitos Tecnicos

## Indice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Acao](#3-plano-de-acao)
- [4. User Stories para Implementacao](#4-user-stories-para-implementacao)

## 1. Resumo Executivo
- **Estado Atual**: a regra de negocio em si (`OverloadDetectionService`) e solida, rastreavel a fontes reconhecidas (ADR-001) e bem testada (`tests/Steady.Domain.Tests/OverloadDetectionTests.cs`, `tests/Steady.Api.Tests/OverloadAssessmentEndpointTests.cs`). O principal debito esta na camada de integracao API - a forma como o historico e carregado do banco para alimentar o calculo.
- **Principais Problemas**: a rota carrega **todo** o historico de corrida e musculacao do corredor a cada chamada, sem filtro de data no banco, mesmo que a regra so use os ultimos 14 dias; o registro de dor (`PainLog`) nao e considerado no calculo, apesar de ser citado no ADR-001 como sinal de calibracao; e nao ha cache/rate limiting para uma rota que pode ser chamada com frequencia pelo cliente.
- **Impacto no Negocio**: baixo hoje (poucos usuarios, poucas sessoes por corredor no MVP), mas cresce diretamente com a base de usuarios e o tempo de uso - um corredor ativo ha 1-2 anos acumula centenas de sessoes que sao carregadas inteiramente a cada consulta de sobrecarga.

## 2. Problemas por Criticidade

### Criticos
- Nenhum problema critico identificado - a regra de negocio funciona corretamente e os testes cobrem os cenarios da spec.

### Importantes
- **Carga de historico completo sem filtro de data**: `GetByCorredorIdAsync` em `RunningSessionRepository`/`StrengthSessionRepository` nao aceita nenhum parametro de data - traz todas as sessoes do corredor desde o inicio dos tempos, mesmo que `OverloadDetectionService.Evaluate` so precise dos ultimos 14 dias (`MinimumHistoryDays` + a janela `previousWindow`). Isso e leitura, transferencia de dados e alocacao de memoria desnecessarios que crescem sem limite com o tempo de uso do corredor.
  - **Acao Recomendada**: adicionar uma variante de consulta com filtro de data (ex.: `GetByCorredorIdAsync(corredorId, sinceDate, ct)`) e usar apenas os ultimos 14+ dias na chamada deste endpoint.
- **`PainLog` nao integrado ao calculo de sobrecarga**: o proprio ADR-001 menciona o registro de dor como mecanismo de calibracao futura da regra ("se dor continuar ocorrendo sem alerta, a regra deve ser revisada"), mas hoje nao ha nenhuma leitura de `PainLog` neste fluxo - nem para ajustar o resultado, nem para relatorio de acompanhamento.
  - **Acao Recomendada**: nao e um bug de escopo da STORY-002 (backend-only conforme a story), mas deve virar uma story explicita de produto para avaliar como/se o dado de dor deve influenciar a avaliacao ou aparecer como contexto adicional na resposta.

### Menores
- **Sem cache para consulta potencialmente repetida**: se o cliente mobile consultar a avaliacao a cada tela (ex.: toda vez que o usuario abre o app), o mesmo calculo roda do zero a cada chamada, mesmo que o historico nao tenha mudado desde a ultima consulta na mesma sessao de uso.
  - **Acao Recomendada**: nao antecipar cache agora (MVP com poucos usuarios) - reavaliar se o padrao de uso do app mobile (STORY-003) mostrar chamadas redundantes frequentes.
- **Mensagem de sugestao fixa (nao personalizada)**: `SuggestionMessage` em `OverloadDetectionService` e uma constante de texto unica, sem interpolar valores especificos do corredor (ex.: percentual exato de aumento de carga, qual perna, qual data).
  - **Acao Recomendada**: avaliar com produto se vale personalizar a mensagem com dados concretos (ex.: "sua carga aumentou 140% ..."), o que tornaria a sugestao ainda mais concreta conforme a regra de negocio #5 da spec.

## 3. Plano de Acao
1. **Fase 1 - Criticos**: nao ha itens nesta fase.
2. **Fase 2 - Importantes**: adicionar filtro de data as queries de historico usadas nesta rota; levar a discussao de integracao com `PainLog` para o backlog de produto.
3. **Fase 3 - Menores**: monitorar necessidade de cache conforme uso real do app mobile; avaliar personalizacao da mensagem de sugestao.

## 4. User Stories para Implementacao

### Story 1: Filtrar o historico por janela de data relevante antes de calcular a sobrecarga

**Contexto Atual**: `OverloadAssessmentEndpoints` chama `GetByCorredorIdAsync` sem nenhum filtro de data, carregando o historico completo de corrida e musculacao do corredor mesmo que `OverloadDetectionService.Evaluate` so utilize os ultimos 14 dias corridos (mais a comparacao de janelas de 7 dias).

**Objetivo**: reduzir o volume de dados trafegado do banco e mantido em memoria a cada consulta de avaliacao de sobrecarga, sem alterar o resultado do calculo.

**Regras de Negocio**:
- O resultado da avaliacao de sobrecarga nao pode mudar em relacao ao comportamento atual - apenas a forma de buscar os dados de entrada muda.
- A regra continua usando exatamente os ultimos 14 dias corridos (`MinimumHistoryDays`) como base minima de historico.

**Especificacao Tecnica**:
- Adicionar `GetByCorredorIdSinceAsync(corredorId, sinceDate, ct)` (ou sobrecarga do metodo existente) em `IRunningSessionRepository`/`IStrengthSessionRepository`, com filtro `WHERE corredor_id = @id AND date >= @sinceDate` direto na query EF Core.
- Em `OverloadAssessmentEndpoints`, calcular `sinceDate = today.AddDays(-13)` e usar o novo metodo no lugar de `GetByCorredorIdAsync`.
- Atencao: `HasSufficientHistory` em `OverloadDetectionService` depende de saber a data da sessao **mais antiga do historico total** do corredor para decidir se ha 14+ dias de historico - se o filtro cortar sessoes anteriores a 14 dias, esse calculo pode ficar incorreto para corredores com menos de 14 dias de historico total. Avaliar se a comparacao deve continuar existindo no dominio ou se pode ser feita a partir de uma consulta separada e mais barata (ex.: `MIN(date)` por corredor).

**Criterios de Aceite**:
- [ ] `GET /api/overload-assessment` retorna exatamente o mesmo resultado antes e depois da mudanca para os cenarios ja cobertos em `OverloadAssessmentEndpointTests` e `OverloadDetectionTests`.
- [ ] A quantidade de linhas trazidas do banco para esta rota nao cresce indefinidamente com o tempo de uso do corredor (limitada a uma janela fixa em torno de 14 dias).
- [ ] Nenhuma regressao no cenario de "corredor com menos de 14 dias de historico total" (deve continuar retornando sem risco).

**Roteiro de Teste**:
1. **Teste 1**: corredor com sessoes distribuidas ao longo de mais de 1 ano, com padrao de sobrecarga apenas nos ultimos 14 dias.
   - **Entrada**: `GET /api/overload-assessment` apos registrar sessoes antigas (fora da janela) e recentes (dentro do padrao de risco).
   - **Resultado Esperado**: mesmo resultado de `hasRisk: true` com a sugestao, independente do volume de sessoes antigas.
2. **Teste 2**: corredor com historico total de 10 dias (menos que o minimo de 14).
   - **Entrada**: `GET /api/overload-assessment` com sessoes cobrindo so os ultimos 10 dias, mesmo que o padrao recente parecesse arriscado.
   - **Resultado Esperado**: `hasRisk: false` (regressao do cenario de historico insuficiente nao pode acontecer).
