const jwt = require('jsonwebtoken');

const secret = 'super-secret-jwt-token-with-at-least-32-characters-length';

function generateKey(role) {
  const payload = {
    role: role,
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3153600000 // 100 years
  };
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

console.log(`JWT_SECRET=${secret}`);
console.log(`ANON_KEY=${generateKey('anon')}`);
console.log(`SERVICE_ROLE_KEY=${generateKey('service_role')}`);
