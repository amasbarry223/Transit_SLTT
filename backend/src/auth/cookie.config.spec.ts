describe('cookie.config', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });

  async function loadConfig() {
    return import('./cookie.config');
  }

  it('par défaut (dev, COOKIE_SAME_SITE non défini) : sameSite=lax et secure=false — indispensable pour que le navigateur accepte le cookie sur http://localhost', async () => {
    delete process.env.COOKIE_SAME_SITE;
    delete process.env.NODE_ENV;
    const { accessCookieOptions } = await loadConfig();
    const opts = accessCookieOptions();
    expect(opts.sameSite).toBe('lax');
    expect(opts.secure).toBe(false);
  });

  it('COOKIE_SAME_SITE=none force toujours secure=true, même hors production — un SameSite=None sans Secure est rejeté par tout navigateur', async () => {
    process.env.COOKIE_SAME_SITE = 'none';
    delete process.env.NODE_ENV;
    const { accessCookieOptions } = await loadConfig();
    const opts = accessCookieOptions();
    expect(opts.sameSite).toBe('none');
    expect(opts.secure).toBe(true);
  });

  it('en production, secure=true quel que soit sameSite', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.COOKIE_SAME_SITE;
    const { accessCookieOptions } = await loadConfig();
    const opts = accessCookieOptions();
    expect(opts.sameSite).toBe('lax');
    expect(opts.secure).toBe(true);
  });

  it('COOKIE_SAME_SITE=strict est respecté', async () => {
    process.env.COOKIE_SAME_SITE = 'strict';
    const { accessCookieOptions } = await loadConfig();
    expect(accessCookieOptions().sameSite).toBe('strict');
  });
});
