import { apiFetch, getApiBase } from '@/lib/api/client';
import type { NewsArticle } from '@/features/news/data/newsArticles';

/** Bài hiển thị trên trang chủ (thêm ảnh bìa từ API). */
export type HomeNewsArticle = NewsArticle & { coverImageUrl: string | null };

export type PublicArticleRow = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  image_url: string | null;
  content: string | null;
  published_at: string | null;
  created_at: string;
  category: string;
};

const ACCENT_CLASSES: string[] = [
  'from-cyan-500 via-sky-600 to-indigo-700 dark:from-cyan-500 dark:via-blue-600 dark:to-indigo-800',
  'from-slate-800 via-slate-900 to-blue-950 dark:from-slate-800 dark:via-slate-950 dark:to-slate-900',
  'from-sky-500 via-blue-600 to-indigo-700 dark:from-sky-500 dark:via-blue-700 dark:to-indigo-800',
  'from-violet-600 via-indigo-700 to-slate-900 dark:from-violet-600 dark:via-indigo-800 dark:to-slate-950',
  'from-emerald-600 via-teal-700 to-slate-900 dark:from-emerald-600 dark:via-teal-800 dark:to-slate-950',
  'from-rose-600 via-orange-700 to-slate-900 dark:from-rose-600 dark:via-orange-800 dark:to-slate-950',
];

function formatViDate(iso: string | null): { publishedAt: string; label: string } {
  if (!iso) {
    const d = new Date();
    return { publishedAt: d.toISOString().slice(0, 10), label: new Intl.DateTimeFormat('vi-VN').format(d) };
  }
  const d = new Date(iso);
  return {
    publishedAt: iso.slice(0, 10),
    label: new Intl.DateTimeFormat('vi-VN').format(d),
  };
}

function shortHeadline(title: string): string {
  const t = title.trim();
  if (t.length <= 36) return t;
  return `${t.slice(0, 34)}…`;
}

function visualLabelFromDate(iso: string | null): string {
  if (!iso) return 'Tin tức';
  const days = (Date.now() - new Date(iso).getTime()) / (86400 * 1000);
  if (days <= 14) return 'Mới cập nhật';
  return 'Tin tức';
}

/**
 * Admin lưu ảnh bìa dạng absolute (vd. http://localhost:3001/image/articles/...).
 * Storefront phải tải qua same-origin `/image/articles/...` (Vite/nginx proxy → admin_orderlist),
 * không gọi trực tiếp localhost hay domain admin (mixed content, CSP, hoặc host không public).
 *
 * Ảnh bìa bài viết luôn nằm dưới `/image/articles/` — luôn chuyển về path tương đối.
 * Các path `/image/` khác: loopback hoặc khớp VITE_ADMIN_PUBLIC_ORIGIN.
 */
function normalizeArticleImageStorageUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url;

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const host = parsed.hostname.toLowerCase();
    const isLoopback =
      host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

    if (pathname.startsWith('/image/articles')) {
      return `${pathname}${parsed.search}`;
    }

    if (!pathname.startsWith('/image/')) {
      return url;
    }

    if (isLoopback) {
      return `${pathname}${parsed.search}`;
    }

    const stripOrigin = import.meta.env.VITE_ADMIN_PUBLIC_ORIGIN?.replace(/\/+$/, '');
    if (stripOrigin) {
      const normalizedIncoming = url.replace(/^http:\/\//i, 'https://');
      const normalizedOrigin = stripOrigin.replace(/^http:\/\//i, 'https://');
      if (
        url.startsWith(`${stripOrigin}/`) ||
        normalizedIncoming.startsWith(`${normalizedOrigin}/`)
      ) {
        return `${pathname}${parsed.search}`;
      }
    }
  } catch {
    /* ignore */
  }
  return url;
}

/** Ảnh bài viết: URL đầy đủ từ API hoặc ghép base khi path tương đối */
export function resolveArticleImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl?.trim()) return null;
  let u = imageUrl.trim();
  u = normalizeArticleImageStorageUrl(u);
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = getApiBase().replace(/\/+$/, '');
  if (u.startsWith('/')) return `${base}${u}`;
  return `${base}/${u}`;
}

/** Map đầy đủ cho trang chi tiết / danh sách tin (có nội dung bài). */
export function mapPublicRowToNewsArticle(row: PublicArticleRow): NewsArticle {
  const { publishedAt, label } = formatViDate(row.published_at);
  const summary = (row.summary || '').trim() || 'Đang cập nhật mô tả…';
  const raw = row.content?.trim() ?? '';
  let contentHtml: string | null = null;
  let content: string[] = [];

  if (raw) {
    if (/<[a-z][\s\S]*>/i.test(raw)) {
      contentHtml = raw;
    } else {
      content = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
      if (!content.length) content = [raw];
    }
  }
  if (!contentHtml && !content.length) {
    content = ['Đang cập nhật nội dung…'];
  }

  return {
    id: String(row.id),
    slug: row.slug,
    category: row.category || 'Tin tức',
    title: row.title,
    summary,
    publishedAt,
    publishedLabel: label,
    visualLabel: visualLabelFromDate(row.published_at),
    visualHeadline: shortHeadline(row.title),
    visualDescription: summary.length > 140 ? `${summary.slice(0, 137)}…` : summary,
    accentClass: ACCENT_CLASSES[Math.abs(row.id) % ACCENT_CLASSES.length],
    content,
    contentHtml,
    coverImageUrl: resolveArticleImageUrl(row.image_url),
  };
}

export function mapRowToHomeArticle(row: PublicArticleRow): HomeNewsArticle {
  const full = mapPublicRowToNewsArticle(row);
  return {
    ...full,
    content: [],
    coverImageUrl: full.coverImageUrl ?? null,
  };
}

/** Chi tiết bài theo slug — `null` nếu 404. */
export async function fetchPublishedArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  const base = getApiBase().replace(/\/+$/, '');
  const url = `${base}/api/public/content/articles/slug/${encodeURIComponent(trimmed)}`;
  const res = await apiFetch(url, undefined, 30_000);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error('Không tải được bài viết.');
  }
  const row = (await res.json()) as PublicArticleRow;
  return mapPublicRowToNewsArticle(row);
}

export async function fetchPublishedArticles(limit = 6): Promise<PublicArticleRow[]> {
  const base = getApiBase().replace(/\/+$/, '');
  const url = `${base}/api/public/content/articles?limit=${limit}`;
  const res = await apiFetch(url, undefined, 30_000);
  if (!res.ok) {
    throw new Error('Không tải được danh sách bài viết.');
  }
  const data = (await res.json()) as { items: PublicArticleRow[] };
  return data.items || [];
}
