import { StreakBadge } from '@/features/streak';
import { AppText, LinkButton, Screen } from '@/shared/ui';

export function HomeScreen() {
  return (
    <Screen>
      <AppText variant="title">Início</AppText>
      <StreakBadge />
      <LinkButton href="/lesson/demo" label="Começar lição" />
      <LinkButton href="/sign-in" label="Entrar" />
    </Screen>
  );
}
