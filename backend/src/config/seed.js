const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function seed() {
  console.log('Starting database seeding...');
  
  // Connection options without database to allow creating it first
  const connectionOptions = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  let connection;
  try {
    connection = await mysql.createConnection(connectionOptions);
    
    const dbName = process.env.DB_NAME || 'medistore_db';
    console.log(`Creating database "${dbName}" if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    console.log('Creating "admins" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`admins\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(255) NOT NULL UNIQUE,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Creating "orders" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`order_number\` VARCHAR(50) NOT NULL UNIQUE,
        \`customer_name\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(50) NOT NULL,
        \`address\` TEXT NOT NULL,
        \`medicines_requested\` TEXT NOT NULL,
        \`prescription_url\` VARCHAR(500) DEFAULT NULL,
        \`status\` ENUM('pending', 'accepted', 'rejected', 'delivered') DEFAULT 'pending',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (\`status\`),
        INDEX idx_created_at (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if an admin already exists
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM admins');
    if (rows[0].count === 0) {
      const defaultUsername = 'admin';
      const defaultPassword = 'admin123';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      console.log(`Inserting default admin user (Username: ${defaultUsername}, Password: ${defaultPassword})...`);
      await connection.query(
        'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
        [defaultUsername, passwordHash]
      );
      console.log('Default admin user created successfully.');
    } else {
      console.log('Admins table already contains accounts. Skipping default admin insert.');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
