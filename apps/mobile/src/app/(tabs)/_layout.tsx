import { Tabs } from 'expo-router';

import { colors } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui';

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return <Icon name={name} size="lg" color={focused ? 'accent' : 'textSubtle'} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSubtle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trilhas',
          tabBarIcon: ({ focused }) => <TabIcon name="trail" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: 'Estudar',
          tabBarIcon: ({ focused }) => <TabIcon name="study" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="alphabet"
        options={{
          title: 'Alfabeto',
          tabBarIcon: ({ focused }) => <TabIcon name="alphabet" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
