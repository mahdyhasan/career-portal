import mysql from 'mysql2/promise';

async function addIndustriesTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'augmex_career',
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database');

    // Create industries table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS industries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Industries table created successfully');

    // Insert sample industries
    const sampleIndustries = [
      'Technology',
      'Healthcare',
      'Finance',
      'Education',
      'Manufacturing',
      'Retail',
      'Consulting',
      'Media & Entertainment',
      'Real Estate',
      'Transportation',
      'Energy',
      'Agriculture',
      'Government',
      'Non-profit',
      'Telecommunications'
    ];

    for (const industry of sampleIndustries) {
      await connection.execute(
        'INSERT IGNORE INTO industries (name) VALUES (?)',
        [industry]
      );
    }

    console.log('Sample industries inserted successfully');

    await connection.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addIndustriesTable();
