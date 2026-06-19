export function normalizeText(value: string | null | undefined) {
  return value
    ?.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase() ?? '';
}

export function normalizeBarcode(value: string | null | undefined) {
  const digits = value?.replace(/\D+/g, '') ?? '';
  return digits.length >= 8 ? digits : '';
}

export function makeProductId(retailer: string, barcode: string | undefined, normalizedName: string) {
  const basis = barcode ? `barcode-${barcode}` : normalizedName;
  return `${retailer}:${basis.replace(/[^a-z0-9]+/g, '-')}`;
}

export function parsePrice(value: string | null | undefined) {
  const text = value?.replace(/\s+/g, ' ').trim() ?? '';
  if (!text) {
    return { text: '', value: undefined, currency: undefined };
  }

  const numeric = text.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
  const amount = Number.parseFloat(numeric);
  const currency = /ksh|kes|shs/i.test(text) ? 'KES' : undefined;

  return {
    text,
    value: Number.isFinite(amount) ? amount : undefined,
    currency
  };
}
