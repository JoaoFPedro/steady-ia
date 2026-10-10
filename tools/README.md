# tools/

## build.py

Gera as superfícies de IDE a partir da fonte única em `kit/`.

```bash
python3 tools/build.py           # escreve os adapters
python3 tools/build.py --check   # sai com 1 se algum adapter divergiu (para CI)
```

| Fonte | Gera |
|---|---|
| `kit/workflow/*.md` | `.claude/commands/*.md`, `.github/prompts/*.prompt.md`, `.codex/skills/*/SKILL.md` |
| `kit/rules/*.md` | `.cursor/rules/*.mdc`, `.github/instructions/*.instructions.md` |
| `kit/models.json` | o campo `model:` dos prompts do Copilot |

Os IDEs exigem esses caminhos, então esses diretórios são **artefatos gerados** —
cada arquivo carrega um banner dizendo isso. Editar um deles à mão faz o `--check` falhar.

Codex CLI não tem um mecanismo de regra por path (`globs`/`applyTo`) — só `AGENTS.md` (global,
estático, igual ao `CLAUDE.md`) e skills. Por isso `kit/rules/*.md` não gera nada para Codex;
o que viria de lá fica só no `AGENTS.md` da raiz.

### Frontmatter da fonte

`kit/workflow/` — `name`, `title`, `role`, `description`, `model` (`strategy`|`execution`,
resolvido por `models.json`), `agent`, `argument-hint`, `instructions` (regras a referenciar,
linkadas em `.github/prompts/` e, com outro prefixo relativo, no `SKILL.md` do Codex),
`targets` (default: claude + copilot + codex).

`kit/rules/` — `name`, `title`, `description`, `applies` (vira `globs` no Cursor e `applyTo`
no Copilot), `always`, `targets` (default: cursor + copilot).

### Codex — skills em vez de prompts

Custom prompts do Codex (`~/.codex/prompts/*.md`) são globais e estão deprecados a favor de
**skills** — por isso `render()` gera `.codex/skills/{nome}/SKILL.md` (escopo de projeto,
mecanismo atual). O frontmatter de skill só aceita `name`/`description`; `argument-hint` não
tem campo equivalente, então vira uma nota (`> Argumento esperado: ...`) no corpo. Invocação:
`$nome` explícito, ou seleção automática pelo Codex a partir da `description`.
