const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');

    // Create connection to MySQL server (without database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('? Connected to MySQL server');

    // Create database
    const dbName = process.env.DB_NAME || 'mestnest';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`? Database '${dbName}' created or already exists`);

    // Select database
    await connection.changeUser({ database: dbName });
    console.log(`? Selected database '${dbName}'`);

    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await connection.execute(statement);
      } catch (err) {
        console.error('Error executing statement:', statement);
        throw err;
      }
    }

    console.log('? Database schema initialized successfully');

    await connection.end();
    console.log('\n? Database initialization completed!');
  } catch (error) {
    console.error('? Error initializing database:', error.message);
    process.exit(1);
  }
};

// Run initialization
initializeDatabase();
