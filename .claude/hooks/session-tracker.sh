#!/usr/bin/env bash
# isabel — session-tracker hook (UserPromptSubmit)
# Registra início de sessão e turno. Silencioso — não emite output para o Claude.

SESSION_FILE=".sdd/.session-id"
TURN_FILE=".sdd/.turn-start"
COMMANDS_FILE=".sdd/.session-commands"
SESSION_TIMEOUT=1800  # 30 minutos sem atividade = nova sessão
NOW=$(date +%s)

# ─── Lê e descarta stdin (necessário no pipeline de hooks) ───────────────────
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('prompt',''))" 2>/dev/null || echo "")

mkdir -p ".sdd/metrics/sessions"

# ─── Gerencia sessão (timeout-based) ─────────────────────────────────────────
SESSION_ID=""
if [ -f "$SESSION_FILE" ]; then
  SESSION_ID=$(grep "^SESSION_ID=" "$SESSION_FILE" 2>/dev/null | cut -d= -f2)
  LAST_ACTIVE=$(grep "^LAST_ACTIVE=" "$SESSION_FILE" 2>/dev/null | cut -d= -f2)
  AGE=$((NOW - ${LAST_ACTIVE:-0}))
  if [ "$AGE" -gt "$SESSION_TIMEOUT" ]; then
    SESSION_ID=""  # sessão expirou — abre nova
  fi
fi

if [ -z "$SESSION_ID" ]; then
  SESSION_ID=$(date +%Y%m%d-%H%M%S)
  rm -f "$COMMANDS_FILE"

  # Abre cabeçalho da nova sessão no log diário
  LOG_DATE=$(date +%Y-%m-%d)
  LOG_FILE=".sdd/metrics/sessions/${LOG_DATE}.md"
  {
    if [ ! -f "$LOG_FILE" ]; then
      echo "# Log de Sessões — ${LOG_DATE}"
      echo ""
    fi
    echo "## Sessão ${SESSION_ID}"
    echo ""
  } >> "$LOG_FILE"
fi

# Persiste estado da sessão
printf "SESSION_ID=%s\nLAST_ACTIVE=%s\n" "$SESSION_ID" "$NOW" > "$SESSION_FILE"

# Registra epoch de início do turno
echo "$NOW" > "$TURN_FILE"

# ─── Detecta e registra comando isabel ──────────────────────────────────────────
for cmd in init onboard triage shape plan analyze build check reflect feature; do
  if echo "$PROMPT" | grep -qE "^\s*/${cmd}(\s|$)"; then
    echo "/$cmd" >> "$COMMANDS_FILE"
    break
  fi
done

exit 0
