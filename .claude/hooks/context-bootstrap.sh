#!/usr/bin/env bash
# SDD Kit — context-bootstrap hook (UserPromptSubmit)
# Injeta contexto do projeto automaticamente quando um comando SDD é detectado.
# Substitui o check manual da seção "Primeira Ação" do CLAUDE.md.

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('prompt',''))" 2>/dev/null || echo "")

# Silencioso para mensagens sem comando SDD
if ! echo "$PROMPT" | grep -qE '^\s*/(init|onboard|analyze|feature|plan|spec|implement|review|sync)(\s|$)'; then
  exit 0
fi

SDD_DIR=".sdd"
MEMORY_DIR="${SDD_DIR}/memory"

# ─── Saúde da fundação ────────────────────────────────────────────────────────
MISSING=""
[ ! -f "${SDD_DIR}/PROJECT-CONSTITUTION.md" ] && MISSING="${MISSING}\n  ✗ .sdd/PROJECT-CONSTITUTION.md ausente — rode /init ou /onboard"
[ ! -f "${SDD_DIR}/STACK.md" ]                && MISSING="${MISSING}\n  ✗ .sdd/STACK.md ausente — rode /onboard (existente) ou /init (novo)"
[ ! -f "${memory_DIR}/PROJECT.md" ] 2>/dev/null
[ ! -f "${MEMORY_DIR}/PROJECT.md" ]           && MISSING="${MISSING}\n  ✗ .sdd/memory/PROJECT.md ausente — rode /init ou /onboard"
[ ! -f "${MEMORY_DIR}/DOMAIN.md" ]            && MISSING="${MISSING}\n  ✗ .sdd/memory/DOMAIN.md ausente — rode /init ou /onboard"

if [ -n "$MISSING" ]; then
  echo "[SDD BOOTSTRAP] Projeto sem fundação completa:"
  echo -e "$MISSING"
  echo ""
  echo "Informe o usuário antes de continuar."
  exit 0
fi

# ─── Carrega contexto condensado ─────────────────────────────────────────────
PROJECT_NAME=$(grep -m1 "^# " "${MEMORY_DIR}/PROJECT.md" 2>/dev/null | sed 's/^# //')
PROJECT_CONTEXT=$(grep -A5 "^## Contexto" "${MEMORY_DIR}/PROJECT.md" 2>/dev/null | grep -v "^##" | head -4 | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')
DOMAIN_ENTITIES=$(grep -A20 "^## Entidades" "${MEMORY_DIR}/DOMAIN.md" 2>/dev/null | grep "^###\|^- \*\*" | head -8 | sed 's/^### //' | sed 's/^- \*\*//' | sed 's/\*\*.*//' | tr '\n' ', ' | sed 's/, $//')
KEY_PRINCIPLES=$(grep -A3 "^### Lei do Domínio\|^## Lei do Domínio" "${SDD_DIR}/PROJECT-CONSTITUTION.md" 2>/dev/null | grep "^-" | head -3 | sed 's/^- //' | tr '\n' ' | ')
STACK_SUMMARY=$(grep -m1 "^|" "${SDD_DIR}/STACK.md" 2>/dev/null | tr -d '|' | tr -s ' ' | sed 's/^ //')
PENDING_SYNC=""
[ -f ".sdd/.pending-sync" ] && PENDING_SYNC="⚠️ /sync pendente para: $(cat .sdd/.pending-sync)"

# ─── Output injetado no contexto de Claude ───────────────────────────────────
cat <<EOF
[SDD CONTEXT LOADED] — leia antes de responder

Projeto: ${PROJECT_NAME:-desconhecido}
Contexto: ${PROJECT_CONTEXT:-ver .sdd/memory/PROJECT.md}
Entidades: ${DOMAIN_ENTITIES:-ver .sdd/memory/DOMAIN.md}
Princípios: ${KEY_PRINCIPLES:-ver .sdd/PROJECT-CONSTITUTION.md}
Stack: ${STACK_SUMMARY:-ver .sdd/STACK.md}
${PENDING_SYNC}

Arquivos completos disponíveis em:
  .sdd/memory/PROJECT.md · .sdd/memory/DOMAIN.md · .sdd/PROJECT-CONSTITUTION.md
  .sdd/STACK.md · .sdd/PLAYBOOK.md · .sdd/memory/DECISIONS.md
EOF

exit 0
