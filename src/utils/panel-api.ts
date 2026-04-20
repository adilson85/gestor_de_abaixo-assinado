const PANEL_API_FALLBACK_ORIGIN = 'https://app.assinapovo.com.br';

const isLocalhostRuntime = () =>
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const buildApiCandidates = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const candidates = [normalizedPath];

  if (isLocalhostRuntime()) {
    candidates.push(`${PANEL_API_FALLBACK_ORIGIN}${normalizedPath}`);
  }

  return [...new Set(candidates)];
};

const shouldRetryWithFallback = (response: Response, candidateIndex: number, totalCandidates: number) =>
  candidateIndex < totalCandidates - 1 && (response.status === 404 || response.status === 405);

export const fetchPanelApi = async (path: string, init?: RequestInit): Promise<Response> => {
  const candidates = buildApiCandidates(path);
  let lastError: unknown = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];

    try {
      const response = await fetch(candidate, init);

      if (shouldRetryWithFallback(response, index, candidates.length)) {
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      if (index === candidates.length - 1) {
        break;
      }
    }
  }

  if (lastError instanceof Error) {
    if (isLocalhostRuntime()) {
      throw new Error(
        'Não foi possível conectar com as funções administrativas. No localhost, use netlify dev ou o endpoint publicado do painel.'
      );
    }

    throw lastError;
  }

  throw new Error('Não foi possível conectar com a API administrativa do painel.');
};
