// Mocks
jest.mock('../../config/db_postgres', () => ({
  pool: {
    query: jest.fn()
  },
  query: jest.fn()
}));

jest.mock('../../services/permissionsService', () => {
  const actual = jest.requireActual('../../services/permissionsService');
  return {
    ...actual,
    userHasPermission: jest.fn()
  };
});

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

jest.mock('../../controllers/suppliesController', () => ({
  getChildSupplies: jest.fn((req, res) => res.json({ success: true })),
  refillSupply: jest.fn((req, res) => res.json({ success: true })),
  useSupply: jest.fn((req, res) => res.json({ success: true })),
  getSuppliesHistory: jest.fn((req, res) => res.json({ success: true })),
  recordDailySupplies: jest.fn((req, res) => res.json({ success: true })),
  getTodaySupplies: jest.fn((req, res) => res.json({ success: true })),
  getFoodOptions: jest.fn((req, res) => res.json({ success: true }))
}));

describe('Supplies Access Control (unified with daily_reports.manage)', () => {
  let permissionsService;
  let suppliesRouter;
  let refillRoute;
  let useRoute;
  let dailyBroughtRoute;

  beforeAll(() => {
    permissionsService = require('../../services/permissionsService');
    suppliesRouter = require('../../routes_postgres/supplies');

    refillRoute = suppliesRouter.stack.find(
      s => s.route && s.route.path === '/child/:childId/refill' && s.route.methods.post
    );
    useRoute = suppliesRouter.stack.find(
      s => s.route && s.route.path === '/child/:childId/use' && s.route.methods.post
    );
    dailyBroughtRoute = suppliesRouter.stack.find(
      s => s.route && s.route.path === '/daily-brought' && s.route.methods.post
    );
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

  test('All 3 mutation routes use requirePermission with daily_reports.manage', () => {
    expect(refillRoute).toBeDefined();
    expect(useRoute).toBeDefined();
    expect(dailyBroughtRoute).toBeDefined();

    // Vérifier les couches middleware de permission
    const getPermMiddleware = (route) => route.route.stack.find(
      layer => layer.handle && layer.handle.name === 'checkPermission'
    )?.handle;

    expect(getPermMiddleware(refillRoute)).toBeDefined();
    expect(getPermMiddleware(useRoute)).toBeDefined();
    expect(getPermMiddleware(dailyBroughtRoute)).toBeDefined();
  });

  test('Rejects staff without daily_reports.manage permission with 403', async () => {
    const permMiddleware = refillRoute.route.stack.find(
      layer => layer.handle && layer.handle.name === 'checkPermission'
    ).handle;

    permissionsService.userHasPermission.mockResolvedValue(false);

    const req = {
      user: { id: 15, role: 'staff' },
      params: { childId: '1' }
    };
    const res = createMockRes();
    const next = jest.fn();

    await permMiddleware(req, res, next);

    expect(permissionsService.userHasPermission).toHaveBeenCalledWith(15, 'daily_reports.manage', 'staff');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Accès refusé') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('Allows staff with daily_reports.manage permission', async () => {
    const permMiddleware = refillRoute.route.stack.find(
      layer => layer.handle && layer.handle.name === 'checkPermission'
    ).handle;

    permissionsService.userHasPermission.mockResolvedValue(true);

    const req = {
      user: { id: 15, role: 'staff' },
      params: { childId: '1' }
    };
    const res = createMockRes();
    const next = jest.fn();

    await permMiddleware(req, res, next);

    expect(permissionsService.userHasPermission).toHaveBeenCalledWith(15, 'daily_reports.manage', 'staff');
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('Admin bypasses permission check automatically without calling userHasPermission', async () => {
    const permMiddleware = refillRoute.route.stack.find(
      layer => layer.handle && layer.handle.name === 'checkPermission'
    ).handle;

    const req = {
      user: { id: 1, role: 'admin' },
      params: { childId: '1' }
    };
    const res = createMockRes();
    const next = jest.fn();

    await permMiddleware(req, res, next);

    expect(permissionsService.userHasPermission).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
