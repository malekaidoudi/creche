#!/usr/bin/env node

// Script de test complet du système
require('dotenv').config();
const db = require('./config/db_postgres');

async function testSystem() {
  try {
    console.log('🧪 TEST COMPLET DU SYSTÈME CRÈCHE');
    console.log('================================');

    // 1. Test connexion base de données
    console.log('\n1️⃣ TEST CONNEXION BASE DE DONNÉES');
    const dbTest = await db.query('SELECT NOW() as current_time');
    console.log('✅ Connexion PostgreSQL OK:', dbTest.rows[0].current_time);

    // 2. Test utilisateurs
    console.log('\n2️⃣ TEST UTILISATEURS');
    const users = await db.query('SELECT id, email, role FROM users ORDER BY role');
    console.log(`📊 Utilisateurs dans la DB: ${users.rows.length}`);
    users.rows.forEach(user => {
      console.log(`   ${user.role}: ${user.email} (ID: ${user.id})`);
    });

    // 3. Test enfants
    console.log('\n3️⃣ TEST ENFANTS');
    const children = await db.query('SELECT id, first_name, last_name, is_active FROM children WHERE is_active = true');
    console.log(`👶 Enfants actifs: ${children.rows.length}`);
    children.rows.forEach(child => {
      console.log(`   ${child.first_name} ${child.last_name} (ID: ${child.id})`);
    });

    // 4. Test enrollments (CRITIQUE)
    console.log('\n4️⃣ TEST ENROLLMENTS (CRITIQUE)');
    const enrollments = await db.query(`
      SELECT 
        e.id, 
        e.status,
        c.first_name as child_name, 
        c.last_name as child_lastname,
        u.email as parent_email 
      FROM enrollments e
      JOIN children c ON e.child_id = c.id
      JOIN users u ON e.parent_id = u.id
      ORDER BY e.created_at DESC
    `);
    console.log(`🔗 Enrollments (associations parent-enfant): ${enrollments.rows.length}`);
    enrollments.rows.forEach(enrollment => {
      console.log(`   ${enrollment.child_name} ${enrollment.child_lastname} → ${enrollment.parent_email} (${enrollment.status})`);
    });

    // 5. Test enfants avec parents (REQUÊTE CRITIQUE)
    console.log('\n5️⃣ TEST REQUÊTE ENFANTS AVEC PARENTS');
    const childrenWithParents = await db.query(`
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
      WHERE c.is_active = true
      ORDER BY c.created_at DESC
    `);
    
    console.log(`👨‍👩‍👧‍👦 Enfants avec info parents: ${childrenWithParents.rows.length}`);
    childrenWithParents.rows.forEach(child => {
      const parentInfo = child.parent_first_name 
        ? `${child.parent_first_name} ${child.parent_last_name} (${child.parent_email})`
        : '❌ AUCUN PARENT';
      console.log(`   ${child.first_name} ${child.last_name} → ${parentInfo}`);
    });

    // 6. Test enfants orphelins
    console.log('\n6️⃣ TEST ENFANTS ORPHELINS');
    const orphans = await db.query(`
      SELECT c.id, c.first_name, c.last_name 
      FROM children c 
      LEFT JOIN enrollments e ON c.id = e.child_id 
      WHERE e.child_id IS NULL AND c.is_active = true
    `);
    console.log(`👶 Enfants sans parents: ${orphans.rows.length}`);
    if (orphans.rows.length > 0) {
      console.log('⚠️ PROBLÈME: Ces enfants n\'ont pas de parents associés:');
      orphans.rows.forEach(orphan => {
        console.log(`   ❌ ${orphan.first_name} ${orphan.last_name} (ID: ${orphan.id})`);
      });
    } else {
      console.log('✅ Tous les enfants ont des parents associés !');
    }

    // 7. Test présences
    console.log('\n7️⃣ TEST PRÉSENCES');
    const attendance = await db.query('SELECT COUNT(*) as total FROM attendance');
    console.log(`📊 Enregistrements de présence: ${attendance.rows[0].total}`);

    // 8. Résumé final
    console.log('\n🎯 RÉSUMÉ DU TEST');
    console.log('================');
    console.log(`✅ Utilisateurs: ${users.rows.length}`);
    console.log(`✅ Enfants actifs: ${children.rows.length}`);
    console.log(`✅ Associations parent-enfant: ${enrollments.rows.length}`);
    console.log(`✅ Enfants avec parents: ${childrenWithParents.rows.filter(c => c.parent_email).length}/${childrenWithParents.rows.length}`);
    console.log(`⚠️ Enfants orphelins: ${orphans.rows.length}`);
    console.log(`✅ Présences: ${attendance.rows[0].total}`);

    if (orphans.rows.length === 0) {
      console.log('\n🎉 SYSTÈME 100% FONCTIONNEL !');
      console.log('Tous les enfants sont correctement associés à leurs parents.');
    } else {
      console.log('\n⚠️ PROBLÈME DÉTECTÉ !');
      console.log('Certains enfants ne sont pas associés à des parents.');
      console.log('Exécutez: node fix_enrollments.js');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    process.exit(0);
  }
}

testSystem();
