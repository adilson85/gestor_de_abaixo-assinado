const DEFAULT_PUBLIC_SITE_URL = 'https://assinapovo.com.br';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const getPublicSiteBaseUrl = () =>
  trimTrailingSlash(import.meta.env.VITE_PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL);

export const getPublicPetitionUrl = (slug: string) =>
  `${getPublicSiteBaseUrl()}/${encodeURIComponent(slug)}`;
