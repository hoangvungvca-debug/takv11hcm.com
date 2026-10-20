import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL chưa được cấu hình.');
const staff = JSON.parse(await readFile(new URL('../server/data/staff.json', import.meta.url), 'utf8'));
const pool = mysql.createPool(url);
await pool.query(`CREATE TABLE IF NOT EXISTS attendance_staff (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, source_no INT NOT NULL, name VARCHAR(255) NOT NULL,
 position VARCHAR(255) NULL, title VARCHAR(255) NULL, unit VARCHAR(255) NULL,
 identity_no VARCHAR(64) NULL, birth_date VARCHAR(64) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_attendance_staff_source (source_no), INDEX idx_attendance_staff_name (name)
)`);
for (const item of staff) {
 const birthDate = item.birthMale || item.birthFemale || null;
 await pool.execute(`INSERT INTO attendance_staff (source_no,name,position,title,unit,identity_no,birth_date)
 VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), position=VALUES(position), title=VALUES(title), unit=VALUES(unit), identity_no=VALUES(identity_no), birth_date=VALUES(birth_date)`, [item.sourceNo,item.name,item.position,item.title,item.unit,null,birthDate]);
}
console.log(`Imported ${staff.length} staff records.`);
await pool.end();
