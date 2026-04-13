// MySQL pool — replaces the in-memory database.
// All route files import this as `db` and call db.query(sql, params).
import pool from './mysql.js';
export default pool;
