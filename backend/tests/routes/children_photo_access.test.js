const express = require('express');

// Mocks
jest.mock('../../config/db_postgres', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../../services/permissionsService', () => ({
  userHasPermission: jest.fn()
}));

jest.mock('../../services/tokenBlacklistService', () => ({
  isTokenRevoked: jest.fn().mockResolvedValue(false),
  init: jest.fn().mockResolvedValue()
}));

jest.mock('../../utils/logger', () => ({
  sensitive: jest.fn(),
  security: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

describe('Children Photo Access Control (POST & DELETE /api/children/:id/photo)', () => {
  let permissionsService;
  let photoPostRoute;
  let photoDeleteRoute;
  let requireChildPhotoAccessMiddleware;

  beforeAll(() => {
    permissionsService = require('../../services/permissionsService');
    const childrenRouter = require('../../routes_postgres/children');

    photoPostRoute = childrenRouter.stack.find(
      s => s.route && s.route.path === '/:id/photo' && s.route.methods.post
    );
    photoDeleteRoute = childrenRouter.stack.find(
      s => s.route && s.route.path === '/:id/photo' && s.route.methods.delete
    );

    // requireChildPhotoAccess est le middleware avant upload.single ou le handler
    requireChildPhotoAccessMiddleware = photoPostRoute.route.stack.find(
      layer => layer.name === 'requireChildPhotoAccess'
    ).handle;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('Route DELETE /api/children/:id/photo doit exister sur le router', () => {
    expect(photoDeleteRoute).toBeDefined();
    expect(photoDeleteRoute.route.methods.delete).toBe(true);
  });

  test('Staff SANS children.photos.manage : rejeté avec HTTP 403', async () => {
    const req = {
      user: { userId: 20, id: 20, role: 'staff' },
      params: { id: '5' }
    };
    const res = createMockRes();
    const next = jest.fn();
    permissionsService.userHasPermission.mockResolvedValue(false);

    await requireChildPhotoAccessMiddleware(req, res, next);

    expect(permissionsService.userHasPermission).toHaveBeenCalledWith(20, 'children.photos.manage', 'staff');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      required_permission: 'children.photos.manage',
      code: 'PERMISSION_DENIED'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('Staff AVEC children.photos.manage : autorisé (next appelé)', async () => {
    const req = {
      user: { userId: 20, id: 20, role: 'staff' },
      params: { id: '5' }
    };
    const res = createMockRes();
    const next = jest.fn();
    permissionsService.userHasPermission.mockResolvedValue(true);

    await requireChildPhotoAccessMiddleware(req, res, next);

    expect(permissionsService.userHasPermission).toHaveBeenCalledWith(20, 'children.photos.manage', 'staff');
    expect(next).toHaveBeenCalled();
  });

  test('Admin : autorisé directement sans vérification de permission', async () => {
    const req = {
      user: { userId: 1, id: 1, role: 'admin' },
      params: { id: '5' }
    };
    const res = createMockRes();
    const next = jest.fn();

    await requireChildPhotoAccessMiddleware(req, res, next);

    expect(permissionsService.userHasPermission).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
