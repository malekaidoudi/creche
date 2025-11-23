/**
 * Script de test avec une vraie adresse email
 */

require('dotenv').config();
const { Resend } = require('resend');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function testWithRealEmail() {
    console.log('🧪 Test Resend avec une vraie adresse email\n');

    const resend = new Resend(process.env.RESEND_API_KEY);

    rl.question('📧 Entrez votre adresse email pour recevoir le test: ', async (email) => {
        try {
            console.log(`\n📤 Envoi d'un email de test à: ${email}\n`);

            const emailData = {
                from: 'Crèche Mima Elghalia <onboarding@resend.dev>',
                to: email,
                subject: '🧪 Test Approbation - Crèche Mima Elghalia',
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Dossier Approuvé</h1>
                <p>Crèche Mima Elghalia</p>
              </div>
              <div class="content">
                <h2>Bonjour,</h2>
                
                <p>Nous avons le plaisir de vous informer que le dossier d'inscription de <strong>votre enfant</strong> a été approuvé !</p>
                
                <div class="info-box">
                  <strong>📅 Rendez-vous prévu :</strong><br>
                  Lundi 20 janvier 2025 à 10:00
                </div>
                
                <p>Pour finaliser votre inscription, veuillez créer votre mot de passe en cliquant sur le bouton ci-dessous :</p>
                
                <center>
                  <a href="https://example.com/create-password?token=test123" class="button">
                    🔐 Créer mon mot de passe
                  </a>
                </center>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  Ce lien est valable pendant 48 heures.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #666; font-size: 12px;">
                  Ceci est un email de test. Si vous recevez cet email, le système fonctionne correctement !
                </p>
              </div>
            </div>
          </body>
          </html>
        `
            };

            const response = await resend.emails.send(emailData);

            if (response.data && response.data.id) {
                console.log('✅ Email envoyé avec succès!\n');
                console.log(`📊 ID de l'email: ${response.data.id}\n`);
                console.log('🔍 Vérifiez votre boîte mail (et le dossier spam)');
                console.log(`📧 Email envoyé à: ${email}\n`);
                console.log('💡 Consultez les logs Resend: https://resend.com/emails');
            } else if (response.error) {
                console.error('❌ Erreur Resend:', response.error);
            }

        } catch (error) {
            console.error('\n❌ Erreur:', error.message);

            if (error.message.includes('bounce')) {
                console.error('\n💡 L\'adresse email a été rejetée (bounced).');
                console.error('   Causes possibles:');
                console.error('   - Adresse email invalide ou inexistante');
                console.error('   - Serveur de messagerie bloque les emails de test');
                console.error('   - Quota Resend atteint');
            }
        } finally {
            rl.close();
        }
    });
}

testWithRealEmail();
