const request = require('supertest')
const app = require('../server')
const { query } = require('../config/database')

describe('Children Routes', () => {
  let authToken
  let parentId
  let childId

  beforeAll(async () => {
    // Créer un utilisateur parent pour les tests
    const parentData = {
      email: 'parent.test@example.com',
      password: 'password123',
      first_name: 'Parent',
      last_name: 'Test',
      role: 'parent'
    }

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(parentData)

    authToken = registerResponse.body.token
    parentId = registerResponse.body.user.id
  })

  afterAll(async () => {
    // Nettoyer les données de test
    if (childId) {
      await query('DELETE FROM children WHERE id = ?', [childId])
    }
    if (parentId) {
      await query('DELETE FROM users WHERE id = ?', [parentId])
    }
  })

  describe('POST /api/children', () => {
    it('should create a new child successfully', async () => {
      const childData = {
        first_name: 'Enfant',
        last_name: 'Test',
        birth_date: '2020-05-15',
        gender: 'male',
        medical_info: 'Aucune allergie connue',
        emergency_contact: 'Grand-mère: 0123456789'
      }

      const response = await request(app)
        .post('/api/children')
        .set('Authorization', `Bearer ${authToken}`)
        .send(childData)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'Enfant ajouté avec succès')
      expect(response.body).toHaveProperty('child')
      expect(response.body.child.first_name).toBe(childData.first_name)
      expect(response.body.child.parent_id).toBe(parentId)

      childId = response.body.child.id
    })

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        first_name: 'E', // trop court
        birth_date: 'invalid-date',
        gender: 'invalid'
      }

      const response = await request(app)
        .post('/api/children')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Données invalides')
      expect(response.body).toHaveProperty('details')
    })

    it('should return error without authentication', async () => {
      const childData = {
        first_name: 'Test',
        last_name: 'Child',
        birth_date: '2020-01-01',
        gender: 'female'
      }

      const response = await request(app)
        .post('/api/children')
        .send(childData)
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Token d\'accès requis')
    })
  })

  describe('GET /api/children', () => {
    it('should get children list for authenticated parent', async () => {
      const response = await request(app)
        .get('/api/children')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Enfants récupérés avec succès')
      expect(response.body).toHaveProperty('children')
      expect(Array.isArray(response.body.children)).toBe(true)
    })

    it('should return error without authentication', async () => {
      const response = await request(app)
        .get('/api/children')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Token d\'accès requis')
    })
  })

  describe('GET /api/children/:id', () => {
    it('should get specific child details', async () => {
      if (!childId) {
        // Créer un enfant pour le test
        const childData = {
          first_name: 'Test',
          last_name: 'Child',
          birth_date: '2020-01-01',
          gender: 'female'
        }

        const createResponse = await request(app)
          .post('/api/children')
          .set('Authorization', `Bearer ${authToken}`)
          .send(childData)

        childId = createResponse.body.child.id
      }

      const response = await request(app)
        .get(`/api/children/${childId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Enfant récupéré avec succès')
      expect(response.body).toHaveProperty('child')
      expect(response.body.child.id).toBe(childId)
    })

    it('should return 404 for non-existent child', async () => {
      const response = await request(app)
        .get('/api/children/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Enfant non trouvé')
    })
  })

  describe('PUT /api/children/:id', () => {
    it('should update child information', async () => {
      if (!childId) return

      const updateData = {
        first_name: 'Enfant Modifié',
        medical_info: 'Allergie aux arachides'
      }

      const response = await request(app)
        .put(`/api/children/${childId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Enfant mis à jour avec succès')
      expect(response.body.child.first_name).toBe(updateData.first_name)
      expect(response.body.child.medical_info).toBe(updateData.medical_info)
    })
  })

  describe('DELETE /api/children/:id', () => {
    it('should delete child (soft delete)', async () => {
      if (!childId) return

      const response = await request(app)
        .delete(`/api/children/${childId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Enfant supprimé avec succès')

      // Vérifier que l'enfant est marqué comme inactif
      const [child] = await query('SELECT is_active FROM children WHERE id = ?', [childId])
      expect(child.is_active).toBe(0) // false en MySQL
    })
  })
})
