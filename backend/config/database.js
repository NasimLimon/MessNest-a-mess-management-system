const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/mestnest.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database with schema
function initializeDatabase() {
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing database:', err.message);
    } else {
      console.log('Database schema initialized');
      seedDatabase();
    }
  });
}

// Seed database with initial data
function seedDatabase() {
  const adminPassword = require('bcryptjs').hashSync('admin123', 10);

  db.run(`INSERT OR IGNORE INTO users (username, email, password, role)
          VALUES (?, ?, ?, ?)`,
    ['admin', 'admin@mestnest.com', adminPassword, 'admin'],
    (err) => {
      if (!err) console.log('Admin user seeded');
    }
  );

  db.run(`INSERT OR IGNORE INTO settings (mess_name, meal_rate, monthly_fixed_cost)
          VALUES (?, ?, ?)`,
    ['MealNest Demo Mess', 100, 500],
    (err) => {
      if (!err) console.log('Settings initialized');
    }
  );
}

// Helper functions
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  db,
  dbGet,
  dbAll,
  dbRun
};
