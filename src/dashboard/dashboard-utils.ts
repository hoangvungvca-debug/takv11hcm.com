export type DashboardUser = {
  email: string;
  name: string;
  role: string;
  status: string;
  isAdmin?: boolean;
};

export type DashboardLetter = {
  id: number;
  incomingNumber: string;
  receivedDate: string;
  summary: string;
  sender: string;
  handler?: string;
  deadline?: string;
  status: string;
};

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

export function dateKey(value: string | Date): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (name: string) => parts.find((entry) => entry.type === name)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function displayDate(value?: string): string {
  if (!value) return 'Chưa có hạn';
  const key = dateKey(value);
  if (!key) return 'Chưa có hạn';
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

export function assignedToUser(letter: DashboardLetter, user: DashboardUser | null): boolean {
  if (!user || !letter.handler?.trim()) return false;
  const handler = letter.handler.trim().toLocaleLowerCase('vi');
  return [user.name, user.email].filter(Boolean)
    .some((value) => value.trim().toLocaleLowerCase('vi') === handler);
}

export function deadlineState(letter: DashboardLetter, now: Date): 'overdue' | 'soon' | 'normal' {
  if (!letter.deadline || letter.status === 'Đã hoàn thành') return 'normal';
  const deadline = dateKey(letter.deadline);
  if (!deadline) return 'normal';
  const today = dateKey(now);
  if (deadline < today) return 'overdue';
  const days = (Date.parse(deadline) - Date.parse(today)) / 86400000;
  return days <= 2 ? 'soon' : 'normal';
}
