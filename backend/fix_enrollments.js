#!/usr/bin/env node

// Script pour corriger les enrollments manquants
require('dotenv').config();
const db = require('./config/db_postgres');

async function fixEnrollments() {
  try {
    console.log('🔧 CORRECTION DES ENROLLMENTS MANQUANTS');
    console.log('=====================================');

    // 1. Vérifier les enfants sans enrollments
    const childrenWithoutEnrollments = await db.query(`
      SELECT c.id, c.first_name, c.last_name 
      FROM children c 
      LEFT JOIN enrollments e ON c.id = e.child_id 
      WHERE e.child_id IS NULL
    `);

    console.log(`📊 Enfants sans enrollments: ${childrenWithoutEnrollments.rows.length}`);
    
    if (childrenWithoutEnrollments.rows.length === 0) {
      console.log('✅ Tous les enfants ont déjà des enrollments !');
      return;
    }

    // 2. Récupérer le parent de test
    const parentUser = await db.query('SELECT id, email FROM users WHERE role = $1 LIMIT 1', ['parent']);
    
    if (parentUser.rows.length === 0) {
      console.log('❌ Aucun parent trouvé dans la base de données');
      return;
    }

    const parentId = parentUser.rows[0].id;
    const parentEmail = parentUser.rows[0].email;
    
    console.log(`👤 Parent trouvé: ${parentEmail} (ID: ${parentId})`);

    // 3. Créer les enrollments manquants
    for (const child of childrenWithoutEnrollments.rows) {
      await db.query(
        `INSERT INTO enrollments (parent_id, child_id, status, lunch_assistance, regulation_accepted, enrollment_date, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, NOW())`,
        [parentId, child.id, 'approved', true, true]
      );
      
      console.log(`✅ Enrollment créé: ${child.first_name} ${child.last_name} (ID: ${child.id}) → Parent ${parentId}`);
    }

    // 4. Vérifier le résultat
    const totalEnrollments = await db.query('SELECT COUNT(*) as count FROM enrollments');
    const totalChildren = await db.query('SELECT COUNT(*) as count FROM children');
    
    console.log('');
    console.log('📊 RÉSULTAT FINAL:');
    console.log(`   Enfants total: ${totalChildren.rows[0].count}`);
    console.log(`   Enrollments total: ${totalEnrollments.rows[0].count}`);
    
    // 5. Test de la requête corrigée
    console.log('');
    console.log('🧪 TEST DE LA REQUÊTE CORRIGÉE:');
    const testQuery = await db.query(`
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        p.first_name as parent_first_name,
        p.last_name as parent_last_name,
        p.email as parent_email,
        e.status as enrollment_status
      FROM children c
      LEFT JOIN enrollments e ON c.id = e.child_id
      LEFT JOIN users p ON e.parent_id = p.id
      ORDER BY c.created_at DESC
    `);

    for (const row of testQuery.rows) {
      const parentInfo = row.parent_first_name ? 
        `${row.parent_first_name} ${row.parent_last_name} (${row.parent_email})` : 
        'AUCUN PARENT';
      
      console.log(`   ${row.first_name} ${row.last_name} → ${parentInfo}`);
    }

    console.log('');
    console.log('🎉 CORRECTION TERMINÉE !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    process.exit(0);
  }
}

fixEnrollments();
