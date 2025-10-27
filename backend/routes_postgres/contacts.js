const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');

router.get('/', (req, res) => {
  res.json({ message: 'Route contacts PostgreSQL - En développement', database: 'PostgreSQL Neon' });
});

module.exports = router;
