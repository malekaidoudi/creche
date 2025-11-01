-- Migration: Ajout de la colonne parent_id à la table children
-- Date: 2025-10-31
-- Description: Associer chaque enfant à un parent pour une meilleure gestion des données

-- Étape 1: Ajouter la colonne parent_id avec contrainte de clé étrangère
ALTER TABLE children 
ADD COLUMN parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Étape 2: Associer les enfants existants aux parents par nom de famille
-- Mohamed Ben Ali (id: 3) - parent@creche.com
UPDATE children SET parent_id = 3 WHERE last_name = 'Ben Ali';

-- Amina Trabelsi (id: 5) - parent2@creche.com  
UPDATE children SET parent_id = 5 WHERE last_name = 'Trabelsi';

-- Karim Sassi (id: 6) - parent3@creche.com
UPDATE children SET parent_id = 6 WHERE last_name = 'Sassi';

-- Leila Gharbi (id: 7) - parent4@creche.com
UPDATE children SET parent_id = 7 WHERE last_name = 'Gharbi';

-- Omar Bouazizi (id: 8) - parent5@creche.com
UPDATE children SET parent_id = 8 WHERE last_name = 'Bouazizi';

-- Enfants orphelins ou cas spéciaux assignés à Mohamed Ben Ali
UPDATE children SET parent_id = 3 WHERE last_name = 'Orpheline';

-- Étape 3: Corriger les enrollments pour qu'ils correspondent aux associations enfants-parents
UPDATE enrollments 
SET parent_id = c.parent_id 
FROM children c 
WHERE enrollments.child_id = c.id 
AND enrollments.parent_id != c.parent_id;

-- Vérification finale
SELECT 
  'Enfants associés' as type,
  COUNT(*) as total,
  COUNT(parent_id) as avec_parent
FROM children

UNION ALL

SELECT 
  'Enrollments cohérents' as type,
  COUNT(*) as total,
  COUNT(CASE WHEN e.parent_id = c.parent_id THEN 1 END) as coherents
FROM enrollments e
JOIN children c ON e.child_id = c.id;
