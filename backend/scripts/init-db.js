const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/mestnest.db');

// Create/initialize database with schema
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }

      console.log('Connected to database');

      // Read schema file
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Execute schema
      db.exec(schema, (err) => {
        if (err) {
          console.error('Error executing schema:', err);
          reject(err);
          return;
        }

        console.log('Database schema initialized successfully');
        resolve(db);
      });
    });
  });
};

// Close database connection
const closeDatabase = (db) => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = { initializeDatabase, closeDatabase };
