#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Career Portal...\n');

// Create necessary directories
console.log('📁 Creating directories...');
const directories = [
  'public/assets/resume',
  'public/assets/cover-letter', 
  'public/assets/portfolio',
  'logs'
];

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  } else {
    console.log(`✅ Already exists: ${dir}`);
  }
});

// Create environment file if it doesn't exist
console.log('\n🔧 Setting up environment configuration...');
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
  } else {
    // Create default .env file
    const defaultEnv = `# Database Configuration
DATABASE_URL=mysql://root:@localhost:3306/augmex_career

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
JWT_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
PORT=3001

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=public/assets

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@yourcompany.com`;
    
    fs.writeFileSync(envPath, defaultEnv);
    console.log('✅ Created default .env file');
  }
} else {
  console.log('✅ .env file already exists');
}

// Create package.json scripts if they don't exist
console.log('\n📦 Updating package.json...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add missing scripts
const requiredScripts = {
  'setup': 'node setup.js',
  'db:setup': 'mysql -u root -p < database/schema.sql && mysql -u root -p < database/add-color-field.sql',
  'dev:server': 'nodemon server/index.ts',
  'build:clean': 'rm -rf dist',
  'start:prod': 'NODE_ENV=production node dist/server.js'
};

let updated = false;
Object.entries(requiredScripts).forEach(([name, command]) => {
  if (!packageJson.scripts[name]) {
    packageJson.scripts[name] = command;
    updated = true;
    console.log(`✅ Added script: ${name}`);
  }
});

if (updated) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json');
} else {
  console.log('✅ All scripts already exist');
}

// Install dependencies
console.log('\n📥 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.log('❌ Failed to install dependencies. Please run "npm install" manually.');
}

// Create database schema if MySQL is available
console.log('\n🗄️ Setting up database...');
try {
  // Check if MySQL is available
  execSync('mysql --version', { stdio: 'ignore' });
  
  console.log('MySQL detected. You can run the following commands to setup the database:');
  console.log('  mysql -u root -p < database/schema.sql');
  console.log('  mysql -u root -p < database/add-color-field.sql');
  console.log('');
  console.log('Or run: npm run db:setup');
} catch (error) {
  console.log('⚠️ MySQL not detected or not in PATH. Please setup the database manually.');
}

// Create a simple health check file
console.log('\n🏥 Creating health check...');
const healthCheckPath = path.join(process.cwd(), 'health-check.js');
const healthCheckContent = `const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/api/ping',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(\`Status: \${res.statusCode}\`);
  res.on('data', (chunk) => {
    console.log('Response:', chunk.toString());
  });
});

req.on('error', (err) => {
  console.log('Server not responding:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Request timed out');
  req.destroy();
  process.exit(1);
});

req.end();`;

fs.writeFileSync(healthCheckPath, healthCheckContent);
console.log('✅ Created health check script');

// Final instructions
console.log('\n🎉 Setup complete!\n');
console.log('Next steps:');
console.log('1. Update your .env file with your database credentials');
console.log('2. Setup your MySQL database by running the schema files');
console.log('3. Start the development server with: npm run dev');
console.log('4. Visit http://localhost:3000 to see your career portal');
console.log('');
console.log('Default login credentials:');
console.log('Admin: admin@augmex.io / password');
console.log('');
console.log('For production deployment:');
console.log('1. Set NODE_ENV=production in your .env file');
console.log('2. Build the project: npm run build');
console.log('3. Start the production server: npm run start:prod');
console.log('');
console.log('🔒 Remember to change the JWT_SECRET in production!');
console.log('📧 Configure email settings for OTP functionality');
console.log('🗄️ Regularly backup your database');

// Make the script executable on Unix systems
if (process.platform !== 'win32') {
  try {
    execSync('chmod +x setup.js', { stdio: 'ignore' });
  } catch (error) {
    // Ignore error on Windows
  }
}

console.log('\n✨ Happy coding!');