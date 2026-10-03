/**
 * SERVICE QUESTIONNAIRE DE PERMISSIONS
 * Permet à la direction (client) de répondre à un questionnaire simple
 * qui servira à définir les accès accordés aux éducatrices.
 *
 * Table créée automatiquement si elle n'existe pas encore (migration
 * additive, aucune table existante n'est modifiée).
 */

const db = require('../config/db_postgres');

let tableReady = false;

/**
 * Crée la table si nécessaire (idempotent, sans danger pour la prod)
 */
const ensureTable = async () => {
  if (tableReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS permissions_questionnaire_responses (
      id SERIAL PRIMARY KEY,
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      comment TEXT,
      submitted_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  tableReady = true;
};

/**
 * Récupère la dernière réponse enregistrée (pour pré-remplir le formulaire)
 */
const getLatestResponse = async () => {
  await ensureTable();

  const result = await db.query(
    `SELECT id, answers, comment, submitted_by, created_at, updated_at
     FROM permissions_questionnaire_responses
     ORDER BY updated_at DESC
     LIMIT 1`
  );

  return result.rows[0] || null;
};

/**
 * Enregistre (ou met à jour) la réponse du client.
 * On garde une seule ligne "courante" : si une réponse existe déjà, on la met à jour,
 * sinon on en crée une nouvelle. L'historique complet reste consultable via created_at.
 */
const saveResponse = async ({ answers, comment, submittedBy }) => {
  await ensureTable();

  const result = await db.query(
    `INSERT INTO permissions_questionnaire_responses (answers, comment, submitted_by)
     VALUES ($1, $2, $3)
     RETURNING id, answers, comment, submitted_by, created_at, updated_at`,
    [JSON.stringify(answers || {}), comment || null, submittedBy || null]
  );

  return result.rows[0];
};

module.exports = {
  ensureTable,
  getLatestResponse,
  saveResponse
};
