type CspDirectiveMap = Record<string, string[]>;

function splitCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function mergeUnique(base: string[], extra: string[]): string[] {
  return Array.from(new Set([...base, ...extra]));
}

/**
 * Build CSP directives for Helmet.
 * Use env `CSP_*_SRC` to append trusted domains without changing code.
 */
export function buildCspDirectives(): CspDirectiveMap {
  const directives: CspDirectiveMap = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    frameSrc: ["'self'", "https://challenges.cloudflare.com"],
    connectSrc: ["'self'"],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https://api.vietqr.io",
      "https://img.vietqr.io",
      "https://images.unsplash.com",
      "https://placehold.co",
      "https://blogger.googleusercontent.com",
      "https://4216176300-files.gitbook.io",
    ],
  };

  directives.scriptSrc = mergeUnique(
    directives.scriptSrc ?? [],
    splitCsv(process.env.CSP_SCRIPT_SRC),
  );
  directives.styleSrc = mergeUnique(
    directives.styleSrc ?? [],
    splitCsv(process.env.CSP_STYLE_SRC),
  );
  directives.fontSrc = mergeUnique(
    directives.fontSrc ?? [],
    splitCsv(process.env.CSP_FONT_SRC),
  );
  directives.frameSrc = mergeUnique(
    directives.frameSrc ?? [],
    splitCsv(process.env.CSP_FRAME_SRC),
  );
  directives.connectSrc = mergeUnique(
    directives.connectSrc ?? [],
    splitCsv(process.env.CSP_CONNECT_SRC),
  );
  directives.imgSrc = mergeUnique(
    directives.imgSrc ?? [],
    splitCsv(process.env.CSP_IMG_SRC),
  );

  return directives;
}

