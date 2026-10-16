import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { filterDirectory, isNeighborhoodLeader } from '../src/directories/directory-utils.ts';
const base = new URL('../', import.meta.url);
const load = async (file) => JSON.parse(await readFile(new URL(file, base), 'utf8'));
const jurors = (await load('server/data/jurors.json')).entries;
const neighborhoods = (await load('server/data/neighborhoods.json')).entries;
const filters = (changes = {}) => ({ query: '', ward: '', neighborhood: '', role: 'all', ...changes });

test('Đủ 42 Hội thẩm, STT đúng thứ tự và đủ trường của bảng nguồn', () => {
  assert.equal(jurors.length, 42);
  assert.deepEqual(jurors.map((entry) => entry.sourceOrder), Array.from({ length: 42 }, (_, i) => i + 1));
  for (const entry of jurors) for (const field of ['name', 'birthDate', 'address', 'qualification', 'occupation', 'phone']) assert.ok(entry[field], `${entry.id}: thiếu ${field}`);
  assert.equal(jurors[0].name, 'Phạm Tuấn Anh');
  assert.equal(jurors[41].name, 'Cao Thị Dung');
});

test('Đủ bản ghi từng phường, gồm mọi dòng PDF 1–325', () => {
  const counts = Object.fromEntries(['Phước Thắng', 'Rạch Dừa', 'Tam Thắng', 'Vũng Tàu'].map((name) => [name, neighborhoods.filter((entry) => entry.ward === `Phường ${name}`).length]));
  assert.deepEqual(counts, { 'Phước Thắng': 70, 'Rạch Dừa': 325, 'Tam Thắng': 25, 'Vũng Tàu': 106 });
  assert.equal(new Set([...jurors, ...neighborhoods].map((entry) => entry.id)).size, 568);
  assert.deepEqual(neighborhoods.filter((entry) => entry.ward === 'Phường Rạch Dừa').map((entry) => entry.sourceOrder), Array.from({ length: 325 }, (_, i) => i + 1));
});

test('98 trưởng khu phố, đúng 6/25/25/42 khu phố tương ứng', () => {
  assert.equal(neighborhoods.filter(isNeighborhoodLeader).length, 98);
  for (const [ward, count] of [['Phước Thắng', 6], ['Rạch Dừa', 25], ['Tam Thắng', 25], ['Vũng Tàu', 42]]) {
    const result = filterDirectory(neighborhoods, filters({ ward: `Phường ${ward}`, role: 'leaders' }));
    assert.equal(result.length, count, ward);
    assert.deepEqual(result.map((entry) => entry.neighborhood), Array.from({ length: count }, (_, i) => `Khu phố ${i + 1}`), ward);
  }
});

test('Tìm không dấu, số điện thoại; kết hợp phường + khu phố', () => {
  assert.equal(filterDirectory(jurors, filters({ query: 'pham tuan anh' }), true)[0].phone, '0909195676');
  assert.equal(filterDirectory(jurors, filters({ query: '0909195676' }), true).length, 1);
  const found = filterDirectory(neighborhoods, filters({ ward: 'Phường Vũng Tàu', neighborhood: 'Khu phố 29', role: 'leaders' }));
  assert.equal(found.length, 1); assert.equal(found[0].name, 'Nguyễn Hùng Anh');
  assert.ok(found[0].note.includes('Khu phố 1 (cũ)'));
  assert.equal(filterDirectory(neighborhoods, filters({ query: 'khongcoabcdefgh' })).length, 0);
});

test('Cảnh báo số lỗi không tự sửa số; giữ dòng nguồn thiếu họ tên', () => {
  const bad = neighborhoods.find((entry) => entry.name === 'Lê Ngọc Ngà');
  assert.equal(bad.phone, '974246064'); assert.equal(bad.needsReview, true); assert.equal(bad.phones.length, 0);
  assert.ok(neighborhoods.some((entry) => !entry.name && entry.note.includes('chưa ghi')));
});

test('Giữ nguyên App, sổ công văn, biểu mẫu và quản trị; chỉ mở API dữ liệu sau kiểm tra quyền', async () => {
  const before = execFileSync('git', ['show', '68aa1d2:src/main.tsx'], { encoding: 'utf8' });
  const after = await readFile(new URL('src/main.tsx', base), 'utf8');
  const section = (s, from, to) => s.slice(s.indexOf(from), s.indexOf(to));
  assert.equal(section(before, 'function App()', 'function Root()'), section(after.replace('<LogoutButton />','').replace('<HomePresenceStats />',''), 'function App()', 'function Root()'));
  assert.equal(section(before, 'function LedgerPage()', 'type DirectoryEntry'), section(after, 'function LedgerPage()', 'type DirectoryEntry'));
  assert.equal(section(before, 'function FormsPage()', 'type Module'), section(after, 'function FormsPage()', 'type Module'));
  const server = await readFile(new URL('server.mjs', base), 'utf8');
  const api = section(server, "  if (['/api/directories/jurors'", "  if (url.pathname === '/api/letters'");
  assert.ok(api.indexOf('return json(res, 403') < api.indexOf('SELECT payload'));
  assert.ok(api.includes("['approved', 'admin'].includes(user.status)"));
});

test('Bundle và tài nguyên public không chứa tên/số điện thoại danh bạ', async () => {
  const files = await readdir(new URL('dist/assets/', base));
  for (const file of files.filter((name) => name.endsWith('.js'))) {
    const content = await readFile(new URL(`dist/assets/${file}`, base), 'utf8');
    for (const text of ['0909195676', 'Cao Thị Dung', 'Nguyễn Hùng Anh', 'Nguyễn Tiến Cường']) assert.ok(!content.includes(text), `${file} chứa danh bạ`);
  }
  const main = await readFile(new URL('src/main.tsx', base), 'utf8');
  assert.ok(!main.includes("const jurors: DirectoryEntry[]"));
  assert.ok(!main.includes("const neighborhoodLeaders: DirectoryEntry[]"));
});


test('Tệp nguồn private bị chặn trước Vite/static; CSS login và nút logout được tích hợp', async () => {
  const server = await readFile(new URL('server.mjs', base), 'utf8');
  assert.ok(server.includes("['/server/', '/scripts/', '/upload/']"));
  const main = await readFile(new URL('src/main.tsx', base), 'utf8');
  assert.ok(main.includes("import './readability-refinement.css'"));
  assert.ok(main.includes('<LogoutButton />') && main.includes('<HomePresenceStats />'));
  const css = await readFile(new URL('src/readability-refinement.css', base), 'utf8');
  assert.ok(css.includes('color:#fff;letter-spacing:0;white-space:nowrap'));
});
