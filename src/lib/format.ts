import type {Accuracy, Location, Provider, Verification} from './types';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const siteUrl = new URL(base, 'https://subtlesayak.github.io');
export const github = 'https://github.com/subtlesayak/Mutta-Puffs-Database';
export const path = (route = '') => base + route.replace(/^\/+/, '');
export const placePath = (id: string) => path('places/' + id + '/');
export const cityPath = (id: string) => path('cities/' + id + '/');
export const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);
export const placeCount = (count: number) => formatNumber(count) + (count === 1 ? ' place' : ' places');
export const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium', timeZone: 'UTC'}).format(new Date(value + 'T00:00:00Z'));
export const formatPrice = (amount: number, currency: string) => new Intl.NumberFormat('en-IN', {style: 'currency', currency}).format(amount);
export const accuracyLabels: Record<Accuracy, string> = {
  estimated: 'Estimated pin', source_pin: 'Original dropped pin', verified: 'Verified pin', unknown: 'Coordinates unknown',
};
export const verificationLabels: Record<Verification, string> = {
  unverified: 'Unverified', needs_details: 'Needs details', verified: 'Verified',
};
export const providerLabels: Record<Provider, string> = {
  google_maps: 'Google Maps', apple_maps: 'Apple Maps', openstreetmap: 'OpenStreetMap',
};
export function locality(location: Location) {
  return [...new Set([location.locality, location.city, location.district, location.state, location.country].filter(Boolean))].join(', ');
}
