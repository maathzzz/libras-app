import { useAdmin } from '@/features/auth/AdminGate';

export function HomePage() {
  const admin = useAdmin();

  return (
    <>
      <h1>{`Olá, ${admin.name}`}</h1>
      <section className="card">
        <h2>Bem-vindo ao CMS</h2>
        <p className="muted">
          Aqui você vai criar trilhas, módulos, lições, exercícios, sinais e estudos. As alterações
          ficam em rascunho até alguém publicar; só então chegam aos alunos.
        </p>
        <p className="muted">As seções do menu serão liberadas nas próximas etapas.</p>
      </section>
    </>
  );
}
