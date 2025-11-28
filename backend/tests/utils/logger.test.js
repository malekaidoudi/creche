/**
 * Tests pour le module logger
 */

describe('Logger Module', () => {
  let logger;
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;
  
  beforeEach(() => {
    // Reset module cache pour permettre différents NODE_ENV
    jest.resetModules();
    
    // Spy sur console
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('En environnement de développement', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      logger = require('../../utils/logger');
    });
    
    test('info() devrait toujours logger', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO]', 'Test message');
    });
    
    test('error() devrait toujours logger', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'Error message');
    });
    
    test('warn() devrait toujours logger', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN]', 'Warning message');
    });
    
    test('debug() devrait logger en dev', () => {
      logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'Debug message');
    });
    
    test('sensitive() devrait logger en dev', () => {
      logger.sensitive('Sensitive data', { token: 'abc123' });
      expect(consoleLogSpy).toHaveBeenCalledWith('[SENSITIVE]', 'Sensitive data', { token: 'abc123' });
    });
  });
  
  describe('En environnement de production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      logger = require('../../utils/logger');
    });
    
    test('info() devrait toujours logger', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
    
    test('error() devrait toujours logger', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    test('debug() ne devrait PAS logger en production', () => {
      logger.debug('Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalledWith('[DEBUG]', expect.anything());
    });
    
    test('sensitive() ne devrait PAS logger en production', () => {
      logger.sensitive('Sensitive data');
      expect(consoleLogSpy).not.toHaveBeenCalledWith('[SENSITIVE]', expect.anything());
    });
  });
  
  describe('Méthode security()', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      logger = require('../../utils/logger');
    });
    
    test('devrait formater les logs de sécurité correctement', () => {
      logger.security('LOGIN_FAILED', { userId: 123, ip: '192.168.1.1' });
      
      expect(consoleLogSpy).toHaveBeenCalled();
      const callArg = consoleLogSpy.mock.calls[0][1];
      const parsed = JSON.parse(callArg);
      
      expect(parsed.event).toBe('LOGIN_FAILED');
      expect(parsed.userId).toBe(123);
      expect(parsed.ip).toBe('192.168.1.1');
      expect(parsed.timestamp).toBeDefined();
    });
    
    test('ne devrait pas exposer de données sensibles', () => {
      logger.security('LOGIN_ATTEMPT', { 
        userId: 1, 
        password: 'secret123',  // Ne devrait pas apparaître
        token: 'jwt-token'      // Ne devrait pas apparaître
      });
      
      const callArg = consoleLogSpy.mock.calls[0][1];
      const parsed = JSON.parse(callArg);
      
      expect(parsed.password).toBeUndefined();
      expect(parsed.token).toBeUndefined();
      expect(parsed.userId).toBe(1);
    });
  });
});

