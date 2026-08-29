/**
 * Nocturne — tokens espelhados do `styles.css` do design system, em
 * `Marathon training app design/_ds/nocturne-<id>/`.
 *
 * Regra do sistema: nenhum hex, tamanho ou raio solto na UI — tudo sai daqui.
 * O accent é linha e brilho, nunca preenchimento amplo; o botão primário é contorno.
 */

export const color = {
  bg: '#161826',
  surface: '#232532',
  text: '#e9e9ed',
  accent: '#9184d9',

  // Rampas tonais (OKLCH, mesma escala perceptual de luminosidade).
  // Em fundo escuro: 700–900 para preenchimentos tingidos e bordas sutis,
  // 500 como base do papel, 100–300 para texto sobre esses tingimentos.
  neutral: {
    100: '#f3f5fe',
    200: '#e4e7f5',
    300: '#cfd3e5',
    400: '#b2b6ca',
    500: '#9397ab',
    600: '#75798c',
    700: '#595d6c',
    800: '#3f424d',
    900: '#292b31',
  },
  /**
   * Erro (ADR-017). O Nocturne nasceu sem vermelho — o accent era o único
   * sinal. Campo inválido precisa de um sinal que não se confunda com foco
   * nem com destaque, então o vermelho entra como rampa própria, restrita a
   * estado de erro. Nunca use `danger` como decoração.
   */
  danger: {
    300: '#f5a3a3',
    500: '#e05252',
    900: '#3a1f24',
  },
  accentRamp: {
    100: '#f5f4ff',
    200: '#e7e5fe',
    300: '#d2cefd',
    400: '#b5abfc',
    500: '#968ae0',
    600: '#796cbf',
    700: '#5d5294',
    800: '#423a6a',
    900: '#2b2741',
  },
} as const;

/**
 * Texto sobre o fundo escuro em opacidades nomeadas.
 * O CSS usa `color-mix(... N%, transparent)`; em RN o equivalente é rgba
 * sobre a mesma cor de texto.
 */
export const textAlpha = {
  /** Corpo secundário — o `.text-muted` do sistema. */
  muted: 'rgba(233,233,237,0.55)',
  /** Rótulos de campo. */
  label: 'rgba(233,233,237,0.70)',
  /** Apoio de card, um passo mais apagado. */
  soft: 'rgba(233,233,237,0.60)',
  /** Metadados e legendas. */
  faint: 'rgba(233,233,237,0.45)',
  /** Marcas de eixo e sufixos discretos. */
  ghost: 'rgba(233,233,237,0.32)',
  /** Divisor — o `--color-divider`. */
  divider: 'rgba(233,233,237,0.16)',
  /** Régua de linha de tabela/lista. */
  rule: 'rgba(233,233,237,0.08)',
} as const;

/** Escala de espaçamento com densidade 0.7× já embutida. */
export const space = {
  1: 2.8,
  2: 5.6,
  3: 8.4,
  4: 11.2,
  6: 16.8,
  8: 22.4,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 14,
  /** Cards de destaque no app usam o raio maior do design das telas. */
  xl: 16,
} as const;

/**
 * Elevação: em fundo escuro é uma aresta fina + escuridão ambiente,
 * nunca sombra empilhada.
 */
export const elevation = {
  sm: {
    borderWidth: 1,
    borderColor: color.neutral[800],
  },
  /** Contorno accent — a faixa que "nomeia o que mudou e por quê". */
  accentOutline: {
    borderWidth: 1,
    borderColor: color.accentRamp[700],
  },
} as const;

export const font = {
  family: 'Inter',
  /** O sistema não passa de 500 em títulos — hierarquia é tamanho e espaço. */
  headingWeight: '500',
  bodyWeight: '400',
} as const;

/** Escala de tipos observada nas telas do design. */
export const type = {
  display: 32,
  title: 27,
  section: 22,
  cardTitle: 19,
  body: 15,
  bodySm: 13.5,
  meta: 12.5,
  label: 11.5,
  kicker: 10.5,
} as const;
