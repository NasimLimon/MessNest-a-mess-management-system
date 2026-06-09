-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'member') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members table (mess member profiles)
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive') DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Meals table (daily meal entries)
CREATE TABLE IF NOT EXISTS meals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  meal_date DATE NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
  quantity INT DEFAULT 1,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_meal (member_id, meal_date, meal_type)
);

-- Menu table (daily/weekly menu)
CREATE TABLE IF NOT EXISTS menu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_date DATE NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
  items LONGTEXT NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE KEY unique_menu (menu_date, meal_type)
);

-- Bills table (monthly billing)
CREATE TABLE IF NOT EXISTS bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  month VARCHAR(7) NOT NULL,
  meal_count INT DEFAULT 0,
  meal_rate DECIMAL(10, 2) DEFAULT 0.0,
  fixed_cost DECIMAL(10, 2) DEFAULT 0.0,
  extra_charges DECIMAL(10, 2) DEFAULT 0.0,
  total_amount DECIMAL(10, 2) DEFAULT 0.0,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_bill (member_id, month)
);

-- Payments table (payment tracking)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  bill_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method ENUM('cash', 'transfer', 'online', 'other') DEFAULT 'cash',
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

-- Expenses table (expense tracking)
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description LONGTEXT,
  expense_date DATE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Notices table (announcements)
CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  created_by INT NOT NULL,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Complaints table (complaint management)
CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT NOT NULL,
  complaint_type ENUM('food_quality', 'hygiene', 'service', 'other') NOT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  response LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  resolved_by INT,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Settings table (for mess-wide configuration)
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mess_name VARCHAR(255) DEFAULT 'MealNest Mess',
  admin_id INT,
  meal_rate DECIMAL(10, 2) DEFAULT 100.0,
  monthly_fixed_cost DECIMAL(10, 2) DEFAULT 500.0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);
