const express = require('express');

// Mocks
jest.mock('../../config/db_postgres', () => ({
  query: jest.fn()
}));

jest.mock('../../services/permissionsService', () => ({
  userHasPermission: jest.fn(),
  grantCommonPermissionsToUser: jest.fn()
}));

jest.mock('../../services/tokenBlacklistService', () => ({
  isTokenRevoked: jest.fn().mockResolvedValue(false),
  init: jest.fn().mockResolvedValue()
}));

jest.mock('../../utils/logger', () => ({
  sensitive: jest.fn(),
  security: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('Users Access Control (GET /api/users & GET /api/users/:id)', () => {
  let db;
  let permissionsService;
  let getUsersHandler;
  let getUserByIdHandler;

  beforeAll(() => {
    db = require('../../config/db_postgres');
    permissionsService = require('../../services/permissionsService');
    const usersRouter = require('../../routes_postgres/users');

    // Extraire les handlers de route Express
    const rootRoute = usersRouter.stack.find(s => s.route && s.route.path === '/' && s.route.methods.get);
    getUsersHandler = rootRoute.route.stack[rootRoute.route.stack.length - 1].handle;

    const idRoute = usersRouter.stack.find(s => s.route && s.route.path === '/:id' && s.route.methods.get);
    getUserByIdHandler = idRoute.route.stack[idRoute.route.stack.length - 1].handle;
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

  test('Parent : GET /api/users doit être rejeté avec HTTP 403', async () => {
    const req = {
      user: { userId: 10, id: 10, role: 'parent', email: 'parent@test.com' },
      query: {}
    };
    const res = createMockRes();

    await getUsersHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.stringMatching(/direction/i)
    }));
  });

  test('Staff sans tasks.manage : GET /api/users doit être rejeté avec HTTP 403', async () => {
    const req = {
      user: { userId: 20, id: 20, role: 'staff', email: 'staff@test.com' },
      query: {}
    };
    const res = createMockRes();
    permissionsService.userHasPermission.mockResolvedValue(false);

    await getUsersHandler(req, res);

    expect(permissionsService.userHasPermission).toHaveBeenCalledWith(20, 'tasks.manage', 'staff');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.stringMatching(/direction/i)
    }));
  });

  test('Staff avec tasks.manage : GET /api/users retourne la liste staff/admin sans données privées', async () => {
    const req = {
      user: { userId: 20, id: 20, role: 'staff', email: 'staff@test.com' },
      query: {}
    };
    const res = createMockRes();
    permissionsService.userHasPermission.mockResolvedValue(true);

    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, first_name: 'Directeur', last_name: 'Admin', role: 'admin', profile_image: null, staff_position: 'Directeur', is_active: true },
        { id: 20, first_name: 'Educatrice', last_name: 'Dupont', role: 'staff', profile_image: null, staff_position: 'Éducatrice', is_active: true }
      ]
    });

    await getUsersHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      users: expect.arrayContaining([
        expect.objectContaining({ id: 1, role: 'admin' }),
        expect.objectContaining({ id: 20, role: 'staff' })
      ])
    }));
    // Vérifier l'absence de fuite de données privées
    const resultUsers = res.json.mock.calls[0][0].users;
    expect(resultUsers[0]).not.toHaveProperty('email');
    expect(resultUsers[0]).not.toHaveProperty('phone');
  });

  test('Admin : GET /api/users autorise l\'annuaire complet avec filtres et pagination', async () => {
    const req = {
      user: { userId: 1, id: 1, role: 'admin', email: 'admin@test.com' },
      query: { role: 'parent', page: '1', limit: '10' }
    };
    const res = createMockRes();

    db.query
      .mockResolvedValueOnce({
        rows: [
          { id: 10, email: 'parent@test.com', first_name: 'Parent', last_name: 'Test', phone: '0601020304', role: 'parent', is_active: true }
        ]
      })
      .mockResolvedValueOnce({
        rows: [{ total: '1' }]
      });

    await getUsersHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      users: expect.arrayContaining([
        expect.objectContaining({ id: 10, email: 'parent@test.com' })
      ]),
      pagination: expect.objectContaining({ total: 1 })
    }));
  });

  test('GET /api/users/:id : Un utilisateur ne peut pas consulter le profil d\'un tiers sans être admin/dev', async () => {
    const req = {
      user: { userId: 10, id: 10, role: 'parent', email: 'parent@test.com' },
      params: { id: '99' }
    };
    const res = createMockRes();

    await getUserByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false
    }));
  });

  test('GET /api/users/:id : Un utilisateur peut consulter son propre profil', async () => {
    const req = {
      user: { userId: 10, id: 10, role: 'parent', email: 'parent@test.com' },
      params: { id: '10' }
    };
    const res = createMockRes();

    db.query.mockResolvedValueOnce({
      rows: [
        { id: 10, email: 'parent@test.com', first_name: 'Parent', last_name: 'Test', role: 'parent' }
      ]
    });

    await getUserByIdHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      user: expect.objectContaining({ id: 10 })
    }));
  });

  describe('GET /api/users/contacts (Messagerie)', () => {
    let getContactsHandler;

    beforeAll(() => {
      const usersRouter = require('../../routes_postgres/users');
      const contactsRoute = usersRouter.stack.find(s => s.route && s.route.path === '/contacts' && s.route.methods.get);
      getContactsHandler = contactsRoute.route.stack[contactsRoute.route.stack.length - 1].handle;
    });

    test('Staff SANS messages.parents : Ne voit que les collègues staff et l\'admin', async () => {
      const req = {
        user: { userId: 20, id: 20, role: 'staff', email: 'staff@test.com' }
      };
      const res = createMockRes();
      permissionsService.userHasPermission.mockResolvedValue(false);

      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, email: 'admin@creche.com', first_name: 'Directeur', last_name: 'Admin', role: 'admin', is_active: true },
          { id: 21, email: 'staff2@creche.com', first_name: 'Sarah', last_name: 'Educ', role: 'staff', is_active: true }
        ]
      });

      await getContactsHandler(req, res);

      // Vérifie que le SQL a bien filtré pour exclure les parents
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("AND role IN ('admin', 'staff')"),
        expect.any(Array)
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        contacts: expect.arrayContaining([
          expect.objectContaining({ role: 'admin' }),
          expect.objectContaining({ role: 'staff' })
        ])
      }));
    });

    test('Staff AVEC messages.parents : Peut voir l\'admin, le staff ET les parents', async () => {
      const req = {
        user: { userId: 20, id: 20, role: 'staff', email: 'staff@test.com' }
      };
      const res = createMockRes();
      permissionsService.userHasPermission.mockResolvedValue(true);

      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, role: 'admin', first_name: 'Directeur' },
          { id: 30, role: 'parent', first_name: 'Parent' }
        ]
      });

      await getContactsHandler(req, res);

      // Le SQL n'a PAS de filtre limitatif aux seuls admin/staff pour ce staff
      const sqlQuery = db.query.mock.calls[0][0];
      expect(sqlQuery).not.toContain("AND role IN ('admin', 'staff')");
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
      expect(res.json.mock.calls[0][0].contacts).toHaveLength(2);
    });

    test('Parent : Ne voit QUE les admins et le staff (jamais les autres parents)', async () => {
      const req = {
        user: { userId: 30, id: 30, role: 'parent', email: 'parent@test.com' }
      };
      const res = createMockRes();

      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, role: 'admin', first_name: 'Directeur' },
          { id: 20, role: 'staff', first_name: 'Educatrice' }
        ]
      });

      await getContactsHandler(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("AND role IN ('admin', 'staff')"),
        expect.any(Array)
      );
    });
  });
});
