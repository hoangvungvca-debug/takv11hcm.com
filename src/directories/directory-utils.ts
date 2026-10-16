export type Contact = {
  id: string; sourceOrder: number; name: string; ward: string; neighborhood: string;
  area: string; detail: string; phone: string; phones: string[]; birthDate: string;
  address: string; qualification: string; occupation: string; note: string;
  needsReview: boolean; source: string; sourceLocation: string;
};
export type DirectoryFilters = { query: string; ward: string; neighborhood: string; role: string };
export const normalizeDirectory = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
export const isNeighborhoodLeader = (entry: Contact) => /truong\s*(khu\s*pho|kp)/.test(normalizeDirectory(entry.detail));
const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });
export function filterDirectory(entries: Contact[], filters: DirectoryFilters, jurors = false): Contact[] {
  const words = normalizeDirectory(filters.query).split(/\s+/).filter(Boolean);
  return entries.filter((entry) => {
    const haystack = normalizeDirectory([entry.name, entry.ward, entry.neighborhood, entry.detail, entry.phone,
      ...entry.phones, entry.birthDate, entry.address, entry.qualification, entry.occupation, entry.note].join(' '));
    return words.every((word) => haystack.includes(word))
      && (!filters.ward || entry.ward === filters.ward)
      && (!filters.neighborhood || entry.neighborhood === filters.neighborhood)
      && (jurors || !filters.role || filters.role === 'all' || (filters.role === 'leaders' && isNeighborhoodLeader(entry))
        || (filters.role === 'groups' && normalizeDirectory(entry.detail).includes('to truong'))
        || (filters.role === 'other' && !isNeighborhoodLeader(entry) && !normalizeDirectory(entry.detail).includes('to truong')));
  }).sort((a, b) => jurors ? a.sourceOrder - b.sourceOrder
    : collator.compare(a.ward, b.ward) || collator.compare(a.neighborhood, b.neighborhood) || a.sourceOrder - b.sourceOrder);
}
export const sortedDirectoryOptions = (values: string[]) => [...new Set(values.filter(Boolean))].sort(collator.compare);
