import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);
    console.log('✅ Database schema created successfully');

    // Read seed file
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');

    // Execute seed data
    await pool.query(seedData);
    console.log('✅ Sample data inserted successfully');

    console.log('🎉 Database initialization completed!');
    
    // Test the setup
    const result = await pool.query('SELECT COUNT(*) as count FROM spare_parts');
    console.log(`📊 Total parts in database: ${result.rows[0].count}`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then(() => {
      console.log('Database initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export default initDatabase;
