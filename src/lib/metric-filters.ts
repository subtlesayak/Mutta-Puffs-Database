import type {PlaceMetrics} from './types';

export const metricControls = (form: HTMLFormElement) =>
  [...form.querySelectorAll<HTMLSelectElement | HTMLInputElement>('[name=price_status],[name=currency],[name=max_price],[name=min_score]')];

export function metricMatcher(form: HTMLFormElement) {
  const currency = form.querySelector<HTMLSelectElement>('[name=currency]')?.value || '';
  const maximum = form.querySelector<HTMLInputElement>('[name=max_price]');
  if (maximum) maximum.disabled = !currency;
  const priceLimit = currency && maximum?.valueAsNumber;
  const priceRequired = Boolean(form.querySelector<HTMLSelectElement>('[name=price_status]')?.value || currency);
  const minScore = Number(form.querySelector<HTMLSelectElement>('[name=min_score]')?.value);
  return (metric: PlaceMetrics | undefined) => {
    const {price, score} = metric ?? {};
    return (!priceRequired || !!price) &&
      (!currency || price?.currency === currency) &&
      (typeof priceLimit !== 'number' || Number.isNaN(priceLimit) || priceLimit < 0 || (price?.amount ?? Infinity) <= priceLimit) &&
      (!minScore || (score?.score ?? 0) >= minScore);
  };
}
