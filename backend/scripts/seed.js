const bcryptjs = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/mestnest.db');

// Helper functions for promises
const dbRun = (db, sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (db, sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Seed database with default data
const seedDatabase = async () => {
  const db = new sqlite3.Database(dbPath);

  try {
    console.log('Starting database seeding...');

    // Hash default password
    const defaultPassword = bcryptjs.hashSync('admin123', 10);

    // Create admin user if doesn't exist
    const adminExists = await dbGet(db, 'SELECT id FROM users WHERE username = ?', ['admin']);

    if (!adminExists) {
      await dbRun(
        db,
        `INSERT INTO users (username, email, password, role)
         VALUES (?, ?, ?, ?)`,
        ['admin', 'admin@mestnest.local', defaultPassword, 'admin']
      );
      console.log('✓ Admin user created (username: admin, password: admin123)');
    }

    // Create default settings if doesn't exist
    const settingsExists = await dbGet(db, 'SELECT id FROM settings');

    if (!settingsExists) {
      // Get admin user ID
      const admin = await dbGet(db, 'SELECT id FROM users WHERE username = ?', ['admin']);

      await dbRun(
        db,
        `INSERT INTO settings (mess_name, admin_id, meal_rate, monthly_fixed_cost)
         VALUES (?, ?, ?, ?)`,
        ['MessNest Mess', admin.id, 100.0, 500.0]
      );
      console.log('✓ Default settings created');
    }

    // Create sample member if doesn't exist
    const memberExists = await dbGet(db, 'SELECT id FROM members');

    if (!memberExists) {
      // Create a sample member user first
      const memberPassword = bcryptjs.hashSync('member123', 10);
      const member = await dbRun(
        db,
        `INSERT INTO users (username, email, password, role)
         VALUES (?, ?, ?, ?)`,
        ['member1', 'member1@mestnest.local', memberPassword, 'member']
      );

      // Then create member profile
      await dbRun(
        db,
        `INSERT INTO members (user_id, full_name, phone, status)
         VALUES (?, ?, ?, ?)`,
        [member.lastID, 'John Doe', '9876543210', 'active']
      );
      console.log('✓ Sample member created (username: member1, password: member123)');
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('');
    console.log('Default credentials:');
    console.log('  Admin  - username: admin, password: admin123');
    console.log('  Member - username: member1, password: member123');
    console.log('');
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
};

// Run seeding
seedDatabase();
