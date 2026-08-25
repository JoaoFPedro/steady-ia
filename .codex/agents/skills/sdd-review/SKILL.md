---
name: sdd-review
description: Revisa implementação contra spec BDD, testes, qualidade, segurança e padrões do SDD Kit. Use quando o usuário pedir /review, revalidação pós-refactor ou revisão pré-release.
---
## /review

Valida código contra a spec BDD. Use o checklist do `.sdd/PLAYBOOK.md` como referência.

> **Auto-disparado pelo `/implement`** quando todos os cenários ficam verdes — no fluxo padrão, você não precisa chamar manualmente.
>
> **Uso manual cai em três casos:**
> 1. **Re-validar pós-refactor ou pós-merge** — código já entregue mudou e quer revalidar contra a spec + OWASP.
> 2. **Pré-release** — checagem final antes de subir pra prod.
> 3. **Fluxo Jira/Azure depois do `/sync`** — quando `/implement` rodou sem spec, o `/review` automático é pulado; depois que `/sync` gera a spec BDD, rode `/review` manualmente.

### Contexto

1. `specs/{story-id}/spec.bdd.md`
2. `.sdd/PLAYBOOK.md` — anti-patterns, error handling, segurança
3. Código em `src/` e testes em `tests/`

### Checklist — Código

- [ ] KISS — solução mais simples possível?
- [ ] SOLID — cada módulo faz uma coisa?
- [ ] DRY — sem duplicação (3+ vezes)?
- [ ] Nenhum anti-pattern? (God class, shotgun surgery, primitive obsession, over-engineering)

### Checklist — Testes

- [ ] Todo cenário BDD tem teste?
- [ ] Testes descrevem comportamento, não implementação?
- [ ] Fixtures com `_meta` rastreando spec?
- [ ] Fronteiras testadas?

### Checklist — Error Handling

- [ ] Inputs validados no ponto de entrada?
- [ ] Erros tipados e tratáveis?
- [ ] Mensagens de erro úteis?
- [ ] Logs estruturados sem dados sensíveis?

### Checklist — Segurança (OWASP Top 10)

> Engineer & QA é responsável pela segurança da implementação.
> Consulte `.sdd/PLAYBOOK.md` seção 6 para padrões detalhados e exemplos.

**A01 — Broken Access Control**
- [ ] Toda query filtra por `userId`/`tenantId` no banco (não filtra depois de buscar)?
- [ ] Endpoints verificam ownership do recurso, não apenas autenticação?
- [ ] Respostas de "não encontrado" não revelam existência do recurso?

**A02 — Cryptographic Failures**
- [ ] Nenhum secret, token ou senha hardcoded no código?
- [ ] Secrets lidos de variáveis de ambiente ou secret manager?
- [ ] Senhas com bcrypt/argon2 (custo ≥ 12)? Nunca MD5/SHA sem salt?
- [ ] Tokens JWT em httpOnly cookie? Nunca em localStorage?

**A03 — Injection**
- [ ] Queries SQL com parameterized statements? Nunca concatenação de string?
- [ ] Output HTML escapado ou via `textContent`? Nunca `innerHTML` com input direto?
- [ ] Comandos shell sem `shell=True` / sem concatenação de input?
- [ ] LDAP/XPath queries parametrizadas (se aplicável)?

**A04 — Insecure Design**
- [ ] Endpoints sensíveis (login, reset, OTP) têm rate limiting?
- [ ] Mensagens de erro genéricas para o usuário (não revelam estado interno)?
- [ ] Fluxos críticos têm tokens de uso único com expiração?
- [ ] Ações destrutivas têm confirmação e audit log?

**A05 — Security Misconfiguration**
- [ ] `.env` no `.gitignore`? Nenhum arquivo de ambiente sendo commitado?
- [ ] CORS restrito a origens conhecidas? Nunca `origin: '*'` em produção?
- [ ] Headers de segurança configurados (CSP, HSTS, X-Frame-Options)?
- [ ] Modo debug desativado em produção?

**A06 — Vulnerable Components**
- [ ] Novas dependências têm manutenção ativa e sem CVEs críticos?
- [ ] `npm audit` / `pip-audit` sem vulnerabilidades críticas ou altas?

**A07 — Auth Failures**
- [ ] Rate limit em tentativas de login (máx 5, depois lockout progressivo)?
- [ ] Tokens com expiração curta (access ≤ 15min, refresh ≤ 7d)?
- [ ] Logout invalida token no servidor, não apenas no cliente?
- [ ] Refresh tokens revogáveis e rotacionados a cada uso?

**A09 — Logging & Monitoring**
- [ ] Logs estruturados sem dados sensíveis (senhas, tokens, PII)?
- [ ] Falhas de autenticação logadas com contexto (IP, user_id, attempt)?
- [ ] Ações sensíveis têm audit log (mudança de senha, deleção, export)?

**A10 — SSRF**
- [ ] URLs fornecidas pelo usuário validadas contra allowlist?
- [ ] Redirects usam identificador mapeado, não URL direta?

### Checklist — Processo

- [ ] ADRs criados quando necessário?
- [ ] Blueprint atualizado se fluxo mudou?
- [ ] Conventional Commits?
