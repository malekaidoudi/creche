const { pool } = require('../config/db_postgres');

async function fixRemainingAges() {
    try {
        console.log('🔧 Correction des enfants restants...\n');

        // Mettre à jour Adam Gharbi (3 ans 2 mois) → 2 ans 6 mois
        const updateAdam = await pool.query(`
      UPDATE children 
      SET birth_date = CURRENT_DATE - INTERVAL '2 years 6 months'
      WHERE first_name = 'Adam' AND last_name = 'Gharbi'
      RETURNING id, first_name, last_name, birth_date
    `);

        if (updateAdam.rows.length > 0) {
            console.log('✅ Adam Gharbi mis à jour:', updateAdam.rows[0].birth_date);
        }

        // Mettre à jour Youssef Trabelsi (3 ans 8 mois) → 2 ans 10 mois
        const updateYoussef = await pool.query(`
      UPDATE children 
      SET birth_date = CURRENT_DATE - INTERVAL '2 years 10 months'
      WHERE first_name = 'Youssef' AND last_name = 'Trabelsi'
      RETURNING id, first_name, last_name, birth_date
    `);

        if (updateYoussef.rows.length > 0) {
            console.log('✅ Youssef Trabelsi mis à jour:', updateYoussef.rows[0].birth_date);
        }

        // Vérifier tous les enfants
        console.log('\n📊 Tous les enfants:');
        const all = await pool.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        birth_date,
        EXTRACT(YEAR FROM AGE(birth_date)) as years,
        EXTRACT(MONTH FROM AGE(birth_date)) as months,
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) = 0 AND EXTRACT(MONTH FROM AGE(birth_date)) BETWEEN 2 AND 11 THEN 'infant'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) = 1 THEN 'toddler'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) = 2 OR (EXTRACT(YEAR FROM AGE(birth_date)) = 3 AND EXTRACT(MONTH FROM AGE(birth_date)) = 0) THEN 'young'
          ELSE 'HORS_LIMITE'
        END as category
      FROM children 
      ORDER BY birth_date DESC
    `);

        all.rows.forEach(child => {
            const emoji = child.category === 'HORS_LIMITE' ? '❌' : '✅';
            console.log(`  ${emoji} ${child.first_name} ${child.last_name}: ${child.years} ans ${child.months} mois → ${child.category}`);
        });

        console.log('\n✅ Terminé !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

fixRemainingAges();
