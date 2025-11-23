-- Script pour mettre à jour les dates de naissance des enfants
-- Tous les enfants doivent avoir entre 2 mois et 3 ans

-- Mettre à jour les enfants trop vieux (plus de 3 ans)
UPDATE children 
SET birth_date = CURRENT_DATE - INTERVAL '2 years 6 months'
WHERE EXTRACT(YEAR FROM AGE(birth_date)) > 3;

-- Mettre à jour les enfants trop jeunes (moins de 2 mois)
UPDATE children 
SET birth_date = CURRENT_DATE - INTERVAL '6 months'
WHERE birth_date > CURRENT_DATE - INTERVAL '2 months';

-- Vérifier les résultats
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
    ELSE 'hors_limite'
  END as age_category
FROM children 
ORDER BY birth_date DESC;
