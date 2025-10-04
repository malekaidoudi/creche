import { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext()

// Types d'actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_LOADING: 'SET_LOADING',
}

// État initial
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
}

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      }

    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null,
      }

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      }

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      }

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      }

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }

    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Vérifier le token au chargement
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (token) {
        try {
          const user = await authService.getCurrentUser()
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user, token },
          })
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error)
          localStorage.removeItem('token')
          dispatch({ type: AUTH_ACTIONS.LOGOUT })
        }
      }
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    }

    initAuth()
  }, [])

  // Fonction de connexion
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })
    
    try {
      const response = await authService.login(credentials)
      const { user, token } = response.data
      
      localStorage.setItem('token', token)
      
      // En mode démo, sauvegarder l'utilisateur
      if (token === 'demo-jwt-token-for-github-pages') {
        localStorage.setItem('demoUser', JSON.stringify(user))
      }
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      })
      
      toast.success('Connexion réussie')
      return response
    } catch (error) {
      let errorMessage = 'Erreur de connexion'
      
      // En mode démo, afficher le message d'erreur spécifique
      const apiUrl = import.meta.env.VITE_API_URL
      const isDemo = import.meta.env.PROD && (!apiUrl || apiUrl.includes('votre-backend-url'))
      
      if (isDemo) {
        errorMessage = error.message || 'Email ou mot de passe incorrect'
      } else {
        errorMessage = error.response?.data?.error || 'Erreur de connexion, vérifiez votre connexion internet'
      }
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      })
      
      toast.error(errorMessage)
      throw error
    }
  }

  // Fonction d'inscription
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START })
    
    try {
      const response = await authService.register(userData)
      const { user, token } = response.data
      
      localStorage.setItem('token', token)
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user, token },
      })
      
      toast.success('Inscription réussie')
      return response
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur d\'inscription'
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      })
      
      toast.error(errorMessage)
      throw error
    }
  }

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('token')
    dispatch({ type: AUTH_ACTIONS.LOGOUT })
    toast.success('Déconnexion réussie')
  }

  // Fonction de mise à jour du profil
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData)
      const { user } = response.data
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: user,
      })
      
      toast.success('Profil mis à jour')
      return response
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur de mise à jour'
      toast.error(errorMessage)
      throw error
    }
  }

  // Fonction de changement de mot de passe
  const changePassword = async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData)
      toast.success('Mot de passe modifié')
      return response
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur de changement de mot de passe'
      toast.error(errorMessage)
      throw error
    }
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role) => {
    return state.user?.role === role
  }

  // Vérifier si l'utilisateur a l'un des rôles spécifiés
  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role)
  }

  // Vérifier si l'utilisateur est admin
  const isAdmin = () => hasRole('admin')

  // Vérifier si l'utilisateur est staff (admin ou staff)
  const isStaff = () => hasAnyRole(['admin', 'staff'])

  // Vérifier si l'utilisateur est parent
  const isParent = () => hasRole('parent')

  const value = {
    // État
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    
    // Utilitaires
    hasRole,
    hasAnyRole,
    isAdmin,
    isStaff,
    isParent,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
