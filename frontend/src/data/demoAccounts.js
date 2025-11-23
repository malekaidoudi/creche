// Comptes de démonstration pour GitHub Pages
export const demoAccounts = {
  admin: {
    id: 1,
    email: 'admin@mimaelghalia.tn',
    password: 'admin123',
    first_name: 'Directeur',
    last_name: 'Système',
    role: 'admin',
    phone: '+216 71 000 000',
    profile_picture: null,
    is_active: true,
    email_verified: true,
    created_at: '2024-01-01T00:00:00Z'
  },

  staff: {
    id: 2,
    email: 'staff@mimaelghalia.tn',
    password: 'staff123',
    first_name: 'Fatma',
    last_name: 'Ben Ali',
    role: 'staff',
    phone: '+216 71 000 001',
    profile_picture: null,
    is_active: true,
    email_verified: true,
    created_at: '2024-01-01T00:00:00Z'
  },

  parent: {
    id: 3,
    email: 'parent@mimaelghalia.tn',
    password: 'parent123',
    first_name: 'Ahmed',
    last_name: 'Trabelsi',
    role: 'parent',
    phone: '+216 71 000 002',
    profile_picture: null,
    is_active: true,
    email_verified: true,
    created_at: '2024-01-01T00:00:00Z'
  }
}

// Données de démo pour les enfants
export const demoChildren = [
  {
    id: 1,
    first_name: 'Yasmine',
    last_name: 'Trabelsi',
    birth_date: '2021-03-15',
    gender: 'female',
    parent_id: 3,
    medical_info: 'Aucune allergie connue',
    emergency_contact: 'Leila Trabelsi - +216 98 123 456',
    is_active: true,
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    first_name: 'Omar',
    last_name: 'Ben Salem',
    birth_date: '2020-11-22',
    gender: 'male',
    parent_id: 3,
    medical_info: 'Allergie aux arachides',
    emergency_contact: 'Monia Ben Salem - +216 97 654 321',
    is_active: true,
    created_at: '2024-01-20T00:00:00Z'
  }
]

// Données de démo pour les articles
export const demoArticles = [
  {
    id: 1,
    title: 'Bienvenue à la crèche Mima Elghalia',
    slug: 'bienvenue-mima-elghalia',
    content: 'Découvrez notre approche pédagogique unique et notre environnement bienveillant pour l\'épanouissement de votre enfant.',
    excerpt: 'Une crèche moderne au cœur de Tunis',
    featured_image: `${import.meta.env.BASE_URL}images/affiche.jpg`,
    status: 'published',
    author_id: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    title: 'Activités d\'éveil pour les tout-petits',
    slug: 'activites-eveil-tout-petits',
    content: 'Nos activités d\'éveil sont spécialement conçues pour stimuler le développement cognitif et moteur des enfants de 6 mois à 3 ans.',
    excerpt: 'Développement et épanouissement',
    featured_image: `${import.meta.env.BASE_URL}images/logo_creche.jpg`,
    status: 'published',
    author_id: 2,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
]

// Token de démo (JWT factice pour la démo)
export const demoToken = 'demo-jwt-token-for-github-pages'

// Fonction pour simuler l'authentification
export const authenticateDemo = (email, password) => {
  console.log('🔐 === DÉBUT AUTHENTIFICATION DÉMO ===')
  console.log('- Email reçu:', `"${email}"`, 'Type:', typeof email)
  console.log('- Password reçu:', `"${password}"`, 'Type:', typeof password)

  // Vérifier que demoAccounts existe
  console.log('- demoAccounts existe:', !!demoAccounts)
  console.log('- Nombre de comptes:', Object.keys(demoAccounts).length)

  // Afficher tous les comptes disponibles
  const accounts = Object.values(demoAccounts)
  console.log('- Comptes disponibles:')
  accounts.forEach((acc, index) => {
    console.log(`  ${index + 1}. Email: "${acc.email}" | Password: "${acc.password}" | Role: ${acc.role}`)
  })

  // Recherche du compte
  console.log('- Recherche du compte...')
  const account = accounts.find(acc => {
    const emailMatch = acc.email === email
    const passwordMatch = acc.password === password
    console.log(`  Test ${acc.role}: email=${emailMatch}, password=${passwordMatch}`)
    return emailMatch && passwordMatch
  })

  console.log('- Compte trouvé:', account ? `OUI (${account.role})` : 'NON')

  if (account) {
    const { password: _, ...userWithoutPassword } = account
    console.log('✅ AUTHENTIFICATION RÉUSSIE')
    console.log('- Utilisateur:', userWithoutPassword)
    console.log('- Token:', demoToken)

    const result = {
      success: true,
      data: {
        user: userWithoutPassword,
        token: demoToken
      }
    }
    console.log('- Résultat final:', result)
    return result
  }

  console.log('❌ AUTHENTIFICATION ÉCHOUÉE')
  const errorResult = {
    success: false,
    error: 'Email ou mot de passe incorrect'
  }
  console.log('- Résultat d\'erreur:', errorResult)
  return errorResult
}
