const request = require('supertest');
const app = require('../server');
const db = require('../config/db_postgres');

describe('Enrollments Workflow v2', () => {
  let adminToken, testEnrollmentId;
  
  beforeAll(async () => {
    // Setup test user and token
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign(
      { id: 1, email: 'admin@test.com', role: 'admin' },
      process.env.JWT_SECRET
    );
  });
  
  test('POST /api/enrollments - Create enrollment', async () => {
    const data = {
      applicant_first_name: 'Jean',
      applicant_last_name: 'Test',
      applicant_email: 'jean.test@email.com',
      child_first_name: 'Pierre',
      child_last_name: 'Test',
      child_birth_date: '2020-03-15',
      child_gender: 'M'
    };
    
    const response = await request(app)
      .post('/api/enrollments')
      .send(data)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    testEnrollmentId = response.body.enrollment.id;
  });
  
  test('POST /api/enrollments/:id/approve - Approve enrollment', async () => {
    const response = await request(app)
      .post(`/api/enrollments/${testEnrollmentId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('parent_id');
    expect(response.body).toHaveProperty('child_id');
  });
  
  test('GET /api/enrollments - List enrollments', async () => {
    const response = await request(app)
      .get('/api/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.enrollments).toBeInstanceOf(Array);
  });
});

module.exports = {};
