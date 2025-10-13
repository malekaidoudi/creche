-- Table pour gérer les présences des enfants
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  child_id INT NOT NULL,
  date DATE NOT NULL,
  check_in_time DATETIME NULL,
  check_out_time DATETIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Contraintes
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  UNIQUE KEY unique_child_date (child_id, date),
  
  -- Index pour les performances
  INDEX idx_date (date),
  INDEX idx_child_id (child_id),
  INDEX idx_check_in_time (check_in_time),
  INDEX idx_check_out_time (check_out_time)
);

-- Insérer quelques données de test pour aujourd'hui
INSERT IGNORE INTO attendance (child_id, date, check_in_time, check_out_time, notes) VALUES
-- Enfants présents (arrivés mais pas encore partis)
(1, CURDATE(), CONCAT(CURDATE(), ' 08:30:00'), NULL, 'Arrivée normale'),
(2, CURDATE(), CONCAT(CURDATE(), ' 08:45:00'), NULL, 'Arrivée avec retard léger'),
(3, CURDATE(), CONCAT(CURDATE(), ' 08:15:00'), NULL, 'Arrivée en avance'),

-- Enfants qui ont terminé leur journée
(4, CURDATE(), CONCAT(CURDATE(), ' 08:20:00'), CONCAT(CURDATE(), ' 16:30:00'), 'Journée complète'),
(5, CURDATE(), CONCAT(CURDATE(), ' 09:00:00'), CONCAT(CURDATE(), ' 15:45:00'), 'Départ anticipé'),

-- Enfants absents (pas d'enregistrement pour aujourd'hui pour les autres enfants)

-- Données historiques (hier)
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:25:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 16:45:00'), 'Journée normale'),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:40:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 16:20:00'), 'Journée normale'),
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:10:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 17:00:00'), 'Journée normale'),
(6, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:50:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 16:10:00'), 'Journée normale'),

-- Données de la semaine dernière
(1, DATE_SUB(CURDATE(), INTERVAL 7 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), ' 08:30:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), ' 16:30:00'), 'Semaine dernière'),
(2, DATE_SUB(CURDATE(), INTERVAL 7 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), ' 08:35:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), ' 16:25:00'), 'Semaine dernière'),
(4, DATE_SUB(CURDATE(), INTERVAL 7 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), ' 08:20:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), ' 16:40:00'), 'Semaine dernière'),
(5, DATE_SUB(CURDATE(), INTERVAL 7 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), ' 09:10:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), ' 15:30:00'), 'Semaine dernière');
