/**
 * Script de test email d'approbation
 */
require('dotenv').config();
const emailService = require('../emails/emailService');

async function testAcceptedEmail() {
    const testEmail = process.argv[2] || 'aidoudimalek@yahoo.com';

    console.log('📧 Test envoi email d\'approbation...');
    console.log('  Destinataire:', testEmail);

    const enrollmentData = {
        applicant_email: testEmail,
        applicant_first_name: 'Test',
        child_first_name: 'Enfant Test'
    };

    const appointmentDate = 'samedi 10 janvier 2026 à 10:00';
    const passwordLink = 'http://localhost:5173/create-password?token=test123&email=' + encodeURIComponent(testEmail);

    try {
        const result = await emailService.sendAcceptedEmail(
            enrollmentData,
            appointmentDate,
            passwordLink
        );

        console.log('\n📬 Résultat:', result);

        if (result.success) {
            console.log('✅ Email envoyé avec succès!');
        } else {
            console.log('❌ Échec envoi:', result.error);
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

testAcceptedEmail();
