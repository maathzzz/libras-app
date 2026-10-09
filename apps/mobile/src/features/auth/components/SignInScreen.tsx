import { AppText, LinkButton, Screen } from '@/shared/ui';

export function SignInScreen() {
  return (
    <Screen>
      <AppText variant="title">Entrar</AppText>
      <AppText color="textMuted" align="center">Em breve você poderá entrar com sua conta.</AppText>
      <LinkButton href="/" label="Ir para o início" replace />
    </Screen>
  );
}
