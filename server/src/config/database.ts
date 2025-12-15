import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'weland',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const cscaPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_CSCA_NAME || 'csca_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export { pool, cscaPool };


