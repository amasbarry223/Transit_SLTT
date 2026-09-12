import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, CSRF_COOKIE } from './cookie.config';

function fakeResponse() {
  const cookies: Record<string, { value: string; options: Record<string, unknown> }> = {};
  const cleared: Record<string, Record<string, unknown>> = {};
  return {
    cookie: vi.fn((name: string, value: string, options: Record<string, unknown>) => {
      cookies[name] = { value, options };
    }),
    clearCookie: vi.fn((name: string, options: Record<string, unknown>) => {
      cleared[name] = options;
    }),
    cookies,
    cleared,
  };
}

describe('AuthController', () => {
  let service: { [K in keyof AuthService]: ReturnType<typeof vi.fn> };
  let controller: AuthController;

  beforeEach(() => {
    service = {
      login: vi.fn(),
      refreshAccessToken: vi.fn(),
      logout: vi.fn(),
      hashPassword: vi.fn(),
      findProfileById: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
    } as any;
    controller = new AuthController(service as any);
  });

  it('login pose les 3 cookies (access/refresh/csrf) et ne renvoie jamais de token en JSON', async () => {
    (service.login as any).mockResolvedValue({
      accessToken: 'AT',
      refreshToken: 'RT',
      user: { id: 'u1', nom: 'U', email: 'u@x.com', role: 'ADMIN', permissions: ['*'], annexeIds: [] },
    });
    const res = fakeResponse();

    const result = await controller.login({ email: 'u@x.com', password: 'pw' } as any, res as any);

    expect(result).toEqual({ user: expect.objectContaining({ id: 'u1' }) });
    expect(JSON.stringify(result)).not.toContain('AT');
    expect(JSON.stringify(result)).not.toContain('RT');

    expect(res.cookies[ACCESS_TOKEN_COOKIE].value).toBe('AT');
    expect(res.cookies[ACCESS_TOKEN_COOKIE].options.httpOnly).toBe(true);
    expect(res.cookies[REFRESH_TOKEN_COOKIE].value).toBe('RT');
    expect(res.cookies[REFRESH_TOKEN_COOKIE].options.httpOnly).toBe(true);
    expect(res.cookies[CSRF_COOKIE].options.httpOnly).toBe(false);
  });

  it('refresh lit le cookie refresh (pas le corps) et re-pose seulement le cookie access', async () => {
    (service.refreshAccessToken as any).mockResolvedValue({ accessToken: 'NEW_AT' });
    const res = fakeResponse();
    const req = { cookies: { [REFRESH_TOKEN_COOKIE]: 'RT' } } as any;

    await controller.refresh(req, res as any);

    expect(service.refreshAccessToken).toHaveBeenCalledWith('RT');
    expect(res.cookies[ACCESS_TOKEN_COOKIE].value).toBe('NEW_AT');
  });

  it('refresh rejette si le cookie refresh est absent', async () => {
    const res = fakeResponse();
    await expect(controller.refresh({ cookies: {} } as any, res as any)).rejects.toThrow(UnauthorizedException);
  });

  it('logout révoque le refresh token en base et vide les 3 cookies avec les mêmes options que la pose', async () => {
    const res = fakeResponse();
    const req = { cookies: { [REFRESH_TOKEN_COOKIE]: 'RT' } } as any;

    await controller.logout(req, res as any);

    expect(service.logout).toHaveBeenCalledWith('RT');
    expect(res.cleared[ACCESS_TOKEN_COOKIE]).toBeDefined();
    expect(res.cleared[REFRESH_TOKEN_COOKIE]).toBeDefined();
    expect(res.cleared[CSRF_COOKIE]).toBeDefined();
  });
});
