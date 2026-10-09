import { router, type Href } from 'expo-router';

import { Button, type ButtonVariant } from './Button';

type LinkButtonProps = {
  href: Href;
  label: string;
  replace?: boolean;
  variant?: ButtonVariant;
};

export function LinkButton({ href, label, replace = false, variant = 'primary' }: LinkButtonProps) {
  const navigate = () => (replace ? router.replace(href) : router.push(href));

  return <Button label={label} variant={variant} onPress={navigate} />;
}
