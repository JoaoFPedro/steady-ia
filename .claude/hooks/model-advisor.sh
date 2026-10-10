#!/usr/bin/env bash
# isabel — model-advisor hook (UserPromptSubmit)
# Recomenda o modelo Claude ideal para cada comando isabel.
# Objetivo: economizar tokens usando o modelo certo para cada tipo de tarefa.
#
# Lógica de custo/benefício:
#   Comandos estratégicos (decisão, arquitetura, descoberta) → Opus 4.7 + thinking
#     Motivo: uma iteração bem pensada evita 3-4 iterações de retrabalho
#   Comandos de execução (código, TDD, reflect) → Sonnet 4.6
#     Motivo: geração de código não precisa de raciocínio profundo — velocidade ganha

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('prompt',''))" 2>/dev/null || echo "")

# Nenhum comando isabel detectado: silêncio
if ! echo "$PROMPT" | grep -qE '^\s*/(init|onboard|analyze|feature|plan|triage|shape|build|check|reflect|documenta-ai)(\s|$)'; then
  exit 0
fi

MATCHED=$(echo "$PROMPT" | grep -oE '/(init|onboard|analyze|feature|plan|triage|shape|build|check|reflect|documenta-ai)' | head -1)

# ─── Mapa de comandos → modelo ideal ─────────────────────────────────────────

case "$MATCHED" in
  /init|/onboard|/analyze|/feature|/plan|/triage|/shape)
    cat <<EOF
[isabel MODEL ADVISOR] Comando ${MATCHED} detectado.

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

  /build)
    cat <<EOF
[isabel MODEL ADVISOR] Comando /build detectado.

  Modelo recomendado: claude-sonnet-4-6 (padrão atual)
  Sonnet é ideal para geração de código TDD — velocidade e qualidade equilibradas.

  Se estiver em Opus: considere trocar para Sonnet para economizar tokens.
  /build é execução, não estratégia — Opus não agrega aqui.

  Para trocar: /model  →  selecione claude-sonnet-4-6
EOF
    ;;

  /check|/reflect)
    cat <<EOF
[isabel MODEL ADVISOR] Comando ${MATCHED} detectado.

  Modelo recomendado: claude-sonnet-4-6 (padrão atual)
  ${MATCHED} é validação/sincronização — Sonnet lida bem com análise focada.

  Se estiver em Opus: trocar para Sonnet economiza tokens sem perda de qualidade aqui.
EOF
    ;;

  /documenta-ai)
    cat <<EOF
[isabel MODEL ADVISOR] Comando /documenta-ai detectado.

  Modelo recomendado: claude-sonnet-4-6
  Documentar é leitura extensiva de muitos arquivos e escrita estruturada — volume, não estratégia.

  Exceção: a análise de débito técnico (TechnicalDebtsDocs) se beneficia de Opus quando
  a área é crítica e as user stories geradas vão para o backlog real.

  Em modo --auto, prefira Sonnet: o custo cresce linearmente com o número de controllers.
EOF
    ;;
esac

exit 0
