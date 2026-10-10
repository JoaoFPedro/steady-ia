---
name: check
description: Valida código contra spec BDD + checklist OWASP Top 10.
---

<!-- GERADO por tools/build.py — edite a fonte em kit/, não este arquivo -->

# Code review contra spec + OWASP

> Argumento esperado: story-id

Valida código contra a spec BDD. Use o checklist do `.sdd/PLAYBOOK.md` como referência.

> **Auto-disparado pelo `/build`** quando todos os cenários ficam verdes — no fluxo padrão, você não precisa chamar manualmente.
>
> **Uso manual cai em três casos:**
> 1. **Re-validar pós-refactor ou pós-merge** — código já entregue mudou e quer revalidar contra a spec + OWASP.
> 2. **Pré-release** — checagem final antes de subir pra prod.
> 3. **Fluxo Jira/Azure depois do `/reflect`** — quando `/build` rodou sem spec, o `/check` automático é pulado; depois que `/reflect` gera a spec BDD, rode `/check` manualmente.

## Pré-condições

### Process guard: bloqueio se `/reflect` pendente

**Primeiro**, verifique se o arquivo `.sdd/.pending-sync` existe.

- Se existir: **RECUSE** a execução. Apresente esta mensagem e pare:

  > ⛔ **BLOQUEIO**: `/check` não pode ser executado agora.
  >
  > Motivo: `/build` foi executado sem spec BDD para a story `{conteúdo de .sdd/.pending-sync}`. O `/reflect` ainda não foi executado.
  >
  > Execute agora:
  > - `/reflect` → gera a spec BDD a partir do código implementado
  >
  > Somente após o `/reflect` o fluxo pode continuar.

- Se não existir: prossiga.

### Leituras obrigatórias

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- `specs/{story-id}/spec.bdd.md`
- [.sdd/PLAYBOOK.md](../../../.sdd/PLAYBOOK.md) — anti-patterns, error handling, segurança
- [.sdd/PROJECT-CONSTITUTION.md](../../../.sdd/PROJECT-CONSTITUTION.md) — mandatos de qualidade do projeto
- `docs/documenta-ai/debts/` — débito já catalogado na área tocada (se existir)
- Código em `src/` e testes em `tests/`

---

## Checklist — Código

- [ ] KISS — solução mais simples possível?
- [ ] SOLID — cada módulo faz uma coisa?
- [ ] DRY — sem duplicação (3+ vezes)?
- [ ] Nenhum anti-pattern? (God class, shotgun surgery, primitive obsession, over-engineering)

## Checklist — Testes

- [ ] Todo cenário BDD tem teste?
- [ ] Testes descrevem comportamento, não implementação?
- [ ] Fixtures com `_meta` rastreando spec?
- [ ] Fronteiras testadas?

## Checklist — Error Handling

- [ ] Inputs validados no ponto de entrada?
- [ ] Erros tipados e tratáveis?
- [ ] Mensagens de erro úteis?
- [ ] Logs estruturados sem dados sensíveis?

## Checklist — Segurança (OWASP Top 10)

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

## Checklist — Processo

- [ ] ADRs criados quando necessário?
- [ ] Blueprint atualizado se fluxo mudou?
- [ ] Conventional Commits?
- [ ] DevDocs da área ainda bate com o código? (`commit:` do doc vs `git log -1 --format=%H -- {source}`)

---

## Débito técnico — entrada e saída

O review consome e alimenta `docs/documenta-ai/debts/`. Sem isso o catálogo de débito nasce e morre no dia em que foi gerado.

**Entrada.** Leia o arquivo de débitos da área antes de revisar. Débito já catalogado **não vira achado novo**: cite a linha do documento e siga. Repetir o que já está registrado infla o relatório e ensina o time a ignorá-lo. Item marcado com `**Categoria**: OWASP A0N` já foi classificado — só reporte de novo se esta story piorou o quadro.

**Saída.** Achado que não é regressão desta story, mas dívida preexistente da área, é **anexado** ao arquivo de débitos na criticidade certa, com a data. Se não existe arquivo para a área, sugira `/documenta-ai {Controller}` ao fim do relatório.

**Resolvido.** Débito que esta story eliminou é marcado como `✅ resolvido em {sha}`, não apagado — o histórico é o que mostra a área melhorando.
