# Mapping — STORY-014

Estado após implementação e validação em 2026-08-30.

| Cenário BDD | Evidência principal | Estado |
|---|---|---|
| Corrida divergente | `WorkoutAdherenceTests.Corrida_divergente_*`, `AdherencePersistenceTests.Worker_*`, Dashboard/histórico | GREEN |
| Musculação divergente | `WorkoutAdherenceTests`, `ReviewOutboxProcessor.CompareStrengthEntityAsync` | GREEN |
| Dia combinado | `TrainingSheetRepository.AddCombinedExecutionAsync`, `ReviewOutboxProcessor.CompareCombinedAsync` | GREEN |
| Dor força recuperação | `WorkoutAdherenceTests.Dor_no_encerramento_*`, `AdherencePersistenceTests.Execucao_dor_*` | GREEN |
| Encerramento sem dor | `SafetyPolicy` e persistência condicional do `PainLog` | GREEN |
| Resposta de dor obrigatória | alertas de encerramento em `app/log/run.tsx`, `app/log/strength.tsx` e `app/coaching/strength.tsx` | GREEN (UI) |
| Corredor confirma leitura | `WorkoutReviewEndpointTests.Corredor_ve_*` | GREEN |
| Próximo treino coerente | `WorkoutReviewTests.Coerencia_*`, `ReviewOutboxProcessor.RecalculateCoherenceAsync` | GREEN |
| Personal vinculado consulta | histórico do personal inclui `WorkoutReviewResponse`; ownership no endpoint | GREEN |
| Treino aderente não gera revisão | retorno antecipado de `ReviewOutboxProcessor.ProcessAsync` | GREEN |
| Pequena variação tolerada | `AdherencePolicyTests` | GREEN |
| Versão nova não reclassifica | snapshot `PolicyVersion` imutável em `WorkoutReviewTests` | GREEN |
| Nova ficha não muda execução antiga | `TrainingSheetId` capturado na outbox e usado pelo processor | GREEN |
| Corridas conflitantes | `WorkoutAdherenceTests.Corridas_com_faixas_*`, card/pop-up do app | GREEN |
| Fechar pop-up não resolve | reconhecimento local por id; revisão permanece no servidor/histórico | GREEN |
| Dashboard só mostra mais recente | `GetLatestAsync` ordenado por data e card único | GREEN |
| Exercício pulado | `WorkoutAdherenceTests.Exercicio_pulado_*` | GREEN |
| Campo não comparável | `AdherencePolicyTests.Campo_sem_prescricao_*` | GREEN |
| Sem próximo treino | `WorkoutReview` inicia `Unknown`; recálculo preserva ausência | GREEN |
| Próximo treino não coerente | `RecalculateCoherenceAsync` atualiza métrica sem mutar execução | GREEN |
| Sincronização tardia | recálculo por `ExecutionDate`, preservando snapshot/action/explanation | GREEN |
| Exercício renomeado | `CoachingEndpointTests` preserva `ExerciseKey` solicitado e autorizado | GREEN |
| Exercício recriado | chave nova quando publicação não envia chave anterior | GREEN |
| Ficha legada | `TrainingSheetDocumentsTests.Documento_preserva_identidade_*` | GREEN |
| Offline aguarda sincronização | fila existente + outbox criada somente no endpoint; cache de revisão | GREEN |
| Ação divergente da IA | `WorkoutReviewTests.Explicacao_com_acao_*` | GREEN |
| Diagnóstico/causalidade | `WorkoutReviewTests.Diagnostico_ou_causalidade_*` | GREEN |
| Falha da IA | `WorkoutReviewTests.Falha_do_provedor_*`, provider indisponível | GREEN |
| Retry manual | endpoint `/retry`, `ReviewExplanationRetryService`, botão no app | GREEN |
| Reenvio idempotente | `AdherencePersistenceTests.Reenvio_*` | GREEN |
| Queda após commit | `AdherencePersistenceTests.Lease_expirado_*` | GREEN |
| Dor avulsa não reabre | somente outbox de execução dispara processor | GREEN |
| Personal sem vínculo | `WorkoutReviewEndpointTests.Revisao_de_outro_*`, `GetForPersonalAsync` | GREEN |
| Vínculo encerrado revoga | vínculo ativo consultado em cada leitura; sem cache de revisão no personal | GREEN |
| Contexto mínimo da IA | `WorkoutReviewTests.Contexto_da_IA_*` | GREEN |
| Dados insuficientes | `WorkoutAdherenceTests.Conflito_ou_dados_insuficientes_*` | GREEN |

## Validação executada

- .NET: 128 testes de API + 138 testes de domínio.
- App: 49 suítes, 353 testes.
- TypeScript: `tsc --noEmit` sem erros.
