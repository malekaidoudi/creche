/**
 * Script pour peupler la base de données de production avec des données de test
 * À exécuter sur Render ou en local avec DATABASE_URL de production
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuration base de données (utilise DATABASE_URL de production)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function populateDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 PEUPLEMENT BASE DE DONNÉES PRODUCTION');
    console.log('=====================================');
    
    // 1. Créer un utilisateur admin
    console.log('👤 Création utilisateur admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminResult = await client.query(`
      INSERT INTO users (email, password, role, first_name, last_name, phone, is_verified)
      VALUES ($1, $2, 'admin', 'Admin', 'Crèche', '+216 12 345 678', true)
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        role = EXCLUDED.role
      RETURNING id, email, role
    `, ['crechemimaelghalia@gmail.com', hashedPassword]);
    
    const adminId = adminResult.rows[0].id;
    console.log('✅ Admin créé:', adminResult.rows[0]);
    
    // 2. Créer des utilisateurs parents
    console.log('👨‍👩‍👧‍👦 Création utilisateurs parents...');
    const parents = [
      { email: 'parent1@gmail.com', firstName: 'Ahmed', lastName: 'Ben Ali', phone: '+216 20 123 456' },
      { email: 'parent2@gmail.com', firstName: 'Fatma', lastName: 'Trabelsi', phone: '+216 25 789 012' },
      { email: 'parent3@gmail.com', firstName: 'Mohamed', lastName: 'Karray', phone: '+216 22 345 678' },
      { email: 'parent4@gmail.com', firstName: 'Amel', lastName: 'Bouaziz', phone: '+216 26 901 234' }
    ];
    
    const parentIds = [];
    for (const parent of parents) {
      const parentResult = await client.query(`
        INSERT INTO users (email, password, role, first_name, last_name, phone, is_verified)
        VALUES ($1, $2, 'parent', $3, $4, $5, true)
        ON CONFLICT (email) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone
        RETURNING id
      `, [parent.email, hashedPassword, parent.firstName, parent.lastName, parent.phone]);
      
      parentIds.push(parentResult.rows[0].id);
      console.log(`✅ Parent créé: ${parent.firstName} ${parent.lastName}`);
    }
    
    // 3. Créer des enfants
    console.log('👶 Création enfants...');
    const children = [
      { firstName: 'Yasmine', lastName: 'Ben Ali', birthDate: '2021-03-15', parentId: parentIds[0] },
      { firstName: 'Adam', lastName: 'Ben Ali', birthDate: '2022-07-22', parentId: parentIds[0] },
      { firstName: 'Lina', lastName: 'Trabelsi', birthDate: '2021-11-08', parentId: parentIds[1] },
      { firstName: 'Omar', lastName: 'Trabelsi', birthDate: '2023-01-12', parentId: parentIds[1] },
      { firstName: 'Salma', lastName: 'Karray', birthDate: '2022-05-30', parentId: parentIds[2] },
      { firstName: 'Youssef', lastName: 'Karray', birthDate: '2021-09-18', parentId: parentIds[2] },
      { firstName: 'Nour', lastName: 'Bouaziz', birthDate: '2022-12-03', parentId: parentIds[3] },
      { firstName: 'Hamza', lastName: 'Bouaziz', birthDate: '2023-04-25', parentId: parentIds[3] }
    ];
    
    for (const child of children) {
      // Créer l'enfant
      const childResult = await client.query(`
        INSERT INTO children (first_name, last_name, birth_date, parent_id, gender, medical_info, emergency_contact, notes)
        VALUES ($1, $2, $3, $4, 'other', 'Aucune allergie connue', $5, 'Enfant en bonne santé')
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [child.firstName, child.lastName, child.birthDate, child.parentId, parents.find(p => parentIds.indexOf(child.parentId) === parents.indexOf(p))?.phone]);
      
      if (childResult.rows.length > 0) {
        const childId = childResult.rows[0].id;
        
        // Créer l'inscription approuvée
        await client.query(`
          INSERT INTO enrollments (child_id, parent_id, status, enrollment_date, approved_by, approved_at)
          VALUES ($1, $2, 'approved', CURRENT_DATE, $3, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING
        `, [childId, child.parentId, adminId]);
        
        console.log(`✅ Enfant créé: ${child.firstName} ${child.lastName}`);
      }
    }
    
    // 4. Vérification finale
    console.log('🔍 Vérification finale...');
    const childrenCount = await client.query('SELECT COUNT(*) FROM children');
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    const enrollmentsCount = await client.query('SELECT COUNT(*) FROM enrollments WHERE status = \'approved\'');
    
    console.log('📊 RÉSULTATS:');
    console.log(`   👤 Utilisateurs: ${usersCount.rows[0].count}`);
    console.log(`   👶 Enfants: ${childrenCount.rows[0].count}`);
    console.log(`   📝 Inscriptions approuvées: ${enrollmentsCount.rows[0].count}`);
    
    console.log('✅ Base de données peuplée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécution du script
if (require.main === module) {
  populateDatabase()
    .then(() => {
      console.log('🎉 Script terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { populateDatabase };
