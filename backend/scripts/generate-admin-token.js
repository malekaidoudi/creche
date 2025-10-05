const jwt = require('jsonwebtoken');

// Configuration (même que dans le backend)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Créer un token admin temporaire (valide 24h)
const adminPayload = {
  id: 1,
  email: 'admin@creche.com',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'System'
};

const token = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 Token Admin Temporaire (24h):');
console.log(token);
console.log('');
console.log('📋 Pour l\'utiliser dans le frontend:');
console.log(`localStorage.setItem('token', '${token}');`);
console.log('');
console.log('🌐 Ou testez directement avec curl:');
console.log(`curl -X PUT http://localhost:3003/api/settings \\`);
console.log(`  -H "Authorization: Bearer ${token}" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"settings": {"nursery_name": "Test"}}'`);
