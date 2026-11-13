'use client';

import type { AdminTrail, AdminUnit } from '@libras/contracts';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { errorMessage } from '@/shared/api/errorMessage';
import { useApiData } from '@/shared/api/useApiData';
import { plural } from '@/shared/plural';
import {
  Button,
  buttonClassName,
  Card,
  ContentNotice,
  ErrorBanner,
  LoadingText,
} from '@/shared/ui';

import {
  createItem,
  deleteItem,
  getTrails,
  moved,
  renameItem,
  reorderItems,
  setVisibility,
  type OutlineList,
} from './curriculumApi';
import { AddItem } from './AddItem';
import { OutlineRow } from './OutlineRow';

// Runs one change against the BFF. The outline is always reloaded afterwards, also on
// failure: an error usually means the screen is out of date.
type Run = (change: () => Promise<unknown>) => Promise<void>;

function UnitBlock({
  unit,
  siblings,
  trailId,
  run,
}: {
  unit: AdminUnit;
  siblings: readonly string[];
  trailId: string;
  run: Run;
}) {
  const unitList: OutlineList = { level: 'unit', parentId: trailId };
  const lessonList: OutlineList = { level: 'lesson', parentId: unit.id };
  const lessonIds = unit.lessons.map((lesson) => lesson.id);

  return (
    <li className="grid gap-2 border-l-4 border-border-subtle pl-4">
      <OutlineRow
        noun="o módulo"
        title={unit.title}
        heading="h3"
        meta={plural(unit.lessons.length, 'lição', 'lições')}
        isFirst={siblings[0] === unit.id}
        isLast={siblings.at(-1) === unit.id}
        deleteWarning={
          unit.lessons.length > 0
            ? `${plural(unit.lessons.length, 'lição', 'lições')} e seus exercícios também são excluídos.`
            : undefined
        }
        visibility={{
          visible: unit.visible,
          onChange: (visible) => run(() => setVisibility('unit', unit.id, visible)),
        }}
        onRename={(title) => run(() => renameItem('unit', unit.id, title))}
        onMove={(step) => run(() => reorderItems(unitList, moved(siblings, unit.id, step)))}
        onDelete={() => run(() => deleteItem('unit', unit.id))}
      />
      {unit.lessons.length === 0 ? (
        <p className="text-[13px] text-text-muted">
          Sem lições. Um módulo sem lições não aparece no app.
        </p>
      ) : (
        <ol className="grid gap-1">
          {unit.lessons.map((lesson) => (
            <li key={lesson.id} className="rounded-sm bg-surface-subtle px-3 py-1">
              <OutlineRow
                noun="a lição"
                title={lesson.title}
                meta={
                  lesson.visible && lesson.exerciseCount === 0
                    ? 'sem exercícios: fica fora do app até ter um'
                    : plural(lesson.exerciseCount, 'exercício', 'exercícios')
                }
                extraAction={
                  <Link
                    href={`/trilhas/licoes/${encodeURIComponent(lesson.id)}`}
                    aria-label={`Exercícios de “${lesson.title}”`}
                    className={buttonClassName('secondary', 'sm')}
                  >
                    Exercícios
                  </Link>
                }
                isFirst={lessonIds[0] === lesson.id}
                isLast={lessonIds.at(-1) === lesson.id}
                deleteWarning={
                  lesson.exerciseCount > 0
                    ? `${plural(lesson.exerciseCount, 'exercício', 'exercícios')} também são excluídos.`
                    : undefined
                }
                visibility={{
                  visible: lesson.visible,
                  onChange: (visible) => run(() => setVisibility('lesson', lesson.id, visible)),
                }}
                onRename={(title) => run(() => renameItem('lesson', lesson.id, title))}
                onMove={(step) =>
                  run(() => reorderItems(lessonList, moved(lessonIds, lesson.id, step)))
                }
                onDelete={() => run(() => deleteItem('lesson', lesson.id))}
              />
            </li>
          ))}
        </ol>
      )}
      <AddItem label="Nova lição" onAdd={(title) => run(() => createItem(lessonList, title))} />
    </li>
  );
}

function TrailCard({
  trail,
  trailIds,
  shownTrailId,
  run,
}: {
  trail: AdminTrail;
  trailIds: readonly string[];
  // The app shows the first visible trail.
  shownTrailId: string | undefined;
  run: Run;
}) {
  const unitIds = trail.units.map((unit) => unit.id);
  const lessonCount = trail.units.reduce((total, unit) => total + unit.lessons.length, 0);
  const shownInApp = shownTrailId === trail.id;

  return (
    <Card className="grid gap-4">
      <OutlineRow
        noun="a trilha"
        title={trail.title}
        heading="h2"
        meta={
          <>
            {plural(trail.units.length, 'módulo', 'módulos')}
            {shownInApp && (
              <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 font-bold text-success-dark">
                exibida no app
              </span>
            )}
          </>
        }
        isFirst={trailIds[0] === trail.id}
        isLast={trailIds.at(-1) === trail.id}
        deleteWarning={
          trail.units.length > 0
            ? `${plural(trail.units.length, 'módulo', 'módulos')} e ${plural(lessonCount, 'lição', 'lições')} também são excluídos.`
            : undefined
        }
        visibility={{
          visible: trail.visible,
          onChange: (visible) => run(() => setVisibility('trail', trail.id, visible)),
        }}
        onRename={(title) => run(() => renameItem('trail', trail.id, title))}
        onMove={(step) =>
          run(() => reorderItems({ level: 'trail' }, moved(trailIds, trail.id, step)))
        }
        onDelete={() => run(() => deleteItem('trail', trail.id))}
      />
      <ol className="grid gap-4">
        {trail.units.map((unit) => (
          <UnitBlock key={unit.id} unit={unit} siblings={unitIds} trailId={trail.id} run={run} />
        ))}
      </ol>
      <AddItem
        label="Novo módulo"
        onAdd={(title) => run(() => createItem({ level: 'unit', parentId: trail.id }, title))}
      />
    </Card>
  );
}

export function TrailsPage() {
  const { state, reload } = useApiData(getTrails);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback<Run>(
    async (change) => {
      setError(null);
      try {
        await change();
      } catch (failure) {
        setError(errorMessage(failure));
      } finally {
        reload();
      }
    },
    [reload],
  );

  return (
    <>
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold">Trilhas e lições</h1>
        <p className="text-text-muted">
          O app mostra a primeira trilha. Os módulos e as lições são liberados para o aluno nesta
          ordem.
        </p>
      </div>
      <ContentNotice />
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {state.status === 'loading' && <LoadingText />}
      {state.status === 'error' && (
        <ErrorBanner
          action={
            <Button variant="secondary" size="sm" onClick={reload}>
              Tentar de novo
            </Button>
          }
        >
          {errorMessage(state.error)}
        </ErrorBanner>
      )}
      {state.status === 'ready' && (
        <>
          {state.data.length === 0 && <p className="text-text-muted">Nenhuma trilha ainda.</p>}
          {state.data.map((trail) => (
            <TrailCard
              key={trail.id}
              trail={trail}
              trailIds={state.data.map((item) => item.id)}
              shownTrailId={state.data.find((item) => item.visible)?.id}
              run={run}
            />
          ))}
          <AddItem
            label="Nova trilha"
            onAdd={(title) => run(() => createItem({ level: 'trail' }, title))}
          />
        </>
      )}
    </>
  );
}
