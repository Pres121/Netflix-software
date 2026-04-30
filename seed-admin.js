require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

async function seedAdmin() {
  const username = process.argv[2] || 'Kellz';
  const password = process.argv[3] || 'kellzadmin121';

  try {
    const hash = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO admins (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
      [username, hash]
    );

    console.log(`Admin user seeded: ${username}`);
    console.log('If this is a real deployment, change the password immediately.');
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedAdmin();
