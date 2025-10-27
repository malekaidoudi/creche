#!/usr/bin/env node

/**
 * Script pour corriger toutes les routes qui utilisent encore MySQL
 * et les faire pointer vers PostgreSQL
 */

const fs = require('fs').promises;
const path = require('path');

const routesDir = path.join(__dirname, '../routes');

const filesToFix = [
  'notifications.js',
  'articles.js', 
  'schedule-settings.js',
  'absences.js',
  'setup.js',
  'userChildren.js',
  'news.js',
  'holidays.js',
  'fixUserRole.js',
  'contacts.js',
  'nursery-settings.js',
  'upload.js',
  'absenceRequests.js',
  'auth.js',
  'publicEnrollments.js',
  'nurserySettings.js',
  'health.js',
  'profile.js'
];

async function fixRoute(filename) {
  const filePath = path.join(routesDir, filename);
  
  try {
    console.log(`🔧 Correction de ${filename}...`);
    
    let content = await fs.readFile(filePath, 'utf8');
    
    // Remplacements pour PostgreSQL
    const replacements = [
      // Import principal
      {
        from: "require('../config/database')",
        to: "require('../config/db_postgres')"
      },
      // Destructuring query
      {
        from: "const { query } = require('../config/database');",
        to: "const { query } = require('../config/db_postgres');"
      },
      // Destructuring avec alias
      {
        from: "const { query: dbQuery } = require('../config/database');",
        to: "const { query: dbQuery } = require('../config/db_postgres');"
      },
      // Destructuring execute
      {
        from: "const { execute } = require('../config/database');",
        to: "const { execute } = require('../config/db_postgres');"
      },
      // Destructuring pool et transaction
      {
        from: "const { pool, transaction } = require('../config/database');",
        to: "const { pool, transaction } = require('../config/db_postgres');"
      },
      // Destructuring testConnection
      {
        from: "const { testConnection } = require('../config/database');",
        to: "const { testConnection } = require('../config/db_postgres');"
      },
      // Import db
      {
        from: "const db = require('../config/database');",
        to: "const db = require('../config/db_postgres');"
      },
      // Import inline dans auth.js
      {
        from: "const db = require('../config/database');",
        to: "const db = require('../config/db_postgres');"
      }
    ];
    
    let modified = false;
    
    for (const replacement of replacements) {
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
        modified = true;
        console.log(`   ✅ Remplacé: ${replacement.from} → ${replacement.to}`);
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`   💾 ${filename} sauvegardé`);
    } else {
      console.log(`   ⚠️  Aucun changement nécessaire dans ${filename}`);
    }
    
  } catch (error) {
    console.error(`   ❌ Erreur avec ${filename}:`, error.message);
  }
}

async function fixAllRoutes() {
  console.log('🚀 CORRECTION DES ROUTES MYSQL → POSTGRESQL');
  console.log('==========================================');
  
  for (const filename of filesToFix) {
    await fixRoute(filename);
  }
  
  console.log('\n🎉 CORRECTION TERMINÉE !');
  console.log('Toutes les routes utilisent maintenant PostgreSQL');
}

if (require.main === module) {
  fixAllRoutes().catch(console.error);
}

module.exports = { fixAllRoutes };
