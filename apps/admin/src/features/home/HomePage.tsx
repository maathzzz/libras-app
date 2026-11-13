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
          Aqui você cria trilhas, módulos, lições, exercícios, sinais e estudos. O que você cria
          nasce oculto: monte tudo e, quando estiver pronto, mostre no app. Depois disso, cada
          alteração chega aos alunos na hora.
        </p>
      </Card>
    </>
  );
}
