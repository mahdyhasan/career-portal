const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function applySchemaFix() {
  const databaseUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/augmex_career';
  const parsed = new URL(databaseUrl);

  const dbConfig = {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port || '3306'),
    user: parsed.username || 'root',
    password: parsed.password || '',
    database: parsed.pathname.substring(1) || 'augmex_career',
    multipleStatements: true
  };

  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    console.log('📖 Reading schema fix file...');
    const sqlContent = fs.readFileSync('database/schema-fix.sql', 'utf8');
    
    console.log('🔄 Executing schema fixes...');
    await connection.execute(sqlContent);
    console.log('✅ Schema fixes applied successfully!');

  } catch (error) {
    console.error('❌ Error applying schema fixes:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

applySchemaFix()
  .then(() => {
    console.log('🎉 All schema fixes have been applied successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema fix failed:', error);
    process.exit(1);
  });
