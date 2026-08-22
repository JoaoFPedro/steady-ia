#!/usr/bin/env bash
#
# Sobe o ambiente local do Steady: banco, API e dev server do Expo.
#
# Os três processos vivem numa sessão tmux chamada `steady` — assim `steady-up`
# devolve o terminal e os logs continuam acessíveis (`steady-logs`). O que este
# script automatiza é exatamente o roteiro do CLAUDE.md, com as verificações que
# lá aparecem como "pré-requisitos que quebram silenciosamente".
#
# Uso:
#   scripts/dev.sh          sobe tudo e devolve o terminal
#   scripts/dev.sh --attach sobe tudo e entra na sessão tmux
#   scripts/dev.sh --stop   derruba API e Expo (o banco continua de pé)
#
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$REPO/src/steady-app"
SESSION=steady
DB_CONTAINER=steady-db
DOTNET_EF="$HOME/.dotnet/tools/dotnet-ef"

# Cores só quando há terminal do outro lado.
if [ -t 1 ]; then B=$'\e[1m'; G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; N=$'\e[0m'
else B=; G=; Y=; R=; N=; fi
passo() { printf '%s==>%s %s\n' "$B" "$N" "$1"; }
ok()    { printf '  %s✓%s %s\n' "$G" "$N" "$1"; }
aviso() { printf '  %s!%s %s\n' "$Y" "$N" "$1"; }
erro()  { printf '  %s✗%s %s\n' "$R" "$N" "$1" >&2; }

# --- parar --------------------------------------------------------------------
if [ "${1:-}" = "--stop" ]; then
  tmux kill-session -t "$SESSION" 2>/dev/null && ok "sessão tmux encerrada" \
    || aviso "nenhuma sessão '$SESSION' em execução"
  echo "  o banco ($DB_CONTAINER) continua de pé — 'docker stop $DB_CONTAINER' para derrubar"
  exit 0
fi

# --- 0. pré-requisitos --------------------------------------------------------
[ -f "$APP/.env" ] || { erro "falta $APP/.env — veja docs/SETUP-LOGIN-GOOGLE.md"; exit 1; }
[ -f "$REPO/src/Steady.Api/Properties/launchSettings.json" ] || {
  erro "falta src/Steady.Api/Properties/launchSettings.json"
  echo "     copie de launchSettings.example.json e preencha o Client ID (ADR-002)" >&2
  exit 1
}

# O IP que o celular alcança sai do .env do app — uma fonte só, e a mesma que o
# app usa para falar com a API. Em WSL/NAT o `hostname -I` devolve o IP interno,
# que o aparelho não enxerga (CLAUDE.md).
HOST_IP="$(sed -n 's|^EXPO_PUBLIC_API_URL=http://\([^:]*\).*|\1|p' "$APP/.env")"
[ -n "$HOST_IP" ] || { erro "não consegui ler EXPO_PUBLIC_API_URL do .env"; exit 1; }

# Client ID da API e do app precisam bater, senão todo login vira 401 (ADR-002).
APP_CLIENT_ID="$(sed -n 's/^EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=//p' "$APP/.env")"
API_CLIENT_ID="$(sed -n 's/.*"Google__ClientId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
  "$REPO/src/Steady.Api/Properties/launchSettings.json" | head -1)"
if [ "$APP_CLIENT_ID" != "$API_CLIENT_ID" ]; then
  erro "Client ID do app e da API divergem — todo login viraria 401 (ADR-002)"
  echo "     app: $APP_CLIENT_ID" >&2
  echo "     api: $API_CLIENT_ID" >&2
  exit 1
fi

# --- 1. banco -----------------------------------------------------------------
passo "Banco (Postgres em container)"
if [ -z "$(docker ps -q -f "name=^${DB_CONTAINER}$")" ]; then
  if [ -n "$(docker ps -aq -f "name=^${DB_CONTAINER}$")" ]; then
    docker start "$DB_CONTAINER" >/dev/null
    ok "container existente reiniciado"
  else
    docker run -d --name "$DB_CONTAINER" \
      -e POSTGRES_DB=steady -e POSTGRES_USER=steady -e POSTGRES_PASSWORD=steady \
      -p 5432:5432 -v steady-pgdata:/var/lib/postgresql/data postgres:16-alpine >/dev/null
    ok "container criado"
  fi
else
  ok "já estava de pé"
fi

# Postgres aceita conexão alguns segundos depois do container subir; sem esperar,
# a migration falha por corrida e não por configuração.
printf '  aguardando o banco aceitar conexão'
for _ in $(seq 30); do
  docker exec "$DB_CONTAINER" pg_isready -U steady -d steady >/dev/null 2>&1 && break
  printf '.'; sleep 1
done
echo
docker exec "$DB_CONTAINER" pg_isready -U steady -d steady >/dev/null 2>&1 \
  || { erro "banco não respondeu em 30s"; exit 1; }
ok "pronto para conexão"

# --- 2. migrations ------------------------------------------------------------
# O dotnet-ef não lê o launchSettings.json: as variáveis vão inline (CLAUDE.md).
passo "Migrations"
if [ -x "$DOTNET_EF" ]; then
  if Google__ClientId="$API_CLIENT_ID" \
     ConnectionStrings__SteadyDb="Host=localhost;Port=5432;Database=steady;Username=steady;Password=steady" \
     "$DOTNET_EF" database update \
       --project "$REPO/src/Steady.Infrastructure" \
       --startup-project "$REPO/src/Steady.Api" >/tmp/steady-ef.log 2>&1; then
    ok "schema em dia"
  else
    erro "falha ao aplicar migrations — log em /tmp/steady-ef.log"
    tail -5 /tmp/steady-ef.log >&2
    exit 1
  fi
else
  aviso "dotnet-ef não encontrado em $DOTNET_EF — pulando"
fi

# --- 3. API + dev server ------------------------------------------------------
passo "API e dev server (sessão tmux '$SESSION')"
tmux kill-session -t "$SESSION" 2>/dev/null || true
tmux new-session  -d -s "$SESSION" -n api -c "$REPO" \
  "dotnet run --project src/Steady.Api"
tmux new-window   -t "$SESSION" -n app -c "$APP" \
  "REACT_NATIVE_PACKAGER_HOSTNAME=$HOST_IP npx expo start --clear"
ok "processos iniciados"

espera_porta() { # $1=url $2=rótulo
  for _ in $(seq 45); do
    curl -sf -m 2 "$1" >/dev/null 2>&1 && return 0
    tmux has-session -t "$SESSION" 2>/dev/null || return 1
    sleep 1
  done
  return 1
}

printf '  aguardando a API responder'
if espera_porta "http://localhost:5050/health" api; then
  echo; ok "API   http://$HOST_IP:5050/health → $(curl -s -m 2 http://localhost:5050/health)"
else
  echo; erro "API não subiu — 'tmux attach -t $SESSION' para ver o log"; exit 1
fi

printf '  aguardando o Metro responder'
if espera_porta "http://localhost:8081/status" metro; then
  echo; ok "Metro http://$HOST_IP:8081"
else
  echo; erro "Metro não subiu — 'tmux attach -t $SESSION' para ver o log"; exit 1
fi

cat <<EOF

  ${B}No celular${N}, na tela "Development build": Enter URL manually
      ${B}http://$HOST_IP:8081${N}
  Não use o QR code — ele aponta para o IP interno do WSL.

  logs:   steady-logs      (ou tmux attach -t $SESSION; Ctrl-b d para sair)
  parar:  steady-down
EOF

[ "${1:-}" = "--attach" ] && exec tmux attach -t "$SESSION"
exit 0
