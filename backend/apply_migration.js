const { Pool } = require('pg');
require('dotenv/config');

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await pool.query(`CREATE UNIQUE INDEX "Booking_active_startTime_key" ON "Booking"("startTime") WHERE status = 'CONFIRMED';`);
    console.log('Index created successfully');
    
    // Also record it in Prisma migrations table
    const migrationName = '20260830190000_double_booking_index';
    const checksum = 'manual_migration';
    await pool.query(`INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES (gen_random_uuid(), $1, now(), $2, '', NULL, now(), 1);`, [checksum, migrationName]);
    console.log('Migration recorded in Prisma table');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
