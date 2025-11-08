const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTestUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Mise à jour des mots de passe des utilisateurs de test...');
    
    // Mettre à jour les mots de passe (mot de passe: password)
    const result = await client.query(`
      INSERT INTO users (email, password, first_name, last_name, role, phone, is_active) VALUES
      ('crechemimaelghalia@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Crèche', 'admin', '+216 25 95 35 32', true),
      ('staff@creche.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff', 'Member', 'staff', '+216 20 123 456', true),
      ('parent@creche.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Parent', 'Test', 'parent', '+216 25 789 123', true)
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING email, role
    `);
    
    console.log('✅ Utilisateurs créés:');
    result.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    
    console.log('\n📝 Identifiants de connexion:');
    console.log('   Email: crechemimaelghalia@gmail.com | Mot de passe: password (Admin)');
    console.log('   Email: staff@creche.com | Mot de passe: password (Staff)');
    console.log('   Email: parent@creche.com | Mot de passe: password (Parent)');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestUsers();
