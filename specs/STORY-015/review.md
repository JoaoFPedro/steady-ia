# Review automático — STORY-015

Data: 2026-08-28
Resultado: **Aprovada**

## Código e arquitetura

- KISS: `RunPrescription` e `NumericRange<T>` são value objects mínimos —
  descrição obrigatória, três campos numéricos opcionais e independentes.
  Nenhuma camada de configuração ou motor de regras foi criada além do que a
  spec pede.
- SOLID: `TrainingSheetEndpoints.cs` cresceu para 333 linhas ao ganhar a
  conversão de/para o novo contrato; extraída para `TrainingSheetMapping.cs`
  (SRP — roteamento/autorização de um lado, serialização de payload do outro).
  Ambos os arquivos voltaram a ficar abaixo de FF-003 (277 e 74 linhas).
- DRY: `NumericRange<T>` é genérico porque a regra de faixa (mínimo
  obrigatório, máximo opcional e maior que o mínimo) se repete três vezes
  (distância, duração, esforço) — extração no limiar exato da regra de três da
  Constituição.
- Sem primitive obsession: a story existe justamente para substituir os três
  `string` de `RunningWorkout` por um tipo que carrega unidade e faixa,
  alinhado ao padrão prioritário "DTO / Value Object" do
  `PROJECT-CONSTITUTION.md`.
- Compatibilidade: `TrainingSheetDocuments.DeserializeSheet` lê três formatos —
  o novo (`TuesdayRun`/`ThursdayRun`/`SaturdayRun`), o da STORY-013
  (`TuesdayRunDescription` etc.) e o legado da ADR-010 (`RunDescription`
  único) — sem migration, coerente com o histórico de leitura tolerante já
  estabelecido.
- App: `runPrescriptionForm.ts` valida só a estrutura da faixa (é número? o
  máximo é maior que o mínimo?) no cliente; os limites de domínio (distância
  > 0, esforço 1–10) permanecem só no backend — sem duplicar a fonte da
  verdade, conforme a task explicitamente pedia.

## Testes

- Todo cenário do `spec.bdd.md` está mapeado em `mapping.md` com o teste real
  que o cobre; nenhum cenário ficou sem correspondência.
- Dois cenários (`Personal prescreve corrida com os três campos` e
  `Faixa invertida é rejeitada`) tinham cobertura só em domínio/persistência —
  adicionados `Publicar_com_campos_numericos_opcionais_preserva_faixas_e_alvo_exato`
  e `Publicar_com_faixa_invertida_retorna_400_e_nao_cria_ficha` em
  `CoachingEndpointTests.cs` para fechar a ponta a ponta via HTTP real.
- Testes descrevem comportamento (nomes em português, `Given/When/Then`
  refletido na estrutura), não implementação.

## Error handling

- `RunPrescription.Create` valida na fronteira do domínio com guard clauses;
  `DomainFactory.TryCreate` traduz `ArgumentException`/`ArgumentOutOfRangeException`
  em 400 com a mensagem de domínio — nenhuma exceção de validação escapa como 500.
- Mensagens distinguem estrutura (faixa invertida, máximo sem mínimo) de valor
  fora do domínio (distância ≤ 0, esforço fora de 1–10).
- Nenhum log novo foi adicionado; os logs de auditoria existentes não mudaram
  de formato e não passaram a carregar os novos campos.

## OWASP Top 10

| Categoria | Resultado |
|-----------|-----------|
| A01 — Access control | Endpoint de publicação inalterado: exige role `Personal` e ownership verificado por `PublishAsync` antes de qualquer campo novo ser processado. |
| A02 — Cryptography | Nenhum secret novo; nenhuma credencial tocada por esta story. |
| A03 — Injection | Apenas `System.Text.Json` e EF/JSONB parametrizado; nenhum SQL cru, HTML ou shell recebendo os novos campos numéricos. |
| A04 — Insecure design | Faixas inválidas (invertida, igual, fora do domínio) são rejeitadas antes da persistência; nenhum estado parcial é criado na rejeição (testado). |
| A05 — Misconfiguration | Nenhuma configuração nova; nenhum schema de banco mudou (`dotnet-ef migrations has-pending-model-changes` confirma nenhuma alteração de modelo — a mudança é só no conteúdo do JSONB). |
| A06 — Components | Nenhuma dependência adicionada. |
| A07 — Authentication | Inalterado por esta story. |
| A08 — Data integrity | Campo ausente nunca é serializado como zero (testado); ficha permanece imutável — publicar cria registro novo, nunca edita o anterior. |
| A09 — Logging | Nenhum dado novo em log; distância/duração/esforço prescritos não são PII. |
| A10 — SSRF | Não aplicável — nenhuma URL ou requisição externa nova. |

## Fitness functions e riscos residuais

- FF-002/FF-003: nenhum método ou arquivo tocado excede os limiares
  (`TrainingSheetEndpoints.cs` 277 linhas, `TrainingSheetMapping.cs` 74,
  `TrainingSheet.cs` 214, `TrainingSheetDocuments.cs` 137,
  `app/personal/runner.tsx` 266).
- FF-004: o app continua sem acessar banco diretamente; a validação de faixa
  no cliente é conveniência de UX, não a fonte de verdade.
- FF-005: `mapping.md` cobre 100% dos cenários da spec com teste real.
- Risco residual: os campos numéricos são opcionais por decisão de produto
  (DISC-006, suposição crítica #1) — a adoção pelo personal só será conhecida
  no piloto. Não é um problema desta implementação; é a métrica que o
  discovery já registrou para acompanhar.

## Sensores desta revisão

- 89 testes de domínio e 78 testes de API verdes (17 pré-existentes + 2 novos
  em `CoachingEndpointTests.cs`, ambos cobrindo a ponta a ponta via HTTP).
- 42 suítes Jest e 296 testes verdes; `tsc --noEmit` verde.
- `dotnet format --verify-no-changes --no-restore` verde nos três projetos
  tocados (`Steady.Domain`, `Steady.Api`, `Steady.Infrastructure`).
- `dotnet-ef migrations has-pending-model-changes` confirma ausência de drift
  de schema — esperado, já que a mudança vive inteira dentro do JSONB da ficha.
- Build sem warnings nos três projetos .NET tocados.

Nenhum achado bloqueante. O único ajuste feito durante a própria revisão foi a
extração de `TrainingSheetMapping.cs` para manter `TrainingSheetEndpoints.cs`
dentro de FF-003 — já refletido no código, não é um item pendente.
