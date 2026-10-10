#!/usr/bin/env bash
# isabel — retro-logger hook (Stop)
# Calcula duração do turno e sessão, detecta decisões e erros de processo,
# persiste em .sdd/metrics/sessions/YYYY-MM-DD.md.
# Exibe resumo apenas quando há eventos notáveis (decisões ou erros).

SESSION_FILE=".sdd/.session-id"
TURN_FILE=".sdd/.turn-start"
COMMANDS_FILE=".sdd/.session-commands"
PENDING_SYNC=".sdd/.pending-sync"
NOW=$(date +%s)

mkdir -p ".sdd/metrics/sessions"

# ─── Sessão ───────────────────────────────────────────────────────────────────
SESSION_ID="desconhecida"
[ -f "$SESSION_FILE" ] && SESSION_ID=$(grep "^SESSION_ID=" "$SESSION_FILE" 2>/dev/null | cut -d= -f2 || echo "desconhecida")

LOG_DATE=$(date +%Y-%m-%d)
LOG_FILE=".sdd/metrics/sessions/${LOG_DATE}.md"
TIMESTAMP=$(date "+%H:%M:%S")

# ─── Duração do turno ─────────────────────────────────────────────────────────
TURN_DURATION="?"
if [ -f "$TURN_FILE" ]; then
  START_TS=$(cat "$TURN_FILE" 2>/dev/null || echo "$NOW")
  DIFF=$((NOW - START_TS))
  if [ "$DIFF" -ge 3600 ]; then
    TURN_DURATION="$((DIFF / 3600))h $((DIFF % 3600 / 60))m"
  elif [ "$DIFF" -ge 60 ]; then
    TURN_DURATION="$((DIFF / 60))m $((DIFF % 60))s"
  else
    TURN_DURATION="${DIFF}s"
  fi
  rm -f "$TURN_FILE"
fi

# ─── Tempo total de sessão (desde a criação do SESSION_ID) ───────────────────
SESSION_ELAPSED=""
if [ "$SESSION_ID" != "desconhecida" ]; then
  SESSION_START_TS=$(python3 -c "
from datetime import datetime
import time
try:
    dt = datetime.strptime('${SESSION_ID}', '%Y%m%d-%H%M%S')
    print(int(time.mktime(dt.timetuple())))
except Exception:
    print(0)
" 2>/dev/null || echo "0")

  if [ "${SESSION_START_TS:-0}" -gt 0 ]; then
    ELAPSED=$((NOW - SESSION_START_TS))
    if [ "$ELAPSED" -ge 3600 ]; then
      SESSION_ELAPSED="$((ELAPSED / 3600))h $((ELAPSED % 3600 / 60))m total"
    elif [ "$ELAPSED" -ge 60 ]; then
      SESSION_ELAPSED="$((ELAPSED / 60))m $((ELAPSED % 60))s total"
    else
      SESSION_ELAPSED="${ELAPSED}s total"
    fi
  fi
fi

# ─── Último comando isabel da sessão ─────────────────────────────────────────────
LAST_COMMAND=""
[ -f "$COMMANDS_FILE" ] && LAST_COMMAND=$(tail -1 "$COMMANDS_FILE" 2>/dev/null)

# ─── Decisões: novos artefatos detectados via git status ─────────────────────
DECISIONS=""

if command -v git &>/dev/null && git rev-parse --git-dir &>/dev/null 2>&1; then
  # ADRs
  while IFS= read -r line; do
    file=$(echo "$line" | awk '{print $2}')
    [ -n "$file" ] && DECISIONS="${DECISIONS}\n  - ADR: ${file}"
  done < <(git status --short 2>/dev/null | grep -E "docs/adr/ADR-[0-9]+" || true)

  # Specs BDD
  while IFS= read -r line; do
    file=$(echo "$line" | awk '{print $2}')
    [ -n "$file" ] && DECISIONS="${DECISIONS}\n  - Spec: ${file}"
  done < <(git status --short 2>/dev/null | grep -E "specs/.*/spec\.bdd\.md" || true)

  # Decisions de discovery
  while IFS= read -r line; do
    file=$(echo "$line" | awk '{print $2}')
    [ -n "$file" ] && DECISIONS="${DECISIONS}\n  - Discovery: ${file}"
  done < <(git status --short 2>/dev/null | grep -E "\.discovery/.*decision\.md" || true)
fi

# ─── Erros / desvios de processo ─────────────────────────────────────────────
ERRORS=""
if [ -f "$PENDING_SYNC" ]; then
  STORY_ID=$(cat "$PENDING_SYNC" 2>/dev/null | tr -d '[:space:]')
  ERRORS="${ERRORS}\n  - process-violation: /build sem spec BDD (${STORY_ID:-story-desconhecida})"
fi

# ─── Grava entrada no log ─────────────────────────────────────────────────────
{
  # Garante cabeçalho se o log foi criado fora do session-tracker
  if [ ! -f "$LOG_FILE" ]; then
    echo "# Log de Sessões — ${LOG_DATE}"
    echo ""
    echo "## Sessão ${SESSION_ID}"
    echo ""
  fi

  echo "### Turno ${TIMESTAMP}"
  [ -n "$LAST_COMMAND" ] && echo "- **Comando**: \`${LAST_COMMAND}\`"
  echo "- **Duração**: ${TURN_DURATION}${SESSION_ELAPSED:+ | Sessão: ${SESSION_ELAPSED}}"

  if [ -n "$DECISIONS" ]; then
    echo "- **Decisões**:"
    echo -e "$DECISIONS"
  fi

  if [ -n "$ERRORS" ]; then
    echo "- **Erros**:"
    echo -e "$ERRORS"
  fi

  echo ""
} >> "$LOG_FILE"

# ─── Linha de timing — sempre visível quando há comando isabel ──────────────────
if [ -n "$LAST_COMMAND" ]; then
  TIMING="${LAST_COMMAND} → ${TURN_DURATION}${SESSION_ELAPSED:+ | sessão: ${SESSION_ELAPSED}}"
  echo ""
  echo "[isabel] ${TIMING}"
  echo ""
fi

# ─── Box de retro — apenas quando há eventos notáveis ────────────────────────
if [ -n "$DECISIONS" ] || [ -n "$ERRORS" ]; then
  echo "╔══ isabel Retro ══════════════════════════════════════════╗"
  if [ -n "$DECISIONS" ]; then
    echo "  Decisões:"
    echo -e "$DECISIONS"
  fi
  if [ -n "$ERRORS" ]; then
    echo "  Erros:"
    echo -e "$ERRORS"
  fi
  echo "  Log: ${LOG_FILE}"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo ""
fi

exit 0
