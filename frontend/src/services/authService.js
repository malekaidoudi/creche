import api from './api';

class AuthService {
  // Connexion
  async login(email, password) {
    const response = await api.post('/api/auth/login', {
      email,
      password
    });
    
    return response.data;
  }

  // Inscription
  async register(userData) {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  }

  // Vérifier le token
  async verifyToken(token) {
    const response = await api.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  }

  // Changer le mot de passe
  async changePassword(currentPassword, newPassword) {
    const token = localStorage.getItem('token');
    
    const response = await api.post('/api/auth/change-password', {
      currentPassword,
      newPassword
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  }

  // Obtenir le token actuel
  getToken() {
    return localStorage.getItem('token');
  }

  // Supprimer le token
  removeToken() {
    localStorage.removeItem('token');
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Vérifier si le token n'est pas expiré
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Obtenir les informations utilisateur depuis le token
  getUserFromToken() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      };
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;
