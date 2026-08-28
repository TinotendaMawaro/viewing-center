const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:CgbYQVEHcvrn84t3@db.bppwrpxmlglfkhcjzicn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function createTable() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "Viwers" (
        id TEXT PRIMARY KEY,
        date TEXT,
        category TEXT,
        name TEXT,
        location TEXT,
        total INTEGER DEFAULT 0,
        contact TEXT,
        breakdown TEXT,
        prayer_expectations TEXT
      );
    `;

    await client.query(createTableSQL);
    console.log('Table "Viwers" created successfully!');

    // Disable RLS for public access (since this is a client-side app)
    await client.query('ALTER TABLE "Viwers" DISABLE ROW LEVEL SECURITY;');
    console.log('Row Level Security disabled for public access');

    // Grant public access
    await client.query('GRANT ALL ON "Viwers" TO anon;');
    await client.query('GRANT ALL ON "Viwers" TO authenticated;');
    console.log('Public access granted');

    // Verify table exists
    const result = await client.query('SELECT COUNT(*) FROM "Viwers";');
    console.log('Table verified. Current row count:', result.rows[0].count);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

createTable();
