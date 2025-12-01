// server/config/database.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { parse } from 'url';

dotenv.config();

// Parse DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/augmex_career';
const parsed = parse(databaseUrl);

const dbConfig = {
  host: parsed.hostname || 'localhost',
  port: parseInt(parsed.port || '3306'),
  user: parsed.auth?.split(':')[0] || 'root',
  password: parsed.auth?.split(':')[1] || '',
  database: parsed.pathname?.substring(1) || 'augmex_career',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Execute query with error handling
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Execute single query (INSERT, UPDATE, DELETE)
export async function executeSingleQuery(
  query: string, 
  params: any[] = []
): Promise<mysql.ResultSetHeader> {
  try {
    const [result] = await pool.execute(query, params);
    return result as mysql.ResultSetHeader;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get single record
export async function findOne<T = any>(
  query: string, 
  params: any[] = []
): Promise<T | null> {
  try {
    const rows = await executeQuery<T>(query, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Close connection pool
export async function closeConnection() {
  await pool.end();
  console.log('Database connection closed');
}

export default pool;