/**
 * Vérifier la configuration Resend et le statut du domaine
 */

require('dotenv').config();
const { Resend } = require('resend');

async function checkResendConfig() {
    console.log('🔍 Vérification de la configuration Resend\n');

    // Afficher les variables d'environnement
    console.log('📋 Variables d\'environnement:');
    console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Définie' : '❌ Manquante'}`);
    console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Manquante'}`);
    console.log(`   CONTACT_EMAIL: ${process.env.CONTACT_EMAIL || '❌ Manquante'}`);
    console.log('');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY non configurée');
        process.exit(1);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        console.log('🌐 Vérification des domaines...\n');

        // Lister les domaines
        const domains = await resend.domains.list();

        if (domains.data && domains.data.data) {
            console.log(`📊 Domaines configurés: ${domains.data.data.length}\n`);

            domains.data.data.forEach((domain, index) => {
                const statusIcon = domain.status === 'verified' ? '✅' : '⚠️';
                console.log(`${index + 1}. ${statusIcon} ${domain.name}`);
                console.log(`   ID: ${domain.id}`);
                console.log(`   Statut: ${domain.status}`);
                console.log(`   Région: ${domain.region || 'N/A'}`);
                console.log(`   Créé: ${new Date(domain.created_at).toLocaleDateString('fr-FR')}`);
                console.log('');
            });

            // Vérifier si mima-elghalia.com est vérifié
            const mimaElghalia = domains.data.data.find(d => d.name === 'mima-elghalia.com');

            if (mimaElghalia) {
                if (mimaElghalia.status === 'verified') {
                    console.log('✅ Le domaine mima-elghalia.com est VÉRIFIÉ !');
                    console.log('   Vous pouvez envoyer des emails depuis ce domaine.\n');
                } else {
                    console.log('⚠️  Le domaine mima-elghalia.com n\'est PAS vérifié.');
                    console.log(`   Statut actuel: ${mimaElghalia.status}`);
                    console.log('   Allez sur https://resend.com/domains pour le vérifier.\n');
                }
            } else {
                console.log('❌ Le domaine mima-elghalia.com n\'est pas configuré dans Resend.');
                console.log('   Ajoutez-le sur: https://resend.com/domains\n');
            }

        } else {
            console.log('⚠️  Aucun domaine configuré dans Resend.');
            console.log('   Ajoutez votre domaine sur: https://resend.com/domains\n');
        }

        // Test de l'extraction de l'email depuis EMAIL_FROM
        const emailFromMatch = process.env.EMAIL_FROM.match(/<(.+)>/);
        const fromEmail = emailFromMatch ? emailFromMatch[1] : process.env.EMAIL_FROM;
        const fromDomain = fromEmail.split('@')[1];

        console.log('📧 Configuration EMAIL_FROM:');
        console.log(`   Adresse complète: ${process.env.EMAIL_FROM}`);
        console.log(`   Email extrait: ${fromEmail}`);
        console.log(`   Domaine: ${fromDomain}`);
        console.log('');

        if (fromDomain === 'mima-elghalia.com') {
            console.log('✅ Le domaine dans EMAIL_FROM correspond à votre domaine vérifié.');
        } else if (fromDomain === 'resend.dev') {
            console.log('⚠️  Vous utilisez le domaine de test Resend (limité).');
        } else {
            console.log('⚠️  Le domaine dans EMAIL_FROM ne correspond pas à un domaine vérifié.');
        }

    } catch (error) {
        console.error('\n❌ Erreur lors de la vérification:', error.message);

        if (error.message.includes('API key')) {
            console.error('\n💡 Votre clé API Resend est peut-être invalide.');
            console.error('   Vérifiez-la sur: https://resend.com/api-keys');
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('💡 Prochaines étapes:');
    console.log('   1. Assurez-vous que mima-elghalia.com est vérifié');
    console.log('   2. Utilisez inscription@mima-elghalia.com dans EMAIL_FROM');
    console.log('   3. Redémarrez le serveur après modification du .env');
    console.log('='.repeat(60));
}

checkResendConfig();
