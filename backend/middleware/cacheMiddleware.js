/**
 * 🧠 MIDDLEWARE DE CACHE INTELLIGENT
 * 
 * Gère la mise en cache automatique des réponses API
 * avec invalidation intelligente et headers HTTP optimisés.
 * 
 * @author Ingénieur Full Stack Senior
 * @version 1.0.0
 */

const NodeCache = require('node-cache');

class CacheMiddleware {
  constructor() {
    // Cache principal avec TTL adaptatif
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes par défaut
      checkperiod: 60,
      useClones: false,
      maxKeys: 1000
    });
    
    // Configuration des TTL par type de données
    this.TTL_CONFIG = {
      public: 900,    // 15 min - données publiques (footer, contact)
      settings: 300,  // 5 min - paramètres généraux
      private: 60,    // 1 min - données utilisateur
      dynamic: 30     // 30 sec - données temps réel
    };
    
    console.log('🧠 CacheMiddleware initialisé');
  }

  /**
   * 🎯 MIDDLEWARE PRINCIPAL DE CACHE
   */
  cache(options = {}) {
    return (req, res, next) => {
      const {
        ttl = this.TTL_CONFIG.settings,
        keyGenerator = this._defaultKeyGenerator,
        condition = () => true,
        invalidateOn = []
      } = options;

      // Vérifier si le cache doit être utilisé
      if (!condition(req)) {
        return next();
      }

      // Générer la clé de cache
      const cacheKey = keyGenerator(req);
      
      // Vérifier le cache
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && req.method === 'GET') {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        
        // Headers de cache
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`,
          'ETag': `"${this._generateETag(cachedData)}"`
        });
        
        return res.json(cachedData);
      }

      // Intercepter la réponse pour la mettre en cache
      const originalJson = res.json;
      res.json = (data) => {
        // Mettre en cache seulement les réponses réussies
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.cache.set(cacheKey, data, ttl);
          console.log(`📦 Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
          
          // Headers de cache
          res.set({
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey,
            'Cache-Control': `public, max-age=${ttl}`,
            'ETag': `"${this._generateETag(data)}"`
          });
        }
        
        return originalJson.call(res, data);
      };

      next();
    };
  }

  /**
   * 🔄 CACHE POUR DONNÉES PUBLIQUES
   */
  publicCache(ttl = this.TTL_CONFIG.public) {
    return this.cache({
      ttl,
      keyGenerator: (req) => `public:${req.path}:${JSON.stringify(req.query)}`,
      condition: (req) => req.method === 'GET'
    });
  }

  /**
   * 🔒 CACHE POUR DONNÉES PRIVÉES
   */
  privateCache(ttl = this.TTL_CONFIG.private) {
    return this.cache({
      ttl,
      keyGenerator: (req) => `private:${req.user?.id}:${req.path}:${JSON.stringify(req.query)}`,
      condition: (req) => req.method === 'GET' && req.user
    });
  }

  /**
   * ⚡ CACHE POUR DONNÉES DYNAMIQUES
   */
  dynamicCache(ttl = this.TTL_CONFIG.dynamic) {
    return this.cache({
      ttl,
      keyGenerator: (req) => `dynamic:${req.path}:${Date.now() - (Date.now() % (ttl * 1000))}`,
      condition: (req) => req.method === 'GET'
    });
  }

  /**
   * 🗑️ INVALIDATION INTELLIGENTE
   */
  invalidatePattern(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
      this.cache.del(key);
    });
    
    console.log(`🗑️ Cache invalidé: ${matchingKeys.length} clés supprimées (pattern: ${pattern})`);
    return matchingKeys.length;
  }

  /**
   * 🔄 MIDDLEWARE D'INVALIDATION
   */
  invalidateOnUpdate(patterns = []) {
    return (req, res, next) => {
      const originalJson = res.json;
      
      res.json = (data) => {
        // Invalider le cache après une modification réussie
        if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
          patterns.forEach(pattern => {
            this.invalidatePattern(pattern);
          });
        }
        
        return originalJson.call(res, data);
      };
      
      next();
    };
  }

  /**
   * 🔑 GÉNÉRATEUR DE CLÉ PAR DÉFAUT
   */
  _defaultKeyGenerator(req) {
    const baseKey = `${req.method}:${req.path}`;
    const queryKey = Object.keys(req.query).length > 0 ? `:${JSON.stringify(req.query)}` : '';
    const userKey = req.user ? `:user:${req.user.id}` : '';
    
    return `${baseKey}${queryKey}${userKey}`;
  }

  /**
   * 🏷️ GÉNÉRATEUR D'ETAG
   */
  _generateETag(data) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex').substring(0, 8);
  }

  /**
   * 📊 STATISTIQUES DU CACHE
   */
  getStats() {
    const stats = this.cache.getStats();
    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      memory: process.memoryUsage()
    };
  }

  /**
   * 🧹 NETTOYAGE DU CACHE
   */
  clear() {
    this.cache.flushAll();
    console.log('🧹 Cache complètement vidé');
  }
}

// Export singleton
module.exports = new CacheMiddleware();
