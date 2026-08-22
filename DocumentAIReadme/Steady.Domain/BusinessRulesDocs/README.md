# Steady.Domain - BusinessRulesDocs - Índice

Regras de negócio de `src/Steady.Domain` traduzidas para linguagem acessível a stakeholders de produto e negócio, com exemplos práticos e cenários de uso.

| Documento | Região | Descrição |
|---|---|---|
| [Registro-de-Corrida-Treino-Corrida-Rules.md](./Registro-de-Corrida-Treino-Corrida-Rules.md) | Treino-Corrida | Regras para registrar uma sessão de corrida: distância, duração e percepção de esforço válidas. |
| [Registro-de-Musculacao-Treino-Forca-Rules.md](./Registro-de-Musculacao-Treino-Forca-Rules.md) | Treino-Forca | Regras para registrar uma sessão de musculação: grupo muscular e intensidade obrigatórios, duração válida. |
| [Registro-de-Dor-Treino-Dor-Rules.md](./Registro-de-Dor-Treino-Dor-Rules.md) | Treino-Dor | Regras para registrar dor pós-treino, a qualquer momento, independente de sessão específica. |
| [Deteccao-de-Sobrecarga-Sobrecarga-Rules.md](./Deteccao-de-Sobrecarga-Sobrecarga-Rules.md) | Sobrecarga | A funcionalidade central do produto: quando o sistema sugere ajuste de treino por risco de sobrecarga combinada (musculação de perna pesada + aumento de carga de corrida), e como distingue "ainda reunindo dados" (menos de 14 dias de histórico) de "sem risco". |

## Como usar

Estes documentos priorizam o "o quê" e o "por quê" em linguagem de negócio. Para o "como" técnico (código, fluxos de execução, assinaturas de método), ver `DocumentAIReadme/Steady.Domain/DevDocs/`.
