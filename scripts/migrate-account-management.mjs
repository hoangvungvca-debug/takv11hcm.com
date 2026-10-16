import mysql from 'mysql2/promise';
import { ensureAccountSchema } from '../server/account-management.mjs';

if (!process.env.DATABASE_URL) throw new Error('Thiếu cấu hình cơ sở dữ liệu.');
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [tables] = await connection.query("SHOW TABLES LIKE 'app_users'");
  if (!tables.length) throw new Error('Chưa có bảng tài khoản; cần khởi tạo máy chủ website trước.');
  await ensureAccountSchema(connection);
  const [columns] = await connection.query('SHOW COLUMNS FROM app_users');
  const required = ['deleted_at', 'previous_status', 'session_version'];
  if (!required.every((name) => columns.some((column) => column.Field === name))) {
    throw new Error('Migration chưa hoàn tất.');
  }
  console.log('Migration quản trị đã hoàn tất: thêm metadata xóa/khôi phục, phiên, ràng buộc email và nhật ký. Không xóa hoặc thay trạng thái tài khoản.');
} finally { await connection.end(); }
