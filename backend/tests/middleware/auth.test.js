/**
 * Tests pour le middleware d'authentification
 */

const jwt = require('jsonwebtoken');

// Mock des dépendances
jest.mock('../../config/db_postgres', () => ({
  query: jest.fn()
}));

jest.mock('../../utils/logger', () => ({
  sensitive: jest.fn(),
  security: jest.fn(),
  error: jest.fn()
}));

describe('Auth Middleware', () => {
  let auth;
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
  });
  
  beforeEach(() => {
    jest.resetModules();
    auth = require('../../middleware/auth');
    
    mockReq = {
      headers: {},
      user: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });
  
  describe('authenticateToken', () => {
    test('devrait rejeter si aucun token fourni', () => {
      auth.authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        code: 'NO_TOKEN'
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('devrait rejeter un token invalide', () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      
      auth.authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        code: 'INVALID_TOKEN'
      }));
    });
    
    test('devrait accepter un token valide', () => {
      const token = jwt.sign(
        { id: 1, email: 'test@test.com', role: 'admin' },
        process.env.JWT_SECRET
      );
      mockReq.headers.authorization = `Bearer ${token}`;
      
      auth.authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(1);
      expect(mockReq.user.role).toBe('admin');
    });
    
    test('devrait normaliser userId vers id', () => {
      const token = jwt.sign(
        { userId: 5, email: 'test@test.com', role: 'parent' },
        process.env.JWT_SECRET
      );
      mockReq.headers.authorization = `Bearer ${token}`;
      
      auth.authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockReq.user.id).toBe(5);
    });
  });
  
  describe('requireRole', () => {
    test('devrait rejeter si pas authentifié', () => {
      const middleware = auth.requireRole('admin');
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
    
    test('devrait rejeter si rôle insuffisant', () => {
      mockReq.user = { id: 1, role: 'parent' };
      const middleware = auth.requireRole('admin');
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INSUFFICIENT_PRIVILEGES'
      }));
    });
    
    test('devrait accepter un rôle autorisé', () => {
      mockReq.user = { id: 1, role: 'admin' };
      const middleware = auth.requireRole('admin', 'staff');
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
    
    test('devrait accepter le rôle staff quand admin|staff sont autorisés', () => {
      mockReq.user = { id: 1, role: 'staff' };
      const middleware = auth.requireRole('admin', 'staff');
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });
  
  describe('Middlewares prédéfinis', () => {
    test('requireAdmin devrait exiger le rôle admin', () => {
      mockReq.user = { id: 1, role: 'staff' };
      auth.requireAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
    
    test('requireStaff devrait accepter admin et staff', () => {
      mockReq.user = { id: 1, role: 'staff' };
      auth.requireStaff(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

