const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:CgbYQVEHcvrn84t3@db.bppwrpxmlglfkhcjzicn.supabase.co:5432/postgres',
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
