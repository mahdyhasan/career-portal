import mysql from 'mysql2/promise';
import { parse } from 'url';

// Parse DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/augmex_career';
const parsed = parse(databaseUrl);

const dbConfig = {
  host: parsed.hostname || 'localhost',
  port: parseInt(parsed.port || '3306'),
  user: parsed.auth?.split(':')[0] || 'root',
  password: parsed.auth?.split(':')[1] || '',
  database: parsed.pathname?.substring(1) || 'augmex_career',
};

async function createOTPTable() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS otp_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email_otp (email, otp)
      )
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ OTP table created successfully');
  } catch (error) {
    console.error('❌ Error creating OTP table:', error);
  } finally {
    await connection.end();
  }
}

createOTPTable();
