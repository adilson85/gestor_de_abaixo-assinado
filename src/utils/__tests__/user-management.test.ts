import { fetchCurrentAccess } from '../user-management';

describe('user-management', () => {
  const session = {
    access_token: 'token-123',
  } as any;
  const createMockResponse = (body: unknown, init: { status: number; headers?: Record<string, string> }) =>
    ({
      ok: init.status >= 200 && init.status < 300,
      status: init.status,
      headers: {
        get: (name: string) => init.headers?.[name] || init.headers?.[name.toLowerCase()] || null,
      },
      json: jest.fn(async () => body),
    }) as unknown as Response;

  it('calls check-admin without cache and with auth headers', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(
        {
          canAccessPanel: true,
          isAdmin: true,
          role: 'admin',
          permissions: {
            'dashboard.view': 'all',
          },
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    );

    const result = await fetchCurrentAccess(session);

    expect(result.role).toBe('admin');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toMatch(/^\/api\/admin-management\/check-admin\?ts=\d+$/);
    expect(options).toMatchObject({
      method: 'GET',
      cache: 'no-store',
    });
    expect(options.headers).toMatchObject({
      Authorization: 'Bearer token-123',
      'Cache-Control': 'no-cache, no-store, max-age=0',
      Pragma: 'no-cache',
    });
  });

  it('throws when the endpoint returns a non-json success payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse('<!doctype html><html></html>', {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      })
    );

    await expect(fetchCurrentAccess(session)).rejects.toThrow('Falha na requisição (200).');
  });
});
