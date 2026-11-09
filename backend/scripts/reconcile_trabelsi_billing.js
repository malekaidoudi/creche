/**
 * Script de réconciliation des cotisations et de la date d'admission
 * Famille Mohamed Trabelsi (parent_id: 24)
 * Enfants : Lina (id: 2), Youssef (id: 1), Samir (id: 27)
 */

const db = require('../config/db_postgres');

async function main() {
  console.log('--- Démarrage de la réconciliation Trabelsi ---');

  // 1. Ajout de la colonne admission_date sur la table children si absente
  await db.query(`
    ALTER TABLE children ADD COLUMN IF NOT EXISTS admission_date DATE;
  `);
  console.log('✓ Colonne admission_date vérifiée sur table children');

  // Initialisation par défaut de admission_date sur created_at::date pour les enfants existants
  await db.query(`
    UPDATE children
    SET admission_date = created_at::date
    WHERE admission_date IS NULL;
  `);

  // Fixer explicitement l'admission de Samir Trabelsi au 01/11/2026
  await db.query(`
    UPDATE children
    SET admission_date = '2026-11-01'
    WHERE id = 27;
  `);
  console.log('✓ Samir Trabelsi (id: 27) admission_date fixée au 2026-11-01');

  // Fixer explicitement l'admission de Lina et Youssef au 2025-11-09
  await db.query(`
    UPDATE children
    SET admission_date = '2025-11-09'
    WHERE id IN (1, 2);
  `);
  console.log('✓ Lina & Youssef admission_date fixée au 2025-11-09');

  // Inscription dans enrollments pour Samir si absent
  const existingEnr = await db.query('SELECT id FROM enrollments WHERE child_id = 27');
  if (existingEnr.rows.length > 0) {
    await db.query(`
      UPDATE enrollments
      SET enrollment_date = '2026-11-01', status = 'approved', updated_at = NOW()
      WHERE child_id = 27
    `);
  } else {
    await db.query(`
      INSERT INTO enrollments (child_id, parent_id, status, enrollment_date, created_at, updated_at)
      VALUES (27, 24, 'approved', '2026-11-01', NOW(), NOW())
    `);
  }
  console.log('✓ Inscription enrollments pour Samir synchronisée');

  // 2. Annulation / Suppression des factures indûment créées pour Samir en Septembre et Octobre 2026
  // Facture 141 : Samir - Septembre 2026 (160 DT)
  // Facture 15 : Samir - Octobre 2026 (100 DT)
  const delSeptSamir = await db.query(`
    DELETE FROM child_invoices
    WHERE child_id = 27 AND period_month = 9 AND period_year = 2026
    RETURNING id, total_due, amount_paid;
  `);
  console.log('✓ Facture Septembre 2026 de Samir supprimée:', delSeptSamir.rows);

  const delOctSamir = await db.query(`
    DELETE FROM child_invoices
    WHERE child_id = 27 AND period_month = 10 AND period_year = 2026
    RETURNING id, total_due, amount_paid;
  `);
  console.log('✓ Facture Octobre 2026 de Samir supprimée:', delOctSamir.rows);

  // 3. Réaffectation du règlement de Septembre 2026 à Youssef (id: 152)
  // En Septembre, le parent a réglé 400 DT (190 DT Lina + 50 DT Youssef + 160 DT Samir)
  // Lina était due 190 DT (payée 190 DT). Youssef était dû 190 DT (payé 50 DT, reste 140 DT).
  // Avec la suppression de la facture indue de Samir (160 DT) :
  // Youssef reçoit 140 DT de ces 160 DT, ce qui solde intégralement sa cotisation de Septembre (190 DT sur 190 DT) !
  // Il reste 20 DT d'excédent (400 - 190 - 190 = 20 DT).
  await db.query(`
    UPDATE child_invoices
    SET amount_paid = 190.00,
        status = 'paid',
        receipt_number = 'REC-202609-AVOIR-0152',
        notes = '[Régularisation admission Samir - 140 DT réaffectés à Youssef pour solde complet de Septembre]',
        updated_at = NOW()
    WHERE id = 152 AND child_id = 1 AND period_month = 9 AND period_year = 2026;
  `);
  console.log('✓ Facture Septembre 2026 de Youssef soldée à 190/190 DT (statut: paid)');

  // 4. Réajustement de la facture de Novembre 2026 pour Samir (id: 65)
  // Samir commence en Novembre 2026.
  // Ses frais légitimes de Novembre sont :
  // - Forfait demi-journée : 100 DT
  // - Assurance annuelle obligatoire 2026-2027 : 60 DT
  // - Remise fratrie : 20 DT
  // - Arriérés antérieurs : 0 DT (il vient d'intégrer la crèche)
  // Total dû = 100 + 60 - 20 = 140 DT.
  // Le parent avait déjà payé 120 DT sur cette facture en Novembre.
  // Le reliquat nécessaire est de 20 DT (140 - 120 = 20 DT).
  // Ces 20 DT sont immédiatement couverts par l'excédent de 20 DT de Septembre !
  await db.query(`
    UPDATE child_invoices
    SET base_price = 100.00,
        insurance_price = 60.00,
        discount_amount = 20.00,
        previous_arrears = 0.00,
        total_due = 140.00,
        amount_paid = 140.00,
        status = 'paid',
        notes = '[Entrée officielle Novembre 2026 - Forfait 100 DT + Assurance annuelle 60 DT - Remise 20 DT - Soldé avec excédent Septembre]',
        updated_at = NOW()
    WHERE id = 65 AND child_id = 27 AND period_month = 11 AND period_year = 2026;
  `);
  console.log('✓ Facture Novembre 2026 de Samir ajustée : Forfait 100 DT + Assurance 60 DT = 140 DT (soldée)');

  // 5. Créditer le compte du parent pour les 100 DT indûment payés sur la facture d'Octobre de Samir
  // Total excédent à inscrire sur le solde d'avoir du parent : 100 DT
  await db.query(`
    UPDATE users
    SET credit_balance = 100.00,
        updated_at = NOW()
    WHERE id = 24;
  `);
  console.log('✓ Avoir du parent Mohamed Trabelsi (user_id: 24) crédité à 100.00 DT');

  // Mettre à jour insurance_paid_school_year sur les 3 enfants
  await db.query(`
    UPDATE children
    SET insurance_paid_school_year = '2026-2027'
    WHERE id IN (1, 2, 27);
  `);
  console.log('✓ insurance_paid_school_year mis à jour à 2026-2027 pour Lina, Youssef et Samir');

  // 6. Nettoyage d'éventuelles factures antérieures fantômes de Samir
  await db.query(`
    DELETE FROM child_invoices
    WHERE child_id = 27
      AND (period_year < 2026 OR (period_year = 2026 AND period_month < 11));
  `);

  console.log('--- Réconciliation Trabelsi terminée avec succès ---');
  process.exit(0);
}

main().catch(err => {
  console.error('Erreur réconciliation:', err);
  process.exit(1);
});
