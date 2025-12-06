/**
 * Script de génération de données de test pour le journal d'activité
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Données de test
const testActivities = [
    // Connexions réussies
    { action: 'login_success', category: 'auth', severity: 'info', title: 'Connexion réussie', description: 'Sophie Martin s\'est connectée', user_name: 'Sophie Martin', user_email: 'sophie.martin@email.com', user_role: 'parent' },
    { action: 'login_success', category: 'auth', severity: 'info', title: 'Connexion réussie', description: 'Ahmed Benali s\'est connecté', user_name: 'Ahmed Benali', user_email: 'ahmed.benali@email.com', user_role: 'parent' },
    { action: 'login_success', category: 'auth', severity: 'info', title: 'Connexion réussie', description: 'Marie Dupont s\'est connectée', user_name: 'Marie Dupont', user_email: 'marie.dupont@creche.com', user_role: 'staff' },
    { action: 'login_success', category: 'auth', severity: 'info', title: 'Connexion réussie', description: 'Admin s\'est connecté', user_name: 'Administrateur', user_email: 'admin@creche.com', user_role: 'admin' },

    // Connexions échouées
    { action: 'login_failed', category: 'auth', severity: 'warning', title: 'Échec de connexion', description: 'Tentative de connexion échouée pour inconnu@email.com - mot de passe incorrect', user_email: 'inconnu@email.com' },
    { action: 'login_failed', category: 'auth', severity: 'warning', title: 'Échec de connexion', description: 'Tentative de connexion échouée pour test@test.com', user_email: 'test@test.com' },

    // Inscriptions
    { action: 'enrollment_created', category: 'enrollment', severity: 'info', title: 'Nouvelle inscription', description: 'Inscription de Léa Martin (2 ans) par Sophie Martin', user_name: 'Sophie Martin', target_type: 'enrollment', target_name: 'Léa Martin' },
    { action: 'enrollment_created', category: 'enrollment', severity: 'info', title: 'Nouvelle inscription', description: 'Inscription de Adam Benali (3 ans) par Ahmed Benali', user_name: 'Ahmed Benali', target_type: 'enrollment', target_name: 'Adam Benali' },
    { action: 'enrollment_approved', category: 'enrollment', severity: 'info', title: 'Inscription validée', description: 'L\'inscription de Léa Martin a été acceptée', user_name: 'Administrateur', target_type: 'enrollment', target_name: 'Léa Martin' },
    { action: 'enrollment_pending', category: 'enrollment', severity: 'info', title: 'Inscription en attente', description: 'Dossier de Youssef Alami en attente de documents', target_type: 'enrollment', target_name: 'Youssef Alami' },

    // Présences
    { action: 'attendance_checkin', category: 'attendance', severity: 'info', title: 'Arrivée enregistrée', description: 'Léa Martin est arrivée à 8h30', target_type: 'child', target_name: 'Léa Martin' },
    { action: 'attendance_checkin', category: 'attendance', severity: 'info', title: 'Arrivée enregistrée', description: 'Adam Benali est arrivé à 8h45', target_type: 'child', target_name: 'Adam Benali' },
    { action: 'attendance_checkout', category: 'attendance', severity: 'info', title: 'Départ enregistré', description: 'Léa Martin est partie à 17h00', target_type: 'child', target_name: 'Léa Martin' },
    { action: 'attendance_absent', category: 'attendance', severity: 'info', title: 'Absence signalée', description: 'Emma Petit absente aujourd\'hui (maladie)', target_type: 'child', target_name: 'Emma Petit' },

    // Documents
    { action: 'document_uploaded', category: 'document', severity: 'info', title: 'Document téléversé', description: 'Sophie Martin a téléversé le carnet de santé de Léa', user_name: 'Sophie Martin', target_type: 'document', target_name: 'Carnet de santé' },
    { action: 'document_downloaded', category: 'document', severity: 'debug', title: 'Document téléchargé', description: 'Attestation de présence téléchargée', user_name: 'Ahmed Benali', target_type: 'document', target_name: 'Attestation présence' },
    { action: 'document_generated', category: 'document', severity: 'info', title: 'Document généré', description: 'Génération du contrat pour la famille Martin', target_type: 'document', target_name: 'Contrat famille Martin' },

    // Comptes
    { action: 'account_created', category: 'account', severity: 'info', title: 'Nouveau compte créé', description: 'Création du compte pour Thomas Bernard (parent)', user_name: 'Administrateur', target_type: 'user', target_name: 'Thomas Bernard' },
    { action: 'account_updated', category: 'account', severity: 'info', title: 'Compte modifié', description: 'Mise à jour des informations de Julie Petit', user_name: 'Julie Petit', target_type: 'user', target_name: 'Julie Petit' },
    { action: 'password_changed', category: 'account', severity: 'info', title: 'Mot de passe modifié', description: 'Sophie Martin a changé son mot de passe', user_name: 'Sophie Martin' },

    // Enfants
    { action: 'child_created', category: 'child', severity: 'info', title: 'Enfant ajouté', description: 'Nouvel enfant ajouté: Lucas Dupont', user_name: 'Marie Dupont', target_type: 'child', target_name: 'Lucas Dupont' },
    { action: 'child_medical_updated', category: 'child', severity: 'info', title: 'Informations médicales mises à jour', description: 'Mise à jour des allergies pour Emma Petit', user_name: 'Staff', target_type: 'child', target_name: 'Emma Petit' },

    // Contacts
    { action: 'contact_received', category: 'contact', severity: 'info', title: 'Message reçu', description: 'Nouveau message de contact reçu de famille.durand@email.com', user_email: 'famille.durand@email.com' },
    { action: 'contact_callback', category: 'contact', severity: 'warning', title: 'Rappel demandé', description: 'Un parent a demandé à être rappelé au 06 12 34 56 78', user_name: 'Parent anonyme' },

    // Système
    { action: 'email_sent', category: 'system', severity: 'debug', title: 'Email envoyé', description: 'Email de confirmation envoyé à sophie.martin@email.com' },
    { action: 'email_failed', category: 'system', severity: 'warning', title: 'Échec envoi email', description: 'Impossible d\'envoyer l\'email à adresse.invalide@test' },
    { action: 'system_warning', category: 'system', severity: 'warning', title: 'Avertissement système', description: 'Espace disque faible sur le serveur' },

    // Sécurité
    { action: 'multiple_login_failures', category: 'security', severity: 'critical', title: 'Tentatives de connexion multiples', description: '5 tentatives de connexion échouées pour hacker@malicious.com depuis IP 192.168.1.100', user_email: 'hacker@malicious.com', ip_address: '192.168.1.100' },
    { action: 'security_alert', category: 'security', severity: 'critical', title: 'Alerte sécurité', description: 'Accès suspect détecté depuis une nouvelle localisation' },

    // Paiements
    { action: 'payment_received', category: 'payment', severity: 'info', title: 'Paiement reçu', description: 'Paiement de 450€ reçu de la famille Martin', user_name: 'Sophie Martin', target_type: 'payment' },
    { action: 'payment_alert_sent', category: 'payment', severity: 'info', title: 'Rappel de paiement envoyé', description: 'Rappel envoyé à la famille Benali pour facture en retard' },
];

// Alertes de test
const testAlerts = [
    { type: 'security', severity: 'critical', title: '🔒 Alerte Sécurité', message: 'Plusieurs tentatives de connexion échouées détectées pour hacker@malicious.com' },
    { type: 'enrollment', severity: 'warning', title: '📋 Inscriptions en attente', message: '3 inscriptions sont en attente de traitement depuis plus de 3 jours' },
    { type: 'system', severity: 'warning', title: '⚠️ Espace disque', message: 'L\'espace disque du serveur est inférieur à 20%' },
    { type: 'document', severity: 'warning', title: '📄 Documents manquants', message: '2 familles n\'ont pas fourni tous les documents requis' },
];

async function seedData() {
    console.log('🌱 Génération des données de test pour le journal d\'activité...\n');

    const client = await pool.connect();

    try {
        // Insérer les activités avec des dates variées
        console.log('📝 Insertion des activités...');

        for (let i = 0; i < testActivities.length; i++) {
            const activity = testActivities[i];

            // Varier les dates (dernières 24h à 7 jours)
            const hoursAgo = Math.floor(Math.random() * 168); // 0 à 7 jours
            const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

            await client.query(`
        INSERT INTO activity_logs (
          action, category, severity, title, description,
          user_name, user_email, user_role,
          target_type, target_name, ip_address,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
                activity.action,
                activity.category,
                activity.severity,
                activity.title,
                activity.description,
                activity.user_name || null,
                activity.user_email || null,
                activity.user_role || null,
                activity.target_type || null,
                activity.target_name || null,
                activity.ip_address || '192.168.1.' + Math.floor(Math.random() * 255),
                createdAt
            ]);
        }

        console.log(`  ✅ ${testActivities.length} activités insérées`);

        // Insérer les alertes
        console.log('\n🔔 Insertion des alertes...');

        for (const alert of testAlerts) {
            await client.query(`
        INSERT INTO alerts (type, severity, status, title, message, created_at)
        VALUES ($1, $2, 'active', $3, $4, NOW() - INTERVAL '${Math.floor(Math.random() * 48)} hours')
      `, [alert.type, alert.severity, alert.title, alert.message]);
        }

        console.log(`  ✅ ${testAlerts.length} alertes insérées`);

        // Afficher les statistiques
        const stats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical,
        COUNT(*) FILTER (WHERE severity = 'warning') as warning,
        COUNT(*) FILTER (WHERE severity = 'info') as info,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today
      FROM activity_logs
    `);

        console.log('\n📊 Statistiques:');
        console.log(`  - Total activités: ${stats.rows[0].total}`);
        console.log(`  - Critiques: ${stats.rows[0].critical}`);
        console.log(`  - Avertissements: ${stats.rows[0].warning}`);
        console.log(`  - Informations: ${stats.rows[0].info}`);
        console.log(`  - Aujourd'hui: ${stats.rows[0].today}`);

        const alertStats = await client.query(`
      SELECT COUNT(*) as total FROM alerts WHERE status = 'active'
    `);
        console.log(`  - Alertes actives: ${alertStats.rows[0].total}`);

        console.log('\n✅ Données de test générées avec succès!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seedData();
