const express = require('express');

// Mocks (même pattern que children_photo_access.test.js)
jest.mock('../../config/db_postgres', () => ({
  pool: { query: jest.fn() },
  query: jest.fn()
}));

jest.mock('../../services/permissionsService', () => ({
  userHasPermission: jest.fn()
}));

jest.mock('../../services/tokenBlacklistService', () => ({
  isTokenRevoked: jest.fn().mockResolvedValue(false),
  init: jest.fn().mockResolvedValue()
}));

jest.mock('../../services/staffMessageService', () => ({
  sendMessage: jest.fn(),
  getUserMessages: jest.fn(),
  getUnreadMessages: jest.fn(),
  getConversations: jest.fn(),
  getConversation: jest.fn(),
  markAsRead: jest.fn()
}));

jest.mock('../../utils/logger', () => ({
  sensitive: jest.fn(),
  security: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

/**
 * Garde-fous des corrections de sécurité de l'audit documentsV2 :
 * #62 (routes children stats authentifiées + requireStaff),
 * #65 (staff-messages : permission messages.parents pour staff),
 * #66 (/api/auth/me via authenticateToken => révocation vérifiée),
 * #20 (endpoint POST /api/auth/register supprimé).
 */

const findRoute = (router, path, method) =>
  router.stack.find(s => s.route && s.route.path === path && s.route.methods[method]);

const layerNames = (route) => route.route.stack.map(l => l.name || '(anonymous)');

describe('Audit sécurité — correction #62 : routes GET de children.js protégées', () => {
  let childrenRouter;
  beforeAll(() => {
    childrenRouter = require('../../routes_postgres/children');
  });

  const protectedPaths = ['/birthdays/month', '/stats', '/unassociated', '/stats/overview'];

  protectedPaths.forEach((path) => {
    test(`GET ${path} exige authenticateToken`, () => {
      const route = findRoute(childrenRouter, path, 'get');
      expect(route).toBeDefined();
      const names = layerNames(route);
      expect(names).toContain('authenticateToken');
      // requireStaff est anonyme (auth.requireRole retourne une closure) :
      // on vérifie qu'un middleware intermédiaire existe entre auth et le handler.
      expect(route.route.stack.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('Audit sécurité — correction #65 : staff-messages protégé par messages.parents (staff)', () => {
  let router;
  beforeAll(() => {
    router = require('../../routes_postgres/staff-messages');
  });

  const paths = [
    ['/', 'post'], ['/', 'get'], ['/unread', 'get'], ['/conversations', 'get'],
    ['/conversation/:contactId', 'get'], ['/:id/conversation', 'get'], ['/:id/read', 'patch']
  ];

  paths.forEach(([path, method]) => {
    test(`${method.toUpperCase()} ${path} exige authenticateToken + requireMessagesParentsIfStaff`, () => {
      const route = findRoute(router, path, method);
      expect(route).toBeDefined();
      const names = layerNames(route);
      expect(names).toContain('authenticateToken');
      expect(names).toContain('requireMessagesParentsIfStaff');
    });
  });
});

describe('Audit sécurité — correction #66 : /api/auth/me utilise authenticateToken', () => {
  test('GET /me passe par authenticateToken (blacklist vérifiée)', () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    const authRouter = require('../../routes_postgres/auth');
    const route = findRoute(authRouter, '/me', 'get');
    expect(route).toBeDefined();
    expect(layerNames(route)).toContain('authenticateToken');
  });

  test('POST /register a été supprimé (anomalie #20)', () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    const authRouter = require('../../routes_postgres/auth');
    const route = findRoute(authRouter, '/register', 'post');
    expect(route).toBeUndefined();
  });
});
