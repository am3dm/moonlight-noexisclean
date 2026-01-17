const crypto = require('crypto');

const secret = 'super-secret-jwt-token-with-at-least-32-characters-length';

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function generateKey(role) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    role: role,
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3153600000 // 100 years
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

console.log(`JWT_SECRET=${secret}`);
console.log(`ANON_KEY=${generateKey('anon')}`);
console.log(`SERVICE_ROLE_KEY=${generateKey('service_role')}`);
