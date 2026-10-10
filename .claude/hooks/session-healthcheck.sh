#!/usr/bin/env bash
# isabel — session-healthcheck hook (Stop)
# Roda após cada resposta do Claude. Verifica a saúde do projeto
# e exibe alertas apenas quando há algo que precisa de atenção.
# Silencioso quando tudo está bem.

ISSUES=""
WARNINGS=""

# ─── 1. /reflect pendente ─────────────────────────────────────────────────────
if [ -f ".sdd/.pending-sync" ]; then
  STORY_ID=$(cat ".sdd/.pending-sync" 2>/dev/null)
  ISSUES="${ISSUES}\n  ⛔ /reflect pendente para ${STORY_ID} — /check e /feature estão bloqueados"
fi

# ─── 2. Stories sem spec BDD ─────────────────────────────────────────────────
if [ -d "specs" ]; then
  STORIES_WITHOUT_SPEC=""
  for story_dir in specs/*/; do
    story_id=$(basename "$story_dir")
    story_file="${story_dir}story.md"
    spec_file="${story_dir}spec.bdd.md"

    # Tem story.md mas não tem spec ou spec sem cenários
    if [ -f "$story_file" ]; then
      if [ ! -f "$spec_file" ]; then
        STORIES_WITHOUT_SPEC="${STORIES_WITHOUT_SPEC} ${story_id}"
      elif ! grep -q "Scenario:" "$spec_file" 2>/dev/null; then
        STORIES_WITHOUT_SPEC="${STORIES_WITHOUT_SPEC} ${story_id}(sem cenários)"
      fi
    fi
  done

  if [ -n "$STORIES_WITHOUT_SPEC" ]; then
    WARNINGS="${WARNINGS}\n  ⚠️  Stories sem spec BDD:${STORIES_WITHOUT_SPEC}"
  fi
fi

# ─── 3. ADRs com status Proposed ─────────────────────────────────────────────
if [ -d "docs/adr" ]; then
  PROPOSED_ADRS=""
  for adr_file in docs/adr/ADR-*.md; do
    [ -f "$adr_file" ] || continue
    if grep -qi "Status.*Proposed\|Status.*Proposto" "$adr_file" 2>/dev/null; then
      adr_name=$(basename "$adr_file" .md)
      PROPOSED_ADRS="${PROPOSED_ADRS} ${adr_name}"
    fi
  done

  if [ -n "$PROPOSED_ADRS" ]; then
    WARNINGS="${WARNINGS}\n  ⚠️  ADRs em Proposed (requerem decisão):${PROPOSED_ADRS}"
  fi
fi

# ─── 4. Fundação incompleta ───────────────────────────────────────────────────
SDD_DIR=".sdd"
FOUNDATION_ISSUES=""
[ ! -f "${SDD_DIR}/PROJECT-CONSTITUTION.md" ] && FOUNDATION_ISSUES="${FOUNDATION_ISSUES} PROJECT-CONSTITUTION.md"
[ ! -f "${SDD_DIR}/memory/PROJECT.md" ]       && FOUNDATION_ISSUES="${FOUNDATION_ISSUES} memory/PROJECT.md"
[ ! -f "${SDD_DIR}/memory/DOMAIN.md" ]        && FOUNDATION_ISSUES="${FOUNDATION_ISSUES} memory/DOMAIN.md"

if [ -n "$FOUNDATION_ISSUES" ]; then
  WARNINGS="${WARNINGS}\n  ⚠️  Fundação incompleta — faltam:${FOUNDATION_ISSUES}"
  WARNINGS="${WARNINGS}\n     Execute /init (projeto novo) ou /onboard (projeto existente)"
fi

# ─── 5. Discoveries sem decisão ──────────────────────────────────────────────
if [ -d ".discovery" ]; then
  UNDECIDED=""
  for disc_dir in .discovery/*/; do
    disc_id=$(basename "$disc_dir")
    decision_file="${disc_dir}decision.md"
    if [ ! -f "$decision_file" ]; then
      UNDECIDED="${UNDECIDED} ${disc_id}(sem decision.md)"
    elif grep -qE '^\- \[ \] \*\*(Construir|Validar|Diferir|Descartar)' "$decision_file" 2>/dev/null; then
      UNDECIDED="${UNDECIDED} ${disc_id}(decisão não tomada)"
    fi
  done
  if [ -n "$UNDECIDED" ]; then
    WARNINGS="${WARNINGS}\n  ⚠️  Discoveries sem decisão:${UNDECIDED}"
    WARNINGS="${WARNINGS}\n     Use /triage para concluir e registrar a decisão em decision.md"
  fi
fi

