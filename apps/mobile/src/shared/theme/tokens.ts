// Values extracted from the Claude Design project "Libras App v2" (docs/design/tokens.md).
// The design ships the dark Nocturne system but repaints it to a light theme at runtime,
// so these are the values the screens actually render with.

const palette = {
  white: '#FFFFFF',
  ink: '#10242E',
  inkDeep: '#06212E',

  blue: '#1C8ED6',
  blueDark: '#1672AA',
  blueSoft: '#E6F3FC',
  blueSoftEdge: '#C8E3F7',
  blueLight: '#9FD0F1',

  teal: '#14BFBA',
  tealDark: '#0F9A96',
  tealSoft: '#E4F7F6',

  green: '#58CC02',
  greenDark: '#47A302',
  greenDeep: '#2F7A00',
  greenLight: '#8AD83F',
  greenSoft: '#EEF9E0',
  greenSoftEdge: '#D7EFBA',

  red: '#E6394A',
  redDark: '#B32B39',
  redSoft: '#FDECEE',
  redSoftEdge: '#FDD9DD',

  orange: '#FF9600',
  orangeDark: '#CC7800',
  orangeSoft: '#FFF3E0',
  orangeSoftEdge: '#FFE4C2',

  slate700: '#33586A',
  slate650: '#4D6A79',
  slate600: '#5C7B8A',
  slate500: '#6B8695',
  slate300: '#D3E0E8',
  slate200: '#DFE9EF',
  slate150: '#E2ECF2',
  slate125: '#E8F0F5',
  slate100: '#EEF4F8',
  slate50: '#F1F6F9',
  sky50: '#F2F9FD',
} as const;

export const colors = {
  background: palette.sky50,
  surface: palette.white,
  surfaceSubtle: palette.slate50,
  border: palette.slate150,
  borderSubtle: palette.slate100,

  text: palette.ink,
  textBody: palette.slate700,
  textMuted: palette.slate600,
  textSubtle: palette.slate500,
  onColor: palette.white,
  // Secondary text and decoration over a colored or gradient background.
  onColorMuted: 'rgba(255, 255, 255, 0.85)',
  onColorFaint: 'rgba(255, 255, 255, 0.14)',

  // Brand accent: links, selected states, XP.
  accent: palette.blue,
  accentDark: palette.blueDark,
  accentSoft: palette.blueSoft,
  accentSoftEdge: palette.blueSoftEdge,
  accentLight: palette.blueLight,

  // Main call to action and correct answers.
  success: palette.green,
  successDark: palette.greenDark,
  // Green text on white, darker than `successDark` so small labels stay readable.
  successText: palette.greenDeep,
  successLight: palette.greenLight,
  successSoft: palette.greenSoft,
  successSoftEdge: palette.greenSoftEdge,

  danger: palette.red,
  dangerDark: palette.redDark,
  dangerSoft: palette.redSoft,
  dangerSoftEdge: palette.redSoftEdge,

  // Streak.
  warning: palette.orange,
  warningDark: palette.orangeDark,
  warningSoft: palette.orangeSoft,
  warningSoftEdge: palette.orangeSoftEdge,

  info: palette.teal,
  infoDark: palette.tealDark,
  infoSoft: palette.tealSoft,

  disabled: palette.slate100,
  disabledEdge: palette.slate200,
  disabledText: palette.slate500,
  track: palette.slate150,
  locked: palette.slate300,
  lockedSurface: palette.slate125,
  lockedText: palette.slate650,

  // Gray square shown while a sign image loads or when it is missing.
  imagePlaceholder: palette.slate150,

  overlay: 'rgba(16, 36, 46, 0.35)',
  shadow: palette.inkDeep,
} as const;

export type ColorToken = keyof typeof colors;

// The design's highlight gradient (accent → teal), drawn with `experimental_backgroundImage`.
// `highlightEdge` is the same gradient, darker, for the raised edge under it.
export const gradients = {
  highlight: `linear-gradient(135deg, ${palette.blue}, ${palette.teal})`,
  highlightEdge: `linear-gradient(135deg, ${palette.blueDark}, ${palette.tealDark})`,
} as const;

