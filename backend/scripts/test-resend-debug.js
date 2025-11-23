/**
 * Script de debug détaillé pour Resend
 */

require('dotenv').config();
const { Resend } = require('resend');

async function testResendDebug() {
    console.log('🔍 Test détaillé Resend\n');

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const emailData = {
            from: 'Crèche Mima Elghalia <onboarding@resend.dev>',
            to: 'crechemimaelghalia@gmail.com',
            subject: '🧪 Test Debug Resend',
            html: '<h1>Test Email</h1><p>Si vous recevez cet email, Resend fonctionne !</p>'
        };

        console.log('📤 Envoi en cours...\n');

        const response = await resend.emails.send(emailData);

        console.log('📊 Réponse complète de Resend:');
        console.log(JSON.stringify(response, null, 2));
        console.log('');

        console.log('🔍 Analyse de la réponse:');
        console.log(`   Type: ${typeof response}`);
        console.log(`   Keys: ${Object.keys(response).join(', ')}`);
        console.log('');

        if (response.data) {
            console.log('✅ response.data existe:');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');

            if (response.data.id) {
                console.log(`✅ ID de l'email: ${response.data.id}`);
            }
        }

        if (response.error) {
            console.log('❌ Erreur dans la réponse:');
            console.log(JSON.stringify(response.error, null, 2));
        }

    } catch (error) {
        console.error('❌ Exception:', error.message);
        console.error('Stack:', error.stack);
    }
}

testResendDebug();
