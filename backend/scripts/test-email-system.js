const emailService = require('../emails/emailService');
const db = require('../config/db_postgres');

/**
 * Script de test du système d'e-mails
 * Usage: node scripts/test-email-system.js [email_destinataire]
 */

const TEST_EMAIL = process.argv[2] || 'test@example.com';

console.log('🧪 Test du système d\'e-mails');
console.log('📧 E-mail de test:', TEST_EMAIL);
console.log('─'.repeat(60));

async function testEmailSystem() {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    tests: []
  };

  // Test 1: E-mail de confirmation d'inscription
  console.log('\n1️⃣ Test: Confirmation d\'inscription...');
  try {
    const result1 = await emailService.sendRegistrationConfirmation({
      id: 999,
      applicant_email: TEST_EMAIL,
      applicant_first_name: 'Ahmed',
      child_first_name: 'Sara'
    });
    
    results.total++;
    if (result1.success) {
      results.success++;
      console.log('   ✅ Succès - ID:', result1.messageId);
    } else {
      results.failed++;
      console.log('   ❌ Échec:', result1.error);
    }
    results.tests.push({ name: 'Confirmation inscription', success: result1.success });
  } catch (error) {
    results.total++;
    results.failed++;
    console.log('   ❌ Erreur:', error.message);
    results.tests.push({ name: 'Confirmation inscription', success: false, error: error.message });
  }

  // Attendre 2 secondes entre les tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: E-mail d'acceptation
  console.log('\n2️⃣ Test: Dossier accepté...');
  try {
    const result2 = await emailService.sendAcceptedEmail(
      {
        applicant_email: TEST_EMAIL,
        applicant_first_name: 'Ahmed',
        child_first_name: 'Sara'
      },
      '2025-01-15T10:00:00',
      'https://malekaidoudi.github.io/creche/create-password?token=test123'
    );
    
    results.total++;
    if (result2.success) {
      results.success++;
      console.log('   ✅ Succès - ID:', result2.messageId);
    } else {
      results.failed++;
      console.log('   ❌ Échec:', result2.error);
    }
    results.tests.push({ name: 'Dossier accepté', success: result2.success });
  } catch (error) {
    results.total++;
    results.failed++;
    console.log('   ❌ Erreur:', error.message);
    results.tests.push({ name: 'Dossier accepté', success: false, error: error.message });
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: E-mail documents manquants
  console.log('\n3️⃣ Test: Documents manquants...');
  try {
    const result3 = await emailService.sendMissingDocsEmail(
      {
        applicant_email: TEST_EMAIL,
        applicant_first_name: 'Ahmed',
        child_first_name: 'Sara'
      },
      ['Carnet de santé', 'Acte de naissance', 'Certificat médical'],
      '2025-01-15T10:00:00',
      'https://malekaidoudi.github.io/creche/upload-documents?token=test123'
    );
    
    results.total++;
    if (result3.success) {
      results.success++;
      console.log('   ✅ Succès - ID:', result3.messageId);
    } else {
      results.failed++;
      console.log('   ❌ Échec:', result3.error);
    }
    results.tests.push({ name: 'Documents manquants', success: result3.success });
  } catch (error) {
    results.total++;
    results.failed++;
    console.log('   ❌ Erreur:', error.message);
    results.tests.push({ name: 'Documents manquants', success: false, error: error.message });
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: E-mail de rejet
  console.log('\n4️⃣ Test: Dossier rejeté...');
  try {
    const result4 = await emailService.sendRejectionEmail(
      {
        applicant_email: TEST_EMAIL,
        applicant_first_name: 'Ahmed',
        child_first_name: 'Sara'
      },
      'Places complètes pour cette tranche d\'âge. Nous vous invitons à réessayer dans quelques mois.'
    );
    
    results.total++;
    if (result4.success) {
      results.success++;
      console.log('   ✅ Succès - ID:', result4.messageId);
    } else {
      results.failed++;
      console.log('   ❌ Échec:', result4.error);
    }
    results.tests.push({ name: 'Dossier rejeté', success: result4.success });
  } catch (error) {
    results.total++;
    results.failed++;
    console.log('   ❌ Erreur:', error.message);
    results.tests.push({ name: 'Dossier rejeté', success: false, error: error.message });
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 5: Message de contact
  console.log('\n5️⃣ Test: Message de contact...');
  try {
    const result5 = await emailService.sendContactMessage({
      name: 'Ahmed Ben Ali',
      email: TEST_EMAIL,
      phone: '+216 XX XXX XXX',
      subject: 'Test du système de contact',
      message: 'Ceci est un message de test pour vérifier le bon fonctionnement du système d\'envoi d\'e-mails.'
    });
    
    results.total++;
    if (result5.success) {
      results.success++;
      console.log('   ✅ Succès - ID:', result5.messageId);
    } else {
      results.failed++;
      console.log('   ❌ Échec:', result5.error);
    }
    results.tests.push({ name: 'Message de contact', success: result5.success });
  } catch (error) {
    results.total++;
    results.failed++;
    console.log('   ❌ Erreur:', error.message);
    results.tests.push({ name: 'Message de contact', success: false, error: error.message });
  }

  // Résumé
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('═'.repeat(60));
  console.log(`Total de tests: ${results.total}`);
  console.log(`✅ Réussis: ${results.success}`);
  console.log(`❌ Échoués: ${results.failed}`);
  console.log(`📈 Taux de réussite: ${Math.round((results.success / results.total) * 100)}%`);

  // Détails des tests
  console.log('\n📋 Détails:');
  results.tests.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${test.name}`);
    if (test.error) {
      console.log(`      Erreur: ${test.error}`);
    }
  });

  // Vérifier les logs en base de données
  console.log('\n🗄️ Vérification des logs en base de données...');
  try {
    const logsResult = await db.query(`
      SELECT 
        email_type, 
        status, 
        resend_id,
        created_at
      FROM email_logs 
      WHERE recipient_email = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [TEST_EMAIL]);

    if (logsResult.rows.length > 0) {
      console.log(`   ✅ ${logsResult.rows.length} entrées trouvées dans email_logs`);
      console.log('\n   Derniers logs:');
      logsResult.rows.forEach((log, index) => {
        const statusIcon = log.status === 'sent' ? '✅' : '❌';
        console.log(`   ${index + 1}. ${statusIcon} ${log.email_type} - ${log.status} (${new Date(log.created_at).toLocaleString('fr-FR')})`);
      });
    } else {
      console.log('   ⚠️ Aucune entrée trouvée dans email_logs');
    }
  } catch (dbError) {
    console.log('   ❌ Erreur lors de la vérification des logs:', dbError.message);
  }

  // Recommandations
  console.log('\n💡 RECOMMANDATIONS:');
  if (results.failed > 0) {
    console.log('   ⚠️ Certains tests ont échoué. Vérifiez:');
    console.log('      1. La clé API Resend (RESEND_API_KEY)');
    console.log('      2. La configuration du domaine dans Resend');
    console.log('      3. Les logs détaillés ci-dessus');
    console.log('      4. Le dashboard Resend pour plus d\'informations');
  } else {
    console.log('   ✅ Tous les tests ont réussi !');
    console.log('   📧 Vérifiez votre boîte e-mail:', TEST_EMAIL);
    console.log('   🔍 Consultez le dashboard Resend pour les statistiques');
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Tests terminés !');
  console.log('═'.repeat(60) + '\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Exécuter les tests
testEmailSystem().catch(error => {
  console.error('\n❌ Erreur fatale lors des tests:', error);
  process.exit(1);
});
