import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  Clock3,
  FileText,
  Globe2,
  Megaphone,
  MessageCircleMore,
  Plus,
  Radio,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  getNotSentMessagesCount,
  getPetitions,
  getSentMessagesCount,
  getSignatureCount,
  getTotalSignatureCount,
} from '../utils/supabase-storage';
import { getPublicPetitionUrl } from '../utils/public-url';
import { Petition } from '../types';

const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

const getAvailabilityBadge = (petition: Petition) =>
  petition.availableOnline
    ? {
        label: 'Página pública ativa',
        className:
          'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200',
      }
    : {
        label: 'Somente painel',
        className:
          'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
      };

export const Dashboard: React.FC = () => {
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [signatureCounts, setSignatureCounts] = useState<Record<string, number>>({});
  const [totalSignatures, setTotalSignatures] = useState(0);
  const [sentMessages, setSentMessages] = useState(0);
  const [notSentMessages, setNotSentMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);

        const [
          allPetitions,
          totalSignaturesCount,
          sentMessagesCount,
          notSentMessagesCount,
        ] = await Promise.all([
          getPetitions(),
          getTotalSignatureCount(),
          getSentMessagesCount(),
          getNotSentMessagesCount(),
        ]);

        const countsEntries = await Promise.all(
          allPetitions.map(async (petition) => {
            try {
              const count = await getSignatureCount(petition.id);
              return [petition.id, count] as const;
            } catch (countError) {
              console.error(`Error loading signature count for petition ${petition.id}:`, countError);
              return [petition.id, 0] as const;
            }
          })
        );

        setPetitions(allPetitions);
        setSignatureCounts(Object.fromEntries(countsEntries));
        setTotalSignatures(totalSignaturesCount);
        setSentMessages(sentMessagesCount);
        setNotSentMessages(notSentMessagesCount);
      } catch (loadError) {
        console.error('Error loading dashboard data:', loadError);
        setError('Não foi possível carregar a visão da operação. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/20">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
          <Megaphone size={26} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Falha ao carregar o painel</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const publicCampaigns = petitions.filter((petition) => petition.availableOnline).length;
  const internalCampaigns = petitions.length - publicCampaigns;
  const petitionsWithoutResponsible = petitions.filter((petition) => !petition.responsible).length;
  const petitionsWithoutImage = petitions.filter((petition) => !petition.imageUrl).length;

  const topPetitions = [...petitions]
    .sort((a, b) => {
      const countDifference = (signatureCounts[b.id] || 0) - (signatureCounts[a.id] || 0);
      if (countDifference !== 0) return countDifference;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })
    .slice(0, 3);

  const latestPetitions = [...petitions]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4);

  const attentionItems = [
    {
      title: 'Campanhas sem página pública',
      value: internalCampaigns,
      hint: 'Ative a assinatura online nas campanhas prontas para divulgar.',
      tone: 'amber',
      href: '/petitions',
      cta: 'Revisar campanhas',
    },
    {
      title: 'Mensagens pendentes',
      value: notSentMessages,
      hint: 'Existem contatos aguardando follow-up na operação.',
      tone: 'rose',
      href: '/petitions',
      cta: 'Abrir operação',
    },
    {
      title: 'Campanhas sem responsável',
      value: petitionsWithoutResponsible,
      hint: 'Defina responsáveis para manter a execução organizada.',
      tone: 'blue',
      href: '/petitions',
      cta: 'Completar dados',
    },
  ].filter((item) => item.value > 0);

  const metricCards = [
    {
      label: 'Campanhas cadastradas',
      value: petitions.length,
      description: 'Base total operada no painel',
      icon: FileText,
      tone:
        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200',
    },
    {
      label: 'Páginas públicas ativas',
      value: publicCampaigns,
      description: 'Mobilizações prontas para captar apoio online',
      icon: Globe2,
      tone:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200',
    },
    {
      label: 'Apoios registrados',
      value: totalSignatures,
      description: 'Assinaturas coletadas em todas as campanhas',
      icon: Users,
      tone:
        'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200',
    },
    {
      label: 'Follow-up pendente',
      value: notSentMessages,
      description: `${formatNumber(sentMessages)} mensagens já marcadas como enviadas`,
      icon: MessageCircleMore,
      tone:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            Operação AssinaPovo
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Visão da mobilização em um só lugar
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Acompanhe campanhas, disponibilidade pública, volume de apoios e a fila de relacionamento sem sair do painel.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/petitions"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/30 dark:hover:text-blue-200"
          >
            Ver campanhas
            <ArrowUpRight size={16} />
          </Link>
          <Link
            to="/petitions/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={16} />
            Nova campanha
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr,1fr]">
        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-slate-50 p-8 shadow-sm dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-white dark:shadow-xl dark:shadow-slate-950/20">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
              Painel principal
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              <Radio size={12} />
              {formatNumber(publicCampaigns)} campanhas em captação pública
            </span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr,0.9fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Sua operação já movimentou {formatNumber(totalSignatures)} apoios.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Use o painel para decidir o que publicar, onde reforçar o contato com apoiadores e quais campanhas precisam de responsável ou capa antes de ganhar escala.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-700 dark:text-slate-200">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                  {formatNumber(sentMessages)} contatos já receberam retorno
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                  {formatNumber(petitionsWithoutImage)} campanhas ainda sem capa
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                  {formatNumber(internalCampaigns)} campanhas seguem apenas no painel
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Campanhas totais</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{formatNumber(petitions.length)}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Base completa da operação</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Captação online</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{formatNumber(publicCampaigns)}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Páginas prontas para divulgar</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Pendências</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{formatNumber(notSentMessages)}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Contatos aguardando resposta</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">O que merece atenção agora</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Pendências que impactam publicação e operação.
              </p>
            </div>
          </div>

          {attentionItems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Painel em ordem.</p>
              <p className="mt-2 text-sm leading-6 text-emerald-700 dark:text-emerald-100/80">
                Não encontramos gargalos críticos nas campanhas cadastradas neste momento.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {attentionItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/80"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.hint}</p>
                    </div>
                    <span
                      className={`inline-flex min-w-[52px] items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${
                        item.tone === 'amber'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200'
                          : item.tone === 'rose'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200'
                      }`}
                    >
                      {formatNumber(item.value)}
                    </span>
                  </div>

                  <Link
                    to={item.href}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300"
                  >
                    {item.cta}
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {formatNumber(card.value)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{card.description}</p>
              </div>
              <div className={`rounded-2xl border p-3 ${card.tone}`}>
                <card.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {petitions.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
            <Megaphone size={28} />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-950 dark:text-white">Nenhuma campanha criada ainda</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Comece pela primeira mobilização para liberar o fluxo completo do AssinaPovo: cadastro, página pública, coleta de apoios e acompanhamento.
          </p>
          <Link
            to="/petitions/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={16} />
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Campanhas que puxam a mobilização</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Priorize divulgação, atualizações e relacionamento onde o apoio já está respondendo.
                </p>
              </div>
              <Link
                to="/petitions"
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300"
              >
                Ver operação completa
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {topPetitions.map((petition) => {
                const availability = getAvailabilityBadge(petition);
                const supportCount = signatureCounts[petition.id] || 0;

                return (
                  <article
                    key={petition.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    {petition.imageUrl ? (
                      <img
                        src={petition.imageUrl}
                        alt={petition.name}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-end bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-500 p-5 text-white">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">Campanha AssinaPovo</p>
                          <p className="mt-2 text-lg font-semibold leading-tight">{petition.name}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${availability.className}`}>
                          {availability.label}
                        </span>
                        {petition.location ? (
                          <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {petition.location}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <Link
                          to={`/petitions/${petition.id}`}
                          className="text-lg font-semibold leading-snug text-slate-950 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                        >
                          {petition.name}
                        </Link>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {petition.description?.trim()
                            ? petition.description.slice(0, 120) + (petition.description.length > 120 ? '...' : '')
                            : 'Campanha pronta para ampliar a visibilidade e converter apoio em mobilização organizada.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/90">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Apoios</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                            {formatNumber(supportCount)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/90">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Criada em</p>
                          <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                            {formatDate(petition.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/petitions/${petition.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          Abrir campanha
                          <ArrowUpRight size={15} />
                        </Link>
                        {petition.availableOnline ? (
                          <a
                            href={getPublicPetitionUrl(petition.slug)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500/30 dark:hover:text-blue-300"
                          >
                            Ver página pública
                            <ArrowUpRight size={15} />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Clock3 size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Ultimas movimentacoes</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Campanhas mais recentes cadastradas no painel.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {latestPetitions.map((petition) => {
                const availability = getAvailabilityBadge(petition);
                const supportCount = signatureCounts[petition.id] || 0;

                return (
                  <div
                    key={petition.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          to={`/petitions/${petition.id}`}
                          className="line-clamp-2 text-base font-semibold text-slate-950 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                        >
                          {petition.name}
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className={`inline-flex rounded-full px-3 py-1 font-semibold ${availability.className}`}>
                            {availability.label}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} />
                            {formatDate(petition.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Apoios</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                          {formatNumber(supportCount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                  {petition.responsible ? `Responsável: ${petition.responsible}` : 'Responsável ainda não definido'}
                      </p>
                      <Link
                        to={`/petitions/${petition.id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300"
                      >
                        Abrir
                        <ArrowUpRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
