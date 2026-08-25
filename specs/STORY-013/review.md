# Review automático — STORY-013

Data: 2026-08-24
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
| A03 — Injection | Apenas LINQ/EF parametrizado e renderização React Native; sem SQL cru, HTML ou shell com input. |
| A04 — Insecure design | Aceite explícito, uma relação ativa, confirmação de pulados e escrita atômica. Risco residual: rate limiting da busca por e-mail antes de produção pública. |
| A05 — Misconfiguration | Migration oficial e `supabase-lockdown.sql` genérico cobrem as novas tabelas com revoke + RLS. |
| A06 — Components | Nenhuma dependência adicionada pela story. |
| A07 — Authentication | Token Google validado pelo filtro existente; cliente tenta uma renovação e falha fechada para login. |
| A08 — Data integrity | Constraints, transações, snapshot imutável e idempotência protegem a integridade. |
| A09 — Logging | Solicitação, aceite, encerramento, publicação e consulta de histórico têm logs estruturados somente com IDs internos. |
| A10 — SSRF | Não há URL fornecida pelo usuário nem requisição server-side externa nova. |

## Fitness functions e riscos residuais

- FF-003: módulos novos ficam abaixo de 300 linhas.
- FF-004: React Native acessa dados somente pela API .NET.
- FF-005: 31 cenários mapeados em `mapping.md`; dois comportamentos visuais são
  verificados manualmente pela limitação já registrada do SDK de testes.
- Cobertura Jest global: **58,93%**, abaixo da meta desejável de 70%. A área
  `src/coaching` ficou em **75,51%**; o déficit global é principalmente de telas
  legadas sem teste de renderização e não bloqueia o MVP pela Constituição.
- Rate limiting da busca por e-mail permanece como hardening pré-produção,
  registrado também na ADR-008.

Nenhum achado bloqueante permaneceu após o refactor de concorrência e auditoria.
