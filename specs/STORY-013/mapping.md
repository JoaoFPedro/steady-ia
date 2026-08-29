# Mapping final — STORY-013

Data: 2026-08-25

## Evidência TDD

- 🔴 Domínio: os testes falharam por ausência de `CoachingLink`, `TrainingSheet`
  e `StrengthWorkoutExecution`.
- 🟢 Domínio: `CoachingLinkTests`, `TrainingSheetTests` e
  `WorkoutExecutionTests` passaram após as factories e invariantes.
- 🔴 API: os testes de coaching falharam primeiro por contratos/endpoints
  ausentes e depois revelaram a tradução inválida de roles no EF.
- 🟢 API: migration oficial, repositories e endpoints passaram contra
  PostgreSQL 16 real via Testcontainers.
- 🔴 App: os testes falharam por ausência de `workoutExecution`,
  `trainingSheetCache` e do endpoint `strengthWorkout` na fila.
- 🟢 App: validação, cache, roles e fila detalhada passaram após a implementação.
- 🔴 Evolução da ficha: domínio falhou porque `RunningWorkout` aceitava uma
  descrição; persistência falhou porque o documento conhecia apenas
  `runDescription`; app falhou porque não existia o seletor diário.
- 🟢 Evolução da ficha: domínio, JSON compatível, contrato HTTP e mapeamento dos
  sete dias passaram após a implementação mínima e o refactor de composição.
- 🔴 Registro combinado: API falhou antes do comando atômico e o app falhou
  antes do rascunho e do novo tipo de fila.
- 🟢 Registro combinado: transação, idempotência, rollback, fallback da
  musculação e recuperação após reinício passaram após a implementação.

## Cenário → teste

