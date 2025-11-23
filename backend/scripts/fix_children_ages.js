const { pool } = require('../config/db_postgres');

async function fixChildrenAges() {
    try {
        console.log('🔧 Correction des âges des enfants...\n');

        // 1. Afficher les âges actuels
        console.log('📊 Âges actuels:');
        const current = await pool.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        birth_date,
        EXTRACT(YEAR FROM AGE(birth_date)) as years,
        EXTRACT(MONTH FROM AGE(birth_date)) as months
      FROM children 
      ORDER BY birth_date DESC
    `);

        current.rows.forEach(child => {
            console.log(`  - ${child.first_name} ${child.last_name}: ${child.years} ans et ${child.months} mois (né le ${child.birth_date})`);
        });

        // 2. Mettre à jour les enfants trop vieux (plus de 3 ans)
        console.log('\n🔄 Mise à jour des enfants trop vieux (> 3 ans)...');
        const updateOld = await pool.query(`
      UPDATE children 
      SET birth_date = CURRENT_DATE - INTERVAL '2 years 6 months'
      WHERE EXTRACT(YEAR FROM AGE(birth_date)) > 3
      RETURNING id, first_name, last_name, birth_date
    `);

        if (updateOld.rows.length > 0) {
            console.log(`✅ ${updateOld.rows.length} enfant(s) mis à jour:`);
            updateOld.rows.forEach(child => {
                console.log(`  - ${child.first_name} ${child.last_name} → nouvelle date: ${child.birth_date}`);
            });
        } else {
            console.log('✅ Aucun enfant trop vieux');
        }

        // 3. Mettre à jour les enfants trop jeunes (moins de 2 mois)
        console.log('\n🔄 Mise à jour des enfants trop jeunes (< 2 mois)...');
        const updateYoung = await pool.query(`
      UPDATE children 
      SET birth_date = CURRENT_DATE - INTERVAL '6 months'
      WHERE birth_date > CURRENT_DATE - INTERVAL '2 months'
      RETURNING id, first_name, last_name, birth_date
    `);

        if (updateYoung.rows.length > 0) {
            console.log(`✅ ${updateYoung.rows.length} enfant(s) mis à jour:`);
            updateYoung.rows.forEach(child => {
                console.log(`  - ${child.first_name} ${child.last_name} → nouvelle date: ${child.birth_date}`);
            });
        } else {
            console.log('✅ Aucun enfant trop jeune');
        }

        // 4. Afficher les âges finaux
        console.log('\n📊 Âges finaux:');
        const final = await pool.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        birth_date,
        EXTRACT(YEAR FROM AGE(birth_date)) as years,
        EXTRACT(MONTH FROM AGE(birth_date)) as months,
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) = 0 AND EXTRACT(MONTH FROM AGE(birth_date)) BETWEEN 2 AND 11 THEN 'infant (2-11 mois)'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) = 1 THEN 'toddler (1-2 ans)'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) = 2 OR (EXTRACT(YEAR FROM AGE(birth_date)) = 3 AND EXTRACT(MONTH FROM AGE(birth_date)) = 0) THEN 'young (2-3 ans)'
          ELSE 'HORS LIMITE'
        END as age_category
      FROM children 
      ORDER BY birth_date DESC
    `);

        final.rows.forEach(child => {
            console.log(`  - ${child.first_name} ${child.last_name}: ${child.years} ans et ${child.months} mois → ${child.age_category}`);
        });

        console.log('\n✅ Correction terminée !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

fixChildrenAges();
