# BusinessRulesDocs - Steady.Api - Indice

Regras de negocio das funcionalidades expostas pelo `src/Steady.Api`, em linguagem acessivel para stakeholders de produto/negocio.

| Arquivo | Descricao |
|---------|-----------|
| [Registro-de-Corrida-Treino-Corrida-Rules.md](./Registro-de-Corrida-Treino-Corrida-Rules.md) | Regras para registrar uma sessao de treino de corrida |
| [Registro-de-Musculacao-Treino-Forca-Rules.md](./Registro-de-Musculacao-Treino-Forca-Rules.md) | Regras para registrar uma sessao de treino de musculacao |
| [Registro-de-Dor-Treino-Dor-Rules.md](./Registro-de-Dor-Treino-Dor-Rules.md) | Regras para registrar dor/desconforto pos-treino |
| [Avaliacao-de-Sobrecarga-Sobrecarga-Rules.md](./Avaliacao-de-Sobrecarga-Sobrecarga-Rules.md) | Regras da avaliacao de risco de sobrecarga combinada (corrida + musculacao) |
| [Historico-de-Treinos-Historico-Rules.md](./Historico-de-Treinos-Historico-Rules.md) | Regras de consulta do historico consolidado de treinos |

## Fontes de verdade referenciadas

- `specs/STORY-001/spec.bdd.md` - registro de treino de corrida/musculacao, deteccao de sobrecarga, registro de dor.
- `specs/STORY-002/spec.bdd.md` - exposicao via API, persistencia, autenticacao e isolamento por corredor.
- [ADR-001](../../../docs/adr/ADR-001-regra-sobrecarga-combinada.md) - fundamentacao cientifica da regra de sobrecarga.
- [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md) - autenticacao via Google Sign-In e isolamento de dados.