# ─── 6. Security drift ───────────────────────────────────────────────────────

# 5a. .env sem .gitignore (A05)
if [ -f ".env" ]; then
  if [ ! -f ".gitignore" ] || ! grep -qE '^\.env$' ".gitignore" 2>/dev/null; then
    ISSUES="${ISSUES}\n  ⛔ SECURITY A05: .env existe mas não está no .gitignore — risco de commit acidental"
  fi
fi

# 5b. Arquivos .env.* de ambiente sem proteção (exceto .example/.sample)
for env_file in .env.local .env.development .env.production .env.staging .env.test; do
  if [ -f "$env_file" ]; then
    if [ ! -f ".gitignore" ] || ! grep -qF "$env_file" ".gitignore" 2>/dev/null; then
      WARNINGS="${WARNINGS}\n  ⚠️  SECURITY A05: ${env_file} não está no .gitignore"
    fi
  fi
done

# 5c. Dependências vulneráveis — npm audit (A06)
if [ -f "package.json" ] && command -v npm &>/dev/null; then
  AUDIT_RESULT=$(npm audit --json 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    v = d.get('metadata', {}).get('vulnerabilities', {})
    c, h = v.get('critical', 0), v.get('high', 0)
    if c > 0 or h > 0:
        print(f'critical={c} high={h}')
except Exception:
    pass
" 2>/dev/null || true)
  if [ -n "$AUDIT_RESULT" ]; then
    WARNINGS="${WARNINGS}\n  ⚠️  SECURITY A06: dependências vulneráveis (${AUDIT_RESULT}) — rode: npm audit fix"
  fi
fi

# 5d. Dependências vulneráveis — pip audit (A06)
if [ -f "requirements.txt" ] && command -v pip &>/dev/null; then
  if command -v pip-audit &>/dev/null; then
    PIP_AUDIT=$(pip-audit --format=json 2>/dev/null | python3 -c "
import sys, json
try:
    vulns = json.load(sys.stdin)
    count = len(vulns)
    if count > 0:
        print(f'{count} vulnerabilidade(s)')
except Exception:
    pass
" 2>/dev/null || true)
    if [ -n "$PIP_AUDIT" ]; then
      WARNINGS="${WARNINGS}\n  ⚠️  SECURITY A06: pip-audit detectou ${PIP_AUDIT} — rode: pip-audit --fix"
    fi
  fi
fi

# 5e. Secret no último commit (A02) — verificação pós-resposta
if command -v git &>/dev/null && git rev-parse --git-dir &>/dev/null 2>&1; then
  LAST_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -vE '\.(png|jpg|jpeg|gif|svg|ico|lock|sum|woff|ttf)$' || true)
  SECRET_HIT=""
  for file in $LAST_FILES; do
    content=$(git show "HEAD:$file" 2>/dev/null) || continue
    if echo "$content" | grep -iqE \
      '(password|passwd|secret|api_key|apikey|token|private_key)\s*[=:]\s*["\x27][^"\x27\$\{]{8,}|AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|ghp_[a-zA-Z0-9]{36}|-----BEGIN.*PRIVATE KEY' 2>/dev/null; then
      SECRET_HIT="${SECRET_HIT} ${file}"
    fi
  done
  if [ -n "$SECRET_HIT" ]; then
    ISSUES="${ISSUES}\n  ⛔ SECURITY A02: possível secret no último commit:${SECRET_HIT}"
    ISSUES="${ISSUES}\n     Remova com: git rebase -i HEAD~1  →  edite o commit  →  force-push"
  fi
fi

# ─── 7. Dead code — imports e símbolos não utilizados ────────────────────────

# TypeScript/JavaScript — knip (preferido) ou fallback para ts-prune
if [ -f "package.json" ]; then
  if command -v knip &>/dev/null; then
    KNIP_OUT=$(knip --reporter json 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    files = d.get('files', [])
    exports = d.get('exports', [])
    total = len(files) + len(exports)
    if total > 0:
        print(f'{total} símbolo(s)/arquivo(s) não utilizados')
except Exception:
    pass
" 2>/dev/null || true)
    if [ -n "$KNIP_OUT" ]; then
      WARNINGS="${WARNINGS}\n  ⚠️  DEAD CODE: ${KNIP_OUT} — rode: knip"
    fi
  elif command -v ts-prune &>/dev/null && [ -f "tsconfig.json" ]; then
    TS_PRUNE_OUT=$(ts-prune 2>/dev/null | grep -v "(used in module)" | head -5 | wc -l | tr -d ' ')
    if [ "${TS_PRUNE_OUT:-0}" -gt 0 ] 2>/dev/null; then
      WARNINGS="${WARNINGS}\n  ⚠️  DEAD CODE: ${TS_PRUNE_OUT} export(s) não utilizados — rode: ts-prune"
    fi
  fi
fi

# Python — vulture
if [ -f "requirements.txt" ] || find . -maxdepth 2 -name "*.py" -not -path "./.git/*" -quit 2>/dev/null | grep -q .; then
  if command -v vulture &>/dev/null; then
    VULTURE_OUT=$(vulture . --min-confidence 80 2>/dev/null | grep -v "^$" | wc -l | tr -d ' ')
    if [ "${VULTURE_OUT:-0}" -gt 0 ] 2>/dev/null; then
      WARNINGS="${WARNINGS}\n  ⚠️  DEAD CODE: ${VULTURE_OUT} item(ns) não utilizados (Python) — rode: vulture . --min-confidence 80"
    fi
  fi
fi

# ─── 8. Doc drift — documentação gerada desatualizada ────────────────────────
# Compara o `commit:` do frontmatter de cada doc com o SHA atual do arquivo-fonte.
# Divergiu, o código andou desde a geração. Sempre ⚠️ — nunca bloqueia.
PENDING_DOCS_FILE=".sdd/.pending-docs"
if [ -d "docs/documenta-ai" ] && command -v git &>/dev/null && git rev-parse --git-dir &>/dev/null 2>&1; then
  STALE_NAMES=""
  STALE_COUNT=0
  NO_TRACE_COUNT=0
  STALE_SOURCES=""

  for doc in docs/documenta-ai/dev/*.md docs/documenta-ai/business/*.md docs/documenta-ai/debts/*.md; do
    [ -f "$doc" ] || continue

    DOC_SOURCE=$(sed -n 's/^source:[[:space:]]*//p' "$doc" 2>/dev/null | head -1)
    DOC_COMMIT=$(sed -n 's/^commit:[[:space:]]*//p' "$doc" 2>/dev/null | head -1)

    # Sem rastreabilidade: não dá para saber se envelheceu
    if [ -z "$DOC_SOURCE" ] || [ -z "$DOC_COMMIT" ]; then
      NO_TRACE_COUNT=$((NO_TRACE_COUNT + 1))
      continue
    fi

    [ -f "$DOC_SOURCE" ] || continue

    CUR_COMMIT=$(git log -1 --format=%H -- "$DOC_SOURCE" 2>/dev/null)
    IS_STALE=false

    # SHA do último commit da fonte difere do registrado no doc
    if [ -n "$CUR_COMMIT" ] && [ "${CUR_COMMIT:0:${#DOC_COMMIT}}" != "$DOC_COMMIT" ]; then
      IS_STALE=true
    fi

    # Mudança não commitada na fonte
    if ! git diff --quiet -- "$DOC_SOURCE" 2>/dev/null; then
      IS_STALE=true
    fi

    if [ "$IS_STALE" = true ]; then
      STALE_COUNT=$((STALE_COUNT + 1))
      DOC_NAME=$(basename "$doc" .md)
      [ "$STALE_COUNT" -le 3 ] && STALE_NAMES="${STALE_NAMES} ${DOC_NAME}"
      STALE_SOURCES="${STALE_SOURCES}${DOC_SOURCE}\n"
    fi
  done

  if [ "$STALE_COUNT" -gt 0 ]; then
    SUFFIX=""
    [ "$STALE_COUNT" -gt 3 ] && SUFFIX=" +$((STALE_COUNT - 3))"
    WARNINGS="${WARNINGS}\n  ⚠️  DOC DRIFT: ${STALE_COUNT} doc(s) desatualizados —${STALE_NAMES}${SUFFIX}"
    WARNINGS="${WARNINGS}\n     Rode /documenta-ai --incremental para regenerar só as rotas afetadas"
    printf "%b" "$STALE_SOURCES" | sort -u > "$PENDING_DOCS_FILE"
  else
    rm -f "$PENDING_DOCS_FILE"
  fi

  if [ "$NO_TRACE_COUNT" -gt 0 ]; then
    WARNINGS="${WARNINGS}\n  ⚠️  DOC DRIFT: ${NO_TRACE_COUNT} doc(s) sem frontmatter source/commit — regere com /documenta-ai"
  fi
fi

# ─── Saída — silencioso se tudo bem ──────────────────────────────────────────
if [ -z "$ISSUES" ] && [ -z "$WARNINGS" ]; then
  exit 0
fi

echo ""
echo "╔══ isabel Health Check ══════════════════════════════════╗"

if [ -n "$ISSUES" ]; then
  echo -e "$ISSUES"
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS"
fi

echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

exit 0
