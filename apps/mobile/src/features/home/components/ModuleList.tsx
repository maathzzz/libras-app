import type { Trail } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui';

import { completedUnits } from './homeView';
import { ModuleCard } from './ModuleCard';

type ModuleListProps = {
  trail: Trail;
  onOpenModule: (unitId: string) => void;
};

export function ModuleList({ trail, onOpenModule }: ModuleListProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="subtitle" accessibilityRole="header">
          Módulos
        </AppText>
        <AppText variant="caption">
          {`${completedUnits(trail)} de ${trail.units.length} concluídos`}
        </AppText>
      </View>
      <View style={styles.list}>
        {trail.units.map((unit, index) => (
          <ModuleCard
            key={unit.id}
            unit={unit}
            index={index}
            onPress={() => onOpenModule(unit.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  list: {
    gap: spacing.md,
  },
});
