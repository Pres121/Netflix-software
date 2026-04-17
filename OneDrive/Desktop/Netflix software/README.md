# Streaming Subscription Manager (PostgreSQL)

A full-stack admin system for managing a small streaming subscription business.

## Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express
- Database: PostgreSQL
- Security: bcrypt admin hashing, encrypted account/profile passwords at rest, CSRF protection, Helmet, rate limiting, PostgreSQL-backed sessions

## Features

- Secure admin login with session-based auth
- Manage streaming accounts (add, edit, delete)
- Manage profiles with max 4 profiles per account
- Store customer details directly on each profile record
- Manage monthly payments
- Automatic profile status logic:
  - Paid => profile Active
  - Pending => profile Inactive
- Dashboard metrics:
  - Total accounts
  - Full accounts
  - Total profiles
  - Active profiles
  - Pending payments

## Project Structure

```text
.
|-- .env.example
|-- db.js
|-- package.json
|-- README.md
|-- schema.sql
|-- seed-admin.js
|-- server.js
`-- public
    |-- accounts.html
    |-- dashboard.html
    |-- login.html
    |-- payments.html
    |-- profiles.html
    |-- css
    |   `-- styles.css
    `-- js
        |-- api.js
        `-- main.js
```

## Local Setup

1. Install PostgreSQL and create a database:

```sql
CREATE DATABASE streaming_manager;
```

2. Run schema:

```bash
psql -U postgres -d streaming_manager -f schema.sql
```

3. Install dependencies:

```bash
npm install
```

4. Create environment file:

```bash
copy .env.example .env
```

5. Update `.env` with your PostgreSQL credentials plus:

- `SESSION_SECRET` with a long random value
- `ENCRYPTION_KEY` as a 64-character hex key

6. Seed an admin account:

```bash
npm run seed:admin -- admin admin123
```

You can change username/password in the same command.

7. Start the app:

```bash
npm run dev
```

or

```bash
npm start
```

8. Open:

```text
http://localhost:3000
```

## Notes

- Account and profile passwords are stored as plain text for operational visibility in this admin tool. For stronger security in production, use encryption-at-rest.
- Session store is persisted in PostgreSQL.
- Password fields for streaming accounts/profiles are encrypted before saving in the database.
