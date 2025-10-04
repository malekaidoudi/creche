const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises
const { authenticateToken } = require('../middleware/auth')
const { query: dbQuery } = require('../config/database')

const router = express.Router()

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profiles')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const extension = path.extname(file.originalname)
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${extension}`)
  }
})

// Filtres pour les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
})

// Route pour uploader une photo de profil
router.post('/profile-picture', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' })
    }

    const userId = req.user.id
    const filename = req.file.filename
    const profilePictureUrl = `/uploads/profiles/${filename}`

    // Récupérer l'ancienne photo de profil pour la supprimer
    const currentUser = await dbQuery(
      'SELECT profile_picture FROM users WHERE id = ?',
      [userId]
    )

    // Mettre à jour la base de données avec la nouvelle URL
    await dbQuery(
      'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [profilePictureUrl, userId]
    )

    // Supprimer l'ancienne photo si elle existe
    if (currentUser[0]?.profile_picture) {
      const oldFilePath = path.join(__dirname, '..', currentUser[0].profile_picture)
      try {
        await fs.unlink(oldFilePath)
      } catch (error) {
        console.log('Impossible de supprimer l\'ancienne photo:', error.message)
      }
    }

    res.json({
      message: 'Photo de profil mise à jour avec succès',
      profile_picture_url: profilePictureUrl
    })

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file) {
      try {
        await fs.unlink(req.file.path)
      } catch (unlinkError) {
        console.error('Erreur lors de la suppression du fichier:', unlinkError)
      }
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux (max 5MB)' })
    }

    res.status(500).json({ error: 'Erreur lors de l\'upload de la photo' })
  }
})

// Route pour supprimer une photo de profil
router.delete('/profile-picture', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Récupérer la photo actuelle
    const currentUser = await dbQuery(
      'SELECT profile_picture FROM users WHERE id = ?',
      [userId]
    )

    if (!currentUser[0]?.profile_picture) {
      return res.status(404).json({ error: 'Aucune photo de profil à supprimer' })
    }

    // Supprimer le fichier
    const filePath = path.join(__dirname, '..', currentUser[0].profile_picture)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.log('Fichier déjà supprimé ou introuvable:', error.message)
    }

    // Mettre à jour la base de données
    await dbQuery(
      'UPDATE users SET profile_picture = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    )

    res.json({ message: 'Photo de profil supprimée avec succès' })

  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression de la photo' })
  }
})

module.exports = router
