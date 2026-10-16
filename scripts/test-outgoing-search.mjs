import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { filterOutgoingLetters, paginateOutgoing, outgoingDateKey, outgoingDateLabel, escapeOutgoingHtml } from '../src/ledger/outgoing-search.ts';

const rows = [
  { outgoingNumber: 'CVĐ-2026-00001', sentDate: '2026-10-15', id: 1 },
  { outgoingNumber: 'CVĐ-2026-00002', sentDate: '2026-10-15T17:00:00.000Z', id: 2 },
  { outgoingNumber: 'CVĐ-2026-00003', sentDate: '2026-10-17', id: 3 },
];
const filters = (values = {}) => ({ number: '', from: '', to: '', ...values });

test('Không lọc giữ toàn bộ dữ liệu và thứ tự', () => {
  assert.deepEqual(filterOutgoingLetters(rows, filters()), rows);
});

test('Tìm một phần số, không phân biệt hoa/thường, dấu và khoảng trắng ngoài', () => {
  assert.deepEqual(filterOutgoingLetters(rows, filters({ number: '00002' })).map((row) => row.id), [2]);
  assert.equal(filterOutgoingLetters(rows, filters({ number: ' cvd-2026 ' })).length, 3);
  assert.equal(filterOutgoingLetters(rows, filters({ number: 'cvđ-2026' })).length, 3);
  assert.equal(filterOutgoingLetters(rows, filters({ number: '99999' })).length, 0);
});

test('Lọc ngày gồm cả mốc đầu và cuối, cho phép một ngày hoặc một đầu mốc', () => {
  assert.deepEqual(filterOutgoingLetters(rows, filters({ from: '2026-10-15', to: '2026-10-17' })).map((row) => row.id), [1, 2, 3]);
  assert.deepEqual(filterOutgoingLetters(rows, filters({ from: '2026-10-16', to: '2026-10-16' })).map((row) => row.id), [2]);
  assert.deepEqual(filterOutgoingLetters(rows, filters({ from: '2026-10-16' })).map((row) => row.id), [2, 3]);
  assert.deepEqual(filterOutgoingLetters(rows, filters({ to: '2026-10-16' })).map((row) => row.id), [1, 2]);
});

test('Kết hợp số và khoảng ngày; khoảng ngày ngược không trả kết quả sai', () => {
  assert.deepEqual(filterOutgoingLetters(rows, filters({ number: '00002', from: '2026-10-16', to: '2026-10-16' })).map((row) => row.id), [2]);
  assert.equal(filterOutgoingLetters(rows, filters({ number: '00001', from: '2026-10-16' })).length, 0);
  assert.equal(filterOutgoingLetters(rows, filters({ from: '2026-10-17', to: '2026-10-15' })).length, 0);
});

test('Ngày ISO từ MySQL được đối chiếu và hiển thị theo Việt Nam', () => {
  assert.equal(outgoingDateKey('2026-10-15T17:00:00.000Z'), '2026-10-16');
  assert.equal(outgoingDateLabel('2026-10-15T17:00:00.000Z'), '16/10/2026');
  assert.equal(outgoingDateLabel('2026-10-16'), '16/10/2026');
  assert.equal(outgoingDateKey('invalid'), '');
});

test('Phân trang đúng 10 dòng; dòng 11 sang trang tiếp theo và không có trang trống sau lọc', () => {
  for (const size of [0, 10, 11, 20, 21]) {
    const entries = Array.from({ length: size }, (_, id) => ({ id }));
    const first = paginateOutgoing(entries, 1);
    assert.equal(first.totalPages, Math.max(1, Math.ceil(size / 10)));
    assert.equal(first.items.length, Math.min(10, size));
    const last = paginateOutgoing(entries, 999);
    assert.equal(last.currentPage, first.totalPages);
    assert.ok(last.items.length <= 10);
  }
  assert.equal(paginateOutgoing(rows, 5).currentPage, 1);
});

test('Nội dung xuất được escape, không diễn giải HTML người dùng như mã lệnh', () => {
  assert.equal(escapeOutgoingHtml('<script>"x" & \'y\'</script>'), '&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;');
});

test('Bộ lọc điều khiển danh sách/xuất, trở về trang 1; giữ nguyên sổ đến, sidebar và backend', async () => {
  const before = execFileSync('git', ['show', '1957e91:src/main.tsx'], { encoding: 'utf8' });
  const after = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8');
  const normalized = after.replace(/^import .*from '\.\/ledger\/outgoing-search';\n/gm, '');
  assert.equal(before.slice(0, before.indexOf('function exportOutgoing')), normalized.slice(0, normalized.indexOf('function exportOutgoing')));
  assert.equal(before.slice(before.indexOf('function AdminPage')), after.slice(after.indexOf('function AdminPage')));
  assert.ok(after.includes('setFilters((current) => ({ ...current, [key]: value })); setPage(1)'));
  for (const format of ['pdf', 'word', 'excel']) assert.ok(after.includes(`exportOutgoing('${format}', filtered)`));
  const server = await readFile(new URL('../server.mjs', import.meta.url));
  assert.deepEqual(server, execFileSync('git', ['show', '1957e91:server.mjs']));
});
