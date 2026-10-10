/**
 * Migration 007 - Activity Multiple Photos (media_urls)
 *
 * Ajout de la colonne media_urls (JSONB) à la table activities
 * pour supporter plusieurs photos par publication :
 * - media_urls JSONB DEFAULT '[]'::jsonb
 * - Rétrocompatibilité : backfill des activités existantes ayant media_url
 */

module.exports = {
  version: '007_activity_media_urls',
  name: 'Add media_urls JSONB to activities for multiple photos support',

  up: async (client) => {
    await client.query(`
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;

      -- Backfill pour les publications existantes ayant un media_url valide
      UPDATE activities
      SET media_urls = jsonb_build_array(
        jsonb_build_object(
          'url', media_url,
          'thumbnailUrl', media_thumbnail_url,
          'publicId', cloudinary_public_id,
          'type', COALESCE(media_type, 'image')
        )
      )
      WHERE media_url IS NOT NULL 
        AND (media_urls IS NULL OR media_urls = '[]'::jsonb);
    `);
  },

  down: async (client) => {
    // Non destructif en production
  }
};
