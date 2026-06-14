const bcrypt = require('bcrypt');
const allowedUsers = require('./config_allowed_users');
const { get, run } = require('./db');

function normalizeLogin(login) {
  return String(login || '').trim().toLowerCase();
}

function hasTodoValue(value) {
  return String(value || '').includes('TODO_');
}

function validateAllowedUsers() {
  const normalized = allowedUsers.map((u) => ({ ...u, login: normalizeLogin(u.login) }));
  const logins = normalized.map((u) => u.login);
  const uniqueLogins = new Set(logins);

  if (normalized.length !== 3) {
    throw new Error('Konfiguracja kont musi zawierać dokładnie 3 użytkowników w src/config_allowed_users.js.');
  }
  if (uniqueLogins.size !== logins.length) {
    throw new Error('Loginy w src/config_allowed_users.js muszą być unikalne.');
  }
  for (const user of normalized) {
    if (!user.login || !user.password || !user.name || !['admin', 'user'].includes(user.role)) {
      throw new Error('Każde konto w src/config_allowed_users.js musi mieć login, password, name oraz role admin/user.');
    }
    if (hasTodoValue(user.login) || hasTodoValue(user.password)) {
      console.warn(`[UWAGA] Konto ${user.login} zawiera wartość TODO. Uzupełnij src/config_allowed_users.js przed publicznym uruchomieniem.`);
    }
    if (String(user.password).length < 8) {
      throw new Error(`Hasło dla konta ${user.login} musi mieć minimum 8 znaków.`);
    }
  }
  return normalized;
}

async function syncConfiguredUsers() {
  const users = validateAllowedUsers();

  // Usuwa z bazy konta, których nie ma na zamkniętej liście.
  const placeholders = users.map(() => '?').join(',');
  await run(`DELETE FROM users WHERE email NOT IN (${placeholders})`, users.map((u) => u.login));

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const existing = await get('SELECT id FROM users WHERE email = ?', [user.login]);
    if (existing) {
      await run('UPDATE users SET password_hash = ?, name = ?, role = ? WHERE email = ?', [passwordHash, user.name, user.role, user.login]);
    } else {
      await run('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)', [user.login, user.name, passwordHash, user.role]);
    }
  }
}

function isConfiguredLogin(login) {
  const normalized = normalizeLogin(login);
  return allowedUsers.some((u) => normalizeLogin(u.login) === normalized);
}

module.exports = { normalizeLogin, syncConfiguredUsers, isConfiguredLogin };
