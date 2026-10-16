export type OutgoingFilters = { number: string; from: string; to: string };
export const EMPTY_OUTGOING_FILTERS: OutgoingFilters = { number: '', from: '', to: '' };

export function outgoingDateKey(value: string): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)?.value).join('-');
}

export function outgoingDateLabel(value: string): string {
  const key = outgoingDateKey(value);
  return key ? key.split('-').reverse().join('/') : '—';
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

export function filterOutgoingLetters<T extends { outgoingNumber: string; sentDate: string }>(letters: T[], filters: OutgoingFilters): T[] {
  if (filters.from && filters.to && filters.from > filters.to) return [];
  const number = normalize(filters.number);
  return letters.filter((letter) => {
    const date = outgoingDateKey(letter.sentDate);
    return normalize(letter.outgoingNumber).includes(number)
      && (!filters.from || date >= filters.from)
      && (!filters.to || Boolean(date) && date <= filters.to);
  });
}

export function paginateOutgoing<T>(letters: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(letters.length / 10));
  const currentPage = Math.min(totalPages, Math.max(1, Math.floor(page) || 1));
  return { totalPages, currentPage, items: letters.slice((currentPage - 1) * 10, currentPage * 10) };
}

export const escapeOutgoingHtml = (value: string) => value.replace(/[&<>"']/g,
  (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
