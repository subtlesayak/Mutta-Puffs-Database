import type {ContributionKind} from './github-draft';

const configured = (import.meta.env.PUBLIC_COMMUNITY_API_URL ?? '').trim();
let endpoint: URL | undefined;
try {
  const url = new URL(configured);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol === 'https:' || (local && url.protocol === 'http:')) &&
      !url.username && !url.password && !url.search && !url.hash) {
    url.pathname = url.pathname.replace(/\/?$/, '/');
    endpoint = url;
  }
} catch {}
export const communityConfigured = Boolean(endpoint);

export interface Receipt {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  reference?: string | null;
  reason?: string | null;
}

export interface ModeratedSubmission extends Receipt {
  created_at: string;
  submission: {kind: ContributionKind; fields: Record<string,string>; license: string};
}

export async function communityRequest<T>(route: string, options: {method?: string; token?: string; body?: unknown} = {}): Promise<T> {
  if (!endpoint) throw new Error('Community submissions are unavailable.');
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = 'Bearer ' + options.token;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(new URL(route, endpoint), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Could not reach the submission service. Try again.');
  }
  return data as T;
}
