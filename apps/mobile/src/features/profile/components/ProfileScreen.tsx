import { AppText, Screen } from '@/shared/ui';

export function ProfileScreen() {
  return (
    <Screen>
      <AppText variant="title">Perfil</AppText>
      <AppText color="textMuted" align="center">Seus dados aparecerão aqui.</AppText>
    </Screen>
  );
}
