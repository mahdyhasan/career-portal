const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function fixTableNames() {
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

    console.log('📖 Reading table fix file...');
    const sqlContent = fs.readFileSync('database/fix-table-names.sql', 'utf8');
    
    // Split content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔄 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_FIELDNAME') {
            console.log(`⚠️  Statement ${i + 1}/${statements.length} skipped (already exists): ${error.message}`);
          } else {
            console.error(`❌ Statement ${i + 1}/${statements.length} failed:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }
    
    console.log('✅ Table fixes applied successfully!');

  } catch (error) {
    console.error('❌ Error fixing table names:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

fixTableNames()
  .then(() => {
    console.log('🎉 All table fixes have been applied successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Table fix failed:', error);
    process.exit(1);
  });
