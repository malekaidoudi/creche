const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function testLogin() {
  try {
    console.log('🔍 Test de connexion pour parent@mimaelghalia.tn...');
    
    const email = 'parent@mimaelghalia.tn';
    const password = 'parent123';
    
    // Récupérer l'utilisateur
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('✅ Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    });
    
    // Tester le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (isValidPassword) {
      console.log('✅ Mot de passe correct!');
      console.log('🎉 La connexion devrait fonctionner');
    } else {
      console.log('❌ Mot de passe incorrect');
      
      // Réinitialiser le mot de passe
      console.log('🔄 Réinitialisation du mot de passe...');
      const hashedPassword = await bcrypt.hash(password, 10);
      await query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
      console.log('✅ Mot de passe réinitialisé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  
  process.exit(0);
}

testLogin();
