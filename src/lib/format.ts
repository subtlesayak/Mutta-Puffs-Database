import type {Accuracy, Location, Provider, Verification} from './types';
import type {Locale} from './locales';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const siteUrl = new URL(base, 'https://subtlesayak.github.io');
export const github = 'https://github.com/subtlesayak/Mutta-Puffs-Database';
export const path = (route = '') => base + route.replace(/^\/+/, '');
export const localizedPath = (route: string, locale: Locale) => path(locale === 'en' ? route : locale + '/' + route);
export const placePath = (id: string, locale: Locale = 'en') => localizedPath('places/' + id + '/',locale);
export const cityPath = (id: string, locale: Locale = 'en') => localizedPath('cities/' + id + '/',locale);
export const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);
export const placeCount = (count: number) => formatNumber(count) + (count === 1 ? ' place' : ' places');
export const formatDate = (value: string, locale = 'en-GB') => new Intl.DateTimeFormat(locale, {dateStyle: 'medium', timeZone: 'UTC'}).format(new Date(value + 'T00:00:00Z'));
export const formatPrice = (amount: number, currency: string, locale = 'en-IN') => new Intl.NumberFormat(locale, {style: 'currency', currency}).format(amount);
export const accuracyLabels: Record<Accuracy, string> = {
  estimated: 'Estimated pin', source_pin: 'Original dropped pin', verified: 'Verified pin', unknown: 'Coordinates unknown',
};
export const verificationLabels: Record<Verification, string> = {
  unverified: 'Unverified', needs_details: 'Needs details', verified: 'Verified',
};
export const providerLabels: Record<Provider, string> = {
  google_maps: 'Google Maps', apple_maps: 'Apple Maps', openstreetmap: 'OpenStreetMap',
};
export const openInMap = (provider: Provider) => 'Open in ' + providerLabels[provider];
export const openInMapName = (provider: Provider, place: string) => openInMap(provider) + ' · ' + place + ' (opens in a new tab)';
export function locality(location: Location, label: (name: string) => string = name => name) {
  const names = [location.locality, location.city, location.district, location.state, location.country];
  return [...new Set(names.flatMap(name => name ? [label(name)] : []))].join(', ');
}

export function formatMessage(template: string, values: Record<string,string>) {
  return template.replace(/\{(\w+)\}/g, (match,key:string) => values[key] ?? match);
}
