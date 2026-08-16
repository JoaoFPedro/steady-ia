#!/usr/bin/env bash
# SDD Kit — model-advisor hook (UserPromptSubmit)
# Recomenda o modelo Claude ideal para cada comando SDD.
# Objetivo: economizar tokens usando o modelo certo para cada tipo de tarefa.
#
# Lógica de custo/benefício:
#   Comandos estratégicos (decisão, arquitetura, descoberta) → Opus 4.7 + thinking
#     Motivo: uma iteração bem pensada evita 3-4 iterações de retrabalho
#   Comandos de execução (código, TDD, sync) → Sonnet 4.6
#     Motivo: geração de código não precisa de raciocínio profundo — velocidade ganha

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('prompt',''))" 2>/dev/null || echo "")

# Nenhum comando SDD detectado: silêncio
if ! echo "$PROMPT" | grep -qE '^\s*/(init|onboard|analyze|feature|plan|spec|implement|review|sync)(\s|$)'; then
  exit 0
fi

MATCHED=$(echo "$PROMPT" | grep -oE '/(init|onboard|analyze|feature|plan|spec|implement|review|sync)' | head -1)

# ─── Mapa de comandos → modelo ideal ─────────────────────────────────────────

case "$MATCHED" in
  /init|/onboard|/analyze|/feature|/plan|/spec)
    cat <<EOF
[SDD MODEL ADVISOR] Comando ${MATCHED} detectado.

  Modelo recomendado: claude-opus-4-7 com extended thinking
  Modelo atual pode ser subótimo para esta tarefa.

  Por quê Opus + thinking aqui:
    ${MATCHED} exige raciocínio estratégico — arquitetura, domínio, decisões de design.
    Com thinking ativado, Opus resolve em 1 iteração o que Sonnet resolve em 3-4.
    Resultado: menos tokens no total, mesmo sendo mais caro por token.

  Para trocar: /model  →  selecione claude-opus-4-7
  Para ativar thinking: settings → extended thinking on

  Informe o usuário desta recomendação antes de prosseguir.
EOF
    ;;

  /implement)
    cat <<EOF
[SDD MODEL ADVISOR] Comando /implement detectado.

  Modelo recomendado: claude-sonnet-4-6 (padrão atual)
  Sonnet é ideal para geração de código TDD — velocidade e qualidade equilibradas.

  Se estiver em Opus: considere trocar para Sonnet para economizar tokens.
  /implement é execução, não estratégia — Opus não agrega aqui.

  Para trocar: /model  →  selecione claude-sonnet-4-6
EOF
    ;;

  /review|/sync)
    cat <<EOF
[SDD MODEL ADVISOR] Comando ${MATCHED} detectado.

  Modelo recomendado: claude-sonnet-4-6 (padrão atual)
  ${MATCHED} é validação/sincronização — Sonnet lida bem com análise focada.

  Se estiver em Opus: trocar para Sonnet economiza tokens sem perda de qualidade aqui.
EOF
    ;;
esac

exit 0
