/**
 * HTML sanitization utility using DOMPurify
 * Prevents XSS attacks by sanitizing user-generated content
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string safe to use with dangerouslySetInnerHTML
 */
export function sanitizeHtml(
  dirty: string,
  options?: DOMPurify.Config
): string {
  if (typeof window === 'undefined') {
    // SSR: Return as-is (sanitization happens on client)
    return dirty;
  }

  const defaultOptions: DOMPurify.Config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  };

  return DOMPurify.sanitize(dirty, { ...defaultOptions, ...options });
}

/**
 * Sanitize plain text (removes all HTML tags)
 * @param text - The text to sanitize
 * @returns Plain text without HTML
 */
export function sanitizeText(text: string): string {
  if (typeof window === 'undefined') {
    return text;
  }
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}
