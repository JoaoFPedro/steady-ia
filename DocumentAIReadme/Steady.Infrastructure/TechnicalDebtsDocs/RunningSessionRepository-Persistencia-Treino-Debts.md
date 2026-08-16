# RunningSessionRepository - Persistencia-Treino - Debitos Tecnicos

## Indice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Acao](#3-plano-de-acao)
- [4. User Stories para Implementacao](#4-user-stories-para-implementacao)

## 1. Resumo Executivo
- **Estado Atual**: implementacao CRUD simples e correta, com isolamento por `corredor_id` aplicado consistentemente nos tres metodos. Sem teste unitario/integrado dedicado a este repositorio isoladamente -- cobertura vem apenas de testes de API ponta a ponta.
- **Principais Problemas**: `GetByCorredorIdAsync` nao pagina (risco de crescimento sem controle); ausencia de indice composto `(corredor_id, date)` para acelerar consultas ordenadas por data em historicos grandes; nenhum tratamento de excecao de infraestrutura.
- **Impacto no Negocio**: baixo hoje (volume de dados do MVP e pequeno), mas a ausencia de paginacao se torna um problema real de performance e de payload de resposta a medida que corredores acumulam meses/anos de historico.

## 2. Problemas por Criticidade

### Amarelo Importantes
- **GetByCorredorIdAsync sem paginacao**: retorna toda a tabela filtrada por `corredor_id` de uma vez, tanto para exibir historico (`TrainingHistoryEndpoints`) quanto para calcular sobrecarga (`OverloadAssessmentEndpoints`). Para o calculo de sobrecarga isso e aceitavel (a regra so olha 14 dias, ver [ADR-001](../../../docs/adr/ADR-001-regra-sobrecarga-combinada.md)), mas para a tela de historico um corredor com anos de uso pode gerar uma resposta HTTP muito grande.
  - **Acao Recomendada**: adicionar paginacao (ex.: `Skip`/`Take` ou keyset pagination por `Date`) especificamente no caminho de exibicao de historico, mantendo `GetByCorredorIdAsync` original (ou uma variante com filtro de data) para o calculo de sobrecarga, que so precisa de uma janela recente.
- **Sem indice composto para consultas por periodo**: hoje so existe indice em `corredor_id`. A avaliacao de sobrecarga e o historico frequentemente vao precisar filtrar tambem por `date` (ex.: "ultimos 7/14 dias") -- atualmente esse filtro e feito em memoria depois de trazer tudo do banco (dentro de `OverloadDetectionService`, em `Steady.Domain`), nao na query SQL.
  - **Acao Recomendada**: avaliar um indice composto `(corredor_id, date)` e mover o filtro de janela temporal para a query SQL (`Where(s => s.CorredorId == corredorId && s.Date >= dataLimite)`), reduzindo a quantidade de dados trazidos do banco a medida que o historico cresce.
- **Sem teste dedicado ao repositorio**: toda a cobertura vem de `tests/Steady.Api.Tests`, que testa o comportamento ponta a ponta via HTTP. Isso e valioso, mas nao substitui um teste de integracao focado no repositorio (ex.: validar que `GetByIdAsync` de fato retorna `null` para sessao de outro corredor, isoladamente do restante do pipeline HTTP).
  - **Acao Recomendada**: criar testes de integracao dedicados em um projeto `Steady.Infrastructure.Tests` usando Testcontainers, cobrindo os tres metodos isoladamente.

### Verde Menores
- **DistanceKm e AveragePaceMinPerKm como double**: tipos de ponto flutuante podem acumular pequenos erros de arredondamento; para valores de distancia/ritmo isso e improvavel de causar problema pratico no MVP, mas `decimal` seria mais preciso caso o produto evolua para calculos financeiros ou comparacoes exatas.
  - **Acao Recomendada**: nenhuma acao imediata; registrar como nota caso o dominio passe a exigir precisao decimal exata.
- **Sem tratamento de erro de infraestrutura**: nenhum dos tres metodos captura excecoes de banco (timeout, conexao perdida); propagam sem log especifico do repositorio.
  - **Acao Recomendada**: avaliar politica de log/tratamento em conjunto com os demais repositorios (mesma observacao vale para Strength e PainLog).

## 3. Plano de Acao
1. **Fase 1 - Importantes**: adicionar paginacao ao caminho de historico; avaliar indice composto `(corredor_id, date)` e mover filtro de janela temporal para a query SQL; criar testes de integracao dedicados ao repositorio.
2. **Fase 2 - Menores**: revisar necessidade de `decimal` para campos numericos; alinhar politica de tratamento de erro de infraestrutura entre os repositorios de treino.

## 4. User Stories para Implementacao

### Story 1: Paginar o historico de sessoes de corrida

**Contexto Atual**: `GetByCorredorIdAsync` devolve todas as sessoes de corrida do corredor de uma vez, sem limite. `TrainingHistoryEndpoints` usa esse resultado diretamente para montar a resposta de `GET /api/training-sessions`.

**Objetivo**: evitar payloads de resposta HTTP muito grandes e queries que trazem mais dados do que a UI realmente exibe de uma vez.

**Regras de Negocio**:
- A paginacao nao pode quebrar o calculo de sobrecarga, que precisa de todo o historico relevante (ultimos 14 dias) independente de paginacao de UI.

**Especificacao Tecnica**:
- Adicionar um metodo `GetByCorredorIdAsync(Guid corredorId, int page, int pageSize, CancellationToken ct)` (ou parametro opcional) que aplica `Skip`/`Take` ordenado por `Date` descendente.
- Manter o metodo atual (sem paginacao) disponivel para o caminho de avaliacao de sobrecarga, ou substituir por uma variante filtrada por janela de datas (ver Story 2).

**Criterios de Aceite**:
- [ ] Endpoint de historico aceita parametros de paginacao e retorna apenas a pagina solicitada.
- [ ] Calculo de sobrecarga continua recebendo o historico completo relevante (nao paginado incorretamente).
- [ ] Performance da query validada com um volume de dados simulado (ex.: 1000+ sessoes por corredor).

**Roteiro de Teste**:
1. **Teste 1**: Corredor com 50 sessoes, pagina 1 de tamanho 10.
   - **Entrada**: `page=1, pageSize=10`.
   - **Resultado Esperado**: 10 sessoes mais recentes retornadas.
2. **Teste 2**: Corredor com 5 sessoes, pagina 2 de tamanho 10.
   - **Entrada**: `page=2, pageSize=10`.
   - **Resultado Esperado**: lista vazia (nao ha segunda pagina).

### Story 2: Filtrar por janela de data na query SQL para o calculo de sobrecarga

**Contexto Atual**: `OverloadAssessmentEndpoints` chama `GetByCorredorIdAsync` sem filtro de data, trazendo todo o historico do corredor para dentro da aplicacao, e o filtro de janela de 7/14 dias e aplicado em memoria dentro de `OverloadDetectionService` (`Steady.Domain`).

**Objetivo**: reduzir a quantidade de dados trafegados do banco para a aplicacao, filtrando a janela temporal relevante diretamente na query SQL.

**Regras de Negocio**:
- A regra de sobrecarga (ADR-001) precisa de, no minimo, os ultimos 14 dias de historico completos para decidir se ha dados suficientes para avaliar.

**Especificacao Tecnica**:
- Adicionar um metodo como `GetByCorredorIdSinceAsync(Guid corredorId, DateOnly since, CancellationToken ct)` que aplica `Where(s => s.CorredorId == corredorId && s.Date >= since)`.
- Avaliar indice composto `(corredor_id, date)` para suportar essa consulta eficientemente.

**Criterios de Aceite**:
- [ ] Novo metodo retorna apenas sessoes dentro da janela solicitada.
- [ ] `OverloadDetectionService` continua recebendo dados suficientes para aplicar a regra de 7/14 dias sem alterar o resultado do calculo.
- [ ] Indice composto criado via nova migration, sem quebrar dados existentes.

**Roteiro de Teste**:
1. **Teste 1**: Sessoes dentro e fora da janela de 14 dias.
   - **Entrada**: `since = hoje - 14 dias`, sessoes com datas variadas.
   - **Resultado Esperado**: apenas sessoes com `Date >= since` retornadas.
2. **Teste 2**: Corredor sem sessoes na janela.
   - **Entrada**: `since` recente, nenhuma sessao no periodo.
   - **Resultado Esperado**: lista vazia, sem erro.
