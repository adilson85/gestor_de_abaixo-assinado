import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  ExternalLink,
  FileText,
  FilterX,
  Globe2,
  Megaphone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { deletePetition, getPetitions, getSignatureCount } from '../utils/supabase-storage';
import { getPublicPetitionUrl } from '../utils/public-url';
import { Petition } from '../types';
import { useAuth } from '../contexts/AuthContext';

type StatusFilter = 'all' | 'public' | 'internal';

const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

const isFeaturedByGoal = (petition: Petition, supportCount: number) => {
  if (petition.signatureGoal && petition.signatureGoal > 0) {
    return supportCount >= petition.signatureGoal;
  }

  return supportCount >= 500;
};

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

export const PetitionList: React.FC = () => {
  const { can } = useAuth();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [signatureCounts, setSignatureCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [petitionToDelete, setPetitionToDelete] = useState<Petition | null>(null);
  const itemsPerPage = 8;
  const canCreatePetitions = can('petitions.create', 'any');
  const canDeletePetitions = can('petitions.delete', 'any');

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);

        const allPetitions = await getPetitions();
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
      } catch (loadError) {
        console.error('Error loading petitions:', loadError);
        setError('Erro ao carregar campanhas. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const uniqueLocations = Array.from(
    new Set(
      petitions
        .map((petition) => petition.location)
        .filter((location): location is string => Boolean(location))
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const filteredPetitions = petitions.filter((petition) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      term.length === 0 ||
      petition.name.toLowerCase().includes(term) ||
      petition.slug.toLowerCase().includes(term) ||
      (petition.description && petition.description.toLowerCase().includes(term)) ||
      (petition.responsible && petition.responsible.toLowerCase().includes(term)) ||
      (petition.location && petition.location.toLowerCase().includes(term));

    const matchesLocation =
      !locationFilter || (petition.location && petition.location.toLowerCase() === locationFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'public' && petition.availableOnline) ||
      (statusFilter === 'internal' && !petition.availableOnline);

    return Boolean(matchesSearch && matchesLocation && matchesStatus);
  });

  const totalPages = Math.max(1, Math.ceil(filteredPetitions.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPetitions = filteredPetitions.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalSignatures = Object.values(signatureCounts).reduce((sum, count) => sum + count, 0);
  const publicCampaigns = petitions.filter((petition) => petition.availableOnline).length;
  const internalCampaigns = petitions.length - publicCampaigns;
  const withImageCampaigns = petitions.filter((petition) => petition.imageUrl).length;
  const hasActiveFilters = searchTerm.length > 0 || locationFilter.length > 0 || statusFilter !== 'all';

  const handleDeletePetition = async () => {
    if (!petitionToDelete) return;

    setDeletingId(petitionToDelete.id);

    try {
      const success = await deletePetition(petitionToDelete.id);

      if (success) {
        setPetitions((prev) => prev.filter((petition) => petition.id !== petitionToDelete.id));
        setSignatureCounts((prev) => {
          const nextCounts = { ...prev };
          delete nextCounts[petitionToDelete.id];
          return nextCounts;
        });
        setPetitionToDelete(null);
      } else {
        alert('Erro ao excluir a campanha. Tente novamente.');
      }
    } catch (deleteError) {
      console.error('Error deleting petition:', deleteError);
      alert('Erro ao excluir a campanha. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  };

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
          <AlertTriangle size={26} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Falha ao carregar campanhas</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Recarregar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 dark:text-gray-100">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
              Campanhas AssinaPovo
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Gerencie a operação das campanhas
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Acompanhe o que já está público, o que ainda depende de ajuste e quais mobilizações concentram mais apoios.
            </p>
          </div>

          {canCreatePetitions ? (
            <Link
              to="/petitions/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={16} />
              Nova campanha
            </Link>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Campanhas no painel</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {formatNumber(petitions.length)}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Base total sob gestao</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                <FileText size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Páginas públicas ativas</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {formatNumber(publicCampaigns)}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Prontas para captar apoio online</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                <Globe2 size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Apoios registrados</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {formatNumber(totalSignatures)}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Assinaturas somadas na operação</p>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
                <Users size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Campanhas com capa</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {formatNumber(withImageCampaigns)}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {formatNumber(internalCampaigns)} ainda estão somente no painel
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                <Megaphone size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Filtre e revise a operação</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Busque por nome, slug, responsável ou local e encontre rapidamente o que precisa publicar, ajustar ou excluir.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {formatNumber(filteredPetitions.length)} campanha{filteredPetitions.length === 1 ? '' : 's'} encontrada{filteredPetitions.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr,0.6fr,0.6fr,auto]">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por nome, slug, descrição, responsável ou local..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400"
              />
            </div>

            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
            >
              <option value="">Todos os locais</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
            >
              <option value="all">Todos os status</option>
              <option value="public">Página pública ativa</option>
              <option value="internal">Somente painel</option>
            </select>

            {hasActiveFilters ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/30 dark:hover:text-blue-300"
              >
                <FilterX size={16} />
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>

        {paginatedPetitions.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Search size={28} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-950 dark:text-white">
              {petitions.length === 0 ? 'Nenhuma campanha cadastrada' : 'Nenhuma campanha corresponde aos filtros'}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {petitions.length === 0
                ? 'Crie a primeira campanha para habilitar a operação completa do AssinaPovo no painel.'
                : 'Ajuste busca, local ou status para encontrar as campanhas certas.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {petitions.length === 0 && canCreatePetitions ? (
                <Link
                  to="/petitions/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Criar primeira campanha
                </Link>
              ) : hasActiveFilters ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('');
                    setStatusFilter('all');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <FilterX size={16} />
                  Limpar filtros
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedPetitions.map((petition) => {
              const availability = getAvailabilityBadge(petition);
              const supportCount = signatureCounts[petition.id] || 0;

              return (
                <article
                  key={petition.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/20"
                >
                  <div className="grid gap-5 xl:grid-cols-[180px,1fr,240px]">
                    <Link
                      to={`/petitions/${petition.id}`}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      {petition.imageUrl ? (
                        <img
                          src={petition.imageUrl}
                          alt={petition.name}
                          className="h-full min-h-[160px] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full min-h-[160px] items-end bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-500 p-5 text-white">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">Campanha AssinaPovo</p>
                            <p className="mt-2 text-lg font-semibold leading-tight">{petition.name}</p>
                          </div>
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${availability.className}`}>
                          {availability.label}
                        </span>
                        {isFeaturedByGoal(petition, supportCount) ? (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                            Em destaque
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <Link
                          to={`/petitions/${petition.id}`}
                          className="text-xl font-semibold leading-tight text-slate-950 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                        >
                          {petition.name}
                        </Link>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {petition.description?.trim()
                            ? petition.description.slice(0, 180) + (petition.description.length > 180 ? '...' : '')
                            : 'Campanha cadastrada no AssinaPovo pronta para organização, divulgação e acompanhamento das assinaturas.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-2">
                          <Calendar size={15} />
                          Criada em {formatDate(petition.createdAt)}
                        </span>
                        {petition.responsible ? (
                          <span className="inline-flex items-center gap-2">
                            <UserRound size={15} />
                            {petition.responsible}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-200">
                            <AlertTriangle size={15} />
                            Sem responsável definido
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Slug: {petition.slug}
                        </span>
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Tabela: {petition.tableName}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/90">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Apoios
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                            {formatNumber(supportCount)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/90">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Origem
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                            {petition.availableOnline ? 'Publica + painel' : 'Somente painel'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
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
                            <ExternalLink size={15} />
                            Ver página pública
                          </a>
                        ) : null}

                        {canDeletePetitions ? (
                          <button
                            onClick={() => setPetitionToDelete(petition)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                          >
                            <Trash2 size={15} />
                            Excluir
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredPetitions.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      {petitionToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => {
              if (!deletingId) {
                setPetitionToDelete(null);
              }
            }}
          />

          <div className="relative w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-200">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Excluir campanha</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Esta ação remove a campanha, a página pública e os apoios vinculados. Use apenas quando tiver certeza.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!deletingId) {
                    setPetitionToDelete(null);
                  }
                }}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{petitionToDelete.name}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900">
                  {formatNumber(signatureCounts[petitionToDelete.id] || 0)} apoios
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900">
                  {petitionToDelete.availableOnline ? 'Página pública ativa' : 'Somente painel'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setPetitionToDelete(null)}
                disabled={Boolean(deletingId)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePetition}
                disabled={Boolean(deletingId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Confirmar exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
