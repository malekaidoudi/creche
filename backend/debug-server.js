#!/usr/bin/env node

console.log('🐛 DÉMARRAGE DEBUG SERVEUR');
console.log('========================');

// 1. Test des imports
console.log('1️⃣ Test des imports...');
try {
  const express = require('express');
  console.log('✅ Express importé');
  
  const cors = require('cors');
  console.log('✅ CORS importé');
  
  require('dotenv').config();
  console.log('✅ dotenv configuré');
  
} catch (error) {
  console.error('❌ Erreur import:', error.message);
  process.exit(1);
}

// 2. Test de la base de données
console.log('\n2️⃣ Test base de données...');
try {
  const db = require('./config/db_postgres');
  console.log('✅ Config DB importée');
  
  // Test connexion async
  (async () => {
    try {
      await db.testConnection();
      console.log('✅ Connexion DB testée');
      
      // 3. Test des routes
      console.log('\n3️⃣ Test des imports de routes...');
      
      const routes = [
        './routes/auth',
        './routes/users', 
        './routes/children',
        './routes/enrollments',
        './routes/attendance',
        './routes/uploads',
        './routes/documents',
        './routes/reports',
        './routes/settings',
        './routes/logs',
        './routes/articles',
        './routes/news',
        './routes/contacts',
        './routes/health',
        './routes/publicEnrollments',
        './routes/setup',
        './routes/profile',
        './routes/absenceRequests',
        './routes/notifications',
        './routes/nurserySettings',
        './routes/holidays',
        './routes/schedule-settings',
        './routes/fixUserRole',
        './routes/userChildren'
      ];
      
      for (const route of routes) {
        try {
          require(route);
          console.log(`✅ Route ${route} importée`);
        } catch (error) {
          console.error(`❌ Erreur route ${route}:`, error.message);
        }
      }
      
      // 4. Test création serveur Express
      console.log('\n4️⃣ Test création serveur Express...');
      
      const express = require('express');
      const app = express();
      console.log('✅ App Express créée');
      
      // 5. Test middlewares
      console.log('\n5️⃣ Test middlewares...');
      
      app.use(express.json());
      console.log('✅ JSON middleware ajouté');
      
      const cors = require('cors');
      app.use(cors());
      console.log('✅ CORS middleware ajouté');
      
      // 6. Test route simple
      console.log('\n6️⃣ Test route simple...');
      
      app.get('/debug', (req, res) => {
        res.json({ status: 'ok', message: 'Debug route fonctionne' });
      });
      console.log('✅ Route debug ajoutée');
      
      // 7. Test démarrage serveur
      console.log('\n7️⃣ Test démarrage serveur...');
      
      const PORT = 3001; // Port différent pour éviter les conflits
      
      const server = app.listen(PORT, () => {
        console.log(`✅ Serveur debug démarré sur port ${PORT}`);
        console.log(`🧪 Test: http://localhost:${PORT}/debug`);
        
        // Test auto de la route
        setTimeout(async () => {
          try {
            const response = await fetch(`http://localhost:${PORT}/debug`);
            const data = await response.json();
            console.log('✅ Route debug testée:', data);
            
            console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
            console.log('Le problème ne vient pas des imports ou de la DB');
            
            server.close();
            process.exit(0);
            
          } catch (error) {
            console.error('❌ Erreur test route:', error.message);
            server.close();
            process.exit(1);
          }
        }, 1000);
      });
      
      server.on('error', (error) => {
        console.error('❌ Erreur serveur:', error.message);
        process.exit(1);
      });
      
    } catch (error) {
      console.error('❌ Erreur test DB:', error.message);
      process.exit(1);
    }
  })();
  
} catch (error) {
  console.error('❌ Erreur config DB:', error.message);
  process.exit(1);
}
