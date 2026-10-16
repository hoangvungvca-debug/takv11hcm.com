import mysql from 'mysql2/promise';
if (!process.env.DATABASE_URL) throw new Error('Thiếu cấu hình cơ sở dữ liệu.');
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.execute(`CREATE TABLE IF NOT EXISTS site_online_users (
    open_id VARCHAR(191) PRIMARY KEY,
    last_seen DATETIME NOT NULL,
    INDEX idx_presence_last_seen (last_seen)
  )`);
  console.log('Bảng trạng thái online đã sẵn sàng. Không sửa dữ liệu tài khoản/công văn.');
} finally { await connection.end(); }
