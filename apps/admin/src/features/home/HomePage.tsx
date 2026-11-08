'use client';

import { useAdmin } from '@/features/auth/AdminGate';
import { Card } from '@/shared/ui';

export function HomePage() {
  const admin = useAdmin();

  return (
    <>
      <h1 className="text-2xl font-bold">{`Olá, ${admin.name}`}</h1>
      <Card className="grid gap-3">
        <h2 className="text-lg font-bold">Bem-vindo ao CMS</h2>
        <p className="text-text-muted">
          Aqui você vai criar trilhas, módulos, lições, exercícios, sinais e estudos. As alterações
          ficam em rascunho até alguém publicar; só então chegam aos alunos.
        </p>
        <p className="text-text-muted">As seções do menu serão liberadas nas próximas etapas.</p>
      </Card>
    </>
  );
}
