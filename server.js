require('dotenv').config();
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const connectPgSimple = require('connect-pg-simple');
const pool = require('./db');
const { encryptText } = require('./utils/security');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const sessionSecret = process.env.SESSION_SECRET || crypto.createHash('sha256').update(process.env.DATABASE_URL || 'streaming-subscription-manager').digest('hex');

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        "font-src": ["'self'", 'https://fonts.gstatic.com', 'data:'],
        "img-src": ["'self'", 'data:'],
        "connect-src": ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

const PgSessionStore = connectPgSimple(session);

app.use(
  session({
    store: new PgSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    }),
    name: 'streaming.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 30
    }
  })
);

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' }
  })
);

app.use(
  '/api/auth/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 6,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Try again in 15 minutes.' }
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function sanitizeText(value, maxLength = 255) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function requireAuth(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return next();
}

function ensureCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }

  return next();
}

function requireCsrf(req, res, next) {
  const method = req.method.toUpperCase();
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(method) || req.path === '/api/auth/login') {
    return next();
  }

  const token = req.get('x-csrf-token');
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ message: 'Invalid CSRF token.' });
  }

  return next();
}

function paymentStatusFromNextDate(nextPaymentDate) {
  if (!nextPaymentDate) {
    return 'Not Yet Paid';
  }

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const nextUtc = Date.UTC(nextPaymentDate.getUTCFullYear(), nextPaymentDate.getUTCMonth(), nextPaymentDate.getUTCDate());

  return nextUtc < todayUtc ? 'Pending Payment' : 'Paid';
}

function profileStateFromPaymentStatus(paymentStatus) {
  return {
    paymentStatus,
    status: paymentStatus === 'Paid' ? 'Active' : 'Inactive'
  };
}

async function updateAccountStatus(client, accountId) {
  const result = await client.query('SELECT COUNT(*)::int AS profile_count FROM profiles WHERE account_id = $1', [accountId]);
  const count = result.rows[0]?.profile_count || 0;
  const status = count >= 4 ? 'Full' : 'Available';

  await client.query('UPDATE accounts SET status = $1, updated_at = NOW() WHERE id = $2', [status, accountId]);
}

async function refreshSingleProfileStatus(client, profileId) {
  const latestPayment = await client.query(
    `SELECT next_payment_date
     FROM payments
     WHERE profile_id = $1
     ORDER BY payment_date DESC, id DESC
     LIMIT 1`,
    [profileId]
  );

  const nextDate = latestPayment.rows[0]?.next_payment_date || null;
  const paymentStatus = paymentStatusFromNextDate(nextDate);
  const nextState = profileStateFromPaymentStatus(paymentStatus);

  await client.query(
    `UPDATE profiles
     SET payment_status = $1,
         status = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [nextState.paymentStatus, nextState.status, profileId]
  );
}

async function refreshAllProfileStatuses() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const profiles = await client.query('SELECT id FROM profiles');
    for (const row of profiles.rows) {
      await refreshSingleProfileStatus(client, row.id);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function publicAccount(row) {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    profile_count: row.profile_count || 0
  };
}

function publicProfile(row) {
  return {
    id: row.id,
    account_id: row.account_id,
    account_email: row.account_email,
    profile_name: row.profile_name,
    username: row.username,
    full_name: row.full_name,
    phone_number: row.phone_number,
    payment_status: row.payment_status,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

app.use(ensureCsrfToken);
app.use(requireCsrf);

app.get('/', (req, res) => {
  res.redirect(req.session.adminId ? '/dashboard.html' : '/login.html');
});

app.get('/api/auth/csrf', (req, res) => {
  res.json({ csrfToken: req.session.csrfToken });
});

app.post('/api/auth/login', async (req, res) => {
  const username = sanitizeText(req.body.username, 100);
  const password = sanitizeText(req.body.password, 200);

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const result = await pool.query('SELECT id, username, password_hash FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    req.session.adminId = admin.id;
    req.session.username = admin.username;
    req.session.csrfToken = generateCsrfToken();

    return res.json({ message: 'Login successful.', csrfToken: req.session.csrfToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to login.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('streaming.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({ authenticated: true, username: req.session.username, csrfToken: req.session.csrfToken });
});

app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    await refreshAllProfileStatuses();

    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM accounts) AS total_accounts,
        (SELECT COUNT(*)::int FROM accounts WHERE status = 'Full') AS full_accounts,
        (SELECT COUNT(*)::int FROM profiles) AS total_profiles,
        (SELECT COUNT(*)::int FROM profiles WHERE status = 'Active') AS active_profiles,
        (SELECT COUNT(*)::int FROM profiles WHERE payment_status IN ('Pending Payment', 'Not Yet Paid')) AS pending_payments
    `);

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to load dashboard stats.' });
  }
});

