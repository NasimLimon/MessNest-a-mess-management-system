const mysql = require('mysql2/promise');

// Create connection pool
let pool;

const createPool = async () => {
  if (!pool) {
    pool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mestnest',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
};

// Get connection
const getConnection = async () => {
  const pool = await createPool();
  return pool.getConnection();
};

// Execute query - single row
const dbGet = async (sql, params = []) => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

// Execute query - multiple rows
const dbAll = async (sql, params = []) => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows || [];
  } finally {
    connection.release();
  }
};

// Execute insert/update/delete
const dbRun = async (sql, params = []) => {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(sql, params);
    return {
      id: result.insertId,
      lastID: result.insertId,
      changes: result.affectedRows
    };
  } finally {
    connection.release();
  }
};

// Initialize database (create if not exists)
const initializeDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    // Create database
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'mestnest'}`);
    console.log(`Database '${process.env.DB_NAME || 'mestnest'}' ready`);
    return connection;
  } finally {
    await connection.end();
  }
};

module.exports = {
  createPool,
  getConnection,
  dbGet,
  dbAll,
  dbRun,
  initializeDatabase
};
