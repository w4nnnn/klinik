const sessionOptions = {
  cookieName: process.env.SESSION_COOKIE_NAME || 'kliniksess',
  password: process.env.SESSION_PASSWORD || 'complex_password_at_least_32_chars_long!',
  // secure: true should be used in production (HTTPS)
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};

module.exports = sessionOptions;
