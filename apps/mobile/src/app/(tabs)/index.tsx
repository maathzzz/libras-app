import { HomeScreen } from '@/features/home';
import { ProfileGreeting } from '@/features/profile';

// The greeting comes from the profile, which already depends on the home.
export default function HomeRoute() {
  return <HomeScreen greeting={<ProfileGreeting />} />;
}
