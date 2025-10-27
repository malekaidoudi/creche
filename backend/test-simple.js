#!/usr/bin/env node

console.log('🚀 Test serveur ultra-simple...');

const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Route de test sans base de données
app.get('/test', (req, res) => {
  console.log('✅ Route /test appelée');
  res.json({ 
    status: 'ok', 
    message: 'Serveur fonctionne sans PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Route de santé simple
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serveur actif' });
});

console.log('🔧 Démarrage du serveur...');

const server = app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
  console.log(`❤️  Santé: http://localhost:${PORT}/health`);
});

server.on('error', (error) => {
  console.error('❌ Erreur serveur:', error.message);
});

// Test automatique après 2 secondes
setTimeout(async () => {
  try {
    console.log('🧪 Test automatique...');
    const response = await fetch(`http://localhost:${PORT}/test`);
    const data = await response.json();
    console.log('✅ Test réussi:', data);
  } catch (error) {
    console.error('❌ Test échoué:', error.message);
  }
}, 2000);
