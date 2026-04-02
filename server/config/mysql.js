import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  uri: process.env.DB_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
