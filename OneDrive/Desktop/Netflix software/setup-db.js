require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function ensureDatabase() {
  const adminClient = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres'
  });

  await adminClient.connect();
  const dbName = process.env.DB_NAME || 'streaming_manager';
  const check = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

  if (check.rowCount === 0) {
    const safeDb = dbName.replace(/"/g, '');
    await adminClient.query(`CREATE DATABASE "${safeDb}"`);
    console.log(`Created database: ${dbName}`);
  } else {
    console.log(`Database already exists: ${dbName}`);
  }

  await adminClient.end();
}

async function applySchema() {
  const appClient = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'streaming_manager'
  });

  await appClient.connect();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await appClient.query(schemaSql);
  console.log('Schema applied successfully.');

  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';
  const passwordHash = await bcrypt.hash(password, 12);

  await appClient.query(
    `INSERT INTO admins (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
    [username, passwordHash]
  );

  console.log(`Admin ready: ${username}`);
  await appClient.end();
}

(async () => {
  try {
    await ensureDatabase();
    await applySchema();
    console.log('Setup complete.');
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
})();
