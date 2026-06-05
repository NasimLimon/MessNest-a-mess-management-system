const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

// Create connection pool
const createPool = async () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mestnest',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    try {
      const connection = await pool.getConnection();
      console.log('✓ Connected to MySQL database');
      connection.release();
    } catch (err) {
      console.error('✗ Database connection failed:', err.message);
    }
  }
  return pool;
};

// Execute any query and return results
const query = async (sql, params = []) => {
  const pool_instance = await createPool();
  const connection = await pool_instance.getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    connection.release();
  }
};

// Get single row
const dbGet = async (sql, params = []) => {
  const results = await query(sql, params);
  return results[0] || null;
};

// Get all rows
const dbAll = async (sql, params = []) => {
  return await query(sql, params);
};

// Insert/Update/Delete
const dbRun = async (sql, params = []) => {
  const pool_instance = await createPool();
  const connection = await pool_instance.getConnection();
  try {
    const [result] = await connection.execute(sql, params);
    return {
      id: result.insertId,
      insertId: result.insertId,
      lastID: result.insertId,
      changes: result.affectedRows
    };
  } finally {
    connection.release();
  }
};

module.exports = {
  createPool,
  query,
  dbGet,
  dbAll,
  dbRun
};
