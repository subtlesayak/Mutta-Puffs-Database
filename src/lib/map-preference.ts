import {formatMessage,openInMap,openInMapName,providerLabels} from './format';
import type {Provider} from './types';

const key = 'mutta-puffs-map-provider';

export function mapPreference(): Provider | undefined {
  try {
    const stored = localStorage.getItem(key);
    if (stored && Object.hasOwn(providerLabels, stored)) return stored as Provider;
  } catch {}
  return undefined;
}

export function rememberMapProvider(provider: Provider) {
  try {localStorage.setItem(key,provider);}
  catch {}
}

export function applyMapPreference() {
  const preferred = mapPreference();
  if (!preferred) return;
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-provider-links]')) {
    const destinations = JSON.parse(link.dataset.providerLinks!) as Partial<Record<Provider,string>>;
    const destination = destinations[preferred];
    if (!destination) continue;
    link.href = destination;
    const message = {provider:providerLabels[preferred],place:link.dataset.placeLabel ?? 'this place'};
    link.textContent = link.dataset.mapAction ? formatMessage(link.dataset.mapAction,message) : openInMap(preferred);
    link.dataset.directions = preferred;
    link.setAttribute('aria-label',link.dataset.mapDescription ? formatMessage(link.dataset.mapDescription,message) : openInMapName(preferred,message.place));
  }
}
