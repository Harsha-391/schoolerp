import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Strip ssl-mode from URI — mysql2 doesn't understand that param; we set ssl explicitly below
const dbUri = (process.env.DB_URL || '').replace(/[?&]ssl-mode=[^&]*/i, '').replace(/\?$/, '');

const pool = mysql.createPool({
  uri: dbUri,
  ssl: { rejectUnauthorized: false }, // required for Aiven / cloud MySQL
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
