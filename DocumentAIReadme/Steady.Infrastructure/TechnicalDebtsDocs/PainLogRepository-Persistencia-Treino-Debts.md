# PainLogRepository - Persistencia-Treino - Debitos Tecnicos

## Indice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Acao](#3-plano-de-acao)
- [4. User Stories para Implementacao](#4-user-stories-para-implementacao)

## 1. Resumo Executivo
- **Estado Atual**: implementacao minima e correta para o unico caso de uso implementado (`AddAsync`). Isolamento por `corredor_id` aplicado na escrita, mas nunca exercitado em leitura, pois nao ha metodo de consulta.
- **Principais Problemas**: ausencia total de leitura (`GetByCorredorIdAsync`/`GetByIdAsync`) apesar de a tabela e o indice `corredor_id` ja existirem prontos para isso; regiao do corpo como texto livre, sem normalizacao (risco de dados inconsistentes tipo "Joelho", "joelho", "joelho direito"); sem teste dedicado.
- **Impacto no Negocio**: baixo enquanto o produto nao expuser consulta de historico de dor, mas representa um dado coletado e nunca reaproveitado -- um desperdicio de informacao potencialmente valiosa para cruzar com padroes de sobrecarga no futuro.

## 2. Problemas por Criticidade

### Amarelo Importantes
- **Nenhuma forma de consultar registros de dor**: diferente de `RunningSessionRepository` e `StrengthSessionRepository`, este repositorio nao tem `GetByCorredorIdAsync` nem `GetByIdAsync`. O indice `IX_pain_logs_corredor_id` ja existe na tabela (criado no `OnModelCreating`), mas nao e usado por nenhuma query -- sugerindo que a leitura foi prevista na modelagem, mas nao implementada. Sem essa leitura, os dados de dor sao coletados e nunca reaproveitados por nenhuma funcionalidade (nem exibicao ao corredor, nem cruzamento com a regra de sobrecarga).
  - **Acao Recomendada**: confirmar com produto se a consulta de historico de dor esta de fato fora do escopo do MVP (parece ser o caso, conforme `specs/STORY-001/spec.bdd.md` nao menciona uma tela de consulta) ou se e uma lacuna de implementacao a ser priorizada. Se confirmado como proxima prioridade, implementar `GetByCorredorIdAsync` e o endpoint correspondente seguindo o mesmo padrao dos demais repositorios de treino.
- **Regiao do corpo sem normalizacao**: `Region` e uma `string` livre, validada apenas quanto a nao ser vazia. Nao ha lista fechada (enum) nem normalizacao de capitalizacao/acentos. Isso dificulta qualquer analise futura (ex.: "quais regioes doem mais") porque o mesmo local pode ser gravado de formas diferentes por diferentes registros do mesmo corredor.
  - **Acao Recomendada**: avaliar com produto se vale migrar `Region` para um enum fechado (similar a `MuscleGroup`) ou aplicar normalizacao no dominio (`PainLog.Create`) antes da persistencia (ex.: trim + capitalizacao consistente).
- **Sem teste dedicado ao repositorio**: cobertura apenas via `tests/Steady.Api.Tests/PainLogEndpointTests.cs`, que testa a escrita ponta a ponta mas nao testa o repositorio isoladamente nem cobre nenhum cenario de leitura (porque nao existe).

### Verde Menores
- **Sem tratamento de erro de infraestrutura**: mesma observacao dos demais repositorios de treino.

## 3. Plano de Acao
1. **Fase 1 - Importantes**: validar com produto se a consulta de historico de dor deve ser implementada; se sim, priorizar `GetByCorredorIdAsync` + endpoint correspondente. Avaliar normalizacao/enum para `Region`.
2. **Fase 2 - Menores**: alinhar politica de tratamento de erro de infraestrutura com os demais repositorios de treino.

## 4. User Stories para Implementacao

### Story 1: Implementar consulta de historico de dor por corredor

**Contexto Atual**: `PainLogRepository` so tem `AddAsync`. O indice `IX_pain_logs_corredor_id` ja existe na tabela `pain_logs`, mas nenhuma query o utiliza hoje, pois nao ha metodo de leitura implementado nem endpoint em `Steady.Api` para consultar dor.

**Objetivo**: permitir que o corredor (ou uma futura funcionalidade de analise) consulte seu proprio historico de dor, reaproveitando um dado ja coletado mas atualmente "morto" (write-only).

**Regras de Negocio**:
- A consulta deve respeitar o isolamento por `corredor_id`, no mesmo padrao dos demais repositorios (ver `Isolamento-de-Dados-por-Corredor-Persistencia-Autenticacao-Rules.md`).

**Especificacao Tecnica**:
- Adicionar `Task<IReadOnlyList<PainLogEntity>> GetByCorredorIdAsync(Guid corredorId, CancellationToken cancellationToken)` em `IPainLogRepository` e `PainLogRepository`, seguindo exatamente o padrao ja usado em `RunningSessionRepository.GetByCorredorIdAsync` (`Where(p => p.CorredorId == corredorId).ToListAsync(ct)`).
- Criar endpoint `GET /api/pain-logs` em `Steady.Api.Endpoints` (fora do escopo desta camada de Infrastructure, mas necessario para o dado ser util ao usuario final).

**Criterios de Aceite**:
- [ ] Novo metodo devolve apenas registros de dor do corredor autenticado.
- [ ] Corredor sem registros de dor recebe lista vazia, nao erro.
- [ ] Indice `IX_pain_logs_corredor_id` passa a ser efetivamente utilizado pela nova query.

**Roteiro de Teste**:
1. **Teste 1**: Corredor com registros de dor.
   - **Entrada**: `corredorId` de um corredor com 3 registros de dor.
   - **Resultado Esperado**: lista com os 3 registros, nenhum de outro corredor.
2. **Teste 2**: Corredor sem registros de dor.
   - **Entrada**: `corredorId` sem nenhum registro.
   - **Resultado Esperado**: lista vazia.

### Story 2: Normalizar ou restringir os valores aceitos para Region

**Contexto Atual**: `Region` e uma `string` livre validada apenas quanto a nao ser vazia/whitespace (`PainLog.Create`). Nao ha garantia de consistencia entre registros (ex.: "Joelho direito" vs "joelho direito" vs "Joelho Direito" seriam tres valores tecnicamente diferentes no banco).

**Objetivo**: tornar os dados de regiao do corpo consistentes o suficiente para permitir analise futura (ex.: agrupar por regiao mais afetada).

**Regras de Negocio**:
- Nenhuma regiao valida hoje deve deixar de ser aceita apos a mudanca (nao restringir demais sem validacao de produto).

**Especificacao Tecnica**:
- Opcao A (normalizacao leve): aplicar `Trim()` e uma capitalizacao consistente em `PainLog.Create` antes de aceitar o valor.
- Opcao B (mais estrutural): migrar `Region` para um enum fechado de regioes do corpo, similar a `MuscleGroup`, exigindo migration de dados para os registros existentes.
- Decisao entre as opcoes depende de validacao com produto sobre a lista de regioes relevantes -- nao deve ser decidida unilateralmente pela engenharia.

**Criterios de Aceite**:
- [ ] Registros novos de dor tem `Region` normalizada de forma consistente (Opcao A) ou restrita a valores validos (Opcao B).
- [ ] Registros existentes no banco nao ficam invalidos apos a mudanca (migration de dados, se Opcao B).
- [ ] Decisao documentada em ADR se a Opcao B (enum fechado) for escolhida, dado que altera o contrato de dados.

**Roteiro de Teste**:
1. **Teste 1**: Regiao com variacao de capitalizacao.
   - **Entrada**: `"joelho DIREITO"`.
   - **Resultado Esperado** (Opcao A): persistido de forma normalizada (ex.: `"Joelho direito"`).
2. **Teste 2**: Regiao invalida (Opcao B).
   - **Entrada**: valor fora da lista fechada.
   - **Resultado Esperado**: rejeitado com mensagem clara, mesmo padrao dos demais campos fechados como `MuscleGroup`.
