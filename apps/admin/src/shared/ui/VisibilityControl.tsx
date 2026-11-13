import { Button } from './Button';

// Whether learners see an item, with the button that changes it. Changes reach the app at
// once, so the label says what the click does.
export function VisibilityControl({
  visible,
  name,
  onChange,
}: {
  visible: boolean;
  // The item's title, for the accessible name of the button.
  name: string;
  onChange: (visible: boolean) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
          visible ? 'bg-success-soft text-success-dark' : 'bg-surface-subtle text-text-muted'
        }`}
      >
        {visible ? 'visível' : 'oculto'}
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`${visible ? 'Ocultar' : 'Mostrar'} “${name}” no app`}
        onClick={() => onChange(!visible)}
      >
        {visible ? 'Ocultar' : 'Mostrar'}
      </Button>
    </span>
  );
}