// The module map ("trilha de aventura", docs/design/trilha-modulo-spec.md): the road, the
// lesson nodes and the countryside drawn around them. Only that screen uses these.
export const trailColors = {
  skyTop: '#DCF0FB',
  meadow: '#E9F7E0',
  meadowEnd: '#E4F4D6',

  roadEdge: '#E2D2AB',
  roadBed: '#FBF4E3',
  roadDots: '#D6C398',
  roadDone: palette.green,

  currentHalo: 'rgba(28, 142, 214, 0.2)',
  currentRing: 'rgba(28, 142, 214, 0.55)',
  lockedNode: '#F4F8FA',
  lockedNodeEdge: '#C4D3DC',
  labelEdge: '#D6E6C4',
  balloonShadow: 'rgba(16, 36, 46, 0.1)',
  headerShadow: 'rgba(16, 36, 46, 0.06)',

  hill: '#D3EDB6',
  hillInner: '#C3E5A0',
  trunk: '#A8743A',
  treeTop: palette.green,
  treeShine: palette.greenLight,
  treeShadow: '#BFE09A',
  cloud: palette.white,
  lake: '#A9D8F2',
  lakeShine: '#C8E8F8',
  stone: '#D3DDE3',
  flowers: [palette.orange, palette.white, palette.teal, '#FFC23D'],
} as const;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const fontSize = {
  xxs: 10,
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 18,
  '2xl': 21,
  '3xl': 25,
  '4xl': 30,
  '5xl': 32,
  display: 58,
} as const;

export const lineHeight = {
  tight: 1.12,
  snug: 1.25,
  normal: 1.5,
} as const;

export const spacing = {
  '3xs': 2,
  '2xs': 4,
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 18,
  '4xl': 20,
  '5xl': 24,
  '6xl': 28,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  '2xl': 18,
  '3xl': 20,
  '4xl': 24,
  pill: 999,
} as const;

// The design's signature "chunky" look: a solid, unblurred shadow under the element
// that shrinks when it is pressed, so the element appears to sink.
export const depth = {
  xs: 2,
  sm: 3,
  md: 4,
  lg: 5,
  // Lesson nodes of the module map.
  xl: 6,
  pressed: 1,
} as const;

export const borderWidth = {
  hairline: 1,
} as const;

export const sizes = {
  // Minimum touch area required by the accessibility guidelines.
  minTouchTarget: 44,
  buttonLg: 54,
  buttonMd: 48,
  progressSm: 10,
  progressMd: 12,
  iconSm: 14,
  iconMd: 16,
  iconLg: 22,
  iconXl: 52,
  trailNode: 72,
  // Soft ring that highlights the current node of the trail, and the pulsing ring around it.
  trailNodeHalo: 8,
  trailNodeRingGap: 10,
  trailNodeRing: 3,
  // "Começar" balloon above the current lesson and its tail.
  trailBalloonWidth: 132,
  trailBalloonHeight: 44,
  trailBalloonTail: 14,
  // Lesson name under a node: it may be wider than the node, never wider than this.
  trailLabelMaxWidth: 150,
  // Round "medals" in the style of the trail nodes: stat tiles, achievements, home cards.
  medalSm: 40,
  medalMd: 48,
  verdictIcon: 34,
  // Lesson reward: the soft circle behind the check and the area the confetti spreads over.
  rewardBurst: 92,
  confettiAreaWidth: 240,
  confettiAreaHeight: 110,
  confettiDot: 9,
  confettiStrokeLength: 14,
  confettiStrokeWidth: 5,
  // One day of the week in the streak card.
  weekMark: 30,
  // Largest frame of a sign shown on its own, so a single picture does not fill the screen.
  signFrameMax: 200,
  // A letter or number opened from the alphabet grid.
  handSignFrame: 140,
  // Initials of the learner on the settings profile card.
  avatar: 46,
  // Picture of the learner on the profile screen and the countryside band behind it.
  profileAvatar: 104,
  profileAvatarRing: 4,
  profileBanner: 104,
  switchWidth: 46,
  switchHeight: 27,
  switchThumb: 21,
  // Icon or number box at the left of an option in a list.
  optionLeading: 40,
  // Hand shown on the welcome screen.
  welcomeHero: 224,
} as const;

export const opacity = {
  disabled: 0.45,
} as const;

export const duration = {
  press: 70,
  progress: 450,
  sheet: 250,
  // Each half of the pulse on the streak tile when the streak grows.
  pulse: 180,
  // Delay between the reward's sections as they come in.
  stagger: 120,
  toggle: 180,
  // Ring that grows out of the current lesson of the module map.
  trailRing: 1800,
  // Each half of the "Começar" balloon floating up and down.
  balloonFloat: 1100,
} as const;
