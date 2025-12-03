const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabaseDirect() {
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

    console.log('🔨 Creating views and missing tables...');

    // Create views to map existing tables to expected names
    const viewsAndTables = [
      // Views for existing tables
      `CREATE OR REPLACE VIEW system_skills AS SELECT * FROM skills`,
      `CREATE OR REPLACE VIEW system_areas AS SELECT * FROM areas`,
      `CREATE OR REPLACE VIEW system_departments AS SELECT * FROM departments`,
      `CREATE OR REPLACE VIEW candidate_educations AS SELECT id, user_id as candidate_profile_id, institute_name, degree, major_subject, graduation_year, result, created_at, updated_at FROM education`,
      `CREATE OR REPLACE VIEW candidate_achievements AS SELECT id, user_id as candidate_profile_id, title, description, url, created_at, updated_at, issue_date FROM achievements`,
      `CREATE OR REPLACE VIEW job_posts AS SELECT id, title, department_id, experience_level_id, job_type_id, status_id, summary, responsibilities, requirements, benefits, salary_min, salary_max, deadline, created_by, created_at, updated_at, deleted_at, NULL as form_field_id, NULL as description FROM jobs`,
      
      // New tables that don't exist
      `CREATE TABLE IF NOT EXISTS application_statuses (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_name (name))`,
      `CREATE TABLE IF NOT EXISTS job_statuses (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_name (name))`,
      `CREATE TABLE IF NOT EXISTS candidate_skills (id INT AUTO_INCREMENT PRIMARY KEY, candidate_profile_id INT NOT NULL, skill_id INT NOT NULL, proficiency ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner', years_experience DECIMAL(3, 1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY unique_candidate_skill (candidate_profile_id, skill_id), INDEX idx_candidate_profile_id (candidate_profile_id), INDEX idx_skill_id (skill_id))`,
      `CREATE TABLE IF NOT EXISTS candidate_attachments (id INT AUTO_INCREMENT PRIMARY KEY, candidate_profile_id INT NOT NULL, file_type ENUM('resume', 'coverLetter', 'portfolio', 'CV', 'Certificate', 'Other') NOT NULL, file_url VARCHAR(500) NOT NULL, file_size_kb INT, mime_type VARCHAR(100), uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_candidate_profile_id (candidate_profile_id), INDEX idx_file_type (file_type))`,
      `CREATE TABLE IF NOT EXISTS candidate_profiles (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE, full_name VARCHAR(255), phone VARCHAR(20), earliest_join_date DATE, area_id INT, linkedin_url VARCHAR(255), github_url VARCHAR(255), portfolio_url VARCHAR(255), exp_salary_min DECIMAL(10, 2), exp_salary_max DECIMAL(10, 2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at TIMESTAMP NULL, INDEX idx_user_id (user_id), INDEX idx_deleted_at (deleted_at))`,
      `CREATE TABLE IF NOT EXISTS job_form_fields (id INT AUTO_INCREMENT PRIMARY KEY, input_type ENUM('text', 'textarea', 'select', 'checkbox', 'radio', 'email', 'number', 'date', 'file') NOT NULL, label VARCHAR(255) NOT NULL, options JSON, is_required BOOLEAN DEFAULT FALSE, validation_rules JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_input_type (input_type), INDEX idx_label (label))`,
      `CREATE TABLE IF NOT EXISTS application_answers (id INT AUTO_INCREMENT PRIMARY KEY, application_id INT NOT NULL, job_form_field_id INT NOT NULL, answer_text TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_application_id (application_id), INDEX idx_job_form_field_id (job_form_field_id))`
    ];

    for (let i = 0; i < viewsAndTables.length; i++) {
      const sql = viewsAndTables[i];
      try {
        await connection.execute(sql);
        console.log(`✅ ${i + 1}/${viewsAndTables.length}: Created view/table`);
      } catch (error) {
        console.log(`⚠️  ${i + 1}/${viewsAndTables.length}: ${error.message}`);
      }
    }

    // Insert basic data
    console.log('📝 Inserting basic data...');
    
    try {
      await connection.execute(`INSERT IGNORE INTO application_statuses (name, description) VALUES ('Applied', 'Application has been submitted'), ('Under Review', 'Application is being reviewed'), ('Interview Scheduled', 'Interview has been scheduled'), ('Interview Completed', 'Interview has been completed'), ('Offer Made', 'Job offer has been made'), ('Offer Accepted', 'Job offer has been accepted'), ('Offer Rejected', 'Job offer has been rejected'), ('Hired', 'Candidate has been hired'), ('Rejected', 'Application has been rejected'), ('Withdrawn', 'Application has been withdrawn by candidate')`);
      console.log('✅ Inserted application statuses');
    } catch (error) {
      console.log(`⚠️  Application statuses: ${error.message}`);
    }

    try {
      await connection.execute(`INSERT IGNORE INTO job_statuses (name, description) VALUES ('Draft', 'Job is in draft mode'), ('Published', 'Job is published and accepting applications'), ('Closed', 'Job is closed to new applications'), ('Archived', 'Job is archived')`);
      console.log('✅ Inserted job statuses');
    } catch (error) {
      console.log(`⚠️  Job statuses: ${error.message}`);
    }

    try {
      await connection.execute(`INSERT IGNORE INTO job_form_fields (input_type, label, is_required) VALUES ('text', 'First Name', true), ('text', 'Last Name', true), ('email', 'Email', true), ('tel', 'Phone Number', false), ('textarea', 'Cover Letter', false), ('file', 'Resume', true)`);
      console.log('✅ Inserted job form fields');
    } catch (error) {
      console.log(`⚠️  Job form fields: ${error.message}`);
    }

    // Add missing columns to users table
    console.log('🔧 Adding missing columns to users table...');
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INT NULL AFTER role`);
      console.log('✅ Added role_id column to users');
    } catch (error) {
      console.log(`⚠️  role_id column: ${error.message}`);
    }

    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE AFTER role_id`);
      console.log('✅ Added is_active column to users');
    } catch (error) {
      console.log(`⚠️  is_active column: ${error.message}`);
    }

    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL AFTER is_active`);
      console.log('✅ Added deleted_at column to users');
    } catch (error) {
      console.log(`⚠️  deleted_at column: ${error.message}`);
    }

    // Create candidate profiles for existing users
    console.log('👤 Creating candidate profiles for existing users...');
    try {
      await connection.execute(`INSERT IGNORE INTO candidate_profiles (user_id, full_name, created_at, updated_at) SELECT id, CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')), NOW(), NOW() FROM users WHERE role = 'Candidate' AND (deleted_at IS NULL OR deleted_at IS NULL)`);
      console.log('✅ Created candidate profiles for existing users');
    } catch (error) {
      console.log(`⚠️  Candidate profiles: ${error.message}`);
    }

    console.log('✅ Database fixes completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

fixDatabaseDirect()
  .then(() => {
    console.log('🎉 Database has been fixed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database fix failed:', error);
    process.exit(1);
  });
