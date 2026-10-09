import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';

import { fontFamily } from './tokens';

// Each weight is its own family because Android does not synthesize weights for
// fonts loaded at runtime; text styles pick the family instead of setting fontWeight.
const fontSources = {
  [fontFamily.regular]: Inter_400Regular,
  [fontFamily.medium]: Inter_500Medium,
  [fontFamily.semibold]: Inter_600SemiBold,
  [fontFamily.bold]: Inter_700Bold,
};

export function useAppFonts() {
  return useFonts(fontSources);
}
