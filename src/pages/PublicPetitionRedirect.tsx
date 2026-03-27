import React, { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getPublicPetitionUrl, getPublicSiteBaseUrl } from '../utils/public-url';

export const PublicPetitionRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();

  const targetUrl = slug
    ? `${getPublicPetitionUrl(slug)}${location.search}${location.hash}`
    : getPublicSiteBaseUrl();

  useEffect(() => {
    window.location.replace(targetUrl);
  }, [targetUrl]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-24">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          URL publica canonica
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Redirecionando para a peticao publica
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Este link agora e servido pelo site principal do AssinaPovo.
        </p>
        <a
          href={targetUrl}
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Abrir pagina publica
        </a>
      </div>
    </div>
  );
};
