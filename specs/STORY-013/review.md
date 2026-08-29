# Review automático — STORY-013

Data: 2026-08-25
Resultado: **Aprovada para entrega do MVP com riscos residuais documentados**

## Código e arquitetura

- KISS/SOLID: domínio rico concentra invariantes; repositories concentram EF;
  cliente separa HTTP, cache, fila e preparação da execução.
- DRY: os quatro tipos e limites têm pontos canônicos; não foi criado catálogo
  ou motor de progressão fora do escopo.
- Imutabilidade: cada publicação cria ficha nova e execuções guardam snapshot;
  não existem endpoints de edição ou deleção do histórico.
- Concorrência: índices parciais garantem um vínculo e uma ficha ativa; corridas
  de solicitação/aceite são traduzidas para resultado de negócio, não 500.
- ADR-008 e ADR-009 registram autorização e versionamento; blueprint permanece
  alinhado ao fluxo entregue.
- ADR-010 registra as três prescrições dentro do mesmo `Run`; a leitura do JSON
  legado possui teste de compatibilidade e não exige migration relacional.
- `dailyPrescription` concentra o mapeamento da ficha nos sete dias; a Semana
  apenas apresenta o resultado e não acessa rede diretamente.
- A aba/rota Treinos foi removida. Aceite e encerramento de vínculo permanecem
  na área Planejamento. O detalhamento possui uma única ação e a escolha livre
  acontece no seletor de treino.
- ADR-011 define o comando combinado: o app mantém a musculação em rascunho,
  cria uma única unidade offline ao concluir a corrida e a API persiste ambas
  na mesma transação e sob a mesma chave de idempotência.

## Error handling

- Domínio valida nomes, séries, repetições, carga e nota antes da persistência.
- API reconstrói agregados a partir dos DTOs; JSON externo nunca é persistido
  diretamente.
- App valida carga/nota antes da fila e mantém erros transitórios como pendentes.
- Erros esperados usam 400/403/404/409 sem expor stack trace.

## OWASP Top 10

| Categoria | Resultado |
|-----------|-----------|
| A01 — Access control | Role `Personal` + vínculo ativo e `corredorId` filtrado no banco; testes cobrem IDOR, revogação e isolamento. |
| A02 — Cryptography | Nenhum secret novo no código; Google Sign-In permanece a única autenticação. `.env` e `launchSettings.json` estão ignorados. |
| A03 — Injection | Apenas LINQ/EF parametrizado, JSON reconstruído pelo domínio e renderização React Native; sem SQL cru, HTML ou shell com input. |
| A04 — Insecure design | Aceite explícito, uma relação ativa, confirmação de pulados e escrita atômica inclusive no comando combinado. Risco residual: rate limiting da busca por e-mail antes de produção pública. |
| A05 — Misconfiguration | Migration oficial e `supabase-lockdown.sql` genérico cobrem as novas tabelas com revoke + RLS. |
| A06 — Components | Nenhuma dependência adicionada pela story. |
| A07 — Authentication | Token Google validado pelo filtro existente; cliente tenta uma renovação e falha fechada para login. |
| A08 — Data integrity | Constraints, transações, snapshot imutável e idempotência protegem a integridade. |
| A09 — Logging | Solicitação, aceite, encerramento, publicação e consulta de histórico têm logs estruturados somente com IDs internos. |
| A10 — SSRF | Não há URL fornecida pelo usuário nem requisição server-side externa nova. |

## Fitness functions e riscos residuais

- FF-003: módulos novos ficam abaixo de 300 linhas.
- FF-004: React Native acessa dados somente pela API .NET.
- FF-005: 47 cenários mapeados em `mapping.md`; comportamentos de renderização e
  retorno de rota são verificados manualmente pela limitação já registrada do
  SDK de testes.
- Cobertura Jest global: **58,93%**, abaixo da meta desejável de 70%. A área
  `src/coaching` ficou em **75,51%**; o déficit global é principalmente de telas
  legadas sem teste de renderização e não bloqueia o MVP pela Constituição.
- Rate limiting da busca por e-mail permanece como hardening pré-produção,
  registrado também na ADR-008.

## Sensores desta revisão

- 76 testes de domínio e 74 testes de API verdes.
- 40 suítes Jest e 282 testes verdes; `tsc --noEmit` verde.
- `dotnet format --verify-no-changes --no-restore` e `git diff --check` verdes.
- Nenhuma dependência ou migration foi adicionada. O comando
  `dotnet-ef migrations has-pending-model-changes` confirmou que o modelo está
  alinhado; a mudança limita-se ao conteúdo do JSONB.

Nenhum achado bloqueante permaneceu após o refactor e a auditoria.
