# Steady.Api - BusinessRulesDocs

Auditoria: 2026-09-27. Cobertura: 10/10 unidades de endpoints; arquivos de mapping são apoio, não unidades adicionais.

| Unidade | Descrição | Rotas |
|---|---|---|
| [RunningSessionEndpoints](Registro-de-Corrida-Treino-Corrida-Rules.md) | Registrar a corrida do corredor e sua intenção durável de revisão, sem esperar o provedor de explicação. | 1 |
| [StrengthSessionEndpoints](Registro-de-Musculacao-Treino-Forca-Rules.md) | Registrar musculação avulsa com grupo, intensidade e duração, e opcionalmente dor no encerramento. | 1 |
| [PainLogEndpoints](Registro-de-Dor-Treino-Dor-Rules.md) | Registrar região e data de dor de forma idempotente, sem diagnóstico ou reabertura de revisão publicada. | 1 |
| [OverloadAssessmentEndpoints](Avaliacao-de-Sobrecarga-Sobrecarga-Rules.md) | Avaliar a combinação de corrida com musculação avulsa pesada de perna, distinguindo histórico insuficiente de ausência de risco. | 1 |
| [TrainingHistoryEndpoints](Historico-de-Treinos-Historico-Rules.md) | Unificar corridas, musculação avulsa e execuções da ficha no histórico do corredor. | 2 |
| [PlanRequestEndpoints](Pedidos-de-Planejamento-Planejamento-Rules.md) | Persistir o contexto do planejamento do corredor com identidade estável criada antes da sincronização. | 3 |
| [TrainingPlanEndpoints](Plano-do-Steady-Planejamento-Rules.md) | Ler o documento versionado associado ao corredor, mantendo prescrições e mobilidade sem calcular progressão. | 1 |
| [CoachingLinkEndpoints](Vinculos-com-Personal-Acompanhamento-Rules.md) | Solicitar, aceitar e encerrar vínculos de acompanhamento, com descoberta por e-mail e acesso restrito por papel. | 8 |
| [TrainingSheetEndpoints](Ficha-e-Execucao-Ficha-Rules.md) | Publicar ficha versionada, registrar musculação ou treino combinado e disponibilizar histórico ao personal vinculado. | 5 |
| [WorkoutReviewEndpoints](Revisao-do-Treino-Revisao-Rules.md) | Consultar revisão determinística, registrar compreensão/contestação e solicitar nova explicação sem alterar o treino. | 6 |

[Índice mestre](../../README.md).
