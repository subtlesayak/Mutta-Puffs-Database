import {locales, type Locale} from './locales';

const key = 'mpdb-language';
const language = (value: string | null) => locales.find(({id}) => id === value)?.id;

export function preferredLocale(): Locale {
  try {return language(localStorage.getItem(key)) ?? 'en';}
  catch {return 'en';}
}

export function rememberPageLanguage() {
  const save = (locale: Locale) => {
    try {localStorage.setItem(key,locale);}
    catch {}
  };
  const pageLocale = language(document.documentElement.lang);
  if (pageLocale && pageLocale !== 'en') save(pageLocale);
  document.addEventListener('click',event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element && event.target.closest('#page-languages a, a[data-language-choice]');
    if (!(link instanceof HTMLAnchorElement)) return;
    const selected = language(link.hreflang);
    if (selected) save(selected);
  });
}
