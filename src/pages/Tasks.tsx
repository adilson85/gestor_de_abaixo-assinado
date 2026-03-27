import React from 'react';
import { KanbanBoardComponent } from '../components/KanbanBoard';

export const Tasks: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            Operação Kanban
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Coordene a execução das campanhas
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Use o quadro para acompanhar prazos, distribuir responsabilidades e manter cada mobilização avançando com clareza.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Fluxo visível</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Entenda em qual etapa cada campanha está e o que precisa acontecer em seguida.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Ação rápida</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Arraste tarefas entre colunas, refine prioridades e mantenha a operação atualizada no mesmo lugar.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Menos ruído</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Filtros e arquivados ajudam a focar no que está em andamento sem perder histórico.
          </p>
        </div>
      </div>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <KanbanBoardComponent />
      </section>
    </div>
  );
};
