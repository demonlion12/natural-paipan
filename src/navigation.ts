import { useEffect, useState } from 'react';
export type PageName = 'login' | 'home' | 'birth' | 'report' | 'yijing' | 'learning';
const paths: Record<PageName, string> = { login: '/login', home: '/home', birth: '/birth', report: '/reports', yijing: '/yijing', learning: '/learn' };
export function readRoute() {
  const url = new URL(window.location.hash.slice(1) || '/login', window.location.origin);
  const parts = url.pathname.split('/').filter(Boolean);
  const page = (Object.keys(paths) as PageName[]).find(key => paths[key].slice(1) === parts[0]) ?? 'login';
  return { page, parts, query: url.searchParams };
}
export function navigate(path: string, replace = false) {
  if (window.location.hash === `#${path}`) return;
  if (replace) { window.history.replaceState(null, '', `#${path}`); window.dispatchEvent(new HashChangeEvent('hashchange')); }
  else window.location.hash = path;
}
export function usePageRoute() {
  const [page, setPage] = useState<PageName>(() => readRoute().page);
  useEffect(() => {
    const update = () => setPage(readRoute().page);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return [page, (value: PageName) => { setPage(value); navigate(paths[value]); }] as const;
}
