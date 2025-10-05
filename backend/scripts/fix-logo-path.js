const { pool } = require('../config/database');

async function fixLogoPath() {
  try {
    console.log('🔧 Correction du chemin du logo dans la base de données...');
    
    // Vérifier l'état actuel
    const [currentLogo] = await pool.execute(
      'SELECT setting_key, setting_value FROM creche_settings WHERE setting_key = ?',
      ['nursery_logo']
    );
    
    if (currentLogo.length > 0) {
      const currentValue = currentLogo[0].setting_value;
      console.log(`📋 Valeur actuelle: ${currentValue.substring(0, 50)}... (${currentValue.length} caractères)`);
      
      if (currentValue.startsWith('data:image/')) {
        console.log('⚠️ Le logo est stocké en base64, correction nécessaire...');
        
        // Corriger avec un chemin normal
        const newLogoPath = `/images/logo.jpg?v=${Date.now()}`;
        
        await pool.execute(
          'UPDATE creche_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
          [newLogoPath, 'nursery_logo']
        );
        
        console.log(`✅ Logo corrigé: ${newLogoPath}`);
      } else {
        console.log('✅ Le logo a déjà un chemin correct');
      }
    } else {
      console.log('❌ Paramètre nursery_logo non trouvé');
    }
    
    // Vérifier le résultat
    const [updatedLogo] = await pool.execute(
      'SELECT setting_key, setting_value FROM creche_settings WHERE setting_key = ?',
      ['nursery_logo']
    );
    
    if (updatedLogo.length > 0) {
      console.log(`📋 Nouvelle valeur: ${updatedLogo[0].setting_value}`);
    }
    
    console.log('✅ Correction terminée!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

fixLogoPath();
