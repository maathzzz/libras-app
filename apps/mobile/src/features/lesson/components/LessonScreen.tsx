import { AppText, LinkButton, Screen } from '@/shared/ui';

type LessonScreenProps = {
  lessonId: string;
};

export function LessonScreen({ lessonId }: LessonScreenProps) {
  return (
    <Screen>
      <AppText variant="title">Lição</AppText>
      <AppText color="textMuted" align="center">{`Lição: ${lessonId}`}</AppText>
      <LinkButton href="/" label="Voltar ao início" replace />
    </Screen>
  );
}
