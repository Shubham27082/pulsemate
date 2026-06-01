const REFRESH_COOKIE_NAME = 'pm_refresh_token';

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/auth',
  maxAge: 1000 * 60 * 60 * 24 * 7,
});

const setRefreshTokenCookie = (res, refreshToken, maxAgeMs) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...getRefreshCookieOptions(),
    maxAge: maxAgeMs || getRefreshCookieOptions().maxAge,
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
};

module.exports = {
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
