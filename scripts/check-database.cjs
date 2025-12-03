const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  const databaseUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/augmex_career';
  const parsed = new URL(databaseUrl);

  const dbConfig = {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port || '3306'),
    user: parsed.username || 'root',
    password: parsed.password || '',
    database: parsed.pathname.substring(1) || 'augmex_career',
  };

  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Check what tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 Existing tables:');
    tables.forEach((row) => {
      const tableName = row[Object.keys(row)[0]];
      console.log(`  - ${tableName}`);
    });

    // Check if critical tables exist
    const criticalTables = [
      'candidate_profiles',
      'candidate_educations', 
      'candidate_achievements',
      'candidate_attachments',
      'candidate_skills',
      'system_skills',
      'system_areas',
      'system_departments',
      'job_posts',
      'application_statuses',
      'job_statuses',
      'roles',
      'otp_codes'
    ];

    console.log('\n🔍 Checking critical tables:');
    criticalTables.forEach(async (tableName) => {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`  ✅ ${tableName}: ${result[0].count} rows`);
      } catch (error) {
        console.log(`  ❌ ${tableName}: Table does not exist`);
      }
    });

    // Create missing tables one by one
    console.log('\n🔨 Creating missing tables...');
    
    const tablesToCreate = [
      `CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS candidate_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        full_name VARCHAR(255),
        phone VARCHAR(20),
        earliest_join_date DATE,
        area_id INT,
        linkedin_url VARCHAR(255),
        github_url VARCHAR(255),
        portfolio_url VARCHAR(255),
        exp_salary_min DECIMAL(10, 2),
        exp_salary_max DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      )`,

      `CREATE TABLE IF NOT EXISTS candidate_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidate_profile_id INT NOT NULL,
        file_type ENUM('resume', 'coverLetter', 'portfolio', 'CV', 'Certificate', 'Other') NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS system_skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (let i = 0; i < tablesToCreate.length; i++) {
      const sql = tablesToCreate[i];
      try {
        await connection.execute(sql);
        console.log(`  ✅ Created table ${i + 1}/${tablesToCreate.length}`);
      } catch (error) {
        console.log(`  ⚠️  Table ${i + 1}/${tablesToCreate.length} already exists or error: ${error.message}`);
      }
    }

    // Insert basic data
    console.log('\n📝 Inserting basic data...');
    try {
      await connection.execute(`INSERT IGNORE INTO roles (name, description) VALUES 
        ('SuperAdmin', 'Super administrator with full system access'),
        ('HiringManager', 'Manager who can create jobs and review applications'),
        ('Candidate', 'Job seeker who can apply for jobs')`);
      console.log('  ✅ Inserted roles');
    } catch (error) {
      console.log(`  ⚠️  Roles already exist`);
    }

    try {
      await connection.execute(`INSERT IGNORE INTO system_skills (name, is_approved) VALUES 
        ('JavaScript', true),
        ('Python', true),
        ('React', true),
        ('Node.js', true),
        ('MySQL', true)`);
      console.log('  ✅ Inserted sample skills');
    } catch (error) {
      console.log(`  ⚠️  Skills already exist`);
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

checkDatabase()
  .then(() => {
    console.log('\n🎉 Database check and setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database check failed:', error);
    process.exit(1);
  });
