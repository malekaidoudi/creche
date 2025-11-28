/**
 * Tests pour le module apiResponse
 */

const apiResponse = require('../../utils/apiResponse');

describe('API Response Helper', () => {
  let mockRes;
  
  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });
  
  describe('success()', () => {
    test('devrait retourner une réponse 200 par défaut', () => {
      apiResponse.success(mockRes, { id: 1 });
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 }
      });
    });
    
    test('devrait inclure un message si fourni', () => {
      apiResponse.success(mockRes, null, 'Opération réussie');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Opération réussie'
      });
    });
    
    test('devrait utiliser un code de statut personnalisé', () => {
      apiResponse.success(mockRes, null, null, 202);
      
      expect(mockRes.status).toHaveBeenCalledWith(202);
    });
  });
  
  describe('created()', () => {
    test('devrait retourner 201 avec message par défaut', () => {
      apiResponse.created(mockRes, { id: 42 });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 42 },
        message: 'Ressource créée avec succès'
      });
    });
  });
  
  describe('paginated()', () => {
    test('devrait retourner des données paginées', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { page: 1, limit: 10, total: 25 };
      
      apiResponse.paginated(mockRes, data, pagination);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3
        }
      });
    });
  });
  
  describe('error()', () => {
    test('devrait retourner une erreur 500 par défaut', () => {
      apiResponse.error(mockRes, 'Erreur serveur');
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erreur serveur'
      });
    });
    
    test('devrait inclure un code et des détails', () => {
      apiResponse.error(mockRes, 'Invalid data', 400, 'VALIDATION_ERROR', ['champ requis']);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid data',
        code: 'VALIDATION_ERROR',
        details: ['champ requis']
      });
    });
  });
  
  describe('Méthodes spécifiques', () => {
    test('badRequest() devrait retourner 400', () => {
      apiResponse.badRequest(mockRes, 'Données invalides');
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
    
    test('unauthorized() devrait retourner 401', () => {
      apiResponse.unauthorized(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
    
    test('forbidden() devrait retourner 403', () => {
      apiResponse.forbidden(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
    
    test('notFound() devrait retourner 404', () => {
      apiResponse.notFound(mockRes, 'Enfant');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Enfant non trouvé(e)'
      }));
    });
    
    test('conflict() devrait retourner 409', () => {
      apiResponse.conflict(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
    
    test('serverError() devrait retourner 500', () => {
      apiResponse.serverError(mockRes, new Error('DB Error'));
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

