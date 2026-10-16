import { ENV } from './env';

/**
 * Checks whether an incoming HTTP request or WebSocket origin is authorized.
 * In development, localhost and 127.0.0.1 origins are allowed.
 * In production, requests matching the same-origin host, RENDER_EXTERNAL_URL,
 * CLIENT_URL, or explicit ALLOWED_ORIGINS are accepted, while untrusted cross-origin requests are rejected.
 */
export const isAllowedOrigin = (origin: string | undefined, host?: string): boolean => {
  // Allow requests without Origin header (e.g. same-origin GET/POST, mobile apps, server-to-server, curl)
  if (!origin) return true;

  // In development/test mode, allow localhost and loopback interfaces
  if (ENV.NODE_ENV !== 'production') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true;
    }
  }

  // Verify same-origin matching against Host header
  try {
    const parsedOrigin = new URL(origin);
    if (host && parsedOrigin.host.toLowerCase() === host.toLowerCase()) {
      return true;
    }
  } catch (_) {
    // Invalid URL format
  }

  // Check configured CLIENT_URL
  if (ENV.CLIENT_URL) {
    const cleanClientUrl = ENV.CLIENT_URL.replace(/\/$/, '');
    if (origin.replace(/\/$/, '') === cleanClientUrl) {
      return true;
    }
  }

  // Check Render provided external URL (e.g. https://<app-name>.onrender.com)
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL;
  if (renderExternalUrl) {
    const cleanRenderUrl = renderExternalUrl.replace(/\/$/, '');
    if (origin.replace(/\/$/, '') === cleanRenderUrl) {
      return true;
    }
  }

  // Check custom allowed origins list
  if (ENV.ALLOWED_ORIGINS) {
    const allowedList = ENV.ALLOWED_ORIGINS.split(',').map((s) => s.trim().replace(/\/$/, ''));
    if (allowedList.includes(origin.replace(/\/$/, ''))) {
      return true;
    }
  }

  return false;
};