app.get('/api/accounts', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.email, a.status, a.created_at, a.updated_at, COUNT(p.id)::int AS profile_count
       FROM accounts a
       LEFT JOIN profiles p ON p.account_id = a.id
       GROUP BY a.id
       ORDER BY a.id DESC`
    );

    return res.json(result.rows.map(publicAccount));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch accounts.' });
  }
});

app.post('/api/accounts', requireAuth, async (req, res) => {
  const email = sanitizeText(req.body.email, 255).toLowerCase();
  const password = sanitizeText(req.body.password, 200);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO accounts (email, password, status)
       VALUES ($1, $2, 'Available')
       RETURNING id, email, status, created_at, updated_at`,
      [email, encryptText(password)]
    );

    return res.status(201).json(publicAccount(result.rows[0]));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create account.' });
  }
});

app.put('/api/accounts/:id', requireAuth, async (req, res) => {
  const accountId = Number(req.params.id);
  const email = sanitizeText(req.body.email, 255).toLowerCase();
  const password = sanitizeText(req.body.password, 200);

  if (!Number.isInteger(accountId) || !email) {
    return res.status(400).json({ message: 'Valid id and email are required.' });
  }

  try {
    const query = password
      ? `UPDATE accounts
         SET email = $1, password = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING id, email, status, created_at, updated_at`
      : `UPDATE accounts
         SET email = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, email, status, created_at, updated_at`;

    const values = password ? [email, encryptText(password), accountId] : [email, accountId];
    const result = await pool.query(query, values);

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await updateAccountStatus(client, accountId);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return res.json(publicAccount(result.rows[0]));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update account.' });
  }
});

