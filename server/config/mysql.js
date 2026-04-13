import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  uri: process.env.DB_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Auto-parse JSON columns returned from MySQL
  typeCast(field, next) {
    if (field.type === 'JSON') {
      const val = field.string();
      try { return val ? JSON.parse(val) : null; } catch { return val; }
    }
    return next();
  },
});

export default pool;
