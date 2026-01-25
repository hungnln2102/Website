/**
 * CSRF Protection Utility
 * 
 * NOTE: Currently, the application only uses GET requests (no POST/PUT/DELETE),
 * so CSRF protection is not immediately required. This utility is prepared for
 * future use when POST/PUT/DELETE endpoints are added.
 * 
 * CSRF protection requires backend support:
 * 1. Backend must generate CSRF tokens
 * 2. Backend must validate CSRF tokens on state-changing requests
 * 3. Frontend must include CSRF token in request headers
 */

/**
 * Get CSRF token from meta tag or cookie
 * Backend should set this token in a meta tag or cookie
 */
export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get from meta tag (recommended for SPAs)
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  // Try to get from cookie (fallback)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token' || name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Add CSRF token to fetch request headers
 * Use this when making POST/PUT/DELETE requests
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();
  
  if (!token) {
    console.warn('[CSRF] No CSRF token found. Make sure backend is configured to provide CSRF tokens.');
    return headers;
  }

  const headersObj = headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;
  
  return {
    ...headersObj,
    'X-CSRF-Token': token,
    'X-XSRF-TOKEN': token, // Alternative header name
  };
}

/**
 * Fetch wrapper that automatically includes CSRF token
 * Use this for POST/PUT/DELETE requests
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase();
  
  // Only add CSRF token for state-changing methods
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const headers = addCsrfHeader(options.headers);
    return fetch(url, {
      ...options,
      headers,
    });
  }

  // For GET/HEAD requests, no CSRF token needed
  return fetch(url, options);
}
