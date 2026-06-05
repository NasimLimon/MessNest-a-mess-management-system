const bcryptjs = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const seedDatabase = async () => {
  let connection;
  try {
    console.log('Connecting to database...');

    // Create connection to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mestnest'
    });

    console.log('? Connected to database');
    console.log('Starting database seeding...\n');

    // Hash default passwords
    const adminPassword = bcryptjs.hashSync('admin123', 10);
    const memberPassword = bcryptjs.hashSync('member123', 10);

    // Create admin user if doesn't exist
    const [adminRows] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );

    if (adminRows.length === 0) {
      const [result] = await connection.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@mestnest.local', adminPassword, 'admin']
      );
      console.log('? Admin user created (username: admin, password: admin123)');
      const adminId = result.insertId;

      // Create default settings
      const [settingsRows] = await connection.execute('SELECT id FROM settings');
      if (settingsRows.length === 0) {
        await connection.execute(
          'INSERT INTO settings (mess_name, admin_id, meal_rate, monthly_fixed_cost) VALUES (?, ?, ?, ?)',
          ['MessNest Mess', adminId, 100.0, 500.0]
        );
        console.log('? Default settings created');
      }
    } else {
      console.log('? Admin user already exists');
    }

    // Create sample member if doesn't exist
    const [memberRows] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['member1']
    );

    if (memberRows.length === 0) {
      // Create member user
      const [memberResult] = await connection.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['member1', 'member1@mestnest.local', memberPassword, 'member']
      );
      const memberId = memberResult.insertId;

      // Create member profile
      await connection.execute(
        'INSERT INTO members (user_id, full_name, phone, status) VALUES (?, ?, ?, ?)',
        [memberId, 'John Doe', '9876543210', 'active']
      );
      console.log('? Sample member created (username: member1, password: member123)');
    } else {
      console.log('? Sample member user already exists');
    }

    console.log('\n? Database seeding completed successfully!');
    console.log('');
    console.log('Default credentials:');
    console.log('  Admin  - username: admin, password: admin123');
    console.log('  Member - username: member1, password: member123');
    console.log('');

    await connection.end();
  } catch (error) {
    console.error('? Error seeding database:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
