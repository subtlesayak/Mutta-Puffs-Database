export const observationErrors = {
  price: 'Enter a positive amount and a three-letter currency code, such as 25 INR.',
  fresh_batch_times: 'Enter each local batch time once in 24-hour format, such as 08:00, 16:30.',
};

type ObservationField = keyof typeof observationErrors;

export function invalidObservationField(fields: Partial<Record<ObservationField, string>>): ObservationField | null {
  const price = fields.price?.trim();
  if (price) {
    const match = /^(?:([0-9]+(?:\.[0-9]+)?)\s+[a-z]{3}|[a-z]{3}\s+([0-9]+(?:\.[0-9]+)?))$/i.exec(price);
    const amount = Number(match?.[1] ?? match?.[2]);
    if (!Number.isFinite(amount) || amount <= 0) return 'price';
  }
  const batchTimes = fields.fresh_batch_times?.trim();
  if (batchTimes) {
    const times = batchTimes.split(',').map(time => time.trim());
    if (times.some(time => !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) ||
        new Set(times).size !== times.length) return 'fresh_batch_times';
  }
  return null;
}
