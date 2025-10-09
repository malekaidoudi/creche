import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

// États d'authentification
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Vérifier le token au chargement de l'application
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const userData = await authService.verifyToken(token);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: userData.user,
              token
            }
          });
        } catch (error) {
          console.error('Token invalide:', error);
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    };

    checkAuth();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authService.login(email, password);
      
      // Sauvegarder le token
      localStorage.setItem('token', response.token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token
        }
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur de connexion';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage
      });
      throw error;
    }
  };

  // Fonction d'inscription
  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authService.register(userData);
      
      // Sauvegarder le token
      localStorage.setItem('token', response.token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token
        }
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'inscription';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage
      });
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  // Fonction de mise à jour du profil utilisateur
  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    });
  };

  // Fonction pour effacer les erreurs
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Fonction pour changer le mot de passe
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors du changement de mot de passe';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage
      });
      throw error;
    }
  };

  // Vérifier les permissions
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role);
  };

  const isAdmin = () => hasRole('admin');
  const isStaff = () => hasAnyRole(['admin', 'staff']);
  const isParent = () => hasRole('parent');

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    changePassword,
    hasRole,
    hasAnyRole,
    isAdmin,
    isStaff,
    isParent
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
