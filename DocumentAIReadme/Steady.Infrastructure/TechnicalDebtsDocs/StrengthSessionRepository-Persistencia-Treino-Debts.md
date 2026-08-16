# StrengthSessionRepository - Persistencia-Treino - Debitos Tecnicos

## Indice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Acao](#3-plano-de-acao)
- [4. User Stories para Implementacao](#4-user-stories-para-implementacao)

## 1. Resumo Executivo
- **Estado Atual**: implementacao identica em estrutura a `RunningSessionRepository` (mesmo padrao de tres metodos), com a particularidade de persistir os enums `MuscleGroup` e `Intensity` como texto. Isolamento por `corredor_id` aplicado corretamente. Sem teste dedicado ao repositorio.
- **Principais Problemas**: os mesmos de `RunningSessionRepository` (ausencia de paginacao, ausencia de indice composto por data, ausencia de teste dedicado), mais um risco especifico da conversao de enum para string: renomear um valor do enum no codigo sem migration de dados quebraria a leitura de registros ja persistidos com o nome antigo.
- **Impacto no Negocio**: baixo hoje; o risco do enum-como-string e latente e so se manifesta se houver uma renomeacao de valor no futuro sem cuidado.

## 2. Problemas por Criticidade

### Amarelo Importantes
- **Renomear um valor de MuscleGroup ou Intensity quebra dados existentes**: como os enums sao persistidos como `text` (via `.HasConversion<string>()`), o banco guarda o nome literal do valor C# (ex.: `"PernaFrontal"`). Se um desenvolvedor renomear `PernaFrontal` para `PernaAnterior` no enum, todo registro ja gravado com `"PernaFrontal"` deixa de corresponder a nenhum valor do enum atual, e o EF Core lanca excecao ao materializar a linha na leitura.
  - **Acao Recomendada**: documentar esta restricao diretamente no codigo (comentario XML nos enums `MuscleGroup`/`Intensity` em `Steady.Domain`) alertando que renomear um valor exige migration de dados (`UPDATE ... SET muscle_group = 'NovoNome' WHERE muscle_group = 'NomeAntigo'`) antes do deploy. Nao ha acao de codigo imediata, apenas de processo/documentacao.
- **GetByCorredorIdAsync sem paginacao**: identico ao debito de `RunningSessionRepository` -- ver `RunningSessionRepository-Persistencia-Treino-Debts.md` para o detalhamento completo (a acao recomendada e a mesma e deve ser implementada de forma consistente entre os dois repositorios).
- **Sem indice composto por data**: mesma observacao de `RunningSessionRepository` -- o filtro por janela de 7/14 dias da regra de sobrecarga acontece em memoria, nao na query SQL.
- **Sem teste dedicado ao repositorio**: cobertura apenas via `tests/Steady.Api.Tests`.

### Verde Menores
- **Sem tratamento de erro de infraestrutura**: mesma observacao dos demais repositorios de treino.

## 3. Plano de Acao
1. **Fase 1 - Importantes**: documentar a restricao de renomeacao de enum nos comentarios do dominio; aplicar a mesma solucao de paginacao e indice composto planejada para `RunningSessionRepository` de forma consistente aqui.
2. **Fase 2 - Menores**: alinhar politica de tratamento de erro de infraestrutura entre os tres repositorios de treino.

## 4. User Stories para Implementacao

### Story 1: Documentar e proteger a estabilidade dos nomes de MuscleGroup e Intensity

**Contexto Atual**: `MuscleGroup` e `Intensity` sao persistidos como `text` no PostgreSQL via `.HasConversion<string>()` em `SteadyDbContext.OnModelCreating`. Isso e uma boa pratica em relacao a persistir como inteiro (mais legivel, resistente a reordenacao dos valores no enum), mas introduz uma dependencia implicita: o *nome* do valor do enum e, na pratica, um contrato de dados com o banco.

**Objetivo**: evitar que uma futura renomeacao de valor de enum quebre silenciosamente a leitura de dados historicos.

**Regras de Negocio**:
- Nenhuma mudanca de nomenclatura no codigo pode invalidar dados de musculacao ja persistidos.

**Especificacao Tecnica**:
- Adicionar comentario XML nos enums `MuscleGroup` (`src/Steady.Domain/Training/MuscleGroup.cs`) e `Intensity` (`src/Steady.Domain/Training/Intensity.cs`) alertando que os nomes sao persistidos como texto no banco e que renomear um valor exige uma migration de dados correspondente.
- Opcionalmente, considerar um teste de regressao que verifique que os nomes dos valores de enum atuais (`PeitoTriceps`, `Ombro`, `PernaFrontal`, `PernaPosterior`, `BicepsCostas`, `Leve`, `Moderado`, `Pesado`) permanecem inalterados, falhando caso alguem renomeie sem ajustar o teste conscientemente.

**Criterios de Aceite**:
- [ ] Comentario XML presente em ambos os enums explicando a implicacao de persistencia.
- [ ] Teste de regressao (opcional, mas recomendado) cobre os nomes atuais dos valores.
- [ ] Nenhuma mudanca de comportamento funcional introduzida.

**Roteiro de Teste**:
1. **Teste 1**: Teste de regressao dos nomes de enum.
   - **Entrada**: reflexao sobre os valores definidos em `MuscleGroup` e `Intensity`.
   - **Resultado Esperado**: teste falha se um nome de valor mudar sem atualizacao deliberada do teste.

### Story 2: Aplicar paginacao e indice composto por data (mesma solucao de RunningSessionRepository)

**Contexto Atual**: identico ao descrito em `RunningSessionRepository-Persistencia-Treino-Debts.md`, Story 1 e Story 2 -- `GetByCorredorIdAsync` sem paginacao e sem filtro de data na query SQL.

**Objetivo**: aplicar a mesma solucao de forma consistente entre `RunningSessionRepository` e `StrengthSessionRepository`, evitando que os dois repositorios divirjam em comportamento de performance.

**Regras de Negocio**:
- A regra de sobrecarga precisa dos ultimos 14 dias completos de historico de musculacao para decidir se ha dados suficientes.

**Especificacao Tecnica**:
- Replicar a assinatura de metodo paginado e o metodo filtrado por janela de data definidos para `RunningSessionRepository`, mantendo a mesma convencao de nomes entre os dois repositorios (ex.: `GetByCorredorIdSinceAsync`).

**Criterios de Aceite**:
- [ ] `StrengthSessionRepository` expoe os mesmos metodos adicionais que `RunningSessionRepository` (paginacao e filtro por data), com assinaturas equivalentes.
- [ ] Indice composto `(corredor_id, date)` criado para `strength_sessions` na mesma migration ou em migration equivalente a de `running_sessions`.

**Roteiro de Teste**:
1. **Teste 1**: Paginacao do historico de musculacao.
   - **Entrada**: corredor com 50 sessoes, pagina 1 de tamanho 10.
   - **Resultado Esperado**: 10 sessoes mais recentes retornadas.
2. **Teste 2**: Filtro por janela de data.
   - **Entrada**: `since = hoje - 14 dias`.
   - **Resultado Esperado**: apenas sessoes dentro da janela retornadas.
