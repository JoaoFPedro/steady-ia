#!/usr/bin/env bash
# isabel — process-guard hook (UserPromptSubmit)
# Detecta /build sem spec BDD e cria marcador para forçar /reflect.
# Detecta /reflect após implementação e limpa o marcador.

R='\033[0;31m' Y='\033[1;33m' G='\033[0;32m' C='\033[0;36m' N='\033[0m' BD='\033[1m'

PENDING_SYNC_FILE=".sdd/.pending-sync"

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('prompt',''))" 2>/dev/null || echo "")

# ─── /reflect detectado: limpa marcador ──────────────────────────────────────
if echo "$PROMPT" | grep -qE '^\s*/reflect(\s|$)'; then
  if [ -f "$PENDING_SYNC_FILE" ]; then
    STORY_ID=$(cat "$PENDING_SYNC_FILE" 2>/dev/null)
    rm -f "$PENDING_SYNC_FILE"
    echo "[isabel PROCESS] /reflect detectado para ${STORY_ID:-story pendente}. Marcador removido. Prossiga normalmente."
  fi
  exit 0
fi

# ─── /check ou /feature bloqueados se /reflect pendente ──────────────────────
if echo "$PROMPT" | grep -qE '^\s*/(check|feature)(\s|$)'; then
  if [ -f "$PENDING_SYNC_FILE" ]; then
    STORY_ID=$(cat "$PENDING_SYNC_FILE" 2>/dev/null)
    MATCHED=$(echo "$PROMPT" | grep -oE '/(check|feature)')
    echo ""
    echo "[isabel PROCESS GUARD] BLOQUEIO: $MATCHED não pode ser executado agora." >&2
    echo "" >&2
    echo "  Motivo: /build foi executado sem spec BDD para ${STORY_ID:-a story atual}." >&2
    echo "  O /reflect ainda não foi executado." >&2
    echo "" >&2
    echo "  Execute agora:" >&2
    echo "    /reflect  →  gera a spec BDD a partir do código implementado" >&2
    echo "" >&2
    echo "  Somente após o /reflect o fluxo pode continuar." >&2
    echo "" >&2
    exit 2
  fi
fi

# ─── /build detectado ─────────────────────────────────────────────────────────
if echo "$PROMPT" | grep -qE '^\s*/build(\s|$)'; then

  # Extrai story-id do prompt ou da branch atual
  STORY_ID=$(echo "$PROMPT" | grep -oE '([A-Z]+-[0-9]+|STORY-[0-9]+|US-[0-9]+|ISSUE-[0-9]+)' | head -1)
  if [ -z "$STORY_ID" ]; then
    BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
    STORY_ID=$(echo "$BRANCH" | grep -oE '([A-Z]+-[0-9]+)' | head -1)
  fi

  STORY_LABEL="${STORY_ID:-story-desconhecida}"

  # Verifica se spec BDD existe e tem cenários
  SPEC_OK=false
  if [ -n "$STORY_ID" ] && [ -d "specs/$STORY_ID" ]; then
    SPEC_FILE="specs/$STORY_ID/spec.bdd.md"
    if [ -f "$SPEC_FILE" ] && grep -q "Scenario:" "$SPEC_FILE" 2>/dev/null; then
      SPEC_OK=true
    fi
  fi

  if [ "$SPEC_OK" = true ]; then
    echo "[isabel PROCESS] Spec BDD encontrada para ${STORY_LABEL}. Fluxo padrão. Prossiga com TDD."
    exit 0
  fi

  # Sem spec: fluxo Jira/Azure — cria marcador e injeta contexto para Claude
  echo "$STORY_LABEL" > "$PENDING_SYNC_FILE"

  cat <<EOF
[isabel PROCESS GUARD] /build sem spec BDD detectado para ${STORY_LABEL}.

Você está no fluxo "Jira/Azure story" (sem /shape prévio). Isso é permitido.

REGRA OBRIGATÓRIA: ao concluir a implementação, informe o usuário:
  "⚠️ Fluxo Jira/Azure detectado: execute /reflect para gerar a spec BDD a partir do código."
  "Sem /reflect, /check e /feature estarão bloqueados para esta story."

Durante o /build:
  - Use os acceptance criteria da story como base para os testes (TDD ainda se aplica)
  - Salve a story em specs/${STORY_LABEL}/story.md se ainda não existir
  - Não crie spec.bdd.md agora — isso é responsabilidade do /reflect
EOF
  exit 0
fi

exit 0
