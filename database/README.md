# MySQL foundation

Status: migration prepared; not applied to the local server. React authentication remains a preview. A running MySQL80 service was detected, but authenticated database access was unavailable.

1. Open your existing authenticated MySQL Workbench connection.
2. For local development, create a new schema named `padi_go` with `utf8mb4`, if it does not already exist. Select that schema. For hosted MySQL, select the service's database instead.
3. Open and execute `001_users.sql` once. It intentionally fails if the objects already exist; it does not delete or replace user data.
4. Verify with `SHOW TABLES LIKE 'users';` and `SHOW CREATE PROCEDURE sp_create_user;`.

The future FastAPI signup endpoint must validate email, password length and input lengths, hash the password with Argon2id using a maintained password library, then call `sp_create_user` using bound parameters. The procedure accepts an encoded hash, never a plaintext password. Its prefix check is not a substitute for cryptographic validation. Duplicate email produces MySQL error 1062; the API should map that to HTTP 409.

Use an application database account, not root. SQL SECURITY INVOKER requires INSERT and SELECT on users plus EXECUTE on this procedure. Do not place database credentials in React, VITE-prefixed environment variables, GitHub, or chat. Configure the backend separately. Sessions, password verification, CSRF and login endpoints are not implemented by this single migration.

Before connecting signup, integration tests must verify user insertion, normalized duplicate email rejection, Tamil display names, rejected invalid medium/language/hash, and absence of password hashes in procedure result sets. Run them in a separate test database.
