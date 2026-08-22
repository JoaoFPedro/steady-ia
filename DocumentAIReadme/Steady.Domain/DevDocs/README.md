# Steady.Domain - DevDocs - Índice

Documentação técnica detalhada das entidades e serviços de domínio de `src/Steady.Domain`. Cada arquivo cobre o fluxo completo de uma unidade (entidade rica ou serviço de domínio), com diagrama de sequência e detalhamento método a método.

| Documento | Região | Descrição |
|---|---|---|
| [RunningSession-Treino-Corrida-DevDocs.md](./RunningSession-Treino-Corrida-DevDocs.md) | Treino-Corrida | Entidade de sessão de corrida: guard clauses de `Create` (distância, duração, escala de esforço 1-10) e cálculo de carga de treino (`Load`). |
| [StrengthSession-Treino-Forca-DevDocs.md](./StrengthSession-Treino-Forca-DevDocs.md) | Treino-Forca | Entidade de sessão de musculação: guard clauses de `Create` (grupo muscular e intensidade obrigatórios, duração positiva) e mapeamento de intensidade para carga (`IntensityWeight`). Documenta também os enums de apoio `MuscleGroup` e `Intensity`. |
| [PainLog-Treino-Dor-DevDocs.md](./PainLog-Treino-Dor-DevDocs.md) | Treino-Dor | Entidade de registro de dor: guard clause única (região obrigatória) e desacoplamento intencional de sessões de treino específicas. |
| [OverloadDetectionService-Sobrecarga-DevDocs.md](./OverloadDetectionService-Sobrecarga-DevDocs.md) | Sobrecarga | Serviço de domínio estático que implementa o algoritmo de detecção de sobrecarga combinada (ACWR + session-RPE + regra dos 10%, fundamentado em ADR-001). Documenta `OverloadDetectionService.Evaluate` junto com o value object de retorno `OverloadAssessment`, que expõe três estados (histórico insuficiente, sem risco, risco com sugestão) desde o ADR-004. |

## Convenções

- Estrutura granular por unidade: **D.** (Entidade/Serviço de Domínio) → **D1.** (método factory ou método principal) → **U1.** (value object/enum de apoio), com âncoras `<a id="..."></a>` para navegação interna.
- Este projeto (`Steady.Domain`) não tem Controller, Endpoint nem Repository — é a camada de regra de negócio pura, isolada de framework. Referências à camada HTTP (`Steady.Api`) ou de persistência (`Steady.Infrastructure`) aparecem como nota de contexto, não como detalhamento — ver `DocumentAIReadme/Steady.Api/` e `DocumentAIReadme/Steady.Infrastructure/`, se existirem.
- Todo threshold numérico e toda guard clause documentados aqui têm origem rastreada: código-fonte, `docs/adr/ADR-001-regra-sobrecarga-combinada.md` ou `specs/STORY-001/spec.bdd.md`.