| # | Cenário | Evidência | Status |
|---|---------|-----------|--------|
| 1 | Personal encontra corredor e solicita vínculo | `CoachingEndpointTests.Busca_e_solicitacao_nao_concedem_acesso_antes_do_aceite` | 🟢 |
| 2 | Corredor aceita vínculo | `CoachingLinkTests.Aceitar_solicitacao_concede_acesso` + helpers de integração | 🟢 |
| 3 | Publicação da ficha completa | `CoachingEndpointTests.Corredor_aceita_e_personal_publica_ficha_completa` | 🟢 |
| 4 | Registro de cargas e nota | `CoachingEndpointTests.Execucao_completa_e_idempotente_aparece_no_historico_do_personal` | 🟢 |
| 5 | Sugestão da última carga positiva | mesmo teste, com nova leitura da ficha ativa | 🟢 |
| 6 | Evolução cronológica | `CoachingCardinalityEndpointTests.Evolucao_e_ordenada_da_execucao_mais_recente_para_a_mais_antiga` | 🟢 |
| 7 | Escolha livre de ficha | `coaching/select.tsx` oferece todas as fichas antes do registro; verificação manual de UI | 🟢 manual |
| 8 | Corrida reutiliza formulário | `Corrida_realizada_aparece_no_historico_do_personal` + rota `log/run.tsx` | 🟢 |
| 9 | Nova ficha substitui a anterior | `Nova_ficha_substitui_ativa_sem_apagar_historico_e_reseta_sugestoes` | 🟢 |
| 10 | Musculação offline | `offlineQueue.test.ts` + `idempotency.test.ts` | 🟢 |
| 11 | Uma confirmação para vazios/zero | `workoutExecution.test.ts` | 🟢 |
| 12 | Confirmar salva pulados | `workoutExecution.test.ts` + `Exercicio_pulado_nao_sugere_carga_no_proximo_treino` | 🟢 |
| 13 | Cancelar mantém formulário | `Alert` não chama `log` no cancelamento; verificação manual de UI | 🟢 manual |
| 14 | Pulado volta sem sugestão | `Exercicio_pulado_nao_sugere_carga_no_proximo_treino` | 🟢 |
| 15 | Duas casas decimais | `WorkoutExecutionTests.Execucao_preserva_carga_com_duas_casas_e_nota_normalizada` + app | 🟢 |
| 16 | Várias solicitações pendentes | `Aceitar_uma_de_varias_solicitacoes_expira_as_demais` | 🟢 |
| 17 | Personal acompanha vários corredores | `Historico_de_varios_corredores_permanece_isolado` | 🟢 |
| 18 | Conta com duas roles | `roleNavigation.test.ts` | 🟢 |
| 19 | Ficha nova enquanto corredor offline | `trainingSheetCache.test.ts` | 🟢 |
| 20 | Progresso continua por modalidade | testes `dayRequirements`, `dayCompletion` e `trainingProgress` da STORY-012 | 🟢 |
| 21 | Personal não vinculado sem acesso | `Busca_e_solicitacao_nao_concedem_acesso_antes_do_aceite` | 🟢 |
| 22 | Corredor ativo indisponível | `Corredor_so_pode_ter_um_vinculo_ativo` | 🟢 |
| 23 | E-mail inexistente | `Busca_email_inexistente_retorna_404` | 🟢 |
| 24 | Ficha incompleta | `Ficha_incompleta_ou_invalida_retorna_400` | 🟢 |
| 25 | Prescrição inválida | `TrainingSheetTests` (nome, séries e repetições nas fronteiras) | 🟢 |
| 26 | Carga inválida | `WorkoutExecutionTests.Carga_invalida_e_recusada`, API e app | 🟢 |
| 27 | Nota acima do limite | domínio e `workoutExecution.test.ts` | 🟢 |
| 28 | Revogação imediata | `Encerrar_vinculo_revoga_acesso_imediatamente` | 🟢 |
| 29 | Falha ao publicar preserva ativa | `Falha_ao_publicar_preserva_a_ficha_ativa` | 🟢 |
| 30 | Falha de sync preserva unidade/chave | `transientFailure.test.ts`, `offlineQueue.test.ts`, `idempotency.test.ts` | 🟢 |
| 31 | Sessão perdida leva ao login sem perder fila | `trainingSheetCache.test.ts`, `transientFailure.test.ts`, `goToLogin.test.ts` | 🟢 |
| 32 | Três corridas no mesmo card | `TrainingSheetTests.Treino_de_corrida_guarda_as_tres_prescricoes_no_mesmo_tipo` + tela do personal | 🟢 |
| 33 | Mapeamento dos sete dias | `dailyPrescription.test.ts` (sete exemplos) | 🟢 |
| 34 | Registro diário usa execução da ficha | seletor puro + rotas em `planning/plan.tsx`; verificação manual de navegação | 🟢 manual |
| 35 | Retorno conserva Semana e dia | navegação por `router.back()` preserva a rota de origem; verificação manual | 🟢 manual |
| 36 | Cache offline no detalhamento | `trainingSheetCache.test.ts` + estado `sheetStale` | 🟢 |
| 37 | Ausência de ficha não inventa treino | `dailyPrescription.test.ts` + estado vazio da Semana | 🟢 |
| 38 | Vínculo acessível em Planejamento | fluxos de endpoint existentes + composição em `planning.tsx`; verificação manual | 🟢 manual |
| 39 | Documento legado continua legível | `TrainingSheetDocumentsTests.Documento_legado_aplica_a_descricao_aos_tres_dias` | 🟢 |
| 40 | Cada corrida é obrigatória | `TrainingSheetTests.Treino_de_corrida_exige_as_tres_descricoes` + API | 🟢 |
| 41 | Um único botão abre o seletor | `SemanaSection.tsx` + `coaching/select.tsx`; verificação manual de UI | 🟢 manual |
| 42 | Musculação sem corrida é enviada isoladamente | `combinedWorkoutDraft.test.ts` — finalização isolada | 🟢 |
| 43 | Musculação e corrida formam uma unidade offline | `combinedWorkoutDraft.test.ts` — item `combinedWorkout` único | 🟢 |
| 44 | Reinício preserva a musculação | `combinedWorkoutDraft.test.ts` — recuperação como `strengthWorkout` | 🟢 |
| 45 | Logout descarta também o rascunho | `discardOnSignOut.test.ts` | 🟢 |
| 46 | Persistência combinada é atômica e idempotente | `CoachingEndpointTests.Registro_combinado_e_atomico_e_idempotente` | 🟢 |
| 47 | Corrida inválida não persiste metade | `CoachingEndpointTests.Corrida_invalida_nao_persiste_metade_do_registro_combinado` | 🟢 |

## Sensores finais

- .NET: 74 testes de API + 76 de domínio, todos verdes.
- App: 40 suítes, 282 testes, todos verdes.
- Regressão do aceite vazio: `httpCoachingApi.test.ts` garante que `200` sem
  corpo continue sendo tratado como sucesso pelo app.
- TypeScript: `tsc --noEmit` verde.
- EF Core: `migrations has-pending-model-changes` sem alterações pendentes.
- Formatação: `dotnet format --verify-no-changes` verde.
- Diff: `git diff --check` verde.
- EF Core: `migrations has-pending-model-changes` confirmou que o modelo está
  alinhado à migration mais recente.
