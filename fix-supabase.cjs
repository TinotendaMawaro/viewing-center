const { Client } = require('pg');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bppwrpxmlglfkhcjzicn.supabase.co';
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_DB_PASSWORD) {
  console.error('Error: SUPABASE_DB_PASSWORD environment variable is required');
  console.error('Set it with: $env:SUPABASE_DB_PASSWORD="your-db-password"');
  process.exit(1);
}

const connectionString = `postgresql://postgres:${encodeURIComponent(SUPABASE_DB_PASSWORD)}@db.bppwrpxmlglfkhcjzicn.supabase.co:5432/postgres`;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    await client.query('ALTER TABLE "Viwers" DISABLE ROW LEVEL SECURITY;');
    console.log('RLS disabled on Viwers');

    await client.query('GRANT ALL ON "Viwers" TO anon;');
    await client.query('GRANT ALL ON "Viwers" TO authenticated;');
    console.log('Grants applied');

    const result = await client.query('SELECT COUNT(*) FROM "Viwers";');
    console.log('Current rows:', result.rows[0].count);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
