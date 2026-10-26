import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) throw new Error('Thiếu cấu hình cơ sở dữ liệu.');
const selected = process.argv.slice(2);
const replace = selected.includes('--replace');
const requested = selected.filter((value) => value !== '--replace');
const categories = requested.length ? requested : ['jurors', 'neighborhoods', 'police'];
if (categories.some((category) => !['jurors', 'neighborhoods', 'police'].includes(category))) throw new Error('Loại danh bạ không hợp lệ.');
const groups = await Promise.all(categories.map(async (category) => ({ category,
  ...JSON.parse(await readFile(new URL(`../server/data/${category}.json`, import.meta.url), 'utf8')),
})));
for (const group of groups) {
  if (!group.entries.length || new Set(group.entries.map((entry) => entry.id)).size !== group.entries.length) {
    throw new Error(`Danh sách ${group.category} trống hoặc trùng mã nguồn.`);
  }
}
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.execute(`CREATE TABLE IF NOT EXISTS directory_contacts (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(32) NOT NULL,
    ward VARCHAR(128) NOT NULL,
    neighborhood VARCHAR(80) NOT NULL,
    payload JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_directory_category_ward (category, ward)
  )`);
  await connection.beginTransaction();
  try {
    for (const group of groups) {
      if (replace) await connection.execute('DELETE FROM directory_contacts WHERE category=?', [group.category]);
      for (let offset = 0; offset < group.entries.length; offset += 100) {
        const batch = group.entries.slice(offset, offset + 100);
        await connection.execute(`INSERT INTO directory_contacts (id, category, ward, neighborhood, payload)
          VALUES ${batch.map(() => '(?,?,?,?,?)').join(',')}
          ON DUPLICATE KEY UPDATE category=VALUES(category), ward=VALUES(ward),
          neighborhood=VALUES(neighborhood), payload=VALUES(payload)`,
          batch.flatMap((entry) => [entry.id, group.category, entry.ward, entry.neighborhood, JSON.stringify(entry)]));
        console.log(`${group.category}: đã xử lý ${Math.min(offset + 100, group.entries.length)}/${group.entries.length}`);
      }
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  for (const group of groups) {
    const [rows] = await connection.execute('SELECT COUNT(*) AS count FROM directory_contacts WHERE category=?', [group.category]);
    console.log(`${group.category}: nhập ${group.entries.length}, tổng lưu ${rows[0].count}`);
  }
} finally { await connection.end(); }
