import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { filterDirectory, sortedDirectoryOptions } from '../src/directories/directory-utils.ts';
const base = new URL('../', import.meta.url);
const entries = JSON.parse(await readFile(new URL('server/data/police.json', base), 'utf8')).entries;
const filters = (changes = {}) => ({ query: '', ward: '', neighborhood: '', role: 'all', ...changes });

test('Đủ 22 cán bộ, 23 số di động và thông tin trực ban theo ảnh', () => {
  assert.equal(entries.length, 22);
  assert.deepEqual(entries.map((entry) => entry.sourceOrder), Array.from({ length: 22 }, (_, i) => i + 1));
  assert.equal(entries.flatMap((entry) => entry.phones).length, 23);
  for (const entry of entries) {
    assert.equal(entry.ward, 'Phường Tam Thắng');
    assert.ok(entry.name && entry.source && entry.sourceLocation);
    assert.ok(entry.phones.every((phone) => /^0\d{9}$/.test(phone)));
    assert.equal(entry.office.dutyPhone, '02543585995');
  }
  assert.equal(entries[0].name, 'Ngô Duy Tân');
  assert.equal(entries[21].name, 'Đặng Tuấn Anh');
  assert.deepEqual(entries[14].phones, ['0909202787', '0909625720']);
});

test('Dropdown đủ 25 khu phố và lọc được 3 khu phố kiêm nhiệm', () => {
  assert.deepEqual(sortedDirectoryOptions(entries.flatMap((entry) => entry.neighborhoods)), Array.from({ length: 25 }, (_, i) => `Khu phố ${i + 1}`));
  for (const [area, name] of [[3, 'Phan Anh Tuấn'], [20, 'Nguyễn Hoàng Thanh Vũ'], [17, 'Đặng Tuấn Anh']]) {
    const found = filterDirectory(entries, filters({ neighborhood: `Khu phố ${area}` }));
    assert.equal(found.length, 1);
    assert.equal(found[0].name, name);
  }
  assert.equal(entries.filter((entry) => entry.neighborhoods.length > 1).length, 3);
});

test('Tìm không dấu, tìm số thứ hai, lọc phường không có dữ liệu', () => {
  assert.equal(filterDirectory(entries, filters({ query: 'ngo duy tan' }))[0].name, 'Ngô Duy Tân');
  assert.equal(filterDirectory(entries, filters({ query: '0909625720' }))[0].name, 'Điều Mạnh Tuấn');
  assert.equal(filterDirectory(entries, filters({ ward: 'Phường Vũng Tàu' })).length, 0);
});

test('Chỉ sửa route Cảnh sát và thêm import CSS; giữ nguyên toàn bộ mã trang khác', async () => {
  const before = execFileSync('git', ['show', 'feb7ff9:src/main.tsx'], { encoding: 'utf8' });
  let after = await readFile(new URL('src/main.tsx', base), 'utf8');
  after = after.replace("import './internal-readability.css';\n", '').replace('<ImportedDirectoryPage category="police" />', '<DirectoryPage title="Cảnh sát khu vực các phường" eyebrow="DANH BẠ PHỐI HỢP" description="Tra cứu cán bộ cảnh sát khu vực theo địa bàn phụ trách." entries={localPolice} icon="◈" />');
  assert.equal(after, before);
  for (const file of ['src/styles.css', 'src/bars-refinement.css', 'src/readability-refinement.css', 'src/home-status.tsx', 'server/data/jurors.json', 'server/data/neighborhoods.json']) {
    assert.equal(await readFile(new URL(file, base), 'utf8'), execFileSync('git', ['show', `feb7ff9:${file}`], { encoding: 'utf8' }), file);
  }
});

test('Font chỉ áp dụng mục con; ô nhập 16px và bảng 15px', async () => {
  const css = await readFile(new URL('src/internal-readability.css', base), 'utf8');
  assert.ok(css.includes('.internal-shell .ledger-table-scroll td{font-size:15px'));
  assert.ok(css.includes('.internal-shell .ledger-form input'));
  assert.ok(css.includes('font-size:16px'));
  assert.ok(!css.includes('.app-shell') && !css.includes('.login-shell'));
});

test('Dữ liệu Cảnh sát không bị đóng gói vào bundle hoặc tài nguyên public', async () => {
  for (const file of (await readdir(new URL('dist/assets/', base))).filter((file) => file.endsWith('.js'))) {
    const content = await readFile(new URL(`dist/assets/${file}`, base), 'utf8');
    for (const value of ['Ngô Duy Tân', '0984536373', 'Nguyễn Hoàng Thanh Vũ']) assert.ok(!content.includes(value));
  }
  const server = await readFile(new URL('server.mjs', base), 'utf8');
  assert.ok(server.includes("'/api/directories/police'"));
  const block = server.slice(server.indexOf("  if (['/api/directories/jurors'"), server.indexOf("  if (url.pathname === '/api/letters'"));
  assert.ok(block.indexOf('return json(res, 403') < block.indexOf('SELECT payload'));
});
