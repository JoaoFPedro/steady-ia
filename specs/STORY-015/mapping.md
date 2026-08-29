# Mapping: Cenário → Teste — STORY-015

> Preenchido ao final do `/implement`. Todos os cenários abaixo estão GREEN.

| Cenário (spec.bdd.md) | Teste(s) | Estado |
|---|---|---|
| Personal prescreve corrida com os três campos | `RunPrescriptionTests.Distancia_como_faixa_guarda_minimo_e_maximo`, `TrainingSheetDocumentsTests.Documento_novo_preserva_os_campos_numericos_opcionais`, `CoachingEndpointTests.Publicar_com_campos_numericos_opcionais_preserva_faixas_e_alvo_exato` | GREEN |
| Personal prescreve alvo exato sem faixa | `RunPrescriptionTests.Distancia_como_alvo_exato_nao_tem_maximo`, `CoachingEndpointTests.Publicar_com_campos_numericos_opcionais_preserva_faixas_e_alvo_exato` (sábado) | GREEN |
| Personal prescreve apenas um dos campos | `RunPrescriptionTests.Campos_numericos_sao_independentes_entre_si`, `TrainingSheetDocumentsTests.Documento_novo_preserva_os_campos_numericos_opcionais` (quinta só com esforço), `CoachingEndpointTests.Publicar_com_campos_numericos_opcionais_preserva_faixas_e_alvo_exato` (quinta) | GREEN |
| Corredor vê os números junto da descrição | `runPrescriptionSummary.test.ts` (todas), `dailyPrescription.test.ts.preserva os campos numéricos opcionais da corrida prescrita` | GREEN |
| Ficha publicada sem nenhum número continua válida | `CoachingEndpointTests.Corredor_aceita_e_personal_publica_ficha_completa` | GREEN |
| Ficha legada é lida sem perda de acesso | `TrainingSheetDocumentsTests.Documento_legado_com_tres_descricoes_fica_sem_campos_numericos`, `.Documento_legado_com_descricao_unica_aplica_aos_tres_dias` | GREEN |
| Campo em branco não vira zero | `RunPrescriptionTests.Descricao_sozinha_e_valida_sem_nenhum_numero`, `TrainingSheetDocumentsTests.Documento_legado_com_tres_descricoes_fica_sem_campos_numericos` | GREEN |
| Nova publicação não altera a ficha anterior | Herdado da ADR-009/STORY-013 (`CoachingEndpointTests.Falha_ao_publicar_preserva_a_ficha_ativa` cobre o mecanismo; nenhum campo novo altera esse comportamento) | GREEN |
| Faixa invertida é rejeitada | `RunPrescriptionTests.Faixa_invertida_de_distancia_e_recusada`, `.Faixa_com_maximo_igual_ao_minimo_e_recusada`, `CoachingEndpointTests.Publicar_com_faixa_invertida_retorna_400_e_nao_cria_ficha` | GREEN |
| Valor fora dos limites do domínio é rejeitado | `RunPrescriptionTests.Distancia_zero_ou_negativa_e_recusada`, `.Duracao_zero_ou_negativa_e_recusada`, `.Esforco_fora_da_escala_1_a_10_e_recusado` | GREEN |
| Zero e negativo não são prescrição | `RunPrescriptionTests.Distancia_zero_ou_negativa_e_recusada`, `.Duracao_zero_ou_negativa_e_recusada` | GREEN |
| Esforço percebido respeita a escala existente | `RunPrescriptionTests.Esforco_fora_da_escala_1_a_10_e_recusado` | GREEN |
| Publicar continua exigindo personal com vínculo ativo | Herdado da STORY-013 (`AuthorizationTests`, `CoachingEndpointTests.Busca_e_solicitacao_nao_concedem_acesso_antes_do_aceite`); nenhum caminho novo contorna essa checagem | GREEN |

## Formulário do app (client-side, não repetindo regra de domínio)

| Cenário | Teste | Estado |
|---|---|---|
| Campos independentes, faixa e alvo exato no formulário do personal | `runPrescriptionForm.test.ts` (8 casos) | GREEN |
| Exibição no detalhamento do dia | `dailyPrescription.test.ts`, `runPrescriptionSummary.test.ts` | GREEN |

## Resumo de execução

- **Backend**: 89 testes de domínio, 78 testes de API — 0 falhas.
- **App**: 296 testes Jest (42 suites) — 0 falhas.
- **Typecheck**: `tsc --noEmit` limpo.
- Nenhum teste pré-existente foi removido; os que dependiam da assinatura antiga
  de `RunningWorkout` foram atualizados para o novo contrato (ADR-012).