app.delete('/api/accounts/:id', requireAuth, async (req, res) => {
  const accountId = Number(req.params.id);

  if (!Number.isInteger(accountId)) {
    return res.status(400).json({ message: 'Invalid account id.' });
  }

  try {
    const result = await pool.query('DELETE FROM accounts WHERE id = $1 RETURNING id', [accountId]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    return res.json({ message: 'Account deleted.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete account.' });
  }
});

app.get('/api/profiles', requireAuth, async (req, res) => {
  const accountId = req.query.accountId ? Number(req.query.accountId) : null;
  const status = sanitizeText(req.query.status || '', 20);

  const conditions = [];
  const values = [];

  if (Number.isInteger(accountId)) {
    values.push(accountId);
    conditions.push(`p.account_id = $${values.length}`);
  }

  if (status && ['Active', 'Inactive'].includes(status)) {
    values.push(status);
    conditions.push(`p.status = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    await refreshAllProfileStatuses();

    const result = await pool.query(
      `SELECT p.id, p.account_id, p.profile_name, p.username, p.full_name, p.phone_number,
              p.payment_status, p.status, p.created_at, p.updated_at, a.email AS account_email
       FROM profiles p
       JOIN accounts a ON a.id = p.account_id
       ${whereClause}
       ORDER BY p.id DESC`,
      values
    );

    return res.json(result.rows.map(publicProfile));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch profiles.' });
  }
});

app.post('/api/profiles', requireAuth, async (req, res) => {
  const accountId = Number(req.body.account_id);
  const profileName = sanitizeText(req.body.profile_name, 120);
  const username = sanitizeText(req.body.username, 120);
  const password = sanitizeText(req.body.password, 200);
  const fullName = sanitizeText(req.body.full_name, 150);
  const phoneNumber = sanitizeText(req.body.phone_number, 30);

  if (!Number.isInteger(accountId) || !profileName || !username || !password || !fullName || !phoneNumber) {
    return res.status(400).json({ message: 'account_id, profile_name, username, password, full_name, and phone_number are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const countResult = await client.query('SELECT COUNT(*)::int AS profile_count FROM profiles WHERE account_id = $1', [accountId]);
    if ((countResult.rows[0]?.profile_count || 0) >= 4) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'This account already has 4 profiles.' });
    }

    const result = await client.query(
      `INSERT INTO profiles (account_id, profile_name, username, password, full_name, phone_number, payment_status, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Not Yet Paid', 'Inactive')
       RETURNING id, account_id, profile_name, username, full_name, phone_number, payment_status, status, created_at, updated_at`,
      [accountId, profileName, username, encryptText(password), fullName, phoneNumber]
    );

    await updateAccountStatus(client, accountId);
    await client.query('COMMIT');
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to create profile.' });
  } finally {
    client.release();
  }
});

app.put('/api/profiles/:id', requireAuth, async (req, res) => {
  const profileId = Number(req.params.id);
  const accountId = Number(req.body.account_id);
  const profileName = sanitizeText(req.body.profile_name, 120);
  const username = sanitizeText(req.body.username, 120);
  const password = sanitizeText(req.body.password, 200);
  const fullName = sanitizeText(req.body.full_name, 150);
  const phoneNumber = sanitizeText(req.body.phone_number, 30);

  if (!Number.isInteger(profileId) || !Number.isInteger(accountId) || !profileName || !username || !fullName || !phoneNumber) {
    return res.status(400).json({ message: 'Valid id, account_id, profile_name, username, full_name, and phone_number are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentResult = await client.query('SELECT * FROM profiles WHERE id = $1', [profileId]);
    const current = currentResult.rows[0];
    if (!current) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Profile not found.' });
    }

    if (current.account_id !== accountId) {
      const countResult = await client.query('SELECT COUNT(*)::int AS profile_count FROM profiles WHERE account_id = $1', [accountId]);
      if ((countResult.rows[0]?.profile_count || 0) >= 4) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Target account already has 4 profiles.' });
      }
    }

    const query = password
      ? `UPDATE profiles
         SET account_id = $1, profile_name = $2, username = $3, password = $4,
             full_name = $5, phone_number = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING id, account_id, profile_name, username, full_name, phone_number, payment_status, status, created_at, updated_at`
      : `UPDATE profiles
         SET account_id = $1, profile_name = $2, username = $3,
             full_name = $4, phone_number = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING id, account_id, profile_name, username, full_name, phone_number, payment_status, status, created_at, updated_at`;

    const values = password
      ? [accountId, profileName, username, encryptText(password), fullName, phoneNumber, profileId]
      : [accountId, profileName, username, fullName, phoneNumber, profileId];

    const result = await client.query(query, values);

    await refreshSingleProfileStatus(client, profileId);

    await updateAccountStatus(client, current.account_id);
    await updateAccountStatus(client, accountId);

    await client.query('COMMIT');
    return res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to update profile.' });
  } finally {
    client.release();
  }
});

app.delete('/api/profiles/:id', requireAuth, async (req, res) => {
  const profileId = Number(req.params.id);

  if (!Number.isInteger(profileId)) {
    return res.status(400).json({ message: 'Invalid profile id.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query('SELECT account_id FROM profiles WHERE id = $1', [profileId]);
    const profile = result.rows[0];
    if (!profile) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Profile not found.' });
    }

    await client.query('DELETE FROM profiles WHERE id = $1', [profileId]);
    await updateAccountStatus(client, profile.account_id);

    await client.query('COMMIT');
    return res.json({ message: 'Profile deleted.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete profile.' });
  } finally {
    client.release();
  }
});

app.get('/api/payments', requireAuth, async (req, res) => {
  try {
    await refreshAllProfileStatuses();

    const result = await pool.query(
      `SELECT pay.id, pay.profile_id, pay.payment_date, pay.next_payment_date, pay.created_at, pay.updated_at,
              p.profile_name, p.full_name
       FROM payments pay
       JOIN profiles p ON p.id = pay.profile_id
       ORDER BY pay.payment_date DESC, pay.id DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch payments.' });
  }
});

app.post('/api/payments', requireAuth, async (req, res) => {
  const profileId = Number(req.body.profile_id);
  const paymentDate = sanitizeText(req.body.payment_date, 20);

  if (!Number.isInteger(profileId) || !paymentDate) {
    return res.status(400).json({ message: 'profile_id and payment_date are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO payments (profile_id, payment_date, next_payment_date)
       VALUES ($1, $2::date, ($2::date + INTERVAL '1 month')::date)
       ON CONFLICT (profile_id, payment_date)
       DO UPDATE SET next_payment_date = EXCLUDED.next_payment_date,
                     updated_at = NOW()
       RETURNING *`,
      [profileId, paymentDate]
    );

    await refreshSingleProfileStatus(client, profileId);
    await client.query('COMMIT');
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to save payment.' });
  } finally {
    client.release();
  }
});

app.put('/api/payments/:id', requireAuth, async (req, res) => {
  const paymentId = Number(req.params.id);
  const paymentDate = sanitizeText(req.body.payment_date, 20);

  if (!Number.isInteger(paymentId) || !paymentDate) {
    return res.status(400).json({ message: 'Valid id and payment_date are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentResult = await client.query('SELECT profile_id FROM payments WHERE id = $1', [paymentId]);
    const current = currentResult.rows[0];
    if (!current) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Payment not found.' });
    }

    const result = await client.query(
      `UPDATE payments
       SET payment_date = $1::date,
           next_payment_date = ($1::date + INTERVAL '1 month')::date,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [paymentDate, paymentId]
    );

    await refreshSingleProfileStatus(client, current.profile_id);
    await client.query('COMMIT');
    return res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to update payment.' });
  } finally {
    client.release();
  }
});

app.delete('/api/payments/:id', requireAuth, async (req, res) => {
  const paymentId = Number(req.params.id);

  if (!Number.isInteger(paymentId)) {
    return res.status(400).json({ message: 'Invalid payment id.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentResult = await client.query('SELECT profile_id FROM payments WHERE id = $1', [paymentId]);
    const current = currentResult.rows[0];
    if (!current) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Payment not found.' });
    }

    await client.query('DELETE FROM payments WHERE id = $1', [paymentId]);
    await refreshSingleProfileStatus(client, current.profile_id);
    await client.query('COMMIT');
    return res.json({ message: 'Payment deleted.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete payment.' });
  } finally {
    client.release();
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
