import type { TextStyle } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight } from './tokens';

// React Native has no `em`, so the design's letter-spacing (in em) is converted to points
// against each style's own font size.
const em = (size: number, value: number) => Math.round(size * value * 100) / 100;

const style = (
  family: keyof typeof fontFamily,
  size: number,
  extra: Omit<TextStyle, 'fontFamily' | 'fontSize'> = {},
): TextStyle => ({ fontFamily: fontFamily[family], fontSize: size, color: colors.text, ...extra });

export const textStyles = {
  display: style('bold', fontSize.display, {
    letterSpacing: em(fontSize.display, -0.03),
    lineHeight: fontSize.display * 1.05,
  }),
  hero: style('bold', fontSize['5xl'], {
    letterSpacing: em(fontSize['5xl'], -0.025),
    lineHeight: fontSize['5xl'] * lineHeight.tight,
  }),
  title: style('bold', fontSize['3xl'], {
    letterSpacing: em(fontSize['3xl'], -0.02),
    lineHeight: fontSize['3xl'] * lineHeight.snug,
  }),
  heading: style('bold', fontSize['2xl'], { lineHeight: fontSize['2xl'] * lineHeight.snug }),
  subtitle: style('bold', fontSize.lg, { lineHeight: fontSize.lg * lineHeight.snug }),
  body: style('regular', fontSize.base, {
    color: colors.textBody,
    lineHeight: fontSize.base * lineHeight.normal,
  }),
  bodyStrong: style('bold', fontSize.md, { lineHeight: fontSize.md * lineHeight.normal }),
  caption: style('regular', fontSize.sm, {
    color: colors.textMuted,
    lineHeight: fontSize.sm * lineHeight.normal,
  }),
  kicker: style('bold', fontSize.xs, {
    color: colors.textSubtle,
    letterSpacing: em(fontSize.xs, 0.1),
    textTransform: 'uppercase',
  }),
  button: style('bold', fontSize.lg, {
    letterSpacing: em(fontSize.lg, 0.08),
    textTransform: 'uppercase',
  }),
  buttonSmall: style('bold', fontSize.md, {
    letterSpacing: em(fontSize.md, 0.08),
    textTransform: 'uppercase',
  }),
  link: style('semibold', fontSize.md, { color: colors.textSubtle }),
  pill: style('bold', fontSize.md),
  tab: style('bold', fontSize.xs),
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textStyles;
