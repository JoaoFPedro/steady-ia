---
description: Auditoria manual do estado do processo — sync pendente, specs órfãs, ADRs, fundação, discovery, segurança, dead code.
agent: agent
model: Claude Sonnet 4.6
---

<!-- GERADO por tools/build.py — edite a fonte em kit/, não este arquivo -->

# /healthcheck — Auditoria do processo (Engineer & QA)

Auditoria silenciosa do estado do projeto. Equivalente manual ao hook `Stop` `session-healthcheck.sh` do Claude Code — nem Copilot nem Codex CLI disparam automaticamente ao final da resposta, então execute este comando ao encerrar uma sessão ou antes de commits importantes.

Reporte apenas o que **requer atenção**. Se está tudo bem, diga "✅ Tudo OK" e nada mais.

## Pré-condições

Leia (silenciosamente, só comente se ausente):

- [.sdd/PROJECT-CONSTITUTION.md](../../.sdd/PROJECT-CONSTITUTION.md)
- [.sdd/memory/PROJECT.md](../../.sdd/memory/PROJECT.md)
- [.sdd/memory/DOMAIN.md](../../.sdd/memory/DOMAIN.md)
- [.sdd/memory/DECISIONS.md](../../.sdd/memory/DECISIONS.md)

---

## Checklist (rode em ordem, agregue um único relatório no final)

### 1. `/reflect` pendente

- [.sdd/.pending-sync](../../.sdd/.pending-sync) existe? → reporte como ⛔ **bloqueio**: identifica que `/check` e `/feature` estão bloqueados, e diga a `{story-id}` (conteúdo do arquivo).

### 2. Stories sem spec BDD

Para cada `specs/*/`:
- Tem `story.md` mas **não tem** `spec.bdd.md`? → ⚠️
- Tem `spec.bdd.md` mas **sem `Scenario:`**? → ⚠️ ("sem cenários")

Liste todas as stories afetadas em uma linha agregada.

### 3. ADRs em Proposed

Para cada `docs/adr/ADR-*.md`:
- Contém `Status: Proposed` ou `Status: Proposto`? → ⚠️ liste os ADRs em Proposed.

### 4. Fundação incompleta

Reporte ⚠️ se algum destes faltar:
- [.sdd/PROJECT-CONSTITUTION.md](../../.sdd/PROJECT-CONSTITUTION.md)
- [.sdd/memory/PROJECT.md](../../.sdd/memory/PROJECT.md)
- [.sdd/memory/DOMAIN.md](../../.sdd/memory/DOMAIN.md)

Sugira `/init` (projeto novo) ou `/onboard` (projeto existente).

### 5. Discoveries sem decisão

Para cada `.discovery/*/`:
- Não tem `decision.md`? → ⚠️ "sem decision.md"
- `decision.md` ainda tem checkboxes não marcados (`- [ ] **Construir|Validar|Diferir|Descartar`)? → ⚠️ "decisão não tomada"

### 6. Security drift

- `.env` existe mas **não está** no `.gitignore` (linha `^\.env$`)? → ⛔ **A05** risco de commit acidental.
- `.env.local`, `.env.development`, `.env.production`, `.env.staging`, `.env.test` existem mas não estão no `.gitignore`? → ⚠️ **A05** liste arquivos.
- Se `package.json` existe: rode `npm audit --json` e reporte `critical`/`high` se > 0 → ⚠️ **A06** sugira `npm audit fix`.
- Se `requirements.txt` existe: rode `pip-audit --format=json` (se disponível) e reporte total → ⚠️ **A06** sugira `pip-audit --fix`.
- Inspecione o último commit (`git diff --name-only HEAD~1 HEAD`, ignorando binários): se algum arquivo contém padrões de secret (`password|secret|api_key|token|private_key\s*[=:]\s*"..."`, `AKIA[0-9A-Z]{16}`, `sk-[a-zA-Z0-9]{48}`, `ghp_[a-zA-Z0-9]{36}`, `-----BEGIN ... PRIVATE KEY`) → ⛔ **A02** liste arquivos e sugira `git rebase -i HEAD~1` + force-push após remoção.

### 7. Dead code

- **TypeScript/JavaScript**: se `package.json` existe e `knip` está disponível, rode `knip --reporter json` e reporte `files + exports` não utilizados. Fallback: `ts-prune` (se `tsconfig.json` existir) — conte exports não usados.
- **Python**: se há `requirements.txt` ou arquivos `.py`, rode `vulture . --min-confidence 80` e conte linhas de output.

Reporte ⚠️ com o comando para o usuário rodar.

### 8. Documentação desatualizada (doc drift)

Para cada arquivo em `docs/documenta-ai/dev/`, `business/` e `debts/`:

1. Leia `source:` e `commit:` do frontmatter.
2. `git log -1 --format=%H -- {source}` → SHA atual do arquivo documentado.
3. SHA diferente do `commit:` do doc → o código andou desde a geração: ⚠️ **doc velho**.
4. `git diff --quiet -- {source}` falhando → mudança não commitada na fonte: ⚠️ também.

Doc sem `source:` ou `commit:` no frontmatter → ⚠️ "sem rastreabilidade — regerar com `/documenta-ai`".

Agregue em uma linha só, no máximo 3 nomes: `⚠️ DOC DRIFT: N doc(s) desatualizados (X, Y, Z) — rode /documenta-ai --incremental`.

Grave os alvos afetados em `.sdd/.pending-docs`, um por linha, para o `/documenta-ai` saber o que regenerar.

Sempre ⚠️, nunca ⛔. Bloquear trabalho por documentação atrasada trava o time — ao contrário do `.pending-sync`, que protege o contrato da spec.

---

## Formato de saída

Se há issues ou warnings:

```
╔══ isabel Health Check ══════════════════════════════════╗

  ⛔ <issue crítico 1>
  ⛔ <issue crítico 2>
  ⚠️  <warning 1>
  ⚠️  <warning 2>

╚══════════════════════════════════════════════════════════════╝
```

Se tudo OK: apenas `✅ Tudo OK`.

## Regras

- Seja **conciso**. Uma linha por issue.
- Não duplique informação que já foi comentada nesta sessão.
- ⛔ = bloqueio (precisa resolver agora); ⚠️ = atenção (resolver em breve).
- Não execute comandos destrutivos — apenas reporte e sugira.
