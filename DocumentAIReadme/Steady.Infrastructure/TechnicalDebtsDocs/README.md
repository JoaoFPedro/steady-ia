# Steady.Infrastructure - TechnicalDebtsDocs

12/12 unidades documentadas. Atualização: 2026-09-27.

| Documento | Descrição |
|---|---|
| [CoachingLinkRepository - Persistencia-Coaching - Débitos Técnicos](CoachingLinkRepository-Persistencia-Coaching-Debts.md) | Solicitação, aceite, encerramento e consultas de vínculos autorizados. |
| [CorredorRepository - Persistencia-Autenticacao - Débitos Técnicos](CorredorRepository-Persistencia-Autenticacao-Debts.md) | Provisionamento por sub, perfil sincronizado e plano fixo da conta. |
| [PainLogRepository - Persistencia-Treino - Débitos Técnicos](PainLogRepository-Persistencia-Treino-Debts.md) | Dor idempotente por corredor e distinção da dor congelada na outbox. |
| [PlanRequestRepository - Persistencia-Planejamento - Débitos Técnicos](PlanRequestRepository-Persistencia-Planejamento-Debts.md) | Input completo e imutável do pedido, reenvio e histórico isolado. |
| [ReviewExplanationRetryService - Persistencia-Revisao - Débitos Técnicos](ReviewExplanationRetryService-Persistencia-Revisao-Debts.md) | Retry de explicação congelada com validação e fallback indisponível. |
| [ReviewOutboxProcessor - Persistencia-Revisao - Débitos Técnicos](ReviewOutboxProcessor-Persistencia-Revisao-Debts.md) | Lease, comparação determinística, explicação validada e coerência. |
| [RunningSessionRepository - Persistencia-Treino - Débitos Técnicos](RunningSessionRepository-Persistencia-Treino-Debts.md) | Corrida idempotente com outbox e dor confirmadas juntas. |
| [SteadyDbContext e ServiceCollectionExtensions - Persistencia-Configuracao - Débitos Técnicos](SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-Debts.md) | Doze tabelas, índices e relações, seed de política e serviços Scoped. |
| [StrengthSessionRepository - Persistencia-Treino - Débitos Técnicos](StrengthSessionRepository-Persistencia-Treino-Debts.md) | Musculação resumida e dor; consultas próprias sem revisão por exercício. |
| [TrainingPlanRepository - Persistencia-Planejamento - Débitos Técnicos](TrainingPlanRepository-Persistencia-Planejamento-Debts.md) | Plano fixo versionado, documento completo e seed descritivo. |
| [TrainingSheetRepository - Persistencia-Coaching - Débitos Técnicos](TrainingSheetRepository-Persistencia-Coaching-Debts.md) | Ficha ativa, compatibilidade de documentos e execução combinada atômica. |
| [WorkoutReviewRepository - Persistencia-Revisao - Débitos Técnicos](WorkoutReviewRepository-Persistencia-Revisao-Debts.md) | Consulta própria ou por vínculo e feedback sem mudar ação. |
