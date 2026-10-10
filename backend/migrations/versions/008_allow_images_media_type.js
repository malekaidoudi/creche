/**
 * Migration 008 - Allow 'images' media_type in activities
 *
 * Met à jour la contrainte CHECK sur media_type pour accepter 'images'
 * (en plus de 'image', 'video', 'live', 'none').
 */

module.exports = {
  version: '008_allow_images_media_type',
  name: 'Update activities_media_type_check to allow images',

  up: async (client) => {
    await client.query(`
      ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_media_type_check;

      ALTER TABLE activities ADD CONSTRAINT activities_media_type_check
        CHECK (((media_type)::text = ANY ((ARRAY['image'::character varying, 'images'::character varying, 'video'::character varying, 'live'::character varying, 'none'::character varying])::text[])));
    `);
  },

  down: async (client) => {
    // Non destructif
  }
};
